"""
Практические примеры для подготовки к собеседованию Junior Python Developer
Демонстрация ключевых концепций: JWT, Mutable/Immutable, FastAPI, GIL, Threads, Event Loop
"""

import asyncio
import time
import threading
import json
import hmac
import hashlib
import base64
from typing import Dict, Any
from datetime import datetime, timedelta


# =============================================================================
# 1. JWT IMPLEMENTATION EXAMPLE
# =============================================================================

class SimpleJWT:
    """Простая реализация JWT для демонстрации концепции"""
    
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
    
    def encode(self, payload: Dict[str, Any], expires_in_hours: int = 24) -> str:
        """Создание JWT токена"""
        # Создаем копию payload для модификации
        payload_copy = payload.copy()
        # Добавляем время истечения как timestamp
        payload_copy['exp'] = int((datetime.utcnow() + timedelta(hours=expires_in_hours)).timestamp())
        
        # Кодируем header и payload
        header = base64.urlsafe_b64encode(
            json.dumps({"typ": "JWT", "alg": "HS256"}).encode()
        ).decode().rstrip('=')
        
        payload_encoded = base64.urlsafe_b64encode(
            json.dumps(payload_copy).encode()
        ).decode().rstrip('=')
        
        # Создаем подпись
        message = f"{header}.{payload_encoded}"
        signature = hmac.new(
            self.secret_key.encode(),
            message.encode(),
            hashlib.sha256
        ).digest()
        
        signature_encoded = base64.urlsafe_b64encode(signature).decode().rstrip('=')
        
        return f"{header}.{payload_encoded}.{signature_encoded}"
    
    def decode(self, token: str) -> Dict[str, Any]:
        """Декодирование и проверка JWT токена"""
        try:
            header, payload, signature = token.split('.')
            
            # Проверяем подпись
            message = f"{header}.{payload}"
            expected_signature = hmac.new(
                self.secret_key.encode(),
                message.encode(),
                hashlib.sha256
            ).digest()
            
            signature_decoded = base64.urlsafe_b64decode(signature + '==')
            
            if not hmac.compare_digest(signature_decoded, expected_signature):
                raise ValueError("Invalid signature")
            
            # Декодируем payload
            payload_decoded = json.loads(
                base64.urlsafe_b64decode(payload + '==').decode()
            )
            
            # Проверяем время истечения
            if datetime.utcnow().timestamp() > payload_decoded['exp']:
                raise ValueError("Token expired")
            
            return payload_decoded
            
        except Exception as e:
            raise ValueError(f"Invalid token: {e}")


# =============================================================================
# 2. MUTABLE vs IMMUTABLE DEMONSTRATION
# =============================================================================

def demonstrate_mutable_immutable():
    """Демонстрация разницы между mutable и immutable объектами"""
    
    print("=== MUTABLE vs IMMUTABLE DEMONSTRATION ===")
    
    # Immutable примеры
    print("\n--- IMMUTABLE OBJECTS ---")
    
    # Integer
    x = 42
    print(f"x = {x}, id = {id(x)}")
    x += 1
    print(f"x = {x}, id = {id(x)}")  # Новый объект!
    
    # String
    s = "hello"
    print(f"s = '{s}', id = {id(s)}")
    s += " world"
    print(f"s = '{s}', id = {id(s)}")  # Новый объект!
    
    # Tuple
    t = (1, 2, 3)
    print(f"t = {t}, id = {id(t)}")
    t += (4,)
    print(f"t = {t}, id = {id(t)}")  # Новый объект!
    
    # Mutable примеры
    print("\n--- MUTABLE OBJECTS ---")
    
    # List
    lst = [1, 2, 3]
    print(f"lst = {lst}, id = {id(lst)}")
    lst.append(4)
    print(f"lst = {lst}, id = {id(lst)}")  # Тот же объект!
    
    # Dictionary
    d = {"a": 1}
    print(f"d = {d}, id = {id(d)}")
    d["b"] = 2
    print(f"d = {d}, id = {id(d)}")  # Тот же объект!
    
    # Set
    s_set = {1, 2, 3}
    print(f"s_set = {s_set}, id = {id(s_set)}")
    s_set.add(4)
    print(f"s_set = {s_set}, id = {id(s_set)}")  # Тот же объект!


