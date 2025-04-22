"""fix teams leader_id null values

Revision ID: fix_teams_leader_id
Revises: add_read_to_messages
Create Date: 2024-03-21 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'fix_teams_leader_id'
down_revision = 'add_read_to_messages'
branch_labels = None
depends_on = None


def upgrade():
    # First, update any null leader_id values to a default value
    # We'll use the created_by field as the leader
    op.execute("""
        UPDATE teams t
        SET leader_id = t.created_by
        WHERE t.leader_id IS NULL;
    """)
    
    # Now make the column non-nullable
    op.alter_column('teams', 'leader_id',
               existing_type=postgresql.UUID(),
               nullable=False)


def downgrade():
    # Make the column nullable again
    op.alter_column('teams', 'leader_id',
               existing_type=postgresql.UUID(),
               nullable=True) 