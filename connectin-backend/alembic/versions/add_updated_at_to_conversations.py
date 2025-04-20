"""add updated_at to conversations

Revision ID: add_updated_at_to_conversations
Revises: ef59f3acec1c
Create Date: 2024-03-25 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_updated_at_to_conversations'
down_revision: Union[str, None] = 'ef59f3acec1c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add updated_at column to conversations table
    op.add_column('conversations', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))


def downgrade() -> None:
    # Remove updated_at column from conversations table
    op.drop_column('conversations', 'updated_at') 