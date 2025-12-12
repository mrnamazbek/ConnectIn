# connectin-backend/alembic/versions/ef59f3acec1c_add_subscription_fields_to_users.py

"""add subscription fields to users

Revision ID: ef59f3acec1c
Revises: 91c7d88e3719 # Убедитесь, что это правильная предыдущая ревизия
Create Date: 2025-04-19 23:07:27.766202

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
# ---> ДОБАВЛЯЕМ ИМПОРТ ДЛЯ PostgreSQL Enum <---
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'ef59f3acec1c'
down_revision: Union[str, None] = '91c7d88e3719' # Замените на правильный ID, если нужно
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# ---> ОПРЕДЕЛЯЕМ НАШ ENUM ТИП <---
subscription_status_enum = postgresql.ENUM(
    'FREE', 'ACTIVE', 'PAST_DUE', 'CANCELED',
    name='subscriptionstatusenum', create_type=False # create_type=False т.к. создадим вручную ниже
)

def upgrade() -> None:
    # ===> ШАГ 1: Создаем тип ENUM в базе данных <===
    subscription_status_enum.create(op.get_bind(), checkfirst=True)
    # checkfirst=True добавит IF NOT EXISTS, чтобы избежать ошибки при повторном запуске

    # ===> ШАГ 2: Добавляем колонки (как было, но subscription_status теперь NOT NULL) <===
    op.add_column('users', sa.Column('subscription_status',
                                     subscription_status_enum, # Используем созданный тип
                                     server_default='FREE',    # Используем значение Enum как строку
                                     nullable=False))           # <--- УСТАНАВЛИВАЕМ False (обязательное поле)
    op.add_column('users', sa.Column('stripe_customer_id', sa.String(), nullable=True))
    op.add_column('users', sa.Column('stripe_subscription_id', sa.String(), nullable=True))
    op.add_column('users', sa.Column('subscription_plan_id', sa.String(), nullable=True))
    op.add_column('users', sa.Column('subscription_expires_at', sa.DateTime(timezone=True), nullable=True))

    # ===> ШАГ 3: Создаем индексы (как было) <===
    op.create_index(op.f('ix_users_stripe_customer_id'), 'users', ['stripe_customer_id'], unique=True)
    op.create_index(op.f('ix_users_stripe_subscription_id'), 'users', ['stripe_subscription_id'], unique=True)
    # Индекс для статуса (был в автогенерации, можно оставить)
    op.create_index('ix_users_subscription_status', 'users', ['subscription_status'], unique=False)

    # --- Опционально: Убираем несвязанные изменения для 'teams' отсюда ---
    # op.alter_column('teams', 'leader_id', ...)
    # op.drop_constraint('fk_teams_leader_id_users', ...)
    # op.create_foreign_key(...)
    # Эти изменения должны быть в миграции bed3f612e03f


def downgrade() -> None:
    # ===> ШАГ 1: Удаляем колонки (как было) <===
    op.drop_index('ix_users_subscription_status', table_name='users')
    op.drop_index(op.f('ix_users_stripe_subscription_id'), table_name='users')
    op.drop_index(op.f('ix_users_stripe_customer_id'), table_name='users')
    op.drop_column('users', 'subscription_expires_at')
    op.drop_column('users', 'subscription_plan_id')
    op.drop_column('users', 'stripe_subscription_id')
    op.drop_column('users', 'stripe_customer_id')
    op.drop_column('users', 'subscription_status') # Колонка удаляется

    # ===> ШАГ 2: Удаляем тип ENUM из базы данных <===
    subscription_status_enum.drop(op.get_bind(), checkfirst=True)
    # checkfirst=True добавит IF EXISTS

    # --- Опционально: Возвращаем изменения для 'teams' (если убирали из upgrade) ---
    # op.alter_column('teams', 'leader_id', ...)
    # op.drop_constraint(...)
    # op.create_foreign_key(...)