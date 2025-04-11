"""
logger.py:
Фабрика для получения сконфигурированного логгера.
Может выводить логи в консоль, в файл, или куда захотите (Logstash, Graylog).
"""



import logging
from logging import Logger
import os

"""
Что улучшено:
Настраиваемый уровень логирования: Используется переменная окружения LOG_LEVEL (например, DEBUG, INFO, WARNING), что позволяет менять режим без изменения кода.
Запись в файл: Если LOG_TO_FILE=true, ошибки (уровень ERROR и выше) записываются в errors.log, что удобно для анализа проблем.
Проверка дублирования хендлеров: Как и в вашем коде, хендлеры добавляются только один раз, что предотвращает повторный вывод логов.
"""

def get_logger(name: str = __name__) -> Logger:
    """
    Возвращает сконфигурированный логгер с заданным именем.
    Настройка происходит один раз при первом вызове.
    Пример использования:
        logger = get_logger(__name__)
        logger.info("Hello from logger")
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        # Устанавливаем уровень логирования из переменной окружения или по умолчанию INFO
        log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
        logger.setLevel(getattr(logging, log_level, logging.INFO))

        # Формат лога: [2025-01-30 12:34:56] [INFO] mymodule: Message
        formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] %(name)s: %(message)s")

        # Вывод в консоль
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        # Опционально: запись ошибок в файл
        if os.getenv('LOG_TO_FILE', 'False').lower() == 'true':
            file_handler = logging.FileHandler('errors.log')
            file_handler.setLevel(logging.ERROR)
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)

    return logger