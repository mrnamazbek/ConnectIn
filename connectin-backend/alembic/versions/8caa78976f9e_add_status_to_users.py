"""add_status_to_users

Revision ID: 8caa78976f9e
Revises: 1ec02b49ca8d
Create Date: 2025-03-18 22:22:20.143585

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8caa78976f9e'
down_revision: Union[str, None] = '1ec02b49ca8d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column('users', sa.Column('status', sa.String(), nullable=True, default="in progress"))

def downgrade():
    op.drop_column('users', 'status')