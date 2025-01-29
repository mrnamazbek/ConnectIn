"""
base.py:
Хранит общий declarative_base() для всех моделей. 
Это необходимо, чтобы SQLAlchemy знал, к чему привязывать таблицы.
"""

from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()
