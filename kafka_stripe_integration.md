# Kafka и Stripe интеграция для ConnectIn

## Kafka интеграция

### 1. Добавление зависимостей

Добавьте в `connectin-backend/requirements.txt`:
```
kafka-python==2.0.2
aiokafka==0.8.11
```

### 2. Создание Kafka клиента

Создайте файл `connectin-backend/app/utils/kafka_client.py`:

```python
import json
import logging
from typing import Dict, Any
from kafka import KafkaProducer, KafkaConsumer
from kafka.errors import KafkaError
import asyncio
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer

logger = logging.getLogger(__name__)

class KafkaClient:
    def __init__(self, bootstrap_servers: str = "localhost:9092"):
        self.bootstrap_servers = bootstrap_servers
        self.producer = None
        self.consumer = None
    
    async def start_producer(self):
        """Инициализация асинхронного продюсера"""
        try:
            self.producer = AIOKafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            await self.producer.start()
            logger.info("Kafka producer started successfully")
        except Exception as e:
            logger.error(f"Failed to start Kafka producer: {e}")
            raise
    
    async def start_consumer(self, topic: str, group_id: str):
        """Инициализация асинхронного консьюмера"""
        try:
            self.consumer = AIOKafkaConsumer(
                topic,
                bootstrap_servers=self.bootstrap_servers,
                group_id=group_id,
                value_deserializer=lambda m: json.loads(m.decode('utf-8'))
            )
            await self.consumer.start()
            logger.info(f"Kafka consumer started for topic: {topic}")
        except Exception as e:
            logger.error(f"Failed to start Kafka consumer: {e}")
            raise
    
    async def send_message(self, topic: str, message: Dict[str, Any]):
        """Отправка сообщения в топик"""
        try:
            await self.producer.send_and_wait(topic, message)
            logger.info(f"Message sent to topic {topic}: {message}")
        except Exception as e:
            logger.error(f"Failed to send message to {topic}: {e}")
            raise
    
    async def consume_messages(self):
        """Потребление сообщений"""
        try:
            async for msg in self.consumer:
                yield msg.value
        except Exception as e:
            logger.error(f"Error consuming messages: {e}")
            raise
    
    async def close(self):
        """Закрытие соединений"""
        if self.producer:
            await self.producer.stop()
        if self.consumer:
            await self.consumer.stop()

# Глобальный экземпляр
kafka_client = KafkaClient()
```

### 3. Создание событий для Kafka

Создайте файл `connectin-backend/app/utils/events.py`:

```python
from typing import Dict, Any
from datetime import datetime
from enum import Enum

class EventType(str, Enum):
    USER_REGISTERED = "user.registered"
    USER_LOGIN = "user.login"
    PROJECT_CREATED = "project.created"
    PROJECT_APPLIED = "project.applied"
    MESSAGE_SENT = "message.sent"
    PAYMENT_PROCESSED = "payment.processed"

class Event:
    def __init__(self, event_type: EventType, data: Dict[str, Any], user_id: int = None):
        self.event_type = event_type
        self.data = data
        self.user_id = user_id
        self.timestamp = datetime.utcnow().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_type": self.event_type.value,
            "data": self.data,
            "user_id": self.user_id,
            "timestamp": self.timestamp
        }

# Примеры событий
def create_user_registered_event(user_id: int, username: str, email: str) -> Event:
    return Event(
        event_type=EventType.USER_REGISTERED,
        data={
            "username": username,
            "email": email
        },
        user_id=user_id
    )

def create_project_created_event(project_id: int, title: str, creator_id: int) -> Event:
    return Event(
        event_type=EventType.PROJECT_CREATED,
        data={
            "project_id": project_id,
            "title": title,
            "creator_id": creator_id
        },
        user_id=creator_id
    )
```

### 4. Интеграция с API endpoints

Обновите `connectin-backend/app/api/v1/users.py`:

```python
from app.utils.kafka_client import kafka_client
from app.utils.events import create_user_registered_event, EventType

# В функции регистрации пользователя
async def register_user(user_data: UserCreate):
    # ... существующий код создания пользователя ...
    
    # Отправка события в Kafka
    event = create_user_registered_event(
        user_id=user.id,
        username=user.username,
        email=user.email
    )
    await kafka_client.send_message("user-events", event.to_dict())
    
    return user
```

## Stripe интеграция

### 1. Добавление зависимостей

Добавьте в `connectin-backend/requirements.txt`:
```
stripe==7.8.0
```

### 2. Создание Stripe сервиса

Создайте файл `connectin-backend/app/services/stripe_service.py`:

```python
import stripe
import logging
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class StripeService:
    def __init__(self, api_key: str):
        stripe.api_key = api_key
        self.api_key = api_key
    
    async def create_customer(self, email: str, name: str, user_id: int) -> Dict[str, Any]:
        """Создание клиента в Stripe"""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata={
                    'user_id': str(user_id)
                }
            )
            logger.info(f"Stripe customer created: {customer.id}")
            return customer
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating customer: {e}")
            raise
    
    async def create_payment_intent(
        self, 
        amount: int, 
        currency: str = "usd",
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Создание платежного намерения"""
        try:
            intent_data = {
                'amount': amount,
                'currency': currency,
            }
            
            if customer_id:
                intent_data['customer'] = customer_id
            
            if metadata:
                intent_data['metadata'] = metadata
            
            payment_intent = stripe.PaymentIntent.create(**intent_data)
            logger.info(f"Payment intent created: {payment_intent.id}")
            return payment_intent
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating payment intent: {e}")
            raise
    
    async def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Создание подписки"""
        try:
            subscription_data = {
                'customer': customer_id,
                'items': [{'price': price_id}],
            }
            
            if metadata:
                subscription_data['metadata'] = metadata
            
            subscription = stripe.Subscription.create(**subscription_data)
            logger.info(f"Subscription created: {subscription.id}")
            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating subscription: {e}")
            raise
    
    async def handle_webhook(self, payload: str, signature: str, endpoint_secret: str) -> Dict[str, Any]:
        """Обработка webhook от Stripe"""
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, endpoint_secret
            )
            logger.info(f"Stripe webhook received: {event['type']}")
            return event
        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            raise
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            raise

# Глобальный экземпляр
stripe_service = StripeService(settings.STRIPE_SECRET_KEY)
```

