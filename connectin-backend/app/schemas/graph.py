# connectin-backend/app/schemas/graph.py
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Literal

class NodeModel(BaseModel):
    """Модель узла для графа связей."""
    id: str # Уникальный ID узла (e.g., "user_1", "skill_5", "project_10")
    label: str # Текст для отображения на узле
    type: Literal['user', 'project', 'skill'] # Тип узла для стилизации
    # Дополнительные данные, которые могут пригодиться на фронтенде
    details: Dict[str, Any] = Field(default_factory=dict)

    # Используем ConfigDict для Pydantic v2
    model_config = ConfigDict(from_attributes=True)


class EdgeModel(BaseModel):
    """Модель связи (ребра) между узлами."""
    source: str # ID исходного узла
    target: str # ID целевого узла
    type: str = "related_to" # Тип связи (опционально, e.g., 'has_skill', 'member_of')

    model_config = ConfigDict(from_attributes=True)


class GraphData(BaseModel):
    """Структура данных для ответа API графа."""
    nodes: List[NodeModel]
    edges: List[EdgeModel]

    model_config = ConfigDict(from_attributes=True)
