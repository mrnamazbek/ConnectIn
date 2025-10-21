# Память и потоки - Руководство для собеседования

## 🔒 GIL (Global Interpreter Lock)

### Что такое GIL?
GIL - это механизм в CPython, который позволяет выполнять только один поток Python кода одновременно. Это означает, что даже в многопоточной программе только один поток может выполнять Python байт-код в любой момент времени.

### Как работает GIL?
```python
import threading
import time

def cpu_bound_task():
    """CPU-интенсивная задача"""
    result = 0
    for i in range(10000000):
        result += i * i
    return result

# Тест с threading (ограничен GIL)
def test_threading():
    start_time = time.time()
    
    threads = []
    for _ in range(4):
        thread = threading.Thread(target=cpu_bound_task)
        threads.append(thread)
        thread.start()
    
    for thread in threads:
        thread.join()
    
    end_time = time.time()
    print(f"Threading time: {end_time - start_time:.2f} seconds")

# Тест с multiprocessing (обходит GIL)
import multiprocessing

def test_multiprocessing():
    start_time = time.time()
    
    processes = []
    for _ in range(4):
        process = multiprocessing.Process(target=cpu_bound_task)
        processes.append(process)
        process.start()
    
    for process in processes:
        process.join()
    
    end_time = time.time()
    print(f"Multiprocessing time: {end_time - start_time:.2f} seconds")

# Запуск тестов
if __name__ == "__main__":
    test_threading()
    test_multiprocessing()
```

### Когда GIL не мешает?
```python
import threading
import requests
import time

def io_bound_task(url):
    """I/O операция - GIL освобождается"""
    response = requests.get(url)
    return response.status_code

def test_io_threading():
    urls = [
        "https://httpbin.org/delay/1",
        "https://httpbin.org/delay/1", 
        "https://httpbin.org/delay/1",
        "https://httpbin.org/delay/1"
    ]
    
    start_time = time.time()
    
    threads = []
    for url in urls:
        thread = threading.Thread(target=io_bound_task, args=(url,))
        threads.append(thread)
        thread.start()
    
    for thread in threads:
        thread.join()
    
    end_time = time.time()
    print(f"I/O Threading time: {end_time - start_time:.2f} seconds")

# Результат: ~1 секунда вместо 4 секунд последовательно
```

## 🧵 Threading vs Multiprocessing

### Threading
```python
import threading
import time
import queue

# Потокобезопасная очередь
q = queue.Queue()

def worker():
    """Рабочий поток"""
    while True:
        item = q.get()
        if item is None:
            break
        print(f"Processing {item} in thread {threading.current_thread().name}")
        time.sleep(1)  # Имитация работы
        q.task_done()

# Создание потоков
threads = []
for i in range(3):
    thread = threading.Thread(target=worker, name=f"Worker-{i}")
    thread.start()
    threads.append(thread)

# Добавление задач
for i in range(10):
    q.put(f"Task-{i}")

# Ожидание завершения
q.join()

# Остановка потоков
for _ in range(3):
    q.put(None)
for thread in threads:
    thread.join()
```

### Multiprocessing
```python
import multiprocessing
import time

def cpu_intensive_task(n):
    """CPU-интенсивная задача"""
    result = 0
    for i in range(n):
        result += i * i
    return result

def test_multiprocessing():
    # Создание пула процессов
    with multiprocessing.Pool(processes=4) as pool:
        # Параллельное выполнение
        results = pool.map(cpu_intensive_task, [1000000] * 4)
        print(f"Results: {results}")

# Альтернативный способ
def test_process():
    processes = []
    
    for i in range(4):
        process = multiprocessing.Process(
            target=cpu_intensive_task, 
            args=(1000000,)
        )
        processes.append(process)
        process.start()
    
    for process in processes:
        process.join()

if __name__ == "__main__":
    test_multiprocessing()
```

