"""add read column to messages

Revision ID: add_read_to_messages
Revises: add_created_at
Create Date: 2024-03-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_read_to_messages'
down_revision = 'add_created_at'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('messages', sa.Column('read', sa.DateTime(), nullable=True))

def downgrade():
    op.drop_column('messages', 'read') 