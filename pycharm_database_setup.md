# Руководство по настройке PyCharm для работы с PostgreSQL

## Настройка подключения к базе данных в PyCharm

### Шаг 1: Открытие Database Tool Window
1. В PyCharm перейдите в меню `View` → `Tool Windows` → `Database`
2. Или нажмите `Alt + 1` (Windows/Linux) или `Cmd + 1` (Mac)

### Шаг 2: Добавление нового подключения
1. Нажмите на `+` в Database tool window
2. Выберите `Data Source` → `PostgreSQL`

### Шаг 3: Заполнение полей подключения

Исходя из вашего DATABASE_URL:
`postgresql://postgres:connectinamazon123@connectin-core-eu-db.cx4gaywwm3rk.eu-north-1.rds.amazonaws.com:5432/connectin`

**Заполните поля следующим образом:**

- **Host:** `connectin-core-eu-db.cx4gaywwm3rk.eu-north-1.rds.amazonaws.com`
- **Port:** `5432`
- **Database:** `connectin`
- **User:** `postgres`
- **Password:** `connectinamazon123`
- **URL:** `jdbc:postgresql://connectin-core-eu-db.cx4gaywwm3rk.eu-north-1.rds.amazonaws.com:5432/connectin`

### Шаг 4: Тестирование подключения
1. Нажмите `Test Connection`
2. Если появится ошибка с драйвером, нажмите `Download missing driver files`
3. После успешного тестирования нажмите `OK`

### Шаг 5: Настройка для локальной разработки

Для работы с локальной базой данных (через docker-compose):

- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `connectin`
- **User:** `postgres`
- **Password:** `connectinamazon123`

## Полезные функции PyCharm Database Tool

### 1. Просмотр структуры базы данных
- Разверните ваше подключение в Database tool window
- Вы увидите все таблицы, индексы, функции

### 2. Выполнение SQL запросов
- Правый клик на базе данных → `New` → `Query Console`
- Или используйте `Ctrl + Shift + F10` для выполнения выделенного SQL

### 3. Редактирование данных
- Правый клик на таблице → `Edit Table`
- Можно редактировать данные прямо в PyCharm

### 4. Экспорт/Импорт данных
- Правый клик на таблице → `Dump Data` для экспорта
- Правый клик на базе данных → `Restore` для импорта

## Настройка для работы с Alembic

### 1. Настройка Run Configuration для Alembic
1. Перейдите в `Run` → `Edit Configurations`
2. Нажмите `+` → `Python`
3. Настройте:
   - **Name:** `Alembic Upgrade`
   - **Script path:** `connectin-backend/alembic`
   - **Parameters:** `upgrade head`
   - **Working directory:** `connectin-backend`

### 2. Создание миграций
1. Создайте новую Run Configuration:
   - **Name:** `Alembic Revision`
   - **Script path:** `connectin-backend/alembic`
   - **Parameters:** `revision --autogenerate -m "description"`
   - **Working directory:** `connectin-backend`

## Переменные окружения в PyCharm

### Настройка Environment Variables
1. Перейдите в `Run` → `Edit Configurations`
2. Выберите вашу конфигурацию
3. В разделе `Environment variables` добавьте:
   - `DATABASE_URL=postgresql://postgres:connectinamazon123@localhost:5432/connectin`
   - `SECRET_KEY=SUPERSECRET123`
   - И другие переменные из вашего .env файла

## Troubleshooting

### Проблема: Connection timeout
**Решение:** Проверьте Security Groups в AWS RDS - разрешите доступ с вашего IP

### Проблема: Authentication failed
**Решение:** Убедитесь, что пароль правильный и пользователь существует

### Проблема: Database does not exist
**Решение:** Создайте базу данных `connectin` в RDS или используйте существующую