### Сравнение производительности
```python
import threading
import multiprocessing
import time
import concurrent.futures

def cpu_task(n):
    """CPU-интенсивная задача"""
    return sum(i * i for i in range(n))

def io_task(delay):
    """I/O задача"""
    time.sleep(delay)
    return f"Completed after {delay}s"

# Тест CPU задач
def test_cpu_performance():
    n = 1000000
    
    # Последовательно
    start = time.time()
    results = [cpu_task(n) for _ in range(4)]
    sequential_time = time.time() - start
    
    # Threading
    start = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(cpu_task, [n] * 4))
    threading_time = time.time() - start
    
    # Multiprocessing
    start = time.time()
    with concurrent.futures.ProcessPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(cpu_task, [n] * 4))
    multiprocessing_time = time.time() - start
    
    print(f"Sequential: {sequential_time:.2f}s")
    print(f"Threading: {threading_time:.2f}s")
    print(f"Multiprocessing: {multiprocessing_time:.2f}s")

# Тест I/O задач
def test_io_performance():
    delays = [1, 1, 1, 1]
    
    # Последовательно
    start = time.time()
    results = [io_task(delay) for delay in delays]
    sequential_time = time.time() - start
    
    # Threading
    start = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(io_task, delays))
    threading_time = time.time() - start
    
    print(f"I/O Sequential: {sequential_time:.2f}s")
    print(f"I/O Threading: {threading_time:.2f}s")
```

## ⚠️ Race Conditions

### Что такое Race Condition?
Race condition возникает, когда результат выполнения программы зависит от порядка выполнения потоков, который может быть непредсказуемым.

### Пример Race Condition
```python
import threading
import time

# Небезопасный счетчик
class UnsafeCounter:
    def __init__(self):
        self.value = 0
    
    def increment(self):
        # Это не атомарная операция!
        temp = self.value
        temp += 1
        self.value = temp

# Безопасный счетчик с блокировкой
class SafeCounter:
    def __init__(self):
        self.value = 0
        self.lock = threading.Lock()
    
    def increment(self):
        with self.lock:
            temp = self.value
            temp += 1
            self.value = temp

def test_counter(counter, iterations=1000):
    """Тестирование счетчика"""
    for _ in range(iterations):
        counter.increment()

# Тест небезопасного счетчика
unsafe_counter = UnsafeCounter()
threads = []

for _ in range(5):
    thread = threading.Thread(target=test_counter, args=(unsafe_counter, 1000))
    threads.append(thread)
    thread.start()

for thread in threads:
    thread.join()

print(f"Unsafe counter: {unsafe_counter.value}")  # Может быть меньше 5000!

# Тест безопасного счетчика
safe_counter = SafeCounter()
threads = []

for _ in range(5):
    thread = threading.Thread(target=test_counter, args=(safe_counter, 1000))
    threads.append(thread)
    thread.start()

for thread in threads:
    thread.join()

print(f"Safe counter: {safe_counter.value}")  # Всегда 5000
```

### Типы блокировок
```python
import threading
import time

# 1. Обычная блокировка (Lock)
lock = threading.Lock()

def with_lock():
    with lock:
        print(f"Thread {threading.current_thread().name} acquired lock")
        time.sleep(1)
        print(f"Thread {threading.current_thread().name} releasing lock")

# 2. RLock (Reentrant Lock)
rlock = threading.RLock()

def recursive_function(count):
    with rlock:
        if count > 0:
            print(f"Count: {count}")
            recursive_function(count - 1)

# 3. Semaphore
semaphore = threading.Semaphore(3)  # Максимум 3 потока одновременно

def limited_resource():
    with semaphore:
        print(f"Thread {threading.current_thread().name} using resource")
        time.sleep(2)
        print(f"Thread {threading.current_thread().name} releasing resource")

# 4. Event
event = threading.Event()

def waiter():
    print("Waiting for event...")
    event.wait()
    print("Event received!")

def setter():
    time.sleep(3)
    print("Setting event...")
    event.set()

# 5. Condition
condition = threading.Condition()
shared_data = []

def producer():
    with condition:
        shared_data.append("data")
        print("Produced data")
        condition.notify()  # Уведомляем ожидающие потоки

def consumer():
    with condition:
        while not shared_data:
            condition.wait()  # Ждем данные
        data = shared_data.pop()
        print(f"Consumed: {data}")
```

