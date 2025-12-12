# connectin-backend/app/utils/logger.py
import logging
from logging import Logger
import os
import datetime
from typing import Optional, Dict, Any
import inspect
import threading

# Словарь для отслеживания состояния логирования для каждого потока
_thread_local_data = threading.local()


class ConnectInLogger:
    """Центральный класс логирования для проекта ConnectIn с поддержкой эмоджи и цветного вывода."""

    # Словарь эмоджи для разных уровней логов
    LEVEL_EMOJI = {
        'DEBUG': '🔍',
        'INFO': 'ℹ️',
        'WARNING': '⚠️',
        'ERROR': '❌',
        'CRITICAL': '🔥'
    }

    # Словарь эмоджи для разных модулей проекта ConnectIn
    MODULE_EMOJI = {
        # Основные модули
        'auth': '🔐',
        'user': '👤',
        'chat': '💬',
        'message': '📨',
        'ws': '📡',
        'websocket': '📡',
        'project': '📋',
        'team': '👥',
        'skill': '🛠️',
        'post': '📝',
        'todo': '✅',
        'tag': '🏷️',

        # Сервисы
        'service': '⚙️',
        'ai_service': '🤖',
        'chat_service': '💬',
        'pdf_service': '📄',

        # Хранилища
        'database': '🗃️',
        's3': '☁️',
        'redis': '📦',
        'elastic': '🔍',

        # Системные
        'middleware': '🔄',
        'config': '⚙️',
        'main': '🚀',
        'api': '🌐',
        'schema': '📊',
        'model': '🏗️',
        'upload': '📤',
        'download': '📥',

        # Бизнес-логика
        'recommendation': '👍',
        'comment': '💭',
        'like': '❤️',
        'save': '🔖',
        'vote': '🗳️',
        'resume': '📑',
        'notification': '🔔',

        # По умолчанию
        'default': '🔧'
    }

    # ANSI коды цветов для разных уровней
    COLORS = {
        'DEBUG': '\033[94m',  # Синий
        'INFO': '\033[92m',  # Зелёный
        'WARNING': '\033[93m',  # Жёлтый
        'ERROR': '\033[91m',  # Красный
        'CRITICAL': '\033[41m',  # Белый на красном фоне
        'RESET': '\033[0m'  # Сброс цветов
    }

    @staticmethod
    def get_logger(name: str = None, module_emoji: Optional[str] = None) -> Logger:
        """
        Возвращает сконфигурированный логгер с креативным форматированием и эмоджи.

        Параметры:
            name: Имя логгера (обычно __name__)
            module_emoji: Явно указанный эмоджи для модуля

        Пример использования:
            logger = ConnectInLogger.get_logger(__name__)  # Автоопределение эмоджи
            logger = ConnectInLogger.get_logger(__name__, "💬")  # Явное указание эмоджи
        """
        # Если имя не передано, определяем модуль из стека вызовов
        if name is None:
            frame = inspect.currentframe().f_back
            module = inspect.getmodule(frame)
            name = module.__name__ if module else "unknown"

        logger = logging.getLogger(name)

        # Проверяем, настроен ли уже логгер
        if not hasattr(_thread_local_data, 'initialized_loggers'):
            _thread_local_data.initialized_loggers = set()

        if name in _thread_local_data.initialized_loggers:
            return logger

        # Добавляем имя в список инициализированных логгеров
        _thread_local_data.initialized_loggers.add(name)

        # Уровень логирования из переменной окружения или по умолчанию INFO
        log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
        logger.setLevel(getattr(logging, log_level, logging.INFO))

        # Включать ли эмоджи в логи (по умолчанию включены)
        use_emoji = os.getenv('LOG_EMOJI', 'true').lower() == 'true'

        # Определяем эмоджи модуля автоматически, если он не передан явно
        if not module_emoji and use_emoji:
            module_parts = name.lower().split('.')

            # Сначала пытаемся найти по полному имени модуля
            for module_part in module_parts:
                if module_part in ConnectInLogger.MODULE_EMOJI:
                    module_emoji = ConnectInLogger.MODULE_EMOJI[module_part]
                    break

            # Если эмоджи не найден, ищем по частичному совпадению
            if not module_emoji:
                for key, emoji in ConnectInLogger.MODULE_EMOJI.items():
                    if any(key in part for part in module_parts):
                        module_emoji = emoji
                        break

            # Если всё равно не нашли, используем эмоджи по умолчанию
            if not module_emoji:
                module_emoji = ConnectInLogger.MODULE_EMOJI["default"]

        # Формирование префикса с эмоджи модуля
        module_prefix = f"{module_emoji} " if module_emoji and use_emoji else ""

        # Создаем кастомный класс форматтера для красивого вывода
        class ColoredFormatter(logging.Formatter):
            """Форматтер с цветами и эмоджи для разных уровней логирования."""

            def format(self, record):
                # Получаем текущее время
                timestamp = datetime.datetime.fromtimestamp(record.created).strftime('%H:%M:%S')

                # Выбираем эмоджи для уровня лога
                level_icon = ConnectInLogger.LEVEL_EMOJI.get(record.levelname, '•') if use_emoji else ''

                # Применяем цвет к уровню лога
                colored_level = f"{ConnectInLogger.COLORS.get(record.levelname, '')}{level_icon} {record.levelname}{ConnectInLogger.COLORS['RESET']}"

                # Определяем короткое имя модуля (последняя часть имени)
                module_short = record.name.split('.')[-1]

                # Форматируем сообщение
                log_message = f"[{timestamp}] {colored_level} {module_prefix}{module_short}: {record.getMessage()}"

                # Добавляем информацию об исключении, если оно есть
                if record.exc_info:
                    exception_msg = self.formatException(record.exc_info)
                    backtrace = f"\n{exception_msg}"
                    log_message = f"{log_message}{backtrace}"

                return log_message

        # Форматтер для файлов логов (без цветов, но с эмоджи)
        class FileFormatter(logging.Formatter):
            """Форматтер для файлов логов с эмоджи."""

            def format(self, record):
                # Форматирование с датой для файлов
                timestamp = self.formatTime(record, datefmt='%Y-%m-%d %H:%M:%S')

                # Выбираем эмоджи для уровня лога
                level_icon = ConnectInLogger.LEVEL_EMOJI.get(record.levelname, '') if use_emoji else ''

                # Форматируем сообщение для файла
                log_message = f"[{timestamp}] [{level_icon} {record.levelname}] {module_prefix}{record.name}: {record.getMessage()}"

                # Добавляем информацию об исключении, если оно есть
                if record.exc_info:
                    exception_msg = self.formatException(record.exc_info)
                    backtrace = f"\n{exception_msg}"
                    log_message = f"{log_message}{backtrace}"

                return log_message

        # Если нет хендлеров, добавляем их
        if not logger.handlers:
            # Вывод в консоль
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(ColoredFormatter())
            logger.addHandler(console_handler)

            # Опционально: запись в файл
            if os.getenv('LOG_TO_FILE', 'False').lower() == 'true':
                # Создаем директорию для логов, если её нет
                log_dir = os.path.join('connectin-backend', 'logs')
                os.makedirs(log_dir, exist_ok=True)

                # Файл для всех логов
                main_file_handler = logging.FileHandler(f'{log_dir}/connectin.log')
                main_file_handler.setLevel(logging.INFO)
                main_file_handler.setFormatter(FileFormatter())
                logger.addHandler(main_file_handler)

                # Отдельный файл для ошибок
                error_file_handler = logging.FileHandler(f'{log_dir}/errors.log')
                error_file_handler.setLevel(logging.ERROR)
                error_file_handler.setFormatter(FileFormatter())
                logger.addHandler(error_file_handler)

                # Для дебага отдельный файл, если включен дебаг-режим
                if log_level == 'DEBUG':
                    debug_file_handler = logging.FileHandler(f'{log_dir}/debug.log')
                    debug_file_handler.setLevel(logging.DEBUG)
                    debug_file_handler.setFormatter(FileFormatter())
                    logger.addHandler(debug_file_handler)

        return logger


# Экспортируем функцию get_logger для обратной совместимости
def get_logger(name: str = None, module_emoji: Optional[str] = None) -> Logger:
    """
    Возвращает сконфигурированный логгер с креативным форматированием и эмоджи.

    Пример использования:
        # Автоматическое определение эмоджи по имени модуля
        logger = get_logger(__name__)

        # Явное указание эмоджи
        logger = get_logger(__name__, "🚀")

        # Затем использование в коде:
        logger.info("Сервер запущен!")
        logger.error("Произошла ошибка при подключении к базе данных")
    """
    return ConnectInLogger.get_logger(name, module_emoji)