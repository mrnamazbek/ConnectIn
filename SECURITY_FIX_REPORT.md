# 🔒 ConnectIn - Security Best Practices

## 🚨 Проблема, которую мы исправили

GitHub заблокировал push в ваш репозиторий из-за обнаружения секретных ключей в файлах. Это серьезная проблема безопасности, которая могла привести к компрометации ваших API ключей и учетных данных.

## ✅ Что было исправлено

### 1. **Удалены хардкод секреты**
- ❌ `GOOGLE_CLIENT_ID=your-google-client-id-here`
- ❌ `GOOGLE_CLIENT_SECRET=your-google-client-secret-here`
- ❌ `AWS_ACCESS_KEY_ID=your-aws-access-key-id-here`
- ❌ `AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key-here`
- ❌ `OPENAI_API_KEY=your-openai-api-key-here`

### 2. **Заменены на переменные окружения**
- ✅ `GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}`
- ✅ `GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}`
- ✅ `AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}`
- ✅ `AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}`
- ✅ `OPENAI_API_KEY=${OPENAI_API_KEY}`

### 3. **Создан шаблон переменных окружения**
- ✅ `env.template` - файл с примерами переменных окружения

## 🛡️ Рекомендации по безопасности

### 1. **Никогда не коммитьте секреты**
```bash
# ❌ НЕ ДЕЛАЙТЕ ТАК
SECRET_KEY=my-secret-key-123

# ✅ ДЕЛАЙТЕ ТАК
SECRET_KEY=${SECRET_KEY}
```

### 2. **Используйте .env файлы**
```bash
# Создайте .env файл (уже в .gitignore)
cp env.template .env

# Заполните реальными значениями
nano .env
```

### 3. **Проверьте .gitignore**
Убедитесь, что в `.gitignore` есть:
```
.env
.env.local
.env.production
*.key
*.pem
secrets/
```

### 4. **Ротируйте ключи**
Если ключи были скомпрометированы:
- Смените все API ключи
- Обновите переменные окружения
- Проверьте логи на подозрительную активность

## 🔧 Настройка переменных окружения

### Локальная разработка
```bash
# 1. Скопируйте шаблон
cp env.template .env

# 2. Заполните реальными значениями
nano .env

# 3. Запустите приложение
docker-compose up
```

### Railway (Production)
1. Перейдите в Railway Dashboard
2. Выберите ваш проект
3. Перейдите в Settings → Environment
4. Добавьте переменные окружения:
   - `GOOGLE_CLIENT_ID` = ваш реальный Google Client ID
   - `GOOGLE_CLIENT_SECRET` = ваш реальный Google Client Secret
   - `AWS_ACCESS_KEY_ID` = ваш реальный AWS Access Key
   - `AWS_SECRET_ACCESS_KEY` = ваш реальный AWS Secret Key
   - `OPENAI_API_KEY` = ваш реальный OpenAI API Key

### Docker Compose
```yaml
# docker-compose.yml
environment:
  - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
  - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
  # ... другие переменные
```

## 🚨 Что делать если ключи скомпрометированы

### 1. **Немедленные действия**
- Смените все API ключи
- Проверьте логи на подозрительную активность
- Уведомите команду о компрометации

### 2. **Google OAuth**
- Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
- Создайте новые OAuth credentials
- Обновите переменные окружения

### 3. **AWS**
- Перейдите в [AWS IAM Console](https://console.aws.amazon.com/iam/)
- Создайте новые Access Keys
- Удалите старые ключи
- Обновите переменные окружения

### 4. **OpenAI**
- Перейдите в [OpenAI Platform](https://platform.openai.com/)
- Создайте новый API ключ
- Удалите старый ключ
- Обновите переменные окружения

## 📋 Чек-лист безопасности

### Перед каждым коммитом
- [ ] Проверить, что нет хардкод секретов
- [ ] Убедиться, что .env файлы не добавлены
- [ ] Проверить файлы на наличие API ключей

### Регулярно
- [ ] Ротировать API ключи (каждые 3-6 месяцев)
- [ ] Проверять логи на подозрительную активность
- [ ] Обновлять зависимости
- [ ] Проверять права доступа к репозиторию

### При развертывании
- [ ] Использовать переменные окружения
- [ ] Не логировать секреты
- [ ] Настроить мониторинг безопасности
- [ ] Использовать HTTPS везде

## 🔍 Как проверить безопасность

### Поиск секретов в коде
```bash
# Поиск потенциальных секретов
grep -r "sk-" .
grep -r "AKIA" .
grep -r "GOCSPX" .
grep -r "ghp_" .
```

### Проверка .gitignore
```bash
# Проверить, что .env файлы игнорируются
git check-ignore .env
```

### Сканирование зависимостей
```bash
# Проверить уязвимости в зависимостях
npm audit
pip-audit
```

## 📚 Полезные ресурсы

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [12-Factor App](https://12factor.net/config)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)

## 🎯 Заключение

Безопасность - это не одноразовое действие, а постоянный процесс. Следуйте этим рекомендациям, чтобы защитить ваш проект от компрометации секретов и других угроз безопасности.

**Помните**: Лучше потратить время на правильную настройку безопасности сейчас, чем потом разбираться с последствиями утечки данных!
