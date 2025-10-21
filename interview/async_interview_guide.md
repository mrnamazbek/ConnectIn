# Асинхронность в Python - Руководство для собеседования

## 🚀 Основы async/await

### Что такое асинхронность?
Асинхронность позволяет выполнять код без блокировки основного потока. Вместо ожидания завершения операции, программа может переключиться на выполнение других задач.

### Базовый синтаксис
```python
import asyncio
import time

# Синхронная функция
def sync_function():
    print("Start sync function")
    time.sleep(2)  # Блокирующая операция
    print("End sync function")
    return "sync result"

# Асинхронная функция
async def async_function():
    print("Start async function")
    await asyncio.sleep(2)  # Неблокирующая операция
    print("End async function")
    return "async result"

# Сравнение времени выполнения
async def compare_sync_async():
    # Синхронное выполнение
    start = time.time()
    sync_function()
    sync_function()
    sync_time = time.time() - start
    print(f"Sync time: {sync_time:.2f}s")
    
    # Асинхронное выполнение
    start = time.time()
    await asyncio.gather(async_function(), async_function())
    async_time = time.time() - start
    print(f"Async time: {async_time:.2f}s")

# Запуск
asyncio.run(compare_sync_async())
```

### Основные концепции
```python
import asyncio

# 1. async def - определение асинхронной функции
async def fetch_data(url):
    # Имитация HTTP запроса
    await asyncio.sleep(1)
    return f"Data from {url}"

# 2. await - ожидание завершения асинхронной операции
async def main():
    result = await fetch_data("https://api.example.com")
    print(result)

# 3. asyncio.run() - запуск асинхронной программы
asyncio.run(main())
```

## 🔄 Event Loop

### Что такое Event Loop?
Event Loop - это ядро асинхронного программирования в Python. Он управляет выполнением задач, переключаясь между ними когда одна из них ждет I/O операции.

### Как работает Event Loop
```python
import asyncio
import time

async def task1():
    print("Task 1 started")
    await asyncio.sleep(1)
    print("Task 1 completed")
    return "Task 1 result"

async def task2():
    print("Task 2 started")
    await asyncio.sleep(0.5)
    print("Task 2 completed")
    return "Task 2 result"

async def task3():
    print("Task 3 started")
    await asyncio.sleep(2)
    print("Task 3 completed")
    return "Task 3 result"

async def demonstrate_event_loop():
    print("=== Sequential execution ===")
    start = time.time()
    
    result1 = await task1()
    result2 = await task2()
    result3 = await task3()
    
    sequential_time = time.time() - start
    print(f"Sequential time: {sequential_time:.2f}s")
    
    print("\n=== Concurrent execution ===")
    start = time.time()
    
    # Event loop переключается между задачами
    results = await asyncio.gather(task1(), task2(), task3())
    
    concurrent_time = time.time() - start
    print(f"Concurrent time: {concurrent_time:.2f}s")
    print(f"Results: {results}")

asyncio.run(demonstrate_event_loop())
```

### Управление Event Loop
```python
import asyncio

async def long_running_task():
    for i in range(10):
        print(f"Long task: {i}")
        await asyncio.sleep(0.5)

async def short_task():
    print("Short task completed")
    return "Short result"

async def demonstrate_loop_control():
    # Создание задач
    long_task = asyncio.create_task(long_running_task())
    short_task_coro = short_task()
    
    # Ожидание завершения короткой задачи
    short_result = await short_task_coro
    print(f"Short result: {short_result}")
    
    # Отмена длинной задачи
    long_task.cancel()
    
    try:
        await long_task
    except asyncio.CancelledError:
        print("Long task was cancelled")

asyncio.run(demonstrate_loop_control())
```

## 📚 asyncio модуль

