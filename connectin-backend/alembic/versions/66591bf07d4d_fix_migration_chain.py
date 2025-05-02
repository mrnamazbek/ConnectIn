"""Fix migration chain

Revision ID: 66591bf07d4d
Revises: merge_heads
Create Date: 2025-05-04 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '66591bf07d4d'
down_revision: Union[str, None] = 'merge_heads'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This is just a placeholder migration to fix the chain
    pass


def downgrade() -> None:
    # This is just a placeholder migration to fix the chain
    pass 