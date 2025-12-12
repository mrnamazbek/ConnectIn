"""skill_based_tables

Revision ID: 54efce98ae79
Revises: 26d6e4553dbe
Create Date: 2025-03-29 21:49:17.847358

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '54efce98ae79'
down_revision: Union[str, None] = '26d6e4553dbe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Создание таблицы категорий навыков
    op.create_table(
        'skill_categories',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('name', sa.String, nullable=False, unique=True),
        sa.Column('description', sa.Text, nullable=True)
    )

    # Создание таблицы маппинга между навыками и категориями
    op.create_table(
        'skill_mappings',
        sa.Column('skill_id', sa.Integer, sa.ForeignKey('skills.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('category_id', sa.Integer, sa.ForeignKey('skill_categories.id', ondelete='CASCADE'), primary_key=True)
    )


def downgrade():
    op.drop_table('skill_mappings')
    op.drop_table('skill_categories')