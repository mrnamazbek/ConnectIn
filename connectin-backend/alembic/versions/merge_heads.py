"""merge heads

Revision ID: merge_heads
Revises: ef72293edbdd, fix_teams_leader_id
Create Date: 2024-03-21 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'merge_heads'
down_revision = ('ef72293edbdd', 'fix_teams_leader_id')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass 