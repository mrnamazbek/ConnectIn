# connectin-ml_service/run_recommendations.py

import os
import logging
import json
from typing import List, Dict, Set, Tuple, Any, Optional
from sqlalchemy import create_engine, text, Engine
from sqlalchemy.exc import SQLAlchemyError
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from dotenv import load_dotenv
from contextlib import contextmanager
from datetime import date

# --- 1. Настройка Логгирования ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

# --- 2. Загрузка Переменных Окружения и Настройка БД ---
logger.info("Loading environment variables...")
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.critical("CRITICAL: DATABASE_URL environment variable not found!")
    raise ValueError("DATABASE_URL not found in environment variables")
else:
    logger.info("DATABASE_URL found.")

try:
    engine: Engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)
    with engine.connect() as connection_test:
        connection_test.execute(text("SELECT 1"))
    logger.info("Database engine created and connection verified successfully.")
except SQLAlchemyError as e:
    logger.exception("CRITICAL: Failed to create database engine or initial connection:")
    raise

# --- 3. Функции Загрузки Данных ---

def load_all_skills(conn) -> Tuple[List[int], Dict[int, str]]:
    """Загружает все ID и имена навыков, сортируя по ID."""
    logger.info("Loading all skills...")
    try:
        result = conn.execute(text("SELECT id, name FROM skills ORDER BY id")).mappings().fetchall()
        skill_ids = [s["id"] for s in result]
        skill_id_to_name = {s["id"]: s["name"] for s in result}
        logger.info(f"Loaded {len(skill_ids)} unique skills.")
        return skill_ids, skill_id_to_name
    except SQLAlchemyError as e: logger.exception("Failed to load skills:"); raise

def load_all_tags(conn) -> Tuple[List[int], Dict[int, str]]:
    """Загружает все ID и имена тегов, сортируя по ID."""
    logger.info("Loading all tags...")
    try:
        result = conn.execute(text("SELECT id, name FROM tags ORDER BY id")).mappings().fetchall()
        tag_ids = [t["id"] for t in result]
        tag_id_to_name = {t["id"]: t["name"] for t in result}
        logger.info(f"Loaded {len(tag_ids)} unique tags.")
        return tag_ids, tag_id_to_name
    except SQLAlchemyError as e: logger.exception("Failed to load tags:"); raise

def load_project_data(conn) -> Tuple[Dict[int, int], Dict[int, List[int]]]:
    """Загружает ID проектов, ID их владельцев и ID их навыков."""
    logger.info("Loading project data...")
    projects_dict, project_skills_dict = {}, {}
    try:
        projects_res = conn.execute(text("SELECT id, owner_id FROM projects")).mappings().fetchall()
        projects_dict = {p["id"]: p["owner_id"] for p in projects_res}
        proj_skills_res = conn.execute(text("SELECT project_id, skill_id FROM project_skills")).mappings().fetchall()
        for ps in proj_skills_res: project_skills_dict.setdefault(ps["project_id"], []).append(ps["skill_id"])
        logger.info(f"Loaded project data: {len(projects_dict)} projects.")
        return projects_dict, project_skills_dict
    except SQLAlchemyError as e: logger.exception("Failed to load project data:"); raise

def load_team_data(conn) -> Tuple[List[int], Dict[int, List[int]]]:
    """Загружает ID команд и ID участников для каждой команды."""
    logger.info("Loading team data...")
    teams_list, team_members_dict = [], {}
    try:
        teams_res = conn.execute(text("SELECT id FROM teams")).mappings().fetchall()
        teams_list = [t["id"] for t in teams_res]
        user_teams_res = conn.execute(text("SELECT user_id, team_id FROM user_teams")).mappings().fetchall()
        for ut in user_teams_res: team_members_dict.setdefault(ut["team_id"], []).append(ut["user_id"])
        logger.info(f"Loaded team data: {len(teams_list)} teams.")
        return teams_list, team_members_dict
    except SQLAlchemyError as e: logger.exception("Failed to load team data:"); raise

def load_post_data(conn) -> Tuple[Dict[int, int], Dict[int, List[int]]]:
    """Загружает ID постов, ID их авторов и ID их тегов."""
    logger.info("Loading post data...")
    posts_dict, post_tags_dict = {}, {}
    try:
        posts_res = conn.execute(text("SELECT id, author_id FROM posts")).mappings().fetchall()
        posts_dict = {p["id"]: p["author_id"] for p in posts_res}
        post_tags_res = conn.execute(text("SELECT post_id, tag_id FROM post_tags")).mappings().fetchall()
        for pt in post_tags_res: post_tags_dict.setdefault(pt["post_id"], []).append(pt["tag_id"])
        logger.info(f"Loaded post data: {len(posts_dict)} posts.")
        return posts_dict, post_tags_dict
    except SQLAlchemyError as e: logger.exception("Failed to load post data:"); raise

