"""merge recommendation and team related branches

Revision ID: 6d62bf86c931
Revises: 4e4f2693b0fc, bed3f612e03f
Create Date: 2025-04-15 01:17:57.984896

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6d62bf86c931'
down_revision: Union[str, None] = ('4e4f2693b0fc', 'bed3f612e03f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
