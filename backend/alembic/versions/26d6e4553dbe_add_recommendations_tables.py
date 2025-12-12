"""add_recommendations_tables

Revision ID: 26d6e4553dbe
Revises: d1408f1a9c60
Create Date: 2025-03-29 21:38:45.048220

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '26d6e4553dbe'
down_revision: Union[str, None] = '8caa78976f9e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
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

def downgrade():
    op.drop_table('post_recommendations')
    op.drop_table('team_recommendations')
    op.drop_table('project_recommendations')
    op.drop_table('recommendations')