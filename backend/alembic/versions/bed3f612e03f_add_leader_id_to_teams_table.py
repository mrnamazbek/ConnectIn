# connectin-backend/alembic/versions/bed3f612e03f_add_leader_id_to_teams_table.py

"""Add leader_id to teams table

Revision ID: bed3f612e03f
Revises: cbf7f23176c3 # Убедитесь, что Revises правильный
Create Date: ...

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'bed3f612e03f'
# Убедитесь, что ID предыдущей ревизии в вашей ветке верный
down_revision: Union[str, None] = 'cbf7f23176c3' # Пример, проверьте ваш alembic history
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Добавляем колонку leader_id, делая ее nullable=True СНАЧАЛА
    op.add_column('teams', sa.Column('leader_id', sa.Integer(), nullable=True)) # <--- ИСПРАВЛЕНО: nullable=True

    # Добавляем внешний ключ ПОСЛЕ создания колонки
    # Предполагаем, что leader_id ссылается на users.id
    # op.f() используется для автогенерации имени констрейнта, если настроено в env.py
    op.create_foreign_key(
        op.f('fk_teams_leader_id_users'), # Имя для внешнего ключа
        'teams',          # Имя текущей таблицы
        'users',          # Имя таблицы, на которую ссылаемся
        ['leader_id'],    # Колонка(и) в текущей таблице
        ['id'],           # Колонка(и) в таблице, на которую ссылаемся
        ondelete='SET NULL' # Пример: если лидера удалят, установить leader_id в NULL
                            # Другие варианты: 'CASCADE' (удалить команду), 'RESTRICT' (запретить удаление лидера)
    )
    # --- Опционально: Заполнить leader_id для существующих команд ---
    # Если вы хотите сразу задать лидера (например, первого участника) для старых команд:
    # op.execute("""
    #    UPDATE teams t SET leader_id = (
    #        SELECT ut.user_id FROM user_teams ut
    #        WHERE ut.team_id = t.id ORDER BY ut.user_id LIMIT 1 -- Пример: берем первого по ID
    #    ) WHERE t.leader_id IS NULL;
    # """)
    # После этого можно было бы сделать колонку NOT NULL, но лучше отдельной миграцией.


def downgrade() -> None:
    # Сначала удаляем внешний ключ
    op.drop_constraint(op.f('fk_teams_leader_id_users'), 'teams', type_='foreignkey')
    # Затем удаляем колонку
    op.drop_column('teams', 'leader_id')