# =============================================================================
# 3. GIL IMPACT DEMONSTRATION
# =============================================================================

def cpu_intensive_task(n: int) -> int:
    """CPU-intensive задача для демонстрации GIL"""
    result = 0
    for i in range(n):
        result += i * i
    return result


def io_intensive_task(duration: float) -> str:
    """I/O-intensive задача (имитация)"""
    time.sleep(duration)
    return f"Completed after {duration}s"


def demonstrate_gil_impact():
    """Демонстрация влияния GIL на производительность"""
    
    print("\n=== GIL IMPACT DEMONSTRATION ===")
    
    # CPU-intensive задачи
    print("\n--- CPU-INTENSIVE TASKS ---")
    n = 1000000
    
    # Один поток
    start_time = time.time()
    result1 = cpu_intensive_task(n)
    single_thread_time = time.time() - start_time
    print(f"Один поток: {single_thread_time:.2f}с, результат: {result1}")
    
    # Два потока (может быть медленнее из-за GIL)
    start_time = time.time()
    thread1 = threading.Thread(target=cpu_intensive_task, args=(n,))
    thread2 = threading.Thread(target=cpu_intensive_task, args=(n,))
    
    thread1.start()
    thread2.start()
    thread1.join()
    thread2.join()
    multi_thread_time = time.time() - start_time
    print(f"Два потока: {multi_thread_time:.2f}с")
    
    # I/O-intensive задачи
    print("\n--- I/O-INTENSIVE TASKS ---")
    duration = 1.0
    
    # Один поток
    start_time = time.time()
    io_intensive_task(duration)
    io_intensive_task(duration)
    single_io_time = time.time() - start_time
    print(f"Один поток I/O: {single_io_time:.2f}с")
    
    # Два потока (эффективно для I/O)
    start_time = time.time()
    thread1 = threading.Thread(target=io_intensive_task, args=(duration,))
    thread2 = threading.Thread(target=io_intensive_task, args=(duration,))
    
    thread1.start()
    thread2.start()
    thread1.join()
    thread2.join()
    multi_io_time = time.time() - start_time
    print(f"Два потока I/O: {multi_io_time:.2f}с")


# =============================================================================
# 4. THREADING EXAMPLES
# =============================================================================

class ThreadSafeCounter:
    """Thread-safe счетчик для демонстрации синхронизации"""
    
    def __init__(self):
        self._value = 0
        self._lock = threading.Lock()
    
    def increment(self):
        with self._lock:
            self._value += 1
    
    def get_value(self):
        with self._lock:
            return self._value


def worker_with_counter(counter: ThreadSafeCounter, iterations: int):
    """Рабочая функция для демонстрации потоков"""
    for _ in range(iterations):
        counter.increment()


def demonstrate_threading():
    """Демонстрация работы с потоками"""
    
    print("\n=== THREADING DEMONSTRATION ===")
    
    # Thread-safe счетчик
    counter = ThreadSafeCounter()
    iterations = 100000
    num_threads = 5
    
    print(f"Запускаем {num_threads} потоков, каждый делает {iterations} инкрементов")
    
    start_time = time.time()
    threads = []
    
    for i in range(num_threads):
        thread = threading.Thread(target=worker_with_counter, args=(counter, iterations))
        threads.append(thread)
        thread.start()
    
    for thread in threads:
        thread.join()
    
    end_time = time.time()
    print(f"Итоговое значение: {counter.get_value()}")
    print(f"Время выполнения: {end_time - start_time:.2f}с")
    print(f"Ожидаемое значение: {num_threads * iterations}")


# =============================================================================
# 5. EVENT LOOP EXAMPLES
# =============================================================================

async def async_io_task(name: str, duration: float) -> str:
    """Асинхронная I/O задача"""
    print(f"Задача {name} началась")
    await asyncio.sleep(duration)  # Неблокирующее ожидание
    print(f"Задача {name} завершилась")
    return f"Результат {name}"