def load_all_user_skills(conn) -> Dict[int, List[int]]:
    """Загружает ID навыков для всех пользователей."""
    logger.info("Loading user skills data...")
    user_skills_dict = {}
    try:
        user_skills_res = conn.execute(text("SELECT user_id, skill_id FROM user_skills")).mappings().fetchall()
        for us in user_skills_res: user_skills_dict.setdefault(us["user_id"], []).append(us["skill_id"])
        logger.info(f"Loaded skills for {len(user_skills_dict)} users.")
        return user_skills_dict
    except SQLAlchemyError as e: logger.exception("Failed to load user skills data:"); raise

# --- 4. Функция Векторизации ---
def create_feature_vector(item_features: List[int], all_features_map: Dict[int, int], vector_len: int) -> np.ndarray:
    """Создает бинарный вектор признаков, используя готовую карту 'ID признака -> индекс вектора'."""
    vector = np.zeros(vector_len)
    if not item_features or not all_features_map: return vector # Возвращаем нулевой вектор, если нет данных
    for feature_id in item_features:
        idx = all_features_map.get(feature_id) # O(1) lookup
        if idx is not None:
            vector[idx] = 1
    return vector

# --- 5. Функции Генерации Рекомендаций ---

def generate_project_recommendations(conn, all_skills: List[int], all_skills_map: Dict[int, int], user_skills_dict: Dict[int, List[int]]) -> List[Dict]:
    """Генерирует рекомендации проектов для пользователей на основе совпадения навыков."""
    logger.info("Generating project recommendations...")
    try:
        projects_dict, project_skills_dict = load_project_data(conn)
    except Exception: logger.error("Cannot generate project recommendations due to data loading failure."); return []

    if not all_skills or not projects_dict or not user_skills_dict:
        logger.warning("Not enough data to generate project recommendations."); return []

    vector_len = len(all_skills)
    project_vectors: Dict[int, np.ndarray] = {} # Кэшируем векторы проектов
    project_skill_sets: Dict[int, Set[int]] = {} # Кэшируем наборы навыков проектов

    project_recommendations: List[Dict] = []
    for user_id, user_skill_list in user_skills_dict.items():
        user_vector = create_feature_vector(user_skill_list, all_skills_map, vector_len)
        if np.sum(user_vector) == 0: continue
        user_skill_set = set(user_skill_list)

        for project_id, owner_id in projects_dict.items():
            if user_id == owner_id: continue

            project_skills = project_skills_dict.get(project_id, [])
            if not project_skills: continue

            # Получаем вектор проекта из кэша или создаем новый
            project_vector = project_vectors.get(project_id)
            if project_vector is None:
                project_vector = create_feature_vector(project_skills, all_skills_map, vector_len)
                project_vectors[project_id] = project_vector
                project_skill_sets[project_id] = set(project_skills) # Кэшируем и набор
            if np.sum(project_vector) == 0: continue

            try:
                similarity = cosine_similarity([project_vector], [user_vector])[0][0]
                similarity = float(similarity) if not np.isnan(similarity) else 0.0
            except (ValueError, IndexError): similarity = 0.0

            common_skills_count = len(project_skill_sets[project_id] & user_skill_set)
            project_skill_count = len(project_skill_sets[project_id])
            # Формула: Сходство + Бонус за покрытие навыков проекта
            # Веса можно вынести в конфигурацию для тюнинга
            score = min(9.99, (similarity * 0.7) + (common_skills_count / project_skill_count * 0.3 if project_skill_count > 0 else 0) * 10) # Нормализуем бонус к шкале ~10

            if score > 1.0: # Порог отсечения (подбирается экспериментально)
                project_recommendations.append({
                    "recommendation_type": "project", "from_user_id": None, "to_user_id": user_id,
                    "project_id": project_id, "team_id": None, "post_id": None,
                    "text": f"Project recommended based on skill match (Score: {score:.2f})", "score": round(score, 2)
                })
    logger.info(f"Generated {len(project_recommendations)} project recommendations.")
    return project_recommendations

