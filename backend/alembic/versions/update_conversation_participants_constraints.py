"""update conversation_participants constraints

Revision ID: update_constraints
Revises: add_updated_at_to_conversations
Create Date: 2024-03-19 04:30:29.714114

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'update_constraints'
down_revision: Union[str, None] = 'add_updated_at_to_conversations'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing foreign key constraints
    op.drop_constraint('conversation_participants_user_id_fkey', 'conversation_participants', type_='foreignkey')
    op.drop_constraint('conversation_participants_conversation_id_fkey', 'conversation_participants', type_='foreignkey')
    
    # Add new foreign key constraints with CASCADE
    op.create_foreign_key(
        'conversation_participants_user_id_fkey',
        'conversation_participants', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_foreign_key(
        'conversation_participants_conversation_id_fkey',
        'conversation_participants', 'conversations',
        ['conversation_id'], ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # Drop the new constraints
    op.drop_constraint('conversation_participants_user_id_fkey', 'conversation_participants', type_='foreignkey')
    op.drop_constraint('conversation_participants_conversation_id_fkey', 'conversation_participants', type_='foreignkey')
    
    # Recreate the original constraints without CASCADE
    op.create_foreign_key(
        'conversation_participants_user_id_fkey',
        'conversation_participants', 'users',
        ['user_id'], ['id']
    )
    op.create_foreign_key(
        'conversation_participants_conversation_id_fkey',
        'conversation_participants', 'conversations',
        ['conversation_id'], ['id']
    ) 