async def demonstrate_event_loop():
    """Демонстрация работы event loop"""
    
    print("\n=== EVENT LOOP DEMONSTRATION ===")
    
    # Создаем несколько асинхронных задач
    tasks = [
        async_io_task("A", 2),
        async_io_task("B", 1),
        async_io_task("C", 3),
        async_io_task("D", 1.5)
    ]
    
    print("Запускаем все задачи одновременно...")
    start_time = time.time()
    
    # Выполняем все задачи параллельно
    results = await asyncio.gather(*tasks)
    
    end_time = time.time()
    print(f"Все задачи завершены за {end_time - start_time:.2f}с")
    print(f"Результаты: {results}")


# =============================================================================
# 6. FASTAPI-LIKE EXAMPLE
# =============================================================================

class SimpleWebFramework:
    """Простая имитация FastAPI для демонстрации концепций"""
    
    def __init__(self):
        self.routes = {}
    
    def get(self, path: str):
        """Декоратор для GET маршрутов"""
        def decorator(func):
            self.routes[f"GET {path}"] = func
            return func
        return decorator
    
    def post(self, path: str):
        """Декоратор для POST маршрутов"""
        def decorator(func):
            self.routes[f"POST {path}"] = func
            return func
        return decorator
    
    async def handle_request(self, method: str, path: str, data: dict = None):
        """Обработка запроса (имитация)"""
        route_key = f"{method} {path}"
        
        if route_key in self.routes:
            func = self.routes[route_key]
            
            # Имитация валидации данных
            if data:
                print(f"Валидация данных: {data}")
            
            # Выполнение функции
            if asyncio.iscoroutinefunction(func):
                result = await func(data)
            else:
                result = func(data)
            
            # Имитация формирования ответа
            response = {
                "status": "success",
                "data": result,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return response
        else:
            return {"status": "error", "message": "Route not found"}


def demonstrate_web_framework():
    """Демонстрация работы веб-фреймворка"""
    
    print("\n=== WEB FRAMEWORK DEMONSTRATION ===")
    
    app = SimpleWebFramework()
    
    @app.get("/users/{user_id}")
    async def get_user(user_id: str):
        # Имитация получения пользователя из БД
        await asyncio.sleep(0.1)  # Имитация I/O операции
        return {"user_id": user_id, "name": f"User {user_id}"}
    
    @app.post("/users")
    async def create_user(user_data: dict):
        # Имитация создания пользователя
        await asyncio.sleep(0.1)  # Имитация I/O операции
        return {"message": "User created", "user": user_data}
    
    async def test_routes():
        # Тестирование маршрутов
        print("Тестируем GET /users/123:")
        response1 = await app.handle_request("GET", "/users/123")
        print(f"Ответ: {response1}")
        
        print("\nТестируем POST /users:")
        user_data = {"name": "John Doe", "email": "john@example.com"}
        response2 = await app.handle_request("POST", "/users", user_data)
        print(f"Ответ: {response2}")
    
    asyncio.run(test_routes())


# =============================================================================
# MAIN EXECUTION
# =============================================================================

def main():
    """Главная функция для запуска всех демонстраций"""
    
    print("🚀 ПОДГОТОВКА К СОБЕСЕДОВАНИЮ JUNIOR PYTHON DEVELOPER")
    print("=" * 60)
    
    # 1. JWT Demo
    print("\n1. JWT DEMONSTRATION")
    print("-" * 30)
    jwt = SimpleJWT("my-secret-key")
    
    # Создание токена
    payload = {"user_id": 123, "username": "john_doe", "role": "user"}
    token = jwt.encode(payload, expires_in_hours=1)
    print(f"Созданный токен: {token}")
    
    # Декодирование токена
    try:
        decoded = jwt.decode(token)
        print(f"Декодированный payload: {decoded}")
    except ValueError as e:
        print(f"Ошибка декодирования: {e}")
    
    # 2. Mutable vs Immutable
    demonstrate_mutable_immutable()
    
    # 3. GIL Impact
    demonstrate_gil_impact()
    
    # 4. Threading
    demonstrate_threading()
    
    # 5. Event Loop
    asyncio.run(demonstrate_event_loop())
    
    # 6. Web Framework
    demonstrate_web_framework()
    
    print("\n✅ ВСЕ ДЕМОНСТРАЦИИ ЗАВЕРШЕНЫ!")
    print("Удачи на собеседовании! 🎯")


if __name__ == "__main__":
    main()
