"""merge notifications with project status

Revision ID: f74606e87866
Revises: 2216bfdd59eb, 8fa4b9c02e7d
Create Date: 2025-05-07 18:15:38.421857

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f74606e87866'
down_revision: Union[str, None] = ('2216bfdd59eb', '8fa4b9c02e7d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
