"""merged skill based tables and recommendation based tables

Revision ID: c90d20ef7757
Revises: 03b2341a66d9, 54efce98ae79
Create Date: 2025-03-30 16:51:40.023653

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c90d20ef7757'
down_revision: Union[str, None] = ('03b2341a66d9', '54efce98ae79')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Создание таблицы категорий навыков
    # ----------------Skill based tables ------------------------
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

    # ------------Recommendation based tables -------------------

    op.create_table(
        'recommendations',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('from_user_id', sa.Integer, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('text', sa.Text, nullable=True),
        sa.Column('score', sa.Float, nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.current_timestamp()),
        sa.Column('recommendation_type', sa.String(20), nullable=False),
        sa.CheckConstraint("recommendation_type IN ('project', 'team', 'post')", name="ck_recommendation_type")
    )

    op.create_table(
        'project_recommendations',
        sa.Column('recommendation_id', sa.Integer, sa.ForeignKey('recommendations.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('to_project_id', sa.Integer, sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.UniqueConstraint('to_project_id', 'recommendation_id', name='uq_project_recommendation')
    )

    op.create_table(
        'team_recommendations',
        sa.Column('recommendation_id', sa.Integer, sa.ForeignKey('recommendations.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('to_team_id', sa.Integer, sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.UniqueConstraint('to_team_id', 'recommendation_id', name='uq_team_recommendation')
    )

    op.create_table(
        'post_recommendations',
        sa.Column('recommendation_id', sa.Integer, sa.ForeignKey('recommendations.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('to_post_id', sa.Integer, sa.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False),
        sa.UniqueConstraint('to_post_id', 'recommendation_id', name='uq_post_recommendation')
    )


def downgrade() -> None:
    op.drop_table('skill_mappings')
    op.drop_table('skill_categories')
    # -------- recommendation based tables ---------- #
    op.drop_table('post_recommendations')
    op.drop_table('team_recommendations')
    op.drop_table('project_recommendations')
    op.drop_table('recommendations')