### Основные функции asyncio
```python
import asyncio
import aiohttp
import time

# 1. asyncio.gather() - выполнение нескольких задач параллельно
async def fetch_url(session, url, delay):
    await asyncio.sleep(delay)
    return f"Response from {url}"

async def demonstrate_gather():
    urls = [
        ("https://api1.com", 1),
        ("https://api2.com", 0.5),
        ("https://api3.com", 2)
    ]
    
    start = time.time()
    
    # Последовательное выполнение
    results_seq = []
    for url, delay in urls:
        result = await fetch_url(None, url, delay)
        results_seq.append(result)
    
    seq_time = time.time() - start
    print(f"Sequential time: {seq_time:.2f}s")
    
    # Параллельное выполнение
    start = time.time()
    tasks = [fetch_url(None, url, delay) for url, delay in urls]
    results_par = await asyncio.gather(*tasks)
    
    par_time = time.time() - start
    print(f"Parallel time: {par_time:.2f}s")
    print(f"Results: {results_par}")

# 2. asyncio.create_task() - создание задачи
async def demonstrate_tasks():
    async def worker(name, duration):
        print(f"Worker {name} started")
        await asyncio.sleep(duration)
        print(f"Worker {name} completed")
        return f"Result from {name}"
    
    # Создание задач
    task1 = asyncio.create_task(worker("A", 1))
    task2 = asyncio.create_task(worker("B", 2))
    task3 = asyncio.create_task(worker("C", 0.5))
    
    # Ожидание завершения всех задач
    results = await asyncio.gather(task1, task2, task3)
    print(f"All results: {results}")

# 3. asyncio.wait() - ожидание с условиями
async def demonstrate_wait():
    async def task_with_delay(name, delay):
        await asyncio.sleep(delay)
        return f"Task {name} completed"
    
    tasks = [
        asyncio.create_task(task_with_delay("A", 1)),
        asyncio.create_task(task_with_delay("B", 2)),
        asyncio.create_task(task_with_delay("C", 0.5))
    ]
    
    # Ожидание завершения всех задач
    done, pending = await asyncio.wait(tasks, return_when=asyncio.ALL_COMPLETED)
    
    print("Completed tasks:")
    for task in done:
        print(f"  {task.result()}")
    
    print(f"Pending tasks: {len(pending)}")

# 4. asyncio.wait_for() - ожидание с таймаутом
async def demonstrate_wait_for():
    async def slow_task():
        await asyncio.sleep(5)
        return "Slow task completed"
    
    try:
        # Ожидание с таймаутом 2 секунды
        result = await asyncio.wait_for(slow_task(), timeout=2.0)
        print(result)
    except asyncio.TimeoutError:
        print("Task timed out!")

# Запуск примеров
asyncio.run(demonstrate_gather())
print("\n" + "="*50 + "\n")
asyncio.run(demonstrate_tasks())
print("\n" + "="*50 + "\n")
asyncio.run(demonstrate_wait())
print("\n" + "="*50 + "\n")
asyncio.run(demonstrate_wait_for())
```

### Асинхронные контекстные менеджеры
```python
import asyncio

class AsyncResourceManager:
    def __init__(self, name):
        self.name = name
        self.is_open = False
    
    async def __aenter__(self):
        print(f"Opening {self.name}...")
        await asyncio.sleep(0.1)  # Имитация открытия ресурса
        self.is_open = True
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print(f"Closing {self.name}...")
        await asyncio.sleep(0.1)  # Имитация закрытия ресурса
        self.is_open = False
        
        if exc_type:
            print(f"Exception occurred: {exc_type.__name__}")
        
        return False  # Не подавлять исключения
    
    async def do_work(self):
        if not self.is_open:
            raise RuntimeError("Resource is not open")
        
        print(f"Working with {self.name}")
        await asyncio.sleep(1)

async def demonstrate_async_context():
    async with AsyncResourceManager("Database") as db:
        await db.do_work()
    
    print("Resource automatically closed")

asyncio.run(demonstrate_async_context())
```

## 🌐 Асинхронные HTTP запросы

