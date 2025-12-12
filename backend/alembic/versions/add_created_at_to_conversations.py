"""add created_at to conversations

Revision ID: add_created_at
Revises: update_constraints
Create Date: 2024-03-19 04:30:29.714114

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'add_created_at'
down_revision = 'update_constraints'
branch_labels = None
depends_on = None

def upgrade():
    # Add created_at column with default value of current timestamp
    op.add_column('conversations', sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
    
    # Update existing rows to have created_at equal to updated_at
    op.execute("""
        UPDATE conversations 
        SET created_at = updated_at 
        WHERE created_at IS NULL
    """)

def downgrade():
    op.drop_column('conversations', 'created_at') 