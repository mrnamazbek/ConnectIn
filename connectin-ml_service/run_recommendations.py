# connectin-ml_service/run_recommendations.py

import os
import logging
import json
from typing import List, Dict, Set, Tuple, Any # Добавлены типы
import numpy as np
from sqlalchemy import create_engine, text  # Импортируем Engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
from contextlib import contextmanager # Для управления транзакциями

# --- Настройка Логгирования ---
# Рекомендуется настраивать форматтер и уровень в вызывающем коде или через dictConfig
# но для простоты Lambda подойдет и базовая конфигурация
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger(__name__) # Используем имя модуля

# --- Загрузка Переменных Окружения ---
load_dotenv() # Загружает из .env, если он есть (для локального запуска)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.critical("CRITICAL: DATABASE_URL environment variable not found!") # Используем critical для фатальных ошибок конфигурации
    raise ValueError("DATABASE_URL not found in environment variables")

# --- Подключение к Базе Данных ---
# Используем 'pool_pre_ping=True' для проверки соединения перед использованием
# Укажем 'echo=False' в продакшене, чтобы не логгировать все SQL запросы
try:
    # Указываем тип явно для подсказок
    engine: Engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)
    # Проверка соединения при старте (опционально, но полезно)
    with engine.connect() as connection_test:
        logger.info("Database engine created and connection tested successfully.")
except Exception as e:
    logger.exception("CRITICAL: Failed to create database engine or connect:") # exception логгирует traceback
    raise

# --- Технологические Стеки ---
# Оставляем ваш словарь TECH_STACKS как есть
TECH_STACKS = {
    "Machine Learning": {"core": ["TensorFlow", "PyTorch", "scikit-learn", "Keras"], "related": ["NumPy", "Pandas", "Matplotlib", "Seaborn"], "advanced": ["XGBoost", "LightGBM", "CatBoost"]},
    "AI": {"core": ["TensorFlow", "PyTorch", "NLTK", "spaCy"], "related": ["OpenCV", "Scikit-image", "Transformers"], "advanced": ["DeepLearning4j", "H2O.ai"]},
    "Blockchain": {"core": ["Ethereum", "Solidity", "Web3.js", "Truffle"], "related": ["IPFS", "Ganache", "Metamask"], "advanced": ["Hyperledger", "Corda"]},
    "Web Development": {"core": ["React", "Node.js", "Express", "HTML/CSS"], "related": ["TypeScript", "Vue.js", "Angular"], "advanced": ["Next.js", "GraphQL", "WebSocket"]},
    "Data Science": {"core": ["Pandas", "NumPy", "SQL", "scikit-learn"], "related": ["Power BI", "Tableau", "R"], "advanced": ["Dask", "Spark", "Hadoop"]},
    "Cloud Computing": {"core": ["AWS", "Azure", "Google Cloud", "Docker"], "related": ["Kubernetes", "Terraform", "Ansible"], "advanced": ["Serverless", "CloudFormation"]},
    "Cybersecurity": {"core": ["Wireshark", "Metasploit", "Nmap", "Kali Linux"], "related": ["Burp Suite", "OWASP", "Snort"], "advanced": ["SIEM", "SOAR", "Splunk"]},
    "DevOps": {"core": ["Docker", "Kubernetes", "Jenkins", "Git"], "related": ["CI/CD", "Terraform", "Prometheus"], "advanced": ["ArgoCD", "Helm", "Istio"]}
}

# --- Функции Загрузки Данных ---
# Рекомендация: Для консистентности с основным бэкендом, рассмотрите
# использование SQLAlchemy ORM и ваших моделей (`app.models`) вместо прямых SQL.
# Это потребует копирования моделей в lambda_package или создания общей библиотеки.

def load_all_skills(conn) -> Tuple[List[int], Dict[int, str]]:
    """Загружает все ID навыков и маппинг ID -> Name."""
    all_skills_raw = conn.execute(text("SELECT id, name FROM skills ORDER BY id")).mappings().fetchall()
    skill_ids = [s["id"] for s in all_skills_raw]
    skill_id_to_name = {s["id"]: s["name"] for s in all_skills_raw}
    logger.info(f"Loaded {len(skill_ids)} unique skills.")
    logger.debug(f"Skill IDs: {skill_ids}")
    return skill_ids, skill_id_to_name