### Использование aiohttp
```python
import asyncio
import aiohttp
import time

async def fetch_url(session, url):
    """Асинхронный HTTP запрос"""
    try:
        async with session.get(url) as response:
            data = await response.text()
            return {
                'url': url,
                'status': response.status,
                'length': len(data)
            }
    except Exception as e:
        return {
            'url': url,
            'error': str(e)
        }

async def fetch_multiple_urls():
    urls = [
        'https://httpbin.org/delay/1',
        'https://httpbin.org/delay/2',
        'https://httpbin.org/delay/1',
        'https://httpbin.org/json',
        'https://httpbin.org/uuid'
    ]
    
    async with aiohttp.ClientSession() as session:
        # Создание задач для всех URL
        tasks = [fetch_url(session, url) for url in urls]
        
        # Параллельное выполнение
        start = time.time()
        results = await asyncio.gather(*tasks)
        end = time.time()
        
        print(f"Fetched {len(urls)} URLs in {end - start:.2f} seconds")
        
        for result in results:
            if 'error' in result:
                print(f"Error for {result['url']}: {result['error']}")
            else:
                print(f"{result['url']}: {result['status']} ({result['length']} bytes)")

# Запуск
asyncio.run(fetch_multiple_urls())
```

### Асинхронная обработка файлов
```python
import asyncio
import aiofiles
import os

async def read_file_async(filename):
    """Асинхронное чтение файла"""
    async with aiofiles.open(filename, 'r') as file:
        content = await file.read()
        return content

async def write_file_async(filename, content):
    """Асинхронная запись в файл"""
    async with aiofiles.open(filename, 'w') as file:
        await file.write(content)

async def process_files_async():
    # Создание тестовых файлов
    test_files = ['file1.txt', 'file2.txt', 'file3.txt']
    
    # Запись файлов
    write_tasks = []
    for i, filename in enumerate(test_files):
        content = f"Content of {filename}\nLine 1\nLine 2\nLine 3"
        write_tasks.append(write_file_async(filename, content))
    
    await asyncio.gather(*write_tasks)
    print("Files written")
    
    # Чтение файлов
    read_tasks = [read_file_async(filename) for filename in test_files]
    contents = await asyncio.gather(*read_tasks)
    
    for filename, content in zip(test_files, contents):
        print(f"{filename}: {len(content)} characters")
    
    # Очистка
    for filename in test_files:
        os.remove(filename)
    print("Files cleaned up")

asyncio.run(process_files_async())
```

## 🔧 Когда использовать асинхронность

### Подходящие случаи
```python
import asyncio
import time

# 1. I/O операции (сетевые запросы, файлы, базы данных)
async def io_intensive_task():
    """I/O интенсивная задача - подходит для async"""
    await asyncio.sleep(1)  # Имитация сетевого запроса
    return "I/O result"

# 2. Множественные независимые операции
async def multiple_requests():
    """Множественные запросы - отлично для async"""
    tasks = [io_intensive_task() for _ in range(5)]
    results = await asyncio.gather(*tasks)
    return results

# 3. Ожидание событий
async def event_driven_task():
    """Ожидание событий - подходит для async"""
    # Ожидание сигнала или события
    await asyncio.sleep(2)
    return "Event received"
```

### Неподходящие случаи
```python
import asyncio
import time

# 1. CPU интенсивные задачи
def cpu_intensive_task():
    """CPU интенсивная задача - НЕ подходит для async"""
    result = 0
    for i in range(10000000):
        result += i * i
    return result

# 2. Синхронные библиотеки
def sync_database_operation():
    """Синхронная операция с БД - НЕ подходит для async"""
    time.sleep(1)  # Имитация синхронной операции
    return "DB result"

# 3. Простые вычисления
def simple_calculation(a, b):
    """Простое вычисление - НЕ нужно делать async"""
    return a + b

async def demonstrate_when_not_to_use_async():
    # Это НЕ даст преимущества в производительности
    start = time.time()
    
    # Неправильно - CPU задачи в async
    tasks = [asyncio.to_thread(cpu_intensive_task) for _ in range(3)]
    results = await asyncio.gather(*tasks)
    
    end = time.time()
    print(f"CPU tasks in async: {end - start:.2f}s")
    
    # Правильно - использовать multiprocessing для CPU задач
    import multiprocessing
    start = time.time()
    
    with multiprocessing.Pool(3) as pool:
        results = pool.map(cpu_intensive_task, [None] * 3)
    
    end = time.time()
    print(f"CPU tasks with multiprocessing: {end - start:.2f}s")

asyncio.run(demonstrate_when_not_to_use_async())
```

