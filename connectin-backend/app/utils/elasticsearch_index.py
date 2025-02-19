"""
Модуль для работы с индексами Elasticsearch.

Задачи:
1. Создание индексов для основных сущностей:
   - posts (посты)
   - projects (проекты)
   - skills (навыки)
   - tags (теги)
   - teams (команды)
   - users (пользователи)
   - education (образование)
   - experience (опыт работы)
   - recommendations (рекомендации)
   - requests (заявки)
   - reviews (отзывы)
   - user_teams (связь пользователей и команд)
   - project_applications (заявки на участие в проектах)
   - project_members (участники проектов)
2. Универсальное создание индекса с заданной схемой (mapping).
3. Функция create_all_indices() для создания всех индексов.

Визуально:
  При создании или обновлении данных, например, поста, данные индексируются в Elasticsearch для
  быстрого и полнотекстового поиска. Когда пользователь отправляет поисковый запрос, Elasticsearch
  быстро ищет в индексах и возвращает ID документов, после чего приложение может извлечь полные данные из БД.

Рекомендуется:
- При обновлении записей в БД синхронизировать соответствующие индексы в Elasticsearch.
- Использовать Kibana для мониторинга состояния индексов.
"""

from app.utils.elasticsearch_client import get_es_client

def create_index(index_name: str, mapping: dict):
    """
    Создает индекс в Elasticsearch с заданной схемой (mapping), если он не существует.
    """
    es = get_es_client()
    if not es.indices.exists(index=index_name):
        es.indices.create(index=index_name, body=mapping)
        print(f"Индекс '{index_name}' создан.")
    else:
        print(f"Индекс '{index_name}' уже существует.")

def create_posts_index():
    mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "integer"},
                "title": {"type": "text"},
                "content": {"type": "text"},
                "post_type": {"type": "keyword"},
                "author_id": {"type": "integer"},
                "project_id": {"type": "integer"},
                "team_id": {"type": "integer"},
                "tags": {"type": "text"},
                "skills": {"type": "text"}
            }
        }
    }
    create_index("posts", mapping)

def create_projects_index():
    mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "integer"},
                "name": {"type": "text"},
                "description": {"type": "text"},
                "owner_id": {"type": "integer"},
                "tags": {"type": "text"},
                "skills": {"type": "text"}
            }
        }
    }
    create_index("projects", mapping)

def create_skills_index():
    mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "integer"},
                "name": {"type": "text"}
            }
        }
    }
    create_index("skills", mapping)

def create_tags_index():
    mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "integer"},
                "name": {"type": "text"}
            }
        }
    }
    create_index("tags", mapping)

def create_teams_index():
    mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "integer"},
                "name": {"type": "text"},
                "description": {"type": "text"}
            }
        }
    }
    create_index("teams", mapping)

def create_users_index():
    mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "integer"},
                "email": {"type": "keyword"},
                "username": {"type": "keyword"},
                "first_name": {"type": "text"},
                "last_name": {"type": "text"}
            }
        }
    }
    create_index("users", mapping)

def create_education_index():
    mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "integer"},
                "user_id": {"type": "integer"},
                # Допустим, имеются такие поля:
                "degree": {"type": "text"},
                "institution": {"type": "text"},
                "year": {"type": "integer"}
            }
        }
    }
    create_index("education", mapping)

def create_experience_index():
    mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "integer"},
                "user_id": {"type": "integer"},
                # Пример полей:
                "company": {"type": "text"},
                "position": {"type": "text"},
                "years": {"type": "integer"}
            }
        }
    }
    create_index("experience", mapping)

def create_recommendations_index():
    mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "integer"},
                "from_user_id": {"type": "integer"},
                "to_user_id": {"type": "integer"},
                "score": {"type": "double"},
                "type": {"type": "keyword"}
            }
        }
    }
    create_index("recommendations", mapping)

def create_requests_index():
    mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "integer"},
                "user_id": {"type": "integer"},
                "project_id": {"type": "integer"},
                "status": {"type": "keyword"}
            }
        }
    }
    create_index("requests", mapping)

def create_reviews_index():
    mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "integer"},
                "project_id": {"type": "integer"},
                "user_id": {"type": "integer"},
                "rating": {"type": "integer"},
                "comment": {"type": "text"}
            }
        }
    }
    create_index("reviews", mapping)

def create_user_teams_index():
    mapping = {
        "mappings": {
            "properties": {
                "user_id": {"type": "integer"},
                "team_id": {"type": "integer"}
            }
        }
    }
    create_index("user_teams", mapping)

def create_project_applications_index():
    mapping = {
        "mappings": {
            "properties": {
                "user_id": {"type": "integer"},
                "project_id": {"type": "integer"}
            }
        }
    }
    create_index("project_applications", mapping)

def create_project_members_index():
    mapping = {
        "mappings": {
            "properties": {
                "user_id": {"type": "integer"},
                "project_id": {"type": "integer"}
            }
        }
    }
    create_index("project_members", mapping)

def create_post_skills_index():
    mapping = {
        "mappings": {
            "properties": {
                "post_id": {"type": "integer"},
                "skill_id": {"type": "integer"}
            }
        }
    }
    create_index("post_skills", mapping)

def create_post_tags_index():
    mapping = {
        "mappings": {
            "properties": {
                "post_id": {"type": "integer"},
                "tag_id": {"type": "integer"}
            }
        }
    }
    create_index("post_tags", mapping)

# Функция для создания всех индексов
def create_all_indices():
    create_posts_index()
    create_projects_index()
    create_skills_index()
    create_tags_index()
    create_teams_index()
    create_users_index()
    create_education_index()
    create_experience_index()
    create_recommendations_index()
    create_requests_index()
    create_reviews_index()
    create_user_teams_index()
    create_project_applications_index()
    create_project_members_index()
    create_post_skills_index()
    create_post_tags_index()
    print("Все индексы созданы или уже существуют.")

if __name__ == "__main__":
    create_all_indices()