def load_all_tags(conn) -> Tuple[List[int], Dict[int, str]]:
    """Загружает все ID тегов и маппинг ID -> Name."""
    tags_raw = conn.execute(text("SELECT id, name FROM tags ORDER BY id")).mappings().fetchall()
    tag_ids = [t["id"] for t in tags_raw]
    tag_id_to_name = {t["id"]: t["name"] for t in tags_raw}
    logger.info(f"Loaded {len(tag_ids)} unique tags.")
    logger.debug(f"Tag IDs: {tag_ids}")
    return tag_ids, tag_id_to_name

def load_project_data(conn) -> Tuple[Dict[int, int], Dict[int, List[int]], Dict[int, List[int]]]:
    """Загружает данные по проектам, их навыкам и навыкам пользователей."""
    logger.info("Loading project and user skill data...")
    projects_dict, project_skills_dict, user_skills_dict = {}, {}, {}
    try:
        projects = conn.execute(text("SELECT id, owner_id FROM projects")).mappings().fetchall()
        projects_dict = {p["id"]: p["owner_id"] for p in projects}

        project_skills = conn.execute(text("SELECT project_id, skill_id FROM project_skills")).mappings().fetchall()
        for ps in project_skills: project_skills_dict.setdefault(ps["project_id"], []).append(ps["skill_id"])

        user_skills = conn.execute(text("SELECT user_id, skill_id FROM user_skills")).mappings().fetchall()
        for us in user_skills: user_skills_dict.setdefault(us["user_id"], []).append(us["skill_id"])

        logger.info(f"Loaded {len(projects_dict)} projects, {len(project_skills_dict)} project skill entries, {len(user_skills_dict)} user skill entries.")
        return projects_dict, project_skills_dict, user_skills_dict
    except Exception as e:
        logger.exception("Failed to load project data:")
        raise

def load_team_data(conn) -> Tuple[List[int], List[Dict[str, int]], Dict[int, List[int]]]:
    """Загружает данные по командам, их участникам и навыкам участников."""
    logger.info("Loading team and user skill data...")
    teams_list, user_teams_list, user_skills_dict = [], [], {}
    try:
        teams = conn.execute(text("SELECT id FROM teams")).mappings().fetchall()
        teams_list = [t["id"] for t in teams]

        user_teams = conn.execute(text("SELECT user_id, team_id FROM user_teams")).mappings().fetchall()
        user_teams_list = [{"user_id": ut["user_id"], "team_id": ut["team_id"]} for ut in user_teams]

        user_skills = conn.execute(text("SELECT user_id, skill_id FROM user_skills")).mappings().fetchall()
        for us in user_skills: user_skills_dict.setdefault(us["user_id"], []).append(us["skill_id"])

        logger.info(f"Loaded {len(teams_list)} teams, {len(user_teams_list)} team memberships, {len(user_skills_dict)} user skill entries.")
        return teams_list, user_teams_list, user_skills_dict
    except Exception as e:
        logger.exception("Failed to load team data:")
        raise

def load_post_data(conn, all_tag_ids: List[int]) -> Tuple[Dict[int, int], Dict[int, List[int]], Dict[int, List[int]]]:
    """Загружает данные по постам, их тегам и навыкам пользователей."""
    # tags_dict и all_tag_ids теперь передаются извне
    logger.info("Loading post and user skill data...")
    posts_dict, post_tags_dict, user_skills_dict = {}, {}, {}
    try:
        posts = conn.execute(text("SELECT id, author_id FROM posts")).mappings().fetchall()
        posts_dict = {p["id"]: p["author_id"] for p in posts}

        post_tags = conn.execute(text("SELECT post_id, tag_id FROM post_tags")).mappings().fetchall()
        for pt in post_tags:
            # Добавляем тег, только если он существует в общем списке тегов
            if pt["tag_id"] in all_tag_ids:
                post_tags_dict.setdefault(pt["post_id"], []).append(pt["tag_id"])

        user_skills = conn.execute(text("SELECT user_id, skill_id FROM user_skills")).mappings().fetchall()
        for us in user_skills: user_skills_dict.setdefault(us["user_id"], []).append(us["skill_id"])

        logger.info(f"Loaded {len(posts_dict)} posts, {len(post_tags_dict)} post tag entries, {len(user_skills_dict)} user skill entries.")
        return posts_dict, post_tags_dict, user_skills_dict
    except Exception as e:
        logger.exception("Failed to load post data:")
        raise