## 🧠 Управление памятью

### Сборка мусора (Garbage Collection)
```python
import gc
import sys

class Node:
    def __init__(self, value):
        self.value = value
        self.next = None
    
    def __del__(self):
        print(f"Node {self.value} deleted")

# Создание циклических ссылок
def create_cycle():
    node1 = Node(1)
    node2 = Node(2)
    node1.next = node2
    node2.next = node1  # Циклическая ссылка!
    return node1

# Тест сборки мусора
def test_garbage_collection():
    print("Creating cycle...")
    cycle = create_cycle()
    
    print(f"Reference count: {sys.getrefcount(cycle)}")
    
    # Принудительная сборка мусора
    collected = gc.collect()
    print(f"Collected {collected} objects")
    
    # Проверка циклических ссылок
    print(f"Cycles detected: {len(gc.garbage)}")

# Слабая ссылка (weak reference)
import weakref

class Data:
    def __init__(self, value):
        self.value = value
    
    def __del__(self):
        print(f"Data {self.value} deleted")

def test_weak_reference():
    data = Data("important")
    weak_ref = weakref.ref(data)
    
    print(f"Data: {weak_ref()}")
    
    del data  # Удаляем сильную ссылку
    
    print(f"Data after deletion: {weak_ref()}")  # None
```

### Профилирование памяти
```python
import tracemalloc
import psutil
import os

def memory_profiling_example():
    # Начало отслеживания памяти
    tracemalloc.start()
    
    # Создание большого объекта
    large_list = [i for i in range(1000000)]
    
    # Получение текущего использования памяти
    current, peak = tracemalloc.get_traced_memory()
    print(f"Current memory usage: {current / 1024 / 1024:.2f} MB")
    print(f"Peak memory usage: {peak / 1024 / 1024:.2f} MB")
    
    # Получение статистики по блокам памяти
    snapshot = tracemalloc.take_snapshot()
    top_stats = snapshot.statistics('lineno')
    
    print("Top 10 memory allocations:")
    for stat in top_stats[:10]:
        print(stat)
    
    # Остановка отслеживания
    tracemalloc.stop()

# Использование psutil для мониторинга системы
def system_memory_info():
    # Информация о памяти процесса
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    print(f"Process memory: {memory_info.rss / 1024 / 1024:.2f} MB")
    
    # Информация о системной памяти
    system_memory = psutil.virtual_memory()
    print(f"System memory usage: {system_memory.percent}%")
    print(f"Available memory: {system_memory.available / 1024 / 1024:.2f} MB")
```

## 🎯 Вопросы для собеседования

### 1. Что такое GIL и почему он существует?
**Ответ:** GIL - это механизм в CPython, который предотвращает одновременное выполнение нескольких потоков Python кода. Он существует для упрощения управления памятью и предотвращения race conditions в критических структурах данных CPython.

### 2. Когда использовать threading, а когда multiprocessing?
**Ответ:** 
- **Threading**: для I/O операций (сетевые запросы, чтение файлов)
- **Multiprocessing**: для CPU-интенсивных задач, которые не ограничены GIL

### 3. Что такое race condition и как его избежать?
**Ответ:** Race condition - это ситуация, когда результат зависит от порядка выполнения потоков. Избежать можно с помощью блокировок (locks), атомарных операций или правильного проектирования архитектуры.

### 4. Объясните разницу между Lock и RLock
**Ответ:** 
- **Lock**: обычная блокировка, поток может заблокировать её только один раз
- **RLock**: рекурсивная блокировка, тот же поток может заблокировать её несколько раз

