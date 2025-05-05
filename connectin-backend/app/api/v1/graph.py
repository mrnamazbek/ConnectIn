# connectin-backend/app/api/v1/endpoints/graph.py
import logging
from typing import List, Dict, Set, Tuple
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy import text # Используем text для прямых SQL

# --- Импорты проекта ---
# Убедитесь, что пути импорта верны для вашей структуры
from app.database.connection import get_db # Ваша функция получения сессии БД
# Импортируем схемы, которые только что создали
from app.schemas.graph import NodeModel, EdgeModel, GraphData
from app.utils.logger import get_logger
# Импортируем аутентификацию (если граф будет зависеть от пользователя)
# from app.api.v1.deps import get_current_active_user
# from app.models.user import User # Модель пользователя

logger = get_logger(__name__)

# Создаем роутер
router = APIRouter(tags=["Graph Data"])

# --- Константы ---
# Ограничения на количество узлов для предотвращения перегрузки
MAX_USERS_NODES = 50
MAX_PROJECT_NODES = 30
MAX_SKILL_NODES = 40

@router.get("/connections", response_model=GraphData, summary="Получить данные о связях для 3D графа")
async def get_graph_connections(
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_active_user) # Раскомментируйте, если нужны данные для конкретного юзера
):
    """
    Собирает ограниченный набор данных о пользователях, проектах, навыках
    и связях между ними для визуализации в виде графа.
    """
    logger.info("Request received for graph connection data.")
    nodes: List[NodeModel] = []
    edges: List[EdgeModel] = []
    node_ids: Set[str] = set() # Для отслеживания уже добавленных узлов

    try:
        with db.begin(): # Используем транзакцию для согласованного чтения
            # --- 1. Загрузка Узлов (Nodes) ---

            # Загрузка Пользователей (Users)
            logger.debug("Loading user nodes...")
            user_res = db.execute(
                text("SELECT id, username, first_name, last_name FROM users ORDER BY last_active DESC NULLS LAST LIMIT :limit")
                .bindparams(limit=MAX_USERS_NODES)
            ).mappings().fetchall()
            for u in user_res:
                node_id = f"user_{u['id']}"
                label = u['username']
                if u['first_name'] and u['last_name']: label = f"{u['first_name']} {u['last_name']}"
                if node_id not in node_ids:
                    nodes.append(NodeModel(id=node_id, label=label, type='user'))
                    node_ids.add(node_id)
            logger.info(f"Loaded {len(user_res)} user nodes.")

            # Загрузка Проектов (Projects)
            logger.debug("Loading project nodes...")
            project_res = db.execute(
                text("SELECT id, name FROM projects ORDER BY id DESC LIMIT :limit") # Пример: последние проекты
                .bindparams(limit=MAX_PROJECT_NODES)
            ).mappings().fetchall()
            for p in project_res:
                node_id = f"project_{p['id']}"
                if node_id not in node_ids:
                    nodes.append(NodeModel(id=node_id, label=p['name'], type='project'))
                    node_ids.add(node_id)
            logger.info(f"Loaded {len(project_res)} project nodes.")

            # Загрузка Навыков (Skills)
            logger.debug("Loading skill nodes...")
            skill_res = db.execute(
                # Пример: загружаем навыки, связанные с пользователями или проектами, которые мы уже загрузили
                text("""
                    SELECT DISTINCT s.id, s.name FROM skills s
                    JOIN user_skills us ON s.id = us.skill_id WHERE us.user_id IN :user_ids
                    UNION
                    SELECT DISTINCT s.id, s.name FROM skills s
                    JOIN project_skills ps ON s.id = ps.skill_id WHERE ps.project_id IN :project_ids
                    ORDER BY name
                    LIMIT :limit
                """)
                .bindparams(
                    user_ids=tuple(int(nid.split('_')[1]) for nid in node_ids if nid.startswith('user_')),
                    project_ids=tuple(int(nid.split('_')[1]) for nid in node_ids if nid.startswith('project_')),
                    limit=MAX_SKILL_NODES
                )
            ).mappings().fetchall()
            for s in skill_res:
                node_id = f"skill_{s['id']}"
                if node_id not in node_ids:
                    nodes.append(NodeModel(id=node_id, label=s['name'], type='skill'))
                    node_ids.add(node_id)
            logger.info(f"Loaded {len(skill_res)} skill nodes.")

            # --- 2. Загрузка Связей (Edges) ---
            logger.debug("Loading edges...")
            # Собираем ID узлов, которые мы реально добавили
            final_user_ids = {int(nid.split('_')[1]) for nid in node_ids if nid.startswith('user_')}
            final_project_ids = {int(nid.split('_')[1]) for nid in node_ids if nid.startswith('project_')}
            final_skill_ids = {int(nid.split('_')[1]) for nid in node_ids if nid.startswith('skill_')}

            # Связи Пользователь -> Навык
            if final_user_ids and final_skill_ids:
                user_skill_edges = db.execute(
                    text("SELECT user_id, skill_id FROM user_skills WHERE user_id = ANY(:user_ids) AND skill_id = ANY(:skill_ids)")
                    .bindparams(user_ids=list(final_user_ids), skill_ids=list(final_skill_ids))
                ).mappings().fetchall()
                for edge in user_skill_edges:
                    source_id = f"user_{edge['user_id']}"
                    target_id = f"skill_{edge['skill_id']}"
                    edges.append(EdgeModel(source=source_id, target=target_id, type='has_skill'))

            # Связи Пользователь -> Проект (участник)
            if final_user_ids and final_project_ids:
                 project_member_edges = db.execute(
                     text("SELECT user_id, project_id FROM project_members WHERE user_id = ANY(:user_ids) AND project_id = ANY(:project_ids)")
                     .bindparams(user_ids=list(final_user_ids), project_ids=list(final_project_ids))
                 ).mappings().fetchall()
                 for edge in project_member_edges:
                     source_id = f"user_{edge['user_id']}"
                     target_id = f"project_{edge['project_id']}"
                     edges.append(EdgeModel(source=source_id, target=target_id, type='member_of_project'))

            # Связи Проект -> Навык (требуемый)
            if final_project_ids and final_skill_ids:
                 project_skill_edges = db.execute(
                     text("SELECT project_id, skill_id FROM project_skills WHERE project_id = ANY(:project_ids) AND skill_id = ANY(:skill_ids)")
                     .bindparams(project_ids=list(final_project_ids), skill_ids=list(final_skill_ids))
                 ).mappings().fetchall()
                 for edge in project_skill_edges:
                     source_id = f"project_{edge['project_id']}"
                     target_id = f"skill_{edge['skill_id']}"
                     edges.append(EdgeModel(source=source_id, target=target_id, type='requires_skill'))

            logger.info(f"Loaded {len(edges)} edges between {len(nodes)} nodes.")

    except SQLAlchemyError as e:
        logger.exception("Database error while fetching graph data:")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not retrieve connection data.")
    except Exception as e:
        logger.exception("Unexpected error while fetching graph data:")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")

    return GraphData(nodes=nodes, edges=edges)

# --- Подключение Роутера ---
# Не забудьте подключить этот роутер в app/main.py:
# from app.api.v1.endpoints import graph as graph_v1
# app.include_router(graph_v1.router, prefix="/api/v1")