## 🎯 Вопросы для собеседования

### 1. Что такое async/await и как это работает?
**Ответ:** async/await - это синтаксис для асинхронного программирования в Python. async определяет асинхронную функцию, а await приостанавливает выполнение функции до завершения асинхронной операции, позволяя event loop переключиться на другие задачи.

### 2. В чем разница между threading и asyncio?
**Ответ:** 
- **Threading**: использует системные потоки, подходит для I/O операций, но ограничен GIL
- **Asyncio**: использует один поток с event loop, идеален для I/O операций, обходит ограничения GIL

### 3. Когда использовать асинхронность?
**Ответ:** Асинхронность полезна для:
- I/O операций (сетевые запросы, файлы, БД)
- Множественных независимых операций
- Ожидания событий
- НЕ подходит для CPU-интенсивных задач

### 4. Что такое event loop?
**Ответ:** Event loop - это ядро асинхронного программирования, которое управляет выполнением задач, переключаясь между ними когда одна ждет I/O операции.

### 5. Как обработать исключения в async функциях?
**Ответ:** Используйте try/except блоки как в обычных функциях, или обрабатывайте исключения в asyncio.gather() с параметром return_exceptions=True.

## 💡 Практические задачи

### Задача 1: Асинхронный веб-скрапер
```python
import asyncio
import aiohttp
from urllib.parse import urljoin, urlparse
import time

class AsyncWebScraper:
    def __init__(self, max_concurrent=10):
        self.max_concurrent = max_concurrent
        self.visited = set()
        self.results = []
    
    async def fetch_page(self, session, url):
        """Получение страницы"""
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    content = await response.text()
                    return {
                        'url': url,
                        'content': content,
                        'status': response.status
                    }
        except Exception as e:
            return {'url': url, 'error': str(e)}
    
    async def scrape_urls(self, urls):
        """Скрапинг множественных URL"""
        connector = aiohttp.TCPConnector(limit=self.max_concurrent)
        
        async with aiohttp.ClientSession(connector=connector) as session:
            tasks = [self.fetch_page(session, url) for url in urls]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, dict) and 'error' not in result:
                    self.results.append(result)
            
            return self.results

# Использование
async def main():
    urls = [
        'https://httpbin.org/html',
        'https://httpbin.org/json',
        'https://httpbin.org/xml',
        'https://httpbin.org/uuid',
        'https://httpbin.org/delay/1'
    ]
    
    scraper = AsyncWebScraper(max_concurrent=3)
    start = time.time()
    
    results = await scraper.scrape_urls(urls)
    
    end = time.time()
    print(f"Scraped {len(results)} pages in {end - start:.2f} seconds")
    
    for result in results:
        print(f"{result['url']}: {result['status']} ({len(result['content'])} chars)")

asyncio.run(main())
```

