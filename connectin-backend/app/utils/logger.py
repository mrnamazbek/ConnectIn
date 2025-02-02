"""
logger.py:
Фабрика для получения сконфигурированного логгера.
Может выводить логи в консоль, в файл, или куда захотите (Logstash, Graylog).
"""

import logging
from logging import Logger

def get_logger(name: str = __name__) -> Logger:
    """
    Возвращает логгер с заданным именем и форматированием.
    Если уже существует, не создаёт второй раз хендлеры.
    Пример использования:
        logger = get_logger(__name__)
        logger.info("Hello from logger")
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        # Настраиваем уровень логгирования
        logger.setLevel(logging.INFO)

        # Формат лога: [2025-01-30 12:34:56] [INFO] mymodule: Message
        formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] %(name)s: %(message)s")

        # По умолчанию пишем в stdout (StreamHandler)
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    return logger
