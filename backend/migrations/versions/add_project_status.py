"""Add project status field

Revision ID: add_project_status
Revises: remove_media_fields
Create Date: 2023-03-26 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text


# revision identifiers, used by Alembic.
revision = 'add_project_status'
down_revision = 'remove_media_fields'
branch_labels = None
depends_on = None


def upgrade():
    # First add the column with nullable=True
    op.add_column('projects', sa.Column('status', sa.String(), nullable=True))
    
    # Update existing records
    conn = op.get_bind()
    conn.execute(text("UPDATE projects SET status = 'development' WHERE status IS NULL"))
    
    # Then make the column not nullable
    op.alter_column('projects', 'status', nullable=False, server_default='development')


def downgrade():
    # Remove the status column
    op.drop_column('projects', 'status') 