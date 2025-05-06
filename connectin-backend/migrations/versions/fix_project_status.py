"""Fix project status field

Revision ID: fix_project_status
Revises: add_project_status
Create Date: 2023-03-26 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text


# revision identifiers, used by Alembic.
revision = 'fix_project_status'
down_revision = 'add_project_status'
branch_labels = None
depends_on = None


def upgrade():
    # Check if status column exists and make it nullable temporarily if it does
    conn = op.get_bind()
    result = conn.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='projects' AND column_name='status'"
    ))
    column_exists = result.fetchone() is not None

    if column_exists:
        # Make column nullable temporarily
        op.alter_column('projects', 'status', nullable=True)
    else:
        # Add column if it doesn't exist
        op.add_column('projects', sa.Column('status', sa.String(), nullable=True))
    
    # Update existing records
    conn.execute(text("UPDATE projects SET status = 'development' WHERE status IS NULL"))
    
    # Make the column not nullable with default
    op.alter_column('projects', 'status', nullable=False, server_default='development')


def downgrade():
    # If we want to revert to nullable status:
    op.alter_column('projects', 'status', nullable=True)
    # If we want to remove the column:
    # op.drop_column('projects', 'status') 