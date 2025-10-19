# Стратегия резервного копирования и восстановления с Alembic

## Что такое Alembic и зачем он нужен?

Alembic - это инструмент для миграций базы данных в SQLAlchemy. Он позволяет:
- Отслеживать изменения в структуре базы данных
- Применять изменения к базе данных
- Откатывать изменения при необходимости
- Синхронизировать структуру базы данных между разными окружениями

## Ваша текущая ситуация с Alembic

У вас уже есть папка `alembic/versions/` с множеством миграций. Это означает, что ваш проект уже использует Alembic для управления схемой базы данных.

## Стратегия резервного копирования

### 1. Автоматические бэкапы через AWS RDS

**Настройка автоматических снапшотов:**
1. В AWS RDS Console выберите ваш инстанс
2. Перейдите в `Maintenance & backups`
3. Настройте:
   - **Backup retention period:** 7 дней (минимум)
   - **Backup window:** выберите время с низкой активностью
   - **Maintenance window:** выберите удобное время

### 2. Ручные бэкапы через pg_dump

Создайте скрипт для автоматического бэкапа:

```bash
#!/bin/bash
# backup_script.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
DB_HOST="your-rds-endpoint"
DB_NAME="connectin"
DB_USER="postgres"

# Создание директории для бэкапов
mkdir -p $BACKUP_DIR

# Создание бэкапа
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
        --format=custom \
        --compress=9 \
        --file="$BACKUP_DIR/connectin_backup_$DATE.dump"

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "connectin_backup_*.dump" -mtime +30 -delete

echo "Backup completed: connectin_backup_$DATE.dump"
```

### 3. Восстановление из бэкапа

```bash
#!/bin/bash
# restore_script.sh

BACKUP_FILE="$1"
DB_HOST="your-rds-endpoint"
DB_NAME="connectin"
DB_USER="postgres"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.dump>"
    exit 1
fi

# Восстановление из бэкапа
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME \
           --clean --if-exists \
           --verbose "$BACKUP_FILE"

echo "Restore completed from: $BACKUP_FILE"
```

## Восстановление проекта с нуля

### Сценарий: Полная потеря базы данных

**Шаг 1: Создание новой базы данных**
```bash
# Подключение к PostgreSQL
psql -h your-rds-endpoint -U postgres

# Создание базы данных
CREATE DATABASE connectin;
\q
```

**Шаг 2: Восстановление структуры через Alembic**
```bash
cd connectin-backend

# Применение всех миграций
alembic upgrade head
```

**Шаг 3: Восстановление данных (если есть бэкап)**
```bash
# Восстановление из pg_dump
pg_restore -h your-rds-endpoint -U postgres -d connectin backup.dump

# Или из SQL файла
psql -h your-rds-endpoint -U postgres -d connectin -f backup.sql
```

## Работа с миграциями Alembic

### Создание новой миграции
```bash
cd connectin-backend

# Автоматическое создание миграции на основе изменений в моделях
alembic revision --autogenerate -m "Описание изменений"

# Ручное создание пустой миграции
alembic revision -m "Описание изменений"
```

### Применение миграций
```bash
# Применить все миграции до последней
alembic upgrade head

# Применить до конкретной миграции
alembic upgrade <revision_id>

# Показать текущую версию
alembic current

# Показать историю миграций
alembic history
```

### Откат миграций
```bash
# Откат на одну миграцию назад
alembic downgrade -1

# Откат до конкретной миграции
alembic downgrade <revision_id>

# Откат всех миграций
alembic downgrade base
```

## Автоматизация через GitHub Actions

Создайте `.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Каждый день в 2:00 AM
  workflow_dispatch:  # Ручной запуск

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Install PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client

      - name: Create backup
        env:
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
          DB_NAME: ${{ secrets.DB_NAME }}
        run: |
          DATE=$(date +%Y%m%d_%H%M%S)
          pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
                  --format=custom \
                  --compress=9 \
                  --file="backup_$DATE.dump"
          
          # Загрузка в AWS S3
          aws s3 cp "backup_$DATE.dump" s3://your-backup-bucket/
```

## Мониторинг и алерты

### Настройка CloudWatch для RDS
1. В AWS RDS Console выберите ваш инстанс
2. Перейдите в `Monitoring`
3. Настройте алерты для:
   - CPU utilization > 80%
   - Free storage space < 1GB
   - Database connections > 80% от максимума

### Проверка целостности данных
```bash
#!/bin/bash
# data_integrity_check.sh

DB_HOST="your-rds-endpoint"
DB_NAME="connectin"
DB_USER="postgres"

# Проверка основных таблиц
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables
ORDER BY n_tup_ins DESC;
"
```

## Рекомендации по безопасности

1. **Регулярные бэкапы:** Минимум ежедневно
2. **Тестирование восстановления:** Ежемесячно проверяйте возможность восстановления
3. **Шифрование:** Используйте шифрование для бэкапов
4. **Доступ:** Ограничьте доступ к бэкапам только необходимым пользователям
5. **Мониторинг:** Настройте алерты на критические события

## Команды для быстрого восстановления

```bash
# Полное восстановление проекта
git clone your-repo
cd ConnectIn
docker-compose up -d postgres
sleep 30
alembic upgrade head
pg_restore -h localhost -U postgres -d connectin backup.dump
docker-compose up -d
```
