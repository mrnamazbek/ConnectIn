"""add_last_active_to_users

Revision ID: 1ec02b49ca8d
Revises: cbf7f23176c3
Create Date: 2025-03-09 16:10:43.354728

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1ec02b49ca8d'
down_revision: Union[str, None] = 'cbf7f23176c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column('users', sa.Column('last_active', sa.DateTime(), nullable=True))
    op.execute("UPDATE users SET last_active = NOW()")  # Установить текущее время для существующих записей

def downgrade():
    op.drop_column('users', 'last_active')