def generate_team_recommendations(conn, all_skills: List[int], all_skills_map: Dict[int, int], user_skills_dict: Dict[int, List[int]]) -> List[Dict]:
    """Генерирует рекомендации команд для пользователей."""
    logger.info("Generating team recommendations...")
    try:
        teams_list, user_teams_list, _ = load_team_data(conn) # _ т.к. user_skills_dict уже есть
    except Exception: logger.error("Cannot generate team recommendations due to data loading failure."); return []

    if not all_skills or not teams_list or not user_skills_dict:
        logger.warning("Not enough data to generate team recommendations."); return []

    team_members_dict: Dict[int, List[int]] = {}; [team_members_dict.setdefault(ut["team_id"], []).append(ut["user_id"]) for ut in user_teams_list]
    team_vectors: Dict[int, np.ndarray] = {}
    team_skill_sets: Dict[int, Set[int]] = {}

    vector_len = len(all_skills)
    team_recommendations: List[Dict] = []

    # Предрасчет векторов и наборов навыков для команд
    for team_id in teams_list:
        members = team_members_dict.get(team_id, [])
        if not members: continue
        team_skills_set: Set[int] = set()
        for member_id in members: team_skills_set.update(user_skills_dict.get(member_id, []))
        if not team_skills_set: continue
        team_skill_sets[team_id] = team_skills_set
        team_vectors[team_id] = create_feature_vector(list(team_skills_set), all_skills_map, vector_len)

    # Генерация рекомендаций
    for user_id, user_skill_list in user_skills_dict.items():
        user_skills_set = set(user_skill_list)
        if not user_skills_set: continue
        user_vector = create_feature_vector(user_skill_list, all_skills_map, vector_len)
        if np.sum(user_vector) == 0: continue

        for team_id, team_vector in team_vectors.items():
            members = team_members_dict.get(team_id, [])
            if user_id in members: continue # Не рекомендуем команду ее участнику
            if np.sum(team_vector) == 0: continue

            try:
                similarity = float(cosine_similarity([team_vector], [user_vector])[0][0])
            except (ValueError, IndexError): similarity = 0.0

            team_skills_set = team_skill_sets[team_id]
            common_skills = team_skills_set & user_skills_set
            unique_user_skills = user_skills_set - team_skills_set
            # Формула: Сходство + Бонус за уникальность + Бонус за пересечение
            score = min(9.99, (similarity * 0.6) + (len(unique_user_skills) / len(user_skills_set) * 0.3 if user_skills_set else 0) + (len(common_skills) / len(team_skills_set) * 0.1 if team_skills_set else 0) * 10) # Нормализуем бонус к шкале ~10

            if score > 1.0: # Порог
                team_recommendations.append({
                    "recommendation_type": "team", "from_user_id": None, "to_user_id": user_id,
                    "project_id": None, "team_id": team_id, "post_id": None,
                    "text": f"Team recommended based on skill synergy (Score: {score:.2f}).", "score": round(score, 2)
                })
    logger.info(f"Generated {len(team_recommendations)} team recommendations.")
    return team_recommendations


def generate_post_recommendations(conn, all_skills: List[int], skill_id_to_name: Dict[int, str], all_tag_ids: List[int], tag_id_to_name: Dict[int, str], user_skills_dict: Dict[int, List[int]]) -> List[Dict]:
    """Генерирует рекомендации постов для пользователей (Метод: Тег == Навык)."""
    logger.info("Generating post recommendations (using Tag == Skill name matching)...")
    logger.warning("This post recommendation logic is basic. Consider activity-based or advanced content-based methods for better results.")
    try:
        posts_dict, post_tags_dict = load_post_data(conn, all_tag_ids) # user_skills_dict уже загружен
    except Exception:
        logger.error("Cannot generate post recommendations due to data loading failure.")
        return []

    if not all_skills or not all_tag_ids or not posts_dict or not user_skills_dict:
        logger.warning("Not enough data to generate post recommendations.")
        return []

    post_recommendations: List[Dict] = []
    # Преобразуем ID навыков пользователя в ИМЕНА навыков (нижний регистр)
    user_skill_names_map: Dict[int, Set[str]] = {
        uid: set(skill_id_to_name.get(sid, '').lower() for sid in sids if sid in skill_id_to_name)
        for uid, sids in user_skills_dict.items()
    }

    for post_id, author_id in posts_dict.items():
        post_tag_ids = post_tags_dict.get(post_id, [])
        if not post_tag_ids: continue
        # Получаем ИМЕНА тегов поста (нижний регистр)
        post_tags_names = set(tag_id_to_name.get(tid, '').lower() for tid in post_tag_ids if tid in tag_id_to_name)
        if not post_tags_names: continue

        for user_id, user_skill_ids in user_skills_dict.items():
            if user_id == author_id: continue

            user_skill_name_set = user_skill_names_map.get(user_id, set())
            if not user_skill_name_set: continue

            # Считаем ПЕРЕСЕЧЕНИЕ ИМЕН тегов поста и навыков пользователя
            common_names_count = len(post_tags_names.intersection(user_skill_name_set))

            # Простой скоринг на основе количества совпадений
            score = min(9.99, common_names_count * 1.5) # Формула - просто пример!

            if score > 0.5: # Порог
                rec_text = f"Post recommended because its tags ({', '.join(list(post_tags_names)[:3])}...) match your skills."
                post_recommendations.append({
                    "recommendation_type": "post", "from_user_id": author_id, "to_user_id": user_id,
                    "project_id": None, "team_id": None, "post_id": post_id,
                    "text": rec_text, "score": round(score, 2)
                })

    logger.info(f"Generated {len(post_recommendations)} post recommendations (tag/skill name match).")
    return post_recommendations


