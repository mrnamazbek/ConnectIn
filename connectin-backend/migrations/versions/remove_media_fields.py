"""Remove media-related fields from messages table

Revision ID: d43f982a5e1f
Revises: your_previous_revision_id
Create Date: 2023-04-25 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd43f982a5e1f'
down_revision = None  # Set to previous migration
branch_labels = None
depends_on = None


def upgrade():
    # Drop media-related columns from messages table
    op.drop_column('messages', 'media_url')
    op.drop_column('messages', 'media_type')
    op.drop_column('messages', 'media_name')


def downgrade():
    # Add back media-related columns to messages table
    op.add_column('messages', sa.Column('media_url', sa.String(), nullable=True))
    op.add_column('messages', sa.Column('media_type', sa.String(), nullable=True))
    op.add_column('messages', sa.Column('media_name', sa.String(), nullable=True)) 