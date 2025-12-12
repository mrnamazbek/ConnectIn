# Frontend Dockerfile для React + Vite
FROM node:18-alpine

# Установка рабочей директории
WORKDIR /app

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN npm run build

# Установка serve для статических файлов
RUN npm install -g serve

# Открытие порта
EXPOSE 3000

# Запуск приложения
CMD ["serve", "-s", "dist", "-l", "3000"]
