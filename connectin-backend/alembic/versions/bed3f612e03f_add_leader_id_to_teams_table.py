"""Add leader_id to teams table

Revision ID: bed3f612e03f
Revises: cbf7f23176c3
Create Date: 2025-03-05 13:42:23.450911

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bed3f612e03f'
down_revision: Union[str, None] = 'cbf7f23176c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column('teams', sa.Column('leader_id', sa.Integer(), nullable=False))
    op.create_foreign_key('teams_leader_id_fkey', 'teams', 'users', ['leader_id'], ['id'])

def downgrade():
    op.drop_constraint('teams_leader_id_fkey', 'teams', type_='foreignkey')
    op.drop_column('teams', 'leader_id')
