# 🚀 ConnectIn - Полное руководство по развертыванию

## 📋 Обзор проекта

ConnectIn - это платформа для поиска команды и проектов, построенная на современном стеке технологий:

- **Backend**: FastAPI + SQLAlchemy + Alembic
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: PostgreSQL + Redis
- **ML Service**: Python + Scikit-learn
- **Message Queue**: Apache Kafka
- **Payments**: Stripe
- **Deployment**: Railway + Docker

## 🎯 Быстрый старт

### Предварительные требования
- Docker и Docker Compose
- Git
- Node.js 18+
- Python 3.11+

### Локальное развертывание
```bash
# Клонирование репозитория
git clone <your-repo-url>
cd ConnectIn

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл с вашими настройками

# Запуск всех сервисов
./deploy.sh local
```

### Доступные сервисы
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **ML Service**: http://localhost:5000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Kafka**: localhost:9092

## 🏗️ Архитектура проекта

```
ConnectIn/
├── connectin-backend/          # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/            # API endpoints
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utilities
│   ├── alembic/               # Database migrations
│   └── Dockerfile
├── connectin-frontend/         # React Frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   └── store/             # State management
│   └── Dockerfile
├── connectin-ml_service/       # ML Service
│   ├── app.py
│   └── Dockerfile
├── docker-compose.yml         # Multi-service orchestration
└── deploy.sh                  # Deployment script
```

## 🔧 Настройка окружения

### Переменные окружения

#### Backend (.env)
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/connectin
SECRET_KEY=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_bucket_name
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=your_stripe_secret_key
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000
VITE_CKEDITOR_LICENSE_KEY=your_ckeditor_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## 🚀 Развертывание на Railway

### 1. Подготовка
1. Создайте аккаунт на [railway.app](https://railway.app)
2. Подключите ваш GitHub репозиторий
3. Создайте новый проект

### 2. Настройка сервисов
1. **PostgreSQL Database**: Создайте через Railway Dashboard
2. **Backend Service**: Укажите Root Directory как `connectin-backend`
3. **Frontend Service**: Укажите Root Directory как `connectin-frontend`
4. **Redis Service**: Добавьте через Railway Marketplace

### 3. Переменные окружения
Настройте все переменные окружения в Railway Dashboard для каждого сервиса.

### 4. Домены
- Настройте кастомные домены в Railway
- Обновите переменные окружения с новыми URL

## 🗄️ Работа с базой данных

### Миграции Alembic
```bash
# Создание новой миграции
cd connectin-backend
alembic revision --autogenerate -m "Описание изменений"

# Применение миграций
alembic upgrade head

# Откат миграций
alembic downgrade -1
```

### Резервное копирование
```bash
# Создание бэкапа
pg_dump -h your-host -U postgres -d connectin -f backup.sql

# Восстановление
psql -h your-host -U postgres -d connectin -f backup.sql
```

## 🔌 Интеграции

### Kafka
- **Назначение**: Обработка событий в реальном времени
- **Топики**: `user-events`, `payment-events`, `project-events`
- **Использование**: Отправка уведомлений, аналитика, логирование

### Stripe
- **Назначение**: Обработка платежей и подписок
- **Функции**: Создание клиентов, платежные намерения, webhooks
- **Тестирование**: Используйте тестовые карты Stripe

### AWS S3
- **Назначение**: Хранение файлов и изображений
- **Конфигурация**: Настройте bucket и IAM пользователя
- **Использование**: Загрузка аватаров, документов, медиа

## 🧪 Тестирование

### Backend тесты
```bash
cd connectin-backend
python -m pytest tests/
```

### Frontend тесты
```bash
cd connectin-frontend
npm test
```

### Интеграционные тесты
```bash
# Запуск всех тестов
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📊 Мониторинг

### Логи
- **Railway**: Встроенные логи в Dashboard
- **Локально**: `docker-compose logs -f [service]`

### Метрики
- **Railway Metrics**: CPU, Memory, Network
- **Application Metrics**: Response time, Error rate
- **Database Metrics**: Connection count, Query performance

### Алерты
- Настройте уведомления в Railway
- Используйте внешние сервисы (Uptime Robot, Pingdom)

## 🔒 Безопасность

### Переменные окружения
- Никогда не коммитьте секретные ключи
- Используйте Railway Environment Variables
- Регулярно ротируйте ключи

### HTTPS
- Railway автоматически предоставляет SSL
- Настройте HSTS headers
- Используйте secure cookies

### CORS
- Настройте правильные CORS политики
- Ограничьте доступ к API
- Используйте rate limiting

## 🚨 Troubleshooting

### Частые проблемы

#### Сервис не запускается
1. Проверьте логи: `docker-compose logs [service]`
2. Убедитесь, что все переменные окружения настроены
3. Проверьте доступность портов

#### База данных недоступна
1. Проверьте DATABASE_URL
2. Убедитесь, что PostgreSQL запущен
3. Проверьте сетевые настройки

#### Frontend не подключается к Backend
1. Проверьте VITE_API_URL
2. Убедитесь, что backend доступен
3. Проверьте CORS настройки

### Полезные команды
```bash
# Перезапуск сервиса
docker-compose restart [service]

# Просмотр логов
docker-compose logs -f [service]

# Подключение к контейнеру
docker-compose exec [service] bash

# Очистка Docker
docker system prune -a
```

## 📚 Дополнительные ресурсы

### Документация
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Railway Documentation](https://docs.railway.app/)
- [Docker Documentation](https://docs.docker.com/)

### Полезные файлы в проекте
- `database_migration_guide.md` - Руководство по миграции БД
- `pycharm_database_setup.md` - Настройка PyCharm
- `backup_strategy_guide.md` - Стратегия резервного копирования
- `kafka_stripe_integration.md` - Интеграция Kafka и Stripe
- `railway_deployment_guide.md` - Подробное руководство по Railway

## 🤝 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи сервисов
2. Убедитесь, что все переменные окружения настроены
3. Проверьте документацию в папке проекта
4. Создайте issue в репозитории

## 📈 Roadmap

### Планируемые улучшения
- [ ] Добавление мониторинга с Prometheus/Grafana
- [ ] Интеграция с Elasticsearch для поиска
- [ ] Добавление тестов производительности
- [ ] Настройка CI/CD pipeline
- [ ] Добавление мобильного приложения

---

**Удачного развертывания! 🎉**