# --- 6. Функция Сохранения Рекомендаций (под Консолидированную Схему) ---
def save_recommendations_batch(conn, recommendations: List[Dict]):
    """
    Сохраняет пачку рекомендаций в единую таблицу 'recommendations'.
    Использует 'INSERT ... ON CONFLICT DO NOTHING'.
    ПРЕДПОЛАГАЕТ, что таблица recommendations содержит колонки:
    recommendation_type, from_user_id, to_user_id, project_id, team_id, post_id, text, score.
    Старые рекомендации НЕ удаляются.
    """
    if not recommendations:
        logger.info("No recommendations provided to save_recommendations_batch.")
        return

    logger.info(f"Preparing to save/update {len(recommendations)} recommendations into 'recommendations' table.")
    recommendations_data = []

    for rec in recommendations:
        # Проверка наличия и корректности обязательных полей
        rec_type = rec.get("recommendation_type")
        to_user_id = rec.get("to_user_id")
        target_id = rec.get("project_id") or rec.get("team_id") or rec.get("post_id")

        if not rec_type or to_user_id is None or target_id is None:
            logger.warning(f"Skipping invalid recommendation data: {rec}")
            continue

        params = {
            "recommendation_type": rec_type,
            "from_user_id": rec.get("from_user_id"), # Может быть None
            "to_user_id": to_user_id,
            "project_id": rec.get("project_id"), # Будет None если тип не project
            "team_id": rec.get("team_id"),       # Будет None если тип не team
            "post_id": rec.get("post_id"),       # Будет None если тип не post
            "text": rec.get("text", ""),
            "score": round(float(rec.get("score", 0.0)), 4),
            # created_at / updated_at обрабатываются базой данных
        }
        recommendations_data.append(params)

    if not recommendations_data:
        logger.info("No valid recommendations prepared for saving after validation.")
        return

    try:
        # 1. Очистка старых (ПРИМЕР - НЕ АКТИВИРОВАН)
        #    Реализуйте стратегию удаления, если нужно!
        # logger.info("Skipping deletion of old recommendations.")

        # 2. Пакетная Вставка/Обновление (используем DO NOTHING)
        insert_sql = text("""
            INSERT INTO recommendations (recommendation_type, from_user_id, to_user_id, project_id, team_id, post_id, text, score)
            VALUES (:recommendation_type, :from_user_id, :to_user_id, :project_id, :team_id, :post_id, :text, :score)
            -- Для обновления (ON CONFLICT ... DO UPDATE) нужен уникальный индекс в БД,
            -- например: UNIQUE(recommendation_type, to_user_id, project_id, team_id, post_id)
            ON CONFLICT DO NOTHING
        """)

        result_proxy = conn.execute(insert_sql, recommendations_data)
        # rowcount может быть неточным с ON CONFLICT DO NOTHING в PostgreSQL
        logger.info(f"Executed batch insert/skip for {len(recommendations_data)} recommendations. Driver rowcount: {result_proxy.rowcount}")

    except SQLAlchemyError as e:
        logger.exception(f"Error during saving recommendations batch: {e}")
        raise # Передаем ошибку выше, чтобы откатить транзакцию

    logger.info(f"Finished saving recommendations batch.")


