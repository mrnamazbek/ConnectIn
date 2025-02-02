# 1) Зафиксируем текущее состояние в Git
git add .
git commit -m "Before merging db folders"

# 2) Создадим папку database, если её почему-то нет
mkdir -p app/database

# 3) Переместим connection.py внутрь папки database
mv app/db/connection.py app/database/connection.py

# 4) Удалим теперь пустую папку db
rm -r app/db