### 5. Как работает сборка мусора в Python?
**Ответ:** Python использует подсчет ссылок и циклический сборщик мусора. Объекты удаляются, когда количество ссылок на них становится равным нулю.

## 💡 Практические задачи

### Задача 1: Реализуйте потокобезопасный кеш
```python
import threading
import time
from typing import Any, Optional

class ThreadSafeCache:
    def __init__(self, max_size: int = 100):
        self.cache = {}
        self.max_size = max_size
        self.lock = threading.RLock()
        self.access_times = {}
    
    def get(self, key: str) -> Optional[Any]:
        with self.lock:
            if key in self.cache:
                self.access_times[key] = time.time()
                return self.cache[key]
            return None
    
    def set(self, key: str, value: Any) -> None:
        with self.lock:
            if len(self.cache) >= self.max_size:
                self._evict_oldest()
            
            self.cache[key] = value
            self.access_times[key] = time.time()
    
    def _evict_oldest(self) -> None:
        if not self.access_times:
            return
        
        oldest_key = min(self.access_times.keys(), 
                        key=lambda k: self.access_times[k])
        del self.cache[oldest_key]
        del self.access_times[oldest_key]
```

### Задача 2: Реализуйте пул потоков
```python
import threading
import queue
import time
from typing import Callable, Any

class ThreadPool:
    def __init__(self, num_threads: int = 4):
        self.num_threads = num_threads
        self.task_queue = queue.Queue()
        self.threads = []
        self.shutdown = False
        
        # Создание рабочих потоков
        for _ in range(num_threads):
            thread = threading.Thread(target=self._worker)
            thread.daemon = True
            thread.start()
            self.threads.append(thread)
    
    def _worker(self):
        while not self.shutdown:
            try:
                task = self.task_queue.get(timeout=1)
                if task is None:
                    break
                
                func, args, kwargs = task
                func(*args, **kwargs)
                self.task_queue.task_done()
            except queue.Empty:
                continue
    
    def submit(self, func: Callable, *args, **kwargs):
        self.task_queue.put((func, args, kwargs))
    
    def shutdown_pool(self):
        self.shutdown = True
        for _ in range(self.num_threads):
            self.task_queue.put(None)
        
        for thread in self.threads:
            thread.join()

# Использование
def example_task(name: str, duration: int):
    print(f"Task {name} started")
    time.sleep(duration)
    print(f"Task {name} completed")

pool = ThreadPool(3)
pool.submit(example_task, "A", 2)
pool.submit(example_task, "B", 1)
pool.submit(example_task, "C", 3)
pool.shutdown_pool()
```

### Задача 3: Реализуйте читатель-писатель блокировку
```python
import threading
import time

class ReaderWriterLock:
    def __init__(self):
        self.readers = 0
        self.writers = 0
        self.read_ready = threading.Condition()
        self.write_ready = threading.Condition()
        self.lock = threading.RLock()
    
    def acquire_read(self):
        with self.lock:
            while self.writers > 0:
                self.read_ready.wait()
            self.readers += 1
    
    def release_read(self):
        with self.lock:
            self.readers -= 1
            if self.readers == 0:
                self.write_ready.notify()
    
    def acquire_write(self):
        with self.lock:
            while self.readers > 0 or self.writers > 0:
                self.write_ready.wait()
            self.writers += 1
    
    def release_write(self):
        with self.lock:
            self.writers -= 1
            self.write_ready.notify()
            self.read_ready.notify_all()

# Контекстный менеджер
class ReadLock:
    def __init__(self, rw_lock):
        self.rw_lock = rw_lock
    
    def __enter__(self):
        self.rw_lock.acquire_read()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.rw_lock.release_read()

class WriteLock:
    def __init__(self, rw_lock):
        self.rw_lock = rw_lock
    
    def __enter__(self):
        self.rw_lock.acquire_write()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.rw_lock.release_write()
```

Этот материал покрывает все аспекты работы с памятью и потоками в Python, которые важны для собеседования. Практикуйтесь с примерами и понимайте, когда использовать каждый подход!
