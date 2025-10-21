# Interview Pack — Junior Python Developer

Собраны markdown файлы с вопросами и ответами по Python, памяти, асинхронности и "под капотом" для Junior Python разработчиков.

## 📚 Содержание

### Основные файлы
- **`memory_async.md`** — ключевой файл с Q&A по памяти, асинхронности, GIL, потокам и процессам. Включает диаграммы, примеры кода и объяснения "под капотом"
- **`python_core_interview_guide.md`** — основы Python, типы данных, функции, классы
- **`junior_python_dev_interview_prep.md`** — подготовка к интервью для Junior разработчиков
- **`async_interview_guide.md`** — асинхронное программирование в Python
- **`memory_threading_interview_guide.md`** — память и многопоточность
- **`rest_api_interview_guide.md`** — REST API и веб-разработка
- **`interview_cheat_sheet.md`** — шпаргалка с быстрыми ответами
- **`interview_questions_answers.md`** — коллекция вопросов и ответов

## 🎯 Основные темы

### Memory Management
- Stack vs Heap
- Reference counting и Garbage Collection
- Memory leaks и их предотвращение
- Профилирование памяти

### Asynchronous Programming
- asyncio и event loop
- Coroutines, Tasks, Futures
- async/await паттерны
- Concurrent vs Parallel execution

### Threading & Multiprocessing
- GIL (Global Interpreter Lock)
- Threads vs Processes
- Когда использовать каждый подход
- Синхронизация и race conditions

### Python Internals
- Как работает CPython
- Bytecode и интерпретатор
- Namespace и scope
- Import system

## 🚀 Быстрый старт

1. **Начните с `memory_async.md`** — это основной файл с комплексным объяснением
2. **Изучите диаграммы** — они помогают понять концепции визуально
3. **Попробуйте примеры кода** — запустите их в Python
4. **Используйте шпаргалку** — для быстрого повторения перед интервью

## 📊 Визуализации

Файлы содержат:
- Mermaid диаграммы (поддерживаются GitHub)
- ASCII схемы для быстрого понимания
- Таблицы сравнения
- Примеры кода с комментариями

## 🛠️ Инструменты для практики

### Memory Debugging
```python
import tracemalloc
import psutil
import gc
```

### Async Development
```python
import asyncio
import aiohttp
```

### Threading
```python
import threading
import multiprocessing
import queue
```

## 📝 Структура вопросов

Каждый файл содержит:
- **Теоретические вопросы** с подробными ответами
- **Практические примеры** кода
- **Объяснения "под капотом"** — как это работает внутри
- **Лучшие практики** и антипаттерны
- **Инструменты отладки** и профилирования

## 🎓 Уровень сложности

Материалы рассчитаны на:
- **Junior Python разработчиков** (0-2 года опыта)
- **Студентов** изучающих Python
- **Разработчиков** переходящих с других языков
- **Подготовку к техническим интервью**

## 📈 Прогресс изучения

1. **Базовые концепции** → `python_core_interview_guide.md`
2. **Память и производительность** → `memory_async.md` (разделы 1-3)
3. **Многопоточность** → `memory_async.md` (разделы 4-5)
4. **Асинхронность** → `memory_async.md` (раздел 6)
5. **Практические вопросы** → `interview_questions_answers.md`
6. **Повторение** → `interview_cheat_sheet.md`

## 🔗 Полезные ссылки

- [Python Official Documentation](https://docs.python.org/3/)
- [asyncio Documentation](https://docs.python.org/3/library/asyncio.html)
- [Memory Management in Python](https://docs.python.org/3/c-api/memory.html)
- [GIL Explanation](https://wiki.python.org/moin/GlobalInterpreterLock)

## 📞 Поддержка

Если у вас есть вопросы или предложения по улучшению материалов, создайте issue в репозитории.

---

**Удачи на интервью! 🚀**