# --- Функция Векторизации ---
def create_feature_vector(item_features: List[int], all_features: List[int]) -> np.ndarray:
    """Создает бинарный вектор признаков (навыков или тегов)."""
    if not all_features: return np.array([])
    feature_map = {feature_id: i for i, feature_id in enumerate(all_features)}
    vector = np.zeros(len(all_features))
    for feature_id in item_features:
        idx = feature_map.get(feature_id)
        if idx is not None:
            vector[idx] = 1
        else:
             logger.warning(f"Feature ID {feature_id} not found in all_features map")
    return vector

# --- Функции Генерации Рекомендаций ---
def generate_project_recommendations(conn, all_skills: List[int]) -> List[Dict]:
    """Генерирует рекомендации проектов для пользователей на основе совпадения навыков."""
    logger.info("Generating project recommendations...")
    projects_dict, project_skills_dict, user_skills_dict = load_project_data(conn)
    if not all_skills or not projects_dict or not user_skills_dict:
        logger.warning("Not enough data to generate project recommendations.")
        return []

    project_recommendations: List[Dict] = []
    for user_id, user_skill_list in user_skills_dict.items():
        user_vector = create_feature_vector(user_skill_list, all_skills)
        if np.sum(user_vector) == 0: continue # Пропускаем пользователей без релевантных навыков

        for project_id, owner_id in projects_dict.items():
            if user_id == owner_id: continue # Не рекомендуем свой проект

            project_skills = project_skills_dict.get(project_id, [])
            if not project_skills: continue # Пропускаем проекты без навыков

            project_vector = create_feature_vector(project_skills, all_skills)
            if np.sum(project_vector) == 0: continue

            try:
                similarity = cosine_similarity([project_vector], [user_vector])[0][0]
            except ValueError: # Например, если векторы нулевые или разной длины (хотя не должны быть)
                 similarity = 0.0
                 logger.warning(f"Could not calculate similarity for user {user_id} and project {project_id}")


            common_skills_count = len(set(project_skills) & set(user_skill_list))
            project_skill_count = len(project_skills)
            # Улучшенная формула: значимость схожести + бонус за покрытие требуемых навыков
            score = min(9.99, (similarity * 7) + (common_skills_count / project_skill_count * 3 if project_skill_count > 0 else 0))

            if score > 0.5: # Устанавливаем порог для рекомендации
                project_recommendations.append({
                    "recommendation_type": "project",
                    "from_user_id": None, # Рекомендация проекта *для* пользователя
                    "to_user_id": user_id,
                    "project_id": project_id,
                    "team_id": None,
                    "post_id": None,
                    "text": f"Project recommended for you based on skill match.",
                    "score": round(score, 2)
                })
    logger.info(f"Generated {len(project_recommendations)} project recommendations.")
    return project_recommendations

