# Руководство по миграции базы данных

## Создание нового RDS инстанса

### 1. Войдите в AWS Console
- Перейдите на [aws.amazon.com](https://aws.amazon.com)
- Войдите в ваш аккаунт

### 2. Создайте новый RDS инстанс
1. Перейдите в RDS сервис
2. Нажмите "Create database"
3. Выберите "PostgreSQL"
4. Настройки:
   - DB instance identifier: `connectin-your-db`
   - Master username: `postgres`
   - Master password: `your_secure_password`
   - DB instance class: `db.t3.micro` (для начала)
   - Storage: 20 GB
   - Region: `eu-north-1` (как у вашего друга)

### 3. Настройка безопасности
1. В Security Groups разрешите:
   - Port 5432 для вашего IP
   - Port 5432 для Railway IP ranges

## Перенос данных

### Вариант 1: pg_dump (рекомендуется)
```bash
# Создание дампа с базы друга
pg_dump -h connectin-core-eu-db.cx4gaywwm3rk.eu-north-1.rds.amazonaws.com \
        -U postgres \
        -d connectin \
        -f backup.sql

# Восстановление на вашу базу
psql -h your-new-rds-endpoint \
     -U postgres \
     -d connectin \
     -f backup.sql
```

### Вариант 2: Через AWS RDS Snapshot
1. Попросите друга создать snapshot его RDS
2. Поделитесь snapshot с вашим аккаунтом
3. Восстановите snapshot в новый RDS инстанс
