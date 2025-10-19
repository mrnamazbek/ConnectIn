# Railway Deployment Guide для ConnectIn

## 🚀 Полное руководство по развертыванию на Railway

### Шаг 1: Подготовка к развертыванию

#### 1.1 Создание Railway аккаунта
1. Перейдите на [railway.app](https://railway.app)
2. Нажмите "Sign Up" и выберите "Continue with GitHub"
3. Авторизуйтесь через ваш GitHub аккаунт
4. Подтвердите email адрес

#### 1.2 Подключение GitHub репозитория
1. В Railway Dashboard нажмите "New Project"
2. Выберите "Deploy from GitHub repo"
3. Найдите ваш репозиторий "ConnectIn"
4. Нажмите "Deploy Now"

### Шаг 2: Настройка сервисов

#### 2.1 Backend Service
1. Railway автоматически определит Python проект
2. Нажмите на созданный сервис
3. Перейдите в "Settings" → "Environment"
4. Добавьте переменные окружения:

```bash
DATABASE_URL=postgresql://postgres:password@postgres.railway.internal:5432/railway
SECRET_KEY=your_super_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://your-app.railway.app/auth/google/callback
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_REDIRECT_URI=https://your-app.railway.app/auth/github/callback
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_BUCKET_NAME=connectin-bucket
AWS_REGION=eu-north-1
OPENAI_API_KEY=your_openai_api_key_here
```

#### 2.2 Frontend Service
1. Нажмите "New Service" → "GitHub Repo"
2. Выберите тот же репозиторий
3. Укажите Root Directory: `connectin-frontend`
4. Railway определит Node.js проект
5. Добавьте переменные окружения:

```bash
VITE_API_URL=https://your-backend.railway.app/api/v1
VITE_WS_URL=wss://your-backend.railway.app
VITE_CKEDITOR_LICENSE_KEY=eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NzA0MjIzOTksImp0aSI6IjVlOTZlZmE3LTc3NjUtNGY2Yy1iYWVlLWUyNjU4MTY2NzE3MiIsImxpY2Vuc2VkSG9zdHMiOlsiMTI3LjAuMC4xIiwibG9jYWxob3N0IiwiMTkyLjE2OC4qLioiLCIxMC4qLiouKiIsIjE3Mi4qLiouKiIsIioudGVzdCIsIioubG9jYWxob3N0IiwiKi5sb2NhbCJdLCJ1c2FnZUVuZHBvaW50IjoiaHR0cHM6Ly9wcm94eS1ldmVudC5ja2VkaXRvci5jb20iLCJkaXN0cmlidXRpb25DaGFubmVsIjpbImNsb3VkIiwiZHJ1cGFsIl0sImxpY2Vuc2VUeXBlIjoiZGV2ZWxvcG1lbnQiLCJmZWF0dXJlcyI6WyJEUlVQIl0sInZjIjoiYWQ0MmM4M2UifQ.NwegKhZxZ6l3QiZa9UfiYwCSOHg1uJ0esVicu77sHWsWF3EUp16ajo_h05d8K7zM2HXARuyIGnpGnaxSdV19Lw
VITE_EMAIL_PUBLIC_KEY=HS0LjMeoADdVlZ9r9
VITE_EMAIL_SERVICE_KEY=service_cr4lr4q
VITE_EMAIL_TEMPLATE_KEY=template_v1ojrij
```

#### 2.3 PostgreSQL Database
1. Нажмите "New Service" → "Database" → "PostgreSQL"
2. Railway автоматически создаст базу данных
3. Скопируйте DATABASE_URL из настроек базы данных
4. Обновите DATABASE_URL в настройках backend сервиса

#### 2.4 Redis (опционально)
1. Нажмите "New Service" → "Database" → "Redis"
2. Скопируйте REDIS_URL из настроек
3. Добавьте REDIS_URL в переменные backend сервиса

### Шаг 3: Настройка Railway.toml

Создайте файл `railway.toml` в корне проекта:

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "cd connectin-backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[env]
RAILWAY_ENVIRONMENT = "production"
```

### Шаг 4: Настройка доменов

#### 4.1 Настройка кастомного домена
1. В настройках сервиса перейдите в "Settings" → "Domains"
2. Нажмите "Custom Domain"
3. Добавьте ваш домен (например, `connectin.com`)
4. Настройте DNS записи согласно инструкциям Railway

#### 4.2 Настройка поддоменов
- Backend: `api.connectin.com`
- Frontend: `app.connectin.com` или `connectin.com`

### Шаг 5: Миграция данных

#### 5.1 Создание дампа с текущей базы
```bash
# Подключение к базе друга
pg_dump -h connectin-core-eu-db.cx4gaywwm3rk.eu-north-1.rds.amazonaws.com \
        -U postgres \
        -d connectin \
        --format=custom \
        --compress=9 \
        -f backup.dump
```

#### 5.2 Восстановление на Railway
```bash
# Получение DATABASE_URL из Railway
# Восстановление данных
pg_restore -h [railway-postgres-host] \
           -U postgres \
           -d railway \
           --clean --if-exists \
           backup.dump
```

### Шаг 6: Настройка CI/CD

#### 6.1 Автоматическое развертывание
Railway автоматически развертывает при каждом push в main ветку.

#### 6.2 Настройка preview deployments
1. В настройках проекта включите "Preview Deployments"
2. Создайте pull request
3. Railway автоматически создаст preview версию

### Шаг 7: Мониторинг и логи

#### 7.1 Просмотр логов
1. В Railway Dashboard выберите сервис
2. Перейдите в "Deployments"
3. Нажмите на конкретный deployment
4. Просматривайте логи в реальном времени

#### 7.2 Настройка алертов
1. Перейдите в "Settings" → "Notifications"
2. Настройте уведомления на email/Slack
3. Выберите события для мониторинга

### Шаг 8: Оптимизация производительности

#### 8.1 Настройка ресурсов
1. В настройках сервиса перейдите в "Settings" → "Resources"
2. Увеличьте CPU/Memory при необходимости
3. Настройте auto-scaling

#### 8.2 Кэширование
1. Добавьте Redis для кэширования
2. Настройте CDN для статических файлов
3. Используйте Railway Edge для глобального кэширования

### Шаг 9: Безопасность

#### 9.1 Переменные окружения
- Никогда не коммитьте секретные ключи в код
- Используйте Railway Environment Variables
- Регулярно ротируйте ключи

#### 9.2 HTTPS
- Railway автоматически предоставляет SSL сертификаты
- Настройте HSTS headers
- Используйте secure cookies

### Шаг 10: Резервное копирование

#### 10.1 Автоматические бэкапы Railway
Railway автоматически создает бэкапы базы данных.

#### 10.2 Дополнительные бэкапы
```bash
#!/bin/bash
# backup_script.sh

DATE=$(date +%Y%m%d_%H%M%S)
RAILWAY_DB_URL="postgresql://postgres:password@postgres.railway.internal:5432/railway"

pg_dump $RAILWAY_DB_URL \
        --format=custom \
        --compress=9 \
        --file="railway_backup_$DATE.dump"

# Загрузка в AWS S3
aws s3 cp "railway_backup_$DATE.dump" s3://your-backup-bucket/
```

## 🚨 Troubleshooting

### Проблема: Сервис не запускается
**Решение:**
1. Проверьте логи в Railway Dashboard
2. Убедитесь, что все переменные окружения настроены
3. Проверьте синтаксис в railway.toml

### Проблема: База данных недоступна
**Решение:**
1. Проверьте DATABASE_URL в переменных окружения
2. Убедитесь, что PostgreSQL сервис запущен
3. Проверьте сетевые настройки

### Проблема: Frontend не подключается к Backend
**Решение:**
1. Проверьте VITE_API_URL в frontend переменных
2. Убедитесь, что backend сервис доступен
3. Проверьте CORS настройки

## 📊 Мониторинг производительности

### Railway Metrics
1. Перейдите в "Metrics" в Railway Dashboard
2. Мониторьте:
   - CPU Usage
   - Memory Usage
   - Network I/O
   - Response Time

### Внешний мониторинг
- Настройте Uptime Robot для проверки доступности
- Используйте Sentry для отслеживания ошибок
- Настройте DataDog или New Relic для детального мониторинга

## 💰 Оптимизация затрат

### Railway Pricing
- Hobby Plan: $5/месяц (достаточно для начала)
- Pro Plan: $20/месяц (для продакшена)
- Team Plan: $99/месяц (для команды)

### Оптимизация ресурсов
1. Используйте sleep mode для неактивных сервисов
2. Настройте auto-scaling
3. Мониторьте использование ресурсов

## 🎯 Следующие шаги

1. **Настройте мониторинг** - добавьте алерты и метрики
2. **Оптимизируйте производительность** - настройте кэширование
3. **Добавьте CI/CD** - настройте автоматическое тестирование
4. **Настройте резервное копирование** - создайте стратегию бэкапов
5. **Добавьте безопасность** - настройте WAF и мониторинг безопасности
