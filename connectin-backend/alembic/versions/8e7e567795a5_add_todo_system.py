"""add_todo_system

Revision ID: 8e7e567795a5
Revises: a01b6d66c7c7
Create Date: 2025-02-09 13:14:24.631132

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8e7e567795a5'
down_revision: Union[str, None] = 'a01b6d66c7c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'todos',  # Название таблицы
        sa.Column('id', sa.Integer, primary_key=True),  # Уникальный ID
        sa.Column('title', sa.String(100), nullable=False),  # Заголовок задачи
        sa.Column('description', sa.Text),  # Описание (может быть пустым)
        sa.Column('completed', sa.Boolean, default=False),  # Статус выполнения
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),  # Дата создания
        sa.Column('owner_id', sa.Integer, sa.ForeignKey('users.id', ondelete='CASCADE'))  # Связь с пользователем
    )

    # Добавьте индекс для ускорения поиска задач по пользователю
    op.create_index(op.f('ix_todos_owner_id'), 'todos', ['owner_id'])


def downgrade() -> None:
    # Удалите индекс
    op.drop_index(op.f('ix_todos_owner_id'), table_name='todos')

    # Удалите таблицу todos
    op.drop_table('todos')