# --- 7. Основная Логика Скрипта ---
def run_all_recommendations():
    """Запускает генерацию и сохранение всех типов рекомендаций."""
    logger.info("--- Starting recommendation cycle ---")
    status = "error"; details = "Process did not complete."; generated_counts = {"project": 0, "team": 0, "post": 0}
    try:
        with engine.connect() as conn:
            # Начинаем транзакцию для всего процесса
            with conn.begin():
                logger.info("Loading common data (skills, tags, user_skills)...")
                all_skills, skill_id_to_name = load_all_skills(conn)
                all_tag_ids, tag_id_to_name = load_all_tags(conn)
                user_skills_dict = load_all_user_skills(conn) # Загружаем навыки всех юзеров
                logger.info("Common data loaded.")

                # Проверяем наличие данных перед генерацией
                if not all_skills or not all_tag_ids or not user_skills_dict:
                     raise ValueError("Initial data (skills, tags, or user skills) is missing, cannot generate recommendations.")

                all_generated_recommendations: List[Dict] = []
                generated_counts = {"project": 0, "team": 0, "post": 0}

                # --- Генерация ---
                try:
                    project_recs = generate_project_recommendations(conn, all_skills, {sid: i for i, sid in enumerate(all_skills)}, user_skills_dict)
                    generated_counts["project"] = len(project_recs)
                    all_generated_recommendations.extend(project_recs)
                except Exception: logger.exception("Project recommendation generation failed.")

                try:
                    team_recs = generate_team_recommendations(conn, all_skills, {sid: i for i, sid in enumerate(all_skills)}, user_skills_dict)
                    generated_counts["team"] = len(team_recs)
                    all_generated_recommendations.extend(team_recs)
                except Exception: logger.exception("Team recommendation generation failed.")

                try:
                    post_recs = generate_post_recommendations(conn, all_skills, skill_id_to_name, all_tag_ids, tag_id_to_name, user_skills_dict)
                    generated_counts["post"] = len(post_recs)
                    all_generated_recommendations.extend(post_recs)
                except Exception: logger.exception("Post recommendation generation failed.")

                # --- Сохранение (в рамках транзакции) ---
                if all_generated_recommendations:
                    save_recommendations_batch(conn, all_generated_recommendations)
                else:
                    logger.info("No recommendations were generated to save.")

                status = "success"
                details = f"Processed recommendations. Generated - Project: {generated_counts['project']}, Team: {generated_counts['team']}, Post: {generated_counts['post']}"
                logger.info(f"Successfully finished processing recommendations. Details: {details}")
            # --- Транзакция здесь коммитится (если не было ошибок) ---

    except ValueError as ve: # Ловим ошибки конфигурации/данных
         logger.error(f"Configuration or data error during recommendation cycle: {ve}")
         status = "error"; details = str(ve)
    except SQLAlchemyError as db_err: # Ловим ошибки БД
        logger.exception("Database error during recommendation cycle:")
        status = "error"; details = f"Database error: {db_err}"
    except Exception as e: # Ловим все остальные ошибки
        logger.exception("Critical error during recommendation generation cycle:")
        status = "error"; details = str(e)

    logger.info(f"--- Recommendation cycle finished with status: {status} ---")
    return {"status": status, "details": details}

# --- 8. Точка входа для AWS Lambda ---
def lambda_handler(event: Dict, context: Any) -> Dict:
    """Обработчик для AWS Lambda."""
    request_id = getattr(context, 'aws_request_id', 'N/A') if context else 'N/A'
    logger.info(f"Lambda handler started. Request ID: {request_id}")
    logger.debug(f"Received event: {json.dumps(event, indent=2)}")
    try:
        result = run_all_recommendations()
        statusCode = 200 if result["status"] == "success" else 500
    except Exception as e:
        logger.exception(f"Unhandled error in lambda_handler. Request ID: {request_id}")
        result = {"status": "error", "details": "Internal server error in handler."}
        statusCode = 500
    logger.info(f"Lambda handler finished. Request ID: {request_id}. Status Code: {statusCode}")
    return {'statusCode': statusCode, 'body': json.dumps(result)}

# --- 9. Точка входа для Локального Запуска ---
if __name__ == "__main__":
    logger.info("Running recommendation generation locally via __main__...")
    local_result = run_all_recommendations()
    logger.info(f"Local run finished. Result: {local_result}")