def generate_team_recommendations(conn, all_skills: List[int]) -> List[Dict]:
    """Генерирует рекомендации команд для пользователей."""
    logger.info("Generating team recommendations...")
    teams_list, user_teams_list, user_skills_dict = load_team_data(conn)
    if not all_skills or not teams_list or not user_skills_dict:
         logger.warning("Not enough data to generate team recommendations.")
         return []

    # Группируем пользователей по командам
    team_members_dict: Dict[int, List[int]] = {}
    for ut in user_teams_list:
        team_members_dict.setdefault(ut["team_id"], []).append(ut["user_id"])

    team_recommendations: List[Dict] = []
    for team_id in teams_list:
        members = team_members_dict.get(team_id, [])
        if not members: continue

        # Собираем все уникальные навыки команды
        team_skills_set: Set[int] = set()
        for member_id in members:
            team_skills_set.update(user_skills_dict.get(member_id, []))

        if not team_skills_set: continue # Пропускаем команду без навыков

        team_vector = create_feature_vector(list(team_skills_set), all_skills)

        for user_id, user_skill_list in user_skills_dict.items():
            if user_id in members: continue # Не рекомендуем команду ее участнику

            user_skills_set = set(user_skill_list)
            if not user_skills_set: continue

            user_vector = create_feature_vector(user_skill_list, all_skills)
            try:
                similarity = cosine_similarity([team_vector], [user_vector])[0][0]
            except ValueError:
                 similarity = 0.0
                 logger.warning(f"Could not calculate similarity for user {user_id} and team {team_id}")

            # Оценка на основе схожести и уникальности навыков пользователя для команды
            common_skills = team_skills_set & user_skills_set
            unique_user_skills = user_skills_set - team_skills_set
            # Формула: Общая схожесть + Бонус за новые навыки + Небольшой бонус за общие
            score = min(9.99, (similarity * 6) + (len(unique_user_skills) / len(user_skills_set) * 3 if user_skills_set else 0) + (len(common_skills) / len(team_skills_set) * 1 if team_skills_set else 0))

            if score > 0.5: # Порог
                team_recommendations.append({
                    "recommendation_type": "team",
                    "from_user_id": None, # Рекомендация команды *для* пользователя
                    "to_user_id": user_id,
                    "project_id": None,
                    "team_id": team_id,
                    "post_id": None,
                    "text": f"Team recommended for you based on skill synergy.",
                    "score": round(score, 2)
                })
    logger.info(f"Generated {len(team_recommendations)} team recommendations.")
    return team_recommendations


def generate_post_recommendations(conn, all_skills: List[int], skill_id_to_name: Dict[int, str], all_tag_ids: List[int], tag_id_to_name: Dict[int, str]) -> List[Dict]:
    """Генерирует рекомендации постов для пользователей."""
    logger.info("Generating post recommendations...")
    # ВНИМАНИЕ: Эта логика остается под вопросом. Сравнение тегов и навыков напрямую некорректно.
    #           Требуется либо связь тегов с навыками, либо использование интересов пользователя.
    #           Этот код представлен как пример, но требует пересмотра бизнес-логики.
    posts_dict, post_tags_dict, user_skills_dict = load_post_data(conn, all_tag_ids) # Передаем all_tag_ids
    if not all_skills or not all_tag_ids or not posts_dict or not user_skills_dict:
         logger.warning("Not enough data to generate post recommendations.")
         return []

    post_recommendations: List[Dict] = []

    # Преобразуем навыки пользователя в ИМЕНА для сопоставления с TECH_STACKS
    user_skills_names: Dict[int, Set[str]] = {
        uid: set(skill_id_to_name.get(sid, '') for sid in sids) for uid, sids in user_skills_dict.items()
    }

    for post_id, author_id in posts_dict.items():
        post_tag_ids = post_tags_dict.get(post_id, [])
        if not post_tag_ids: continue

        # Используем пространство ID тегов для вектора поста
        post_vector = create_feature_vector(post_tag_ids, all_tag_ids)
        post_tags_names = set(tag_id_to_name.get(tid, '') for tid in post_tag_ids)

        # Пытаемся определить основной стек поста по его тегам
        main_stack = None
        for stack_name, stack_tools in TECH_STACKS.items():
            # Сравниваем имена тегов поста с именами инструментов в стеке
            if any(tag_name in stack_tools["core"] or tag_name in stack_tools["related"] or tag_name in stack_tools["advanced"]
                   for tag_name in post_tags_names if tag_name):
                main_stack = stack_name
                break

        for user_id, user_skill_ids in user_skills_dict.items():
            if user_id == author_id: continue
            if not user_skill_ids: continue

            # Используем пространство ID НАВЫКОВ для вектора пользователя
            user_skills_vector = create_feature_vector(user_skill_ids, all_skills)

            # ---> НЕКОРРЕКТНОЕ СРАВНЕНИЕ ВЕКТОРОВ РАЗНОЙ ПРИРОДЫ <---
            # Косинусная близость между вектором тегов поста и вектором навыков пользователя
            # имеет мало смысла без явного отображения тегов на навыки.
            # Оставляем как есть, но это нужно ИСПРАВИТЬ.
            # Возможно, лучше считать пересечение тегов поста и навыков пользователя?
            common_tags_skills_count = len(post_tags_names & user_skills_names[user_id])

            # --- Упрощенный скоринг на основе пересечения имен и бонуса за стек ---
            stack_bonus = 0
            if main_stack:
                user_skill_name_set = user_skills_names[user_id]
                stack_tools = TECH_STACKS[main_stack]
                core_matches = len(user_skill_name_set.intersection(stack_tools["core"]))
                related_matches = len(user_skill_name_set.intersection(stack_tools["related"]))
                advanced_matches = len(user_skill_name_set.intersection(stack_tools["advanced"]))
                # Простой бонус за наличие навыков из стека
                stack_bonus = 0.5 * bool(core_matches) + 0.3 * bool(related_matches) + 0.2 * bool(advanced_matches)

            # Формула: База за пересечение тег-навык + Бонус за совпадение со стеком
            score = min(9.99, (common_tags_skills_count * 1.5) + (stack_bonus * 4))

            if score > 0.5:
                rec_text = f"Post recommended based on matching tags/skills."
                if main_stack: rec_text += f" Possibly related to {main_stack}."
                post_recommendations.append({
                    "recommendation_type": "post",
                    "from_user_id": author_id, # Автор поста как источник (или None?)
                    "to_user_id": user_id,     # Кому рекомендуем
                    "project_id": None,
                    "team_id": None,
                    "post_id": post_id,        # ID рекомендуемого поста
                    "text": rec_text,
                    "score": round(score, 2)
                })
    logger.info(f"Generated {len(post_recommendations)} post recommendations.")
    return post_recommendations


# --- Функции Сохранения Рекомендаций (УЛУЧШЕННЫЕ) ---
@contextmanager
def transaction(conn):
    """Контекстный менеджер для транзакций."""
    tx = conn.begin()
    try:
        yield tx
        tx.commit()
    except Exception:
        logger.exception("Transaction failed, rolling back.")
        tx.rollback()
        raise

def save_recommendations_batch(conn, recommendations: List[Dict]):
    """Сохраняет пачку рекомендаций одним запросом (если возможно) или в транзакции."""
    if not recommendations: return

    # Группируем по типу для возможной пакетной вставки или удаления
    grouped_recs: Dict[str, List[Dict]] = {}
    for rec in recommendations:
         rec_type = rec.get("recommendation_type")
         if rec_type:
            grouped_recs.setdefault(rec_type, []).append(rec)

    with transaction(conn): # Открываем транзакцию для всех сохранений
        for rec_type, recs in grouped_recs.items():
            if not recs: continue
            logger.info(f"Attempting to save {len(recs)} recommendations of type '{rec_type}'")

            # --- Безопасная Стратегия Удаления (Пример: Удаление по ID цели и получателя) ---
            # Удаляем только те старые рекомендации этого типа для этих пользователей,
            # на которые у нас есть новые рекомендации.
            if rec_type == 'project':
                 target_ids = [r['project_id'] for r in recs if r.get('project_id') is not None]
                 user_ids = list(set(r['to_user_id'] for r in recs if r.get('to_user_id') is not None))
                 if target_ids and user_ids:
                     conn.execute(text(f"DELETE FROM project_recommendations WHERE to_project_id = ANY(:target_ids) AND recommendation_id IN (SELECT id FROM recommendations WHERE to_user_id = ANY(:user_ids) AND recommendation_type = :rec_type)"),
                                  {"target_ids": target_ids, "user_ids": user_ids, "rec_type": rec_type})
                     conn.execute(text(f"DELETE FROM recommendations WHERE to_user_id = ANY(:user_ids) AND project_id = ANY(:target_ids) AND recommendation_type = :rec_type"),
                                  {"user_ids": user_ids, "target_ids": target_ids, "rec_type": rec_type}) # Удаляем и из основной
            elif rec_type == 'team':
                 target_ids = [r['team_id'] for r in recs if r.get('team_id') is not None]
                 user_ids = list(set(r['to_user_id'] for r in recs if r.get('to_user_id') is not None))
                 if target_ids and user_ids:
                     conn.execute(text(f"DELETE FROM team_recommendations WHERE to_team_id = ANY(:target_ids) AND recommendation_id IN (SELECT id FROM recommendations WHERE to_user_id = ANY(:user_ids) AND recommendation_type = :rec_type)"),
                                  {"target_ids": target_ids, "user_ids": user_ids, "rec_type": rec_type})
                     conn.execute(text(f"DELETE FROM recommendations WHERE to_user_id = ANY(:user_ids) AND team_id = ANY(:target_ids) AND recommendation_type = :rec_type"),
                                  {"user_ids": user_ids, "target_ids": target_ids, "rec_type": rec_type})
            elif rec_type == 'post':
                 target_ids = [r['post_id'] for r in recs if r.get('post_id') is not None]
                 user_ids = list(set(r['to_user_id'] for r in recs if r.get('to_user_id') is not None))
                 if target_ids and user_ids:
                     conn.execute(text(f"DELETE FROM post_recommendations WHERE to_post_id = ANY(:target_ids) AND recommendation_id IN (SELECT id FROM recommendations WHERE to_user_id = ANY(:user_ids) AND recommendation_type = :rec_type)"),
                                  {"target_ids": target_ids, "user_ids": user_ids, "rec_type": rec_type})
                     conn.execute(text(f"DELETE FROM recommendations WHERE to_user_id = ANY(:user_ids) AND post_id = ANY(:target_ids) AND recommendation_type = :rec_type"),
                                  {"user_ids": user_ids, "target_ids": target_ids, "rec_type": rec_type})
            logger.info(f"Old recommendations potentially deleted for type '{rec_type}'.")


            # --- Вставка Новых Рекомендаций ---
            # Определяем уникальный ключ для ON CONFLICT (пример!)
            # Вам нужно создать такой constraint в БД, если его нет:
            # ALTER TABLE recommendations ADD CONSTRAINT uq_recommendation UNIQUE (recommendation_type, from_user_id, to_user_id, project_id, team_id, post_id);
            # Или определить другой уникальный ключ.
            # Если ключа нет, ON CONFLICT UPDATE не сработает правильно.
            # Пока используем ON CONFLICT DO NOTHING для простоты.
            insert_rec_sql = text("""
                INSERT INTO recommendations (recommendation_type, from_user_id, to_user_id, project_id, team_id, post_id, text, score)
                VALUES (:recommendation_type, :from_user_id, :to_user_id, :project_id, :team_id, :post_id, :text, :score)
                ON CONFLICT DO NOTHING -- Или ON CONFLICT (...) DO UPDATE SET score = EXCLUDED.score, updated_at = NOW()
                RETURNING id
            """)
            # Подготовка данных для вставки
            recommendations_data = []
            original_recs_map = {} # Для связи с доп. таблицами
            for rec in recs:
                 params = {
                    "recommendation_type": rec_type,
                    "from_user_id": rec.get("from_user_id"),
                    "to_user_id": rec.get("to_user_id"),
                    "project_id": rec.get("project_id"),
                    "team_id": rec.get("team_id"),
                    "post_id": rec.get("post_id"),
                    "text": rec.get("text", ""),
                    "score": rec.get("score", 0.0),
                 }
                 recommendations_data.append(params)
                 original_recs_map[len(recommendations_data)-1] = rec # Сохраняем оригинальный rec по индексу

            if not recommendations_data: continue

            # Пакетная вставка в recommendations
            inserted_ids_with_index = []
            try:
                results = conn.execute(insert_rec_sql, recommendations_data)
                inserted_ids_with_index = [(row[0], i) for i, row in enumerate(results.fetchall()) if row]
                logger.info(f"Inserted/updated {len(inserted_ids_with_index)} base recommendations for type '{rec_type}'")
            except Exception as e:
                logger.exception(f"Failed to insert base recommendations for type '{rec_type}': {e}")
                # Можно пропустить этот тип и перейти к следующему или прервать транзакцию
                continue

            # --- Вставка в связующие таблицы ---
            link_table_data = []
            link_table_name = ""
            fk_name = ""
            target_id_name = ""

            if rec_type == 'project':
                 link_table_name = "project_recommendations"
                 fk_name = "to_project_id"
                 target_id_name = "project_id"
            elif rec_type == 'team':
                 link_table_name = "team_recommendations"
                 fk_name = "to_team_id"
                 target_id_name = "team_id"
            elif rec_type == 'post':
                 link_table_name = "post_recommendations"
                 fk_name = "to_post_id"
                 target_id_name = "post_id"

            if link_table_name and fk_name and target_id_name:
                for rec_id, original_index in inserted_ids_with_index:
                     original_rec = original_recs_map[original_index]
                     target_id = original_rec.get(target_id_name)
                     if rec_id and target_id is not None:
                         link_table_data.append({"rec_id": rec_id, "target_id": target_id})

                if link_table_data:
                    try:
                        insert_link_sql = text(f"""
                            INSERT INTO {link_table_name} (recommendation_id, {fk_name})
                            VALUES (:rec_id, :target_id)
                            ON CONFLICT DO NOTHING
                        """)
                        conn.execute(insert_link_sql, link_table_data)
                        logger.info(f"Inserted {len(link_table_data)} links into {link_table_name}")
                    except Exception as e:
                        logger.exception(f"Failed to insert link recommendations into {link_table_name}: {e}")
                        # Можно прервать транзакцию или пропустить
                        continue


# --- Основная Логика Скрипта ---
def run_all_recommendations():
    """Запускает генерацию и сохранение всех типов рекомендаций."""
    logger.info("--- Starting recommendation cycle ---")
    all_recommendations: List[Dict] = []
    try:
        # Используем одно соединение для всех операций
        with engine.connect() as conn:
            # 1. Загружаем общие данные один раз
            all_skills, skill_id_to_name = load_all_skills(conn)
            all_tag_ids, tag_id_to_name = load_all_tags(conn)

            # 2. Генерируем все типы рекомендаций
            project_recs = generate_project_recommendations(conn, all_skills)
            all_recommendations.extend(project_recs)

            team_recs = generate_team_recommendations(conn, all_skills)
            all_recommendations.extend(team_recs)

            post_recs = generate_post_recommendations(conn, all_skills, skill_id_to_name, all_tag_ids, tag_id_to_name)
            all_recommendations.extend(post_recs)

            # 3. Сохраняем все рекомендации в одной транзакции
            if all_recommendations:
                 save_recommendations_batch(conn, all_recommendations)
                 logger.info(f"Successfully saved {len(all_recommendations)} recommendations in total.")
            else:
                 logger.info("No recommendations were generated to save.")

        status = "success"
        details = f"Processed recommendations. Generated projects: {len(project_recs)}, teams: {len(team_recs)}, posts: {len(post_recs)}"

    except Exception as e:
        logger.exception("Critical error during recommendation generation cycle:")
        status = "error"
        details = str(e)

    logger.info(f"--- Recommendation cycle finished with status: {status} ---")
    return {"status": status, "details": details}

# --- Точка входа для AWS Lambda ---
def lambda_handler(event, context):
    """Обработчик для AWS Lambda."""
    logger.info("Lambda handler invoked.")
    logger.info(f"Event: {json.dumps(event, indent=2)}") # Логгируем событие
    result = run_all_recommendations()
    return {
        'statusCode': 200 if result["status"] == "success" else 500,
        'body': json.dumps(result)
    }

# --- Точка входа для локального запуска ---
if __name__ == "__main__":
    logger.info("Running recommendation generation locally...")
    # Для локального запуска можно передать параметры или использовать .env
    run_all_recommendations()
    logger.info("Local run finished.")