# Python Core - Руководство для собеседования

## 🔥 Mutable vs Immutable объекты

### Immutable (неизменяемые) объекты
```python
# Числа
x = 5
y = x
x = 10  # y остается 5

# Строки
s1 = "hello"
s2 = s1
s1 = "world"  # s2 остается "hello"

# Кортежи
t1 = (1, 2, 3)
t2 = t1
# t1[0] = 4  # Ошибка! Кортежи неизменяемы

# frozenset
fs = frozenset([1, 2, 3])
```

### Mutable (изменяемые) объекты
```python
# Списки
list1 = [1, 2, 3]
list2 = list1
list1.append(4)  # list2 тоже изменится!

# Словари
dict1 = {'a': 1}
dict2 = dict1
dict1['b'] = 2  # dict2 тоже изменится!

# Множества
set1 = {1, 2, 3}
set2 = set1
set1.add(4)  # set2 тоже изменится!
```

### ⚠️ Важные моменты для собеседования
```python
# Проблема с изменяемыми аргументами по умолчанию
def bad_function(items=[]):  # ОПАСНО!
    items.append("new item")
    return items

# Правильный способ
def good_function(items=None):
    if items is None:
        items = []
    items.append("new item")
    return items

# Копирование объектов
import copy

# Поверхностное копирование
list1 = [1, [2, 3]]
list2 = list1.copy()  # или list1[:]
list2[1][0] = 999  # list1[1][0] тоже изменится!

# Глубокое копирование
list3 = copy.deepcopy(list1)
list3[1][0] = 888  # list1 не изменится
```

## 🏗️ ООП (Объектно-ориентированное программирование)

### Основные принципы

#### 1. Инкапсуляция
```python
class BankAccount:
    def __init__(self, initial_balance=0):
        self.__balance = initial_balance  # Приватный атрибут
    
    def deposit(self, amount):
        if amount > 0:
            self.__balance += amount
    
    def get_balance(self):
        return self.__balance
    
    def withdraw(self, amount):
        if 0 < amount <= self.__balance:
            self.__balance -= amount
            return True
        return False

# Использование
account = BankAccount(100)
account.deposit(50)
print(account.get_balance())  # 150
# account.__balance  # Ошибка! Приватный атрибут
```

#### 2. Наследование
```python
class Animal:
    def __init__(self, name):
        self.name = name
    
    def speak(self):
        return f"{self.name} makes a sound"

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)  # Вызов родительского конструктора
        self.breed = breed
    
    def speak(self):  # Переопределение метода
        return f"{self.name} barks"

class Cat(Animal):
    def speak(self):
        return f"{self.name} meows"

# Полиморфизм
animals = [Dog("Rex", "Labrador"), Cat("Whiskers")]
for animal in animals:
    print(animal.speak())
```

#### 3. Полиморфизм
```python
class Shape:
    def area(self):
        raise NotImplementedError

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height
    
    def area(self):
        return self.width * self.height

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius
    
    def area(self):
        return 3.14159 * self.radius ** 2

# Полиморфное использование
shapes = [Rectangle(5, 3), Circle(4)]
for shape in shapes:
    print(f"Area: {shape.area()}")
```

### Специальные методы (Magic Methods)
```python
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    def __str__(self):
        return f"Vector({self.x}, {self.y})"
    
    def __repr__(self):
        return f"Vector({self.x}, {self.y})"
    
    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)
    
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y
    
    def __len__(self):
        return 2

v1 = Vector(1, 2)
v2 = Vector(3, 4)
v3 = v1 + v2  # Vector(4, 6)
print(v1)     # Vector(1, 2)
```

## 🔧 Функции

### *args и **kwargs
```python
def example_function(required_arg, *args, **kwargs):
    print(f"Required: {required_arg}")
    print(f"Args: {args}")
    print(f"Kwargs: {kwargs}")

# Использование
example_function("hello", 1, 2, 3, name="John", age=25)
# Required: hello
# Args: (1, 2, 3)
# Kwargs: {'name': 'John', 'age': 25}

# Распаковка
def multiply(*numbers):
    result = 1
    for num in numbers:
        result *= num
    return result

numbers = [2, 3, 4]
print(multiply(*numbers))  # Распаковка списка
```

### Lambda функции
```python
# Простые lambda функции
square = lambda x: x ** 2
add = lambda x, y: x + y

# Использование с встроенными функциями
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x ** 2, numbers))
evens = list(filter(lambda x: x % 2 == 0, numbers))

# Сортировка
students = [("Alice", 85), ("Bob", 90), ("Charlie", 78)]
sorted_students = sorted(students, key=lambda x: x[1], reverse=True)
```

## 🎨 Декораторы

### Простые декораторы
```python
def timer(func):
    import time
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.4f} seconds")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)
    return "Done"

# Эквивалентно:
# slow_function = timer(slow_function)
```

### Декораторы с параметрами
```python
def repeat(times):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(3)
def greet(name):
    print(f"Hello, {name}!")

greet("Alice")  # Выведет приветствие 3 раза
```

### Декораторы для методов класса
```python
def logged(func):
    def wrapper(self, *args, **kwargs):
        print(f"Calling {func.__name__} with args: {args}")
        return func(self, *args, **kwargs)
    return wrapper

class Calculator:
    @logged
    def add(self, a, b):
        return a + b
```

### functools.wraps
```python
from functools import wraps

def my_decorator(func):
    @wraps(func)  # Сохраняет метаданные оригинальной функции
    def wrapper(*args, **kwargs):
        print("Before function call")
        result = func(*args, **kwargs)
        print("After function call")
        return result
    return wrapper

@my_decorator
def example():
    """This is an example function."""
    pass

print(example.__name__)  # example (а не wrapper)
print(example.__doc__)  # This is an example function.
```

## 📝 List Comprehensions и Генераторы

### List Comprehensions
```python
# Простые
squares = [x**2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]

# С условиями
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
result = [x**2 if x % 2 == 0 else x**3 for x in numbers]

# Вложенные
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flattened = [item for row in matrix for item in row]

# Словари и множества
squares_dict = {x: x**2 for x in range(5)}
squares_set = {x**2 for x in range(5)}
```

### Генераторы
```python
# Генераторные выражения
squares_gen = (x**2 for x in range(10))
print(list(squares_gen))  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# Функции-генераторы
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

# Использование
for num in fibonacci(10):
    print(num)

# Генератор для чтения больших файлов
def read_large_file(filename):
    with open(filename, 'r') as file:
        for line in file:
            yield line.strip()

# Использование
for line in read_large_file('large_file.txt'):
    process(line)
```

## 🎯 Вопросы для собеседования

### 1. Объясните разницу между mutable и immutable объектами
**Ответ:** Mutable объекты можно изменять после создания (списки, словари, множества), а immutable объекты нельзя (числа, строки, кортежи). Это влияет на то, как Python обрабатывает присваивание и передачу аргументов.

### 2. Что такое GIL и как он влияет на многопоточность?
**Ответ:** GIL (Global Interpreter Lock) - это механизм в CPython, который позволяет выполнять только один поток Python кода одновременно. Это ограничивает истинный параллелизм для CPU-интенсивных задач.

### 3. Объясните принципы ООП
**Ответ:** 
- **Инкапсуляция**: сокрытие внутренней реализации
- **Наследование**: создание новых классов на основе существующих
- **Полиморфизм**: один интерфейс для разных типов данных

### 4. Что такое декораторы?
**Ответ:** Декораторы - это функции, которые принимают другую функцию и расширяют её функциональность без изменения исходного кода.

### 5. В чем разница между list comprehension и генераторами?
**Ответ:** List comprehension создает весь список в памяти сразу, а генераторы создают элементы по требованию, что экономит память для больших данных.

## 💡 Практические задачи

### Задача 1: Реализуйте класс Singleton
```python
class Singleton:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# Тест
s1 = Singleton()
s2 = Singleton()
print(s1 is s2)  # True
```

### Задача 2: Создайте декоратор для кеширования
```python
def cache(func):
    cache_dict = {}
    
    def wrapper(*args):
        if args in cache_dict:
            print("Cache hit!")
            return cache_dict[args]
        result = func(*args)
        cache_dict[args] = result
        return result
    
    return wrapper

@cache
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

### Задача 3: Реализуйте контекстный менеджер
```python
class Timer:
    def __enter__(self):
        self.start = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end = time.time()
        print(f"Elapsed time: {self.end - self.start:.4f} seconds")

# Использование
with Timer():
    time.sleep(1)
```

Этот материал покрывает все основные аспекты Python Core, которые могут быть затронуты на собеседовании. Практикуйтесь с примерами и готовьтесь объяснять концепции простыми словами!
