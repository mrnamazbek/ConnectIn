#!/bin/bash

# Скрипт для полного развертывания ConnectIn проекта
# Использование: ./deploy.sh [environment]
# environment: local, staging, production

set -e

ENVIRONMENT=${1:-local}
PROJECT_NAME="connectin"

echo "🚀 Начинаем развертывание ConnectIn в окружении: $ENVIRONMENT"

# Функция для проверки зависимостей
check_dependencies() {
    echo "📋 Проверяем зависимости..."
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker не установлен. Установите Docker и попробуйте снова."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
        exit 1
    fi
    
    echo "✅ Все зависимости установлены"
}

# Функция для создания .env файлов
setup_environment() {
    echo "🔧 Настраиваем переменные окружения..."
    
    if [ ! -f .env ]; then
        echo "❌ Файл .env не найден. Создайте его на основе .env.example"
        exit 1
    fi
    
    # Копируем .env файлы в соответствующие директории
    cp .env connectin-backend/.env
    cp .env connectin-frontend/.env
    
    echo "✅ Переменные окружения настроены"
}

# Функция для сборки и запуска контейнеров
deploy_containers() {
    echo "🐳 Собираем и запускаем контейнеры..."
    
    # Останавливаем существующие контейнеры
    docker-compose down --remove-orphans
    
    # Собираем образы
    docker-compose build --no-cache
    
    # Запускаем контейнеры
    docker-compose up -d
    
    echo "✅ Контейнеры запущены"
}

# Функция для настройки базы данных
setup_database() {
    echo "🗄️ Настраиваем базу данных..."
    
    # Ждем пока PostgreSQL запустится
    echo "⏳ Ждем запуска PostgreSQL..."
    sleep 30
    
    # Проверяем подключение к базе данных
    until docker-compose exec postgres pg_isready -U postgres; do
        echo "⏳ Ждем готовности PostgreSQL..."
        sleep 5
    done
    
    # Применяем миграции Alembic
    echo "📊 Применяем миграции базы данных..."
    docker-compose exec backend alembic upgrade head
    
    # Заполняем начальные данные (если есть)
    if [ -f "connectin-backend/app/populate_skills.py" ]; then
        echo "📝 Заполняем начальные данные..."
        docker-compose exec backend python app/populate_skills.py
    fi
    
    echo "✅ База данных настроена"
}

# Функция для проверки здоровья сервисов
health_check() {
    echo "🏥 Проверяем здоровье сервисов..."
    
    # Проверяем backend
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend работает"
    else
        echo "❌ Backend не отвечает"
        return 1
    fi
    
    # Проверяем frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend работает"
    else
        echo "❌ Frontend не отвечает"
        return 1
    fi
    
    # Проверяем ML service
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        echo "✅ ML Service работает"
    else
        echo "⚠️ ML Service не отвечает (может быть нормально)"
    fi
    
    echo "✅ Все основные сервисы работают"
}

# Функция для показа информации о развертывании
show_deployment_info() {
    echo ""
    echo "🎉 Развертывание завершено!"
    echo ""
    echo "📱 Доступные сервисы:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   ML Service: http://localhost:5000"
    echo "   PostgreSQL: localhost:5432"
    echo "   Redis: localhost:6379"
    echo "   Kafka: localhost:9092"
    echo ""
    echo "📊 Полезные команды:"
    echo "   Просмотр логов: docker-compose logs -f [service]"
    echo "   Остановка: docker-compose down"
    echo "   Перезапуск: docker-compose restart [service]"
    echo ""
}

# Основная функция
main() {
    echo "🎯 ConnectIn Deployment Script"
    echo "=============================="
    
    check_dependencies
    setup_environment
    deploy_containers
    setup_database
    
    # Ждем немного для полного запуска
    sleep 10
    
    health_check
    show_deployment_info
}

# Запуск основной функции
main "$@"