### 3. Создание API endpoints для платежей

Создайте файл `connectin-backend/app/api/v1/payments.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.stripe_service import stripe_service
from app.utils.kafka_client import kafka_client
from app.utils.events import Event, EventType
from typing import Dict, Any

router = APIRouter()

@router.post("/create-payment-intent")
async def create_payment_intent(
    amount: int,
    currency: str = "usd",
    customer_id: str = None,
    db: Session = Depends(get_db)
):
    """Создание платежного намерения"""
    try:
        payment_intent = await stripe_service.create_payment_intent(
            amount=amount,
            currency=currency,
            customer_id=customer_id,
            metadata={"source": "connectin"}
        )
        
        return {
            "client_secret": payment_intent.client_secret,
            "payment_intent_id": payment_intent.id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/create-customer")
async def create_customer(
    email: str,
    name: str,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Создание клиента в Stripe"""
    try:
        customer = await stripe_service.create_customer(
            email=email,
            name=name,
            user_id=user_id
        )
        
        # Отправка события в Kafka
        event = Event(
            event_type=EventType.PAYMENT_PROCESSED,
            data={
                "customer_id": customer.id,
                "email": email,
                "action": "customer_created"
            },
            user_id=user_id
        )
        await kafka_client.send_message("payment-events", event.to_dict())
        
        return {"customer_id": customer.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Обработка webhook от Stripe"""
    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    
    try:
        event = await stripe_service.handle_webhook(
            payload.decode('utf-8'),
            signature,
            settings.STRIPE_WEBHOOK_SECRET
        )
        
        # Обработка различных типов событий
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            # Логика обработки успешного платежа
            
        elif event['type'] == 'customer.subscription.created':
            subscription = event['data']['object']
            # Логика обработки созданной подписки
            
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### 4. Обновление конфигурации

Добавьте в `connectin-backend/app/core/config.py`:

```python
# Stripe настройки
STRIPE_SECRET_KEY: str = "sk_test_..."  # Ваш секретный ключ
STRIPE_PUBLISHABLE_KEY: str = "pk_test_..."  # Ваш публичный ключ
STRIPE_WEBHOOK_SECRET: str = "whsec_..."  # Секрет webhook
```

### 5. Обновление переменных окружения

Добавьте в ваш `.env` файл:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

### 6. Создание Kafka консьюмера для обработки событий

Создайте файл `connectin-backend/app/workers/kafka_worker.py`:

```python
import asyncio
import logging
from app.utils.kafka_client import kafka_client
from app.utils.events import EventType

logger = logging.getLogger(__name__)

async def process_user_events():
    """Обработка событий пользователей"""
    await kafka_client.start_consumer("user-events", "user-events-group")
    
    async for message in kafka_client.consume_messages():
        try:
            if message["event_type"] == EventType.USER_REGISTERED:
                # Логика обработки регистрации пользователя
                logger.info(f"Processing user registration: {message}")
                
            elif message["event_type"] == EventType.USER_LOGIN:
                # Логика обработки входа пользователя
                logger.info(f"Processing user login: {message}")
                
        except Exception as e:
            logger.error(f"Error processing user event: {e}")

async def process_payment_events():
    """Обработка событий платежей"""
    await kafka_client.start_consumer("payment-events", "payment-events-group")
    
    async for message in kafka_client.consume_messages():
        try:
            if message["event_type"] == EventType.PAYMENT_PROCESSED:
                # Логика обработки платежа
                logger.info(f"Processing payment: {message}")
                
        except Exception as e:
            logger.error(f"Error processing payment event: {e}")

async def start_kafka_workers():
    """Запуск всех Kafka воркеров"""
    tasks = [
        process_user_events(),
        process_payment_events()
    ]
    await asyncio.gather(*tasks)
```

### 7. Интеграция с фронтендом

Создайте файл `connectin-frontend/src/services/stripeService.js`:

```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const stripeService = {
  async createPaymentIntent(amount, currency = 'usd') {
    const response = await fetch('/api/v1/payments/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, currency }),
    });
    
    const { client_secret } = await response.json();
    return client_secret;
  },

  async confirmPayment(clientSecret, paymentMethod) {
    const stripe = await stripePromise;
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      { payment_method: paymentMethod }
    );
    
    if (error) {
      throw new Error(error.message);
    }
    
    return paymentIntent;
  }
};
```

## Запуск и тестирование

### 1. Запуск с Docker Compose
```bash
docker-compose up -d
```

### 2. Проверка Kafka
```bash
# Проверка топиков
docker exec -it connectin_kafka_1 kafka-topics --list --bootstrap-server localhost:9092

# Создание топика
docker exec -it connectin_kafka_1 kafka-topics --create --topic user-events --bootstrap-server localhost:9092
```

### 3. Тестирование Stripe
```bash
# Тестовые карты Stripe
# Успешная: 4242424242424242
# Отклоненная: 4000000000000002
```

## Мониторинг

### Kafka мониторинг
- Используйте Kafka Manager или Confluent Control Center
- Настройте алерты на отставание консьюмеров

### Stripe мониторинг
- Используйте Stripe Dashboard для мониторинга платежей
- Настройте webhook endpoints для получения уведомлений
