"""merged skill based tables and recommendation based tables

Revision ID: c90d20ef7757
Revises: 03b2341a66d9, 54efce98ae79
Create Date: 2025-03-30 16:51:40.023653

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c90d20ef7757'
down_revision: Union[str, None] = ('03b2341a66d9', '54efce98ae79')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