### Задача 2: Асинхронная очередь задач
```python
import asyncio
import random
import time

class AsyncTaskQueue:
    def __init__(self, max_workers=3):
        self.max_workers = max_workers
        self.queue = asyncio.Queue()
        self.workers = []
        self.results = []
    
    async def worker(self, worker_id):
        """Рабочий процесс"""
        while True:
            try:
                task = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                if task is None:  # Сигнал завершения
                    break
                
                print(f"Worker {worker_id} processing task: {task}")
                
                # Имитация обработки задачи
                await asyncio.sleep(random.uniform(0.5, 2.0))
                
                result = f"Task {task} completed by worker {worker_id}"
                self.results.append(result)
                
                self.queue.task_done()
                
            except asyncio.TimeoutError:
                continue
    
    async def add_task(self, task):
        """Добавление задачи в очередь"""
        await self.queue.put(task)
    
    async def start_workers(self):
        """Запуск рабочих процессов"""
        self.workers = [
            asyncio.create_task(self.worker(i))
            for i in range(self.max_workers)
        ]
    
    async def stop_workers(self):
        """Остановка рабочих процессов"""
        # Отправляем сигнал завершения
        for _ in range(self.max_workers):
            await self.queue.put(None)
        
        # Ждем завершения всех рабочих
        await asyncio.gather(*self.workers)
    
    async def process_tasks(self, tasks):
        """Обработка списка задач"""
        await self.start_workers()
        
        # Добавляем все задачи
        for task in tasks:
            await self.add_task(task)
        
        # Ждем завершения всех задач
        await self.queue.join()
        
        # Останавливаем рабочих
        await self.stop_workers()
        
        return self.results

# Использование
async def demonstrate_task_queue():
    tasks = [f"Task-{i}" for i in range(10)]
    
    queue = AsyncTaskQueue(max_workers=3)
    start = time.time()
    
    results = await queue.process_tasks(tasks)
    
    end = time.time()
    print(f"Processed {len(results)} tasks in {end - start:.2f} seconds")
    
    for result in results:
        print(result)

asyncio.run(demonstrate_task_queue())
```

### Задача 3: Асинхронный кеш с TTL
```python
import asyncio
import time
from typing import Any, Optional

class AsyncTTLCache:
    def __init__(self, ttl_seconds: int = 300):
        self.ttl_seconds = ttl_seconds
        self.cache = {}
        self.timestamps = {}
        self.lock = asyncio.Lock()
    
    async def get(self, key: str) -> Optional[Any]:
        """Получение значения из кеша"""
        async with self.lock:
            if key in self.cache:
                if time.time() - self.timestamps[key] < self.ttl_seconds:
                    return self.cache[key]
                else:
                    # Удаляем устаревший элемент
                    del self.cache[key]
                    del self.timestamps[key]
            return None
    
    async def set(self, key: str, value: Any) -> None:
        """Сохранение значения в кеш"""
        async with self.lock:
            self.cache[key] = value
            self.timestamps[key] = time.time()
    
    async def delete(self, key: str) -> bool:
        """Удаление значения из кеша"""
        async with self.lock:
            if key in self.cache:
                del self.cache[key]
                del self.timestamps[key]
                return True
            return False
    
    async def clear_expired(self) -> int:
        """Очистка устаревших элементов"""
        async with self.lock:
            current_time = time.time()
            expired_keys = [
                key for key, timestamp in self.timestamps.items()
                if current_time - timestamp >= self.ttl_seconds
            ]
            
            for key in expired_keys:
                del self.cache[key]
                del self.timestamps[key]
            
            return len(expired_keys)

# Использование
async def demonstrate_async_cache():
    cache = AsyncTTLCache(ttl_seconds=2)
    
    # Сохранение значений
    await cache.set("user:1", {"name": "Alice", "age": 30})
    await cache.set("user:2", {"name": "Bob", "age": 25})
    
    # Получение значений
    user1 = await cache.get("user:1")
    print(f"User 1: {user1}")
    
    # Ожидание истечения TTL
    await asyncio.sleep(3)
    
    user1_expired = await cache.get("user:1")
    print(f"User 1 after TTL: {user1_expired}")
    
    # Очистка устаревших элементов
    expired_count = await cache.clear_expired()
    print(f"Cleared {expired_count} expired items")

asyncio.run(demonstrate_async_cache())
```

Этот материал покрывает все аспекты асинхронного программирования в Python, которые важны для собеседования. Практикуйтесь с примерами и понимайте, когда асинхронность действительно полезна!
