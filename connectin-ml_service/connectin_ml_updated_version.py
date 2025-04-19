# connectin-ml_service/run_recommendations.py

import os
import logging
import json
from typing import List, Dict, Set, Tuple, Any, Optional
from sqlalchemy import create_engine, text, Engine
from sqlalchemy.exc import SQLAlchemyError, \
    ArgumentError as SQLAlchemyArgumentError  # Переименовываем, чтобы не конфликтовать
from sqlalchemy.pool import NullPool
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
# from dotenv import load_dotenv # Убран для Lambda, используйте Env Vars
from contextlib import contextmanager
from datetime import datetime
from collections import defaultdict

# --- 1. Настройка Логгирования ---
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
# Убираем базовую конфигурацию, чтобы Lambda использовала свои настройки по умолчанию,
# если они есть, или конфигурируем явно.
# logging.basicConfig(level=log_level, format='%(asctime)s [%(levelname)s] %(name)s %(message)s')
logger = logging.getLogger(__name__)
logger.setLevel(log_level)
# Если логи не появляются, убедитесь, что IAM роль Lambda имеет права на CloudWatch Logs
# или раскомментируйте basicConfig:
if not logger.hasHandlers():
    logging.basicConfig(level=log_level, format='%(asctime)s [%(levelname)s] %(name)s %(message)s')

# --- 2. Конфигурация и Подключение к БД ---
logger.info("Loading configuration...")
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.critical("CRITICAL: DATABASE_URL environment variable not found!")
    raise ValueError("DATABASE_URL environment variable is required.")
else:
    logger.info("DATABASE_URL environment variable found.")

try:
    logger.info("Creating SQLAlchemy engine with NullPool...")
    engine: Engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        pool_pre_ping=True,
        echo=False
    )
    # Простая проверка соединения для быстрого выявления проблем
    with engine.connect() as connection_test:
        connection_test.execute(text("SELECT 1"))
    logger.info("Database engine created and connection verified successfully.")
except SQLAlchemyError as e:
    logger.exception("CRITICAL: Failed to create database engine or initial connection:")
    raise


# --- 3. Функции Загрузки Данных ---
# Возвращают пустые структуры при ошибках

def load_all_skills(conn) -> Tuple[List[int], Dict[int, int]]:
    """Загружает все ID навыков и создает маппинг ID -> индекс."""
    logger.info("Loading all skills...")
    try:
        result = conn.execute(text("SELECT id FROM skills ORDER BY id")).mappings().fetchall()
        skill_ids = [s["id"] for s in result]
        skill_id_to_index = {skill_id: i for i, skill_id in enumerate(skill_ids)}
        logger.info(f"Loaded {len(skill_ids)} unique skills.")
        return skill_ids, skill_id_to_index
    except SQLAlchemyError as e:
        logger.exception("Failed to load skills. Returning empty data.")
        return [], {}  # Возвращаем пустые, чтобы не падать


def load_all_user_data(conn) -> Dict[int, Dict[str, Any]]:
    """Загружает ID пользователей и ID их навыков."""
    logger.info("Loading all user skills data...")
    user_data = defaultdict(lambda: {'skills': []})
    try:
        valid_user_ids = set(conn.execute(text("SELECT id FROM users")).scalars().all())
        if not valid_user_ids:
            logger.warning("No users found in the database.")
            return {}

        user_skills_res = conn.execute(text("SELECT user_id, skill_id FROM user_skills")).mappings().fetchall()
        for us in user_skills_res:
            if us["user_id"] in valid_user_ids:
                user_data[us["user_id"]]['skills'].append(us["skill_id"])
        logger.info(f"Loaded skills for {len(user_data)} users.")
        return dict(user_data)
    except SQLAlchemyError as e:
        logger.exception("Failed to load user skills data. Returning empty data.")
        return {}


def load_project_data(conn) -> Tuple[Dict[int, int], Dict[int, List[int]]]:
    """Загружает ID проектов, владельцев и навыков проектов."""
    logger.info("Loading project data...")
    projects_dict, project_skills_dict = {}, {}
    try:
        projects_res = conn.execute(text("SELECT id, owner_id FROM projects")).mappings().fetchall()
        projects_dict = {p["id"]: p["owner_id"] for p in projects_res}
        proj_skills_res = conn.execute(text("SELECT project_id, skill_id FROM project_skills")).mappings().fetchall()
        for ps in proj_skills_res: project_skills_dict.setdefault(ps["project_id"], []).append(ps["skill_id"])
        logger.info(f"Loaded project data: {len(projects_dict)} projects.")
        return projects_dict, project_skills_dict
    except SQLAlchemyError as e:
        logger.exception("Failed to load project data. Returning empty data.")
        return {}, {}


def load_team_data(conn) -> Tuple[List[int], Dict[int, List[int]]]:
    """Загружает ID команд и ID участников."""
    logger.info("Loading team data...")
    teams_list, team_members_dict = [], {}
    try:
        teams_res = conn.execute(text("SELECT id FROM teams")).mappings().fetchall()
        teams_list = [t["id"] for t in teams_res]
        user_teams_res = conn.execute(text("SELECT user_id, team_id FROM user_teams")).mappings().fetchall()
        for ut in user_teams_res: team_members_dict.setdefault(ut["team_id"], []).append(ut["user_id"])
        logger.info(f"Loaded team data: {len(teams_list)} teams.")
        return teams_list, team_members_dict
    except SQLAlchemyError as e:
        logger.exception("Failed to load team data. Returning empty data.")
        return [], {}


def load_post_likes_data(conn) -> Tuple[Dict[int, Set[int]], Dict[int, Set[int]], Dict[int, Optional[int]]]:
    """Загружает лайки и авторов постов."""
    logger.info("Loading post likes and author data...")
    post_likers: Dict[int, Set[int]] = defaultdict(set)
    user_likes: Dict[int, Set[int]] = defaultdict(set)
    post_authors: Dict[int, Optional[int]] = {}
    try:
        likes_res = conn.execute(text("SELECT user_id, post_id FROM post_likes")).mappings().fetchall()
        for like in likes_res:
            post_likers[like["post_id"]].add(like["user_id"])
            user_likes[like["user_id"]].add(like["post_id"])

        posts_res = conn.execute(text("SELECT id, author_id FROM posts")).mappings().fetchall()
        post_authors = {p["id"]: p["author_id"] for p in posts_res}
        logger.info(f"Loaded {len(likes_res)} likes for {len(user_likes)} users / {len(post_likers)} posts.")
        return post_likers, user_likes, post_authors
    except SQLAlchemyError as e:
        logger.exception("Failed to load post likes/author data. Returning empty data.")
        return {}, {}, {}


# --- 4. Функция Векторизации ---
def create_feature_vector(item_features: List[int], feature_map: Dict[int, int], vector_len: int) -> np.ndarray:
    """Создает бинарный вектор признаков."""
    vector = np.zeros(vector_len)
    if not item_features or not feature_map: return vector
    for feature_id in item_features:
        idx = feature_map.get(feature_id)
        if idx is not None: vector[idx] = 1
    return vector


# --- 5. Функции Генерации Рекомендаций ---

# ВАЖНО: Убедитесь, что сигнатуры функций (количество и типы аргументов) здесь
#         СООТВЕТСТВУЮТ тому, как вы их вызываете в run_all_recommendations!

def generate_project_recommendations(conn, all_skills_map: Dict[int, int], all_user_data: Dict[int, Dict[str, Any]]) -> \
List[Dict]:
    """Генерирует рекомендации проектов (Content-Based: Skills)."""
    logger.info("Generating project recommendations...")
    projects_dict, project_skills_dict = load_project_data(conn)  # Загружаем здесь
    if not all_skills_map or not projects_dict or not all_user_data: return []

    vector_len = len(all_skills_map)
    project_vectors: Dict[int, np.ndarray] = {}
    project_skill_sets: Dict[int, Set[int]] = {}
    project_recommendations: List[Dict] = []

    for project_id, skills in project_skills_dict.items():
        if skills: project_skill_sets[project_id] = set(skills); project_vectors[project_id] = create_feature_vector(
            skills, all_skills_map, vector_len)

    for user_id, user_info in all_user_data.items():
        user_skills = user_info.get('skills', []);
        if not user_skills: continue
        user_vector = create_feature_vector(user_skills, all_skills_map, vector_len);
        if np.sum(user_vector) == 0: continue
        user_skill_set = set(user_skills)

        for project_id, owner_id in projects_dict.items():
            if user_id == owner_id: continue
            project_vector = project_vectors.get(project_id);
            if project_vector is None or np.sum(project_vector) == 0: continue
            try:
                similarity = float(cosine_similarity([project_vector], [user_vector])[0][0])
            except Exception:
                similarity = 0.0
            common_skills_count = len(project_skill_sets.get(project_id, set()) & user_skill_set);
            project_skill_count = len(project_skill_sets.get(project_id, set()))
            score = min(9.99, ((similarity * 0.7) + (
                common_skills_count / project_skill_count * 0.3 if project_skill_count > 0 else 0)) * 10)
            if score > 1.5: project_recommendations.append(
                {"recommendation_type": "project", "from_user_id": None, "to_user_id": user_id,
                 "project_id": project_id, "team_id": None, "post_id": None, "text": f"Project recommended (skills).",
                 "score": round(score, 2)})
    logger.info(f"Generated {len(project_recommendations)} project recommendations.")
    return project_recommendations


def generate_team_recommendations(conn, all_skills_map: Dict[int, int], all_user_data: Dict[int, Dict[str, Any]]) -> \
List[Dict]:
    """Генерирует рекомендации команд (Content-Based: Skills)."""
    logger.info("Generating team recommendations...")
    teams_list, team_members_dict_by_team = load_team_data(conn)  # Загружаем здесь
    if not all_skills_map or not teams_list or not all_user_data: return []

    vector_len = len(all_skills_map)
    team_vectors: Dict[int, np.ndarray] = {};
    team_skill_sets: Dict[int, Set[int]] = {}
    team_recommendations: List[Dict] = []

    for team_id in teams_list:
        members = team_members_dict_by_team.get(team_id, []);
        if not members: continue
        team_skills_set: Set[int] = set();
        [team_skills_set.update(all_user_data.get(member_id, {}).get('skills', [])) for member_id in members]
        if not team_skills_set: continue
        team_skill_sets[team_id] = team_skills_set;
        team_vectors[team_id] = create_feature_vector(list(team_skills_set), all_skills_map, vector_len)

    for user_id, user_info in all_user_data.items():
        user_skills = user_info.get('skills', []);
        if not user_skills: continue
        user_skills_set = set(user_skills);
        user_vector = create_feature_vector(user_skills, all_skills_map, vector_len);
        if np.sum(user_vector) == 0: continue
        for team_id, team_vector in team_vectors.items():
            members = team_members_dict_by_team.get(team_id, []);
            if user_id in members: continue
            if np.sum(team_vector) == 0: continue
            try:
                similarity = float(cosine_similarity([team_vector], [user_vector])[0][0])
            except Exception:
                similarity = 0.0
            team_skills_set = team_skill_sets[team_id];
            common_skills = team_skills_set & user_skills_set;
            unique_user_skills = user_skills_set - team_skills_set
            score = min(9.99, ((similarity * 0.6) + (
                len(unique_user_skills) / len(user_skills_set) * 0.3 if user_skills_set else 0) + (
                                   len(common_skills) / len(team_skills_set) * 0.1 if team_skills_set else 0)) * 10)
            if score > 1.5: team_recommendations.append(
                {"recommendation_type": "team", "from_user_id": None, "to_user_id": user_id, "project_id": None,
                 "team_id": team_id, "post_id": None, "text": f"Team recommended (skills).", "score": round(score, 2)})
    logger.info(f"Generated {len(team_recommendations)} team recommendations.")
    return team_recommendations


def generate_post_recommendations_item_based(conn, all_user_data: Dict[int, Dict[str, Any]]) -> List[Dict]:
    """Генерирует рекомендации постов (Item-Based Collaborative Filtering по лайкам)."""
    logger.info("Generating post recommendations (Item-Based CF on Likes)...")
    post_likers, user_likes, post_authors = load_post_likes_data(conn)  # Загружаем здесь
    if not post_likers or not user_likes or not post_authors or not all_user_data:
        logger.warning("Not enough data for item-based post recommendations.");
        return []

    item_similarity: Dict[int, Dict[int, float]] = defaultdict(dict)
    post_ids = list(post_likers.keys());
    logger.info(f"Calculating similarities for {len(post_ids)} posts...")
    for i in range(len(post_ids)):  # Расчет схожести по Жаккару
        post_id_i = post_ids[i];
        likers_i = post_likers[post_id_i];
        if len(likers_i) < 2: continue
        for j in range(i + 1, len(post_ids)):
            post_id_j = post_ids[j];
            likers_j = post_likers[post_id_j];
            if len(likers_j) < 2: continue
            intersection = len(likers_i.intersection(likers_j));
            if intersection == 0: continue
            union = len(likers_i.union(likers_j));
            similarity = intersection / union if union > 0 else 0
            if similarity > 0.05: item_similarity[post_id_i][post_id_j] = similarity; item_similarity[post_id_j][
                post_id_i] = similarity
    logger.info(f"Finished calculating item similarities.")

    all_recommendations: List[Dict] = []
    logger.info(f"Generating post recommendations for {len(all_user_data)} users...")
    for user_id in all_user_data.keys():  # Генерация для пользователей
        liked_posts = user_likes.get(user_id, set());
        if not liked_posts: continue
        candidate_scores: Dict[int, float] = defaultdict(float);
        candidate_sources: Dict[int, Set[int]] = defaultdict(set)
        for liked_post_id in liked_posts:
            similar_items = sorted(item_similarity.get(liked_post_id, {}).items(), key=lambda item: item[1],
                                   reverse=True)
            for similar_post_id, similarity_score in similar_items[:15]:
                if similar_post_id not in liked_posts: candidate_scores[similar_post_id] += similarity_score;
                candidate_sources[similar_post_id].add(liked_post_id)
        ranked_candidates = sorted(candidate_scores.items(), key=lambda item: item[1], reverse=True)
        count = 0
        for recommended_post_id, score in ranked_candidates:
            if count >= 10: break  # Топ-10
            author_id = post_authors.get(recommended_post_id);
            sources = list(candidate_sources[recommended_post_id])[:2]
            text = f"Recommended post based on similar liked posts (like {sources})."
            all_recommendations.append(
                {"recommendation_type": "post", "from_user_id": author_id, "to_user_id": user_id, "project_id": None,
                 "team_id": None, "post_id": recommended_post_id, "text": text,
                 "score": round(min(9.99, score * 5))})  # Пример скоринга
            count += 1
    logger.info(f"Generated {len(all_recommendations)} item-based post recommendations in total.")
    return all_recommendations


# --- 6. Функция Сохранения Рекомендаций ---
def save_recommendations_batch(conn, recommendations: List[Dict], batch_size: int = 500):
    """Сохраняет рекомендации в 'recommendations', используя ON CONFLICT DO UPDATE."""
    if not recommendations: logger.info("No recommendations provided to save."); return

    logger.info(f"Preparing to save/update {len(recommendations)} recommendations...")
    valid_recs_data = []
    for rec in recommendations:  # Валидация перед созданием пачки
        if not rec.get("recommendation_type") or rec.get("to_user_id") is None or \
                not (rec.get("project_id") or rec.get("team_id") or rec.get("post_id")):
            logger.warning(f"Skipping invalid recommendation data: {rec}");
            continue
        valid_recs_data.append({
            "recommendation_type": rec["recommendation_type"],
            "from_user_id": rec.get("from_user_id"),
            "to_user_id": rec["to_user_id"],
            "project_id": rec.get("project_id"),
            "team_id": rec.get("team_id"),
            "post_id": rec.get("post_id"),
            "text": rec.get("text", ""),
            "score": round(float(rec.get("score", 0.0)), 4),
        })

    if not valid_recs_data: logger.info("No valid recommendations prepared for saving."); return

    logger.info(f"Saving {len(valid_recs_data)} valid recommendations...")
    try:
        # Используем ON CONFLICT DO UPDATE - требует наличия уникального индекса!
        # Пример индекса: UNIQUE(recommendation_type, to_user_id, project_id, team_id, post_id)
        # Назовем его 'uq_recommendation_target' как в модели/миграции
        conflict_target = "(recommendation_type, to_user_id, project_id, team_id, post_id)"
        update_statement = "score = EXCLUDED.score, text = EXCLUDED.text, updated_at = NOW()"

        insert_sql = text(f"""
            INSERT INTO recommendations (recommendation_type, from_user_id, to_user_id, project_id, team_id, post_id, text, score, created_at, updated_at)
            VALUES (:recommendation_type, :from_user_id, :to_user_id, :project_id, :team_id, :post_id, :text, :score, NOW(), NOW())
            ON CONFLICT {conflict_target}
            DO UPDATE SET {update_statement}
        """)
        # Если уникального индекса нет, ИСПОЛЬЗУЙТЕ 'ON CONFLICT DO NOTHING' вместо DO UPDATE

        # Обработка пачками
        total_affected = 0
        for i in range(0, len(valid_recs_data), batch_size):
            batch = valid_recs_data[i: i + batch_size]
            if batch:
                logger.info(f"Executing batch insert/update {i // batch_size + 1} ({len(batch)} items)...")
                result_proxy = conn.execute(insert_sql, batch)
                total_affected += result_proxy.rowcount
                logger.info(f"Batch finished. Affected rows in batch: {result_proxy.rowcount}")

    except SQLAlchemyError as e:
        logger.exception(f"Error during saving recommendations batch: {e}")
        # Не перебрасываем ошибку, чтобы цикл мог завершиться, но статус будет error
        raise  # Или просто `return`, если хотим продолжить несмотря на ошибку сохранения? Перебросим.

    logger.info(f"Finished saving recommendations batch. Total rows affected: {total_affected}.")


# --- 7. Основная Логика Скрипта ---
def run_all_recommendations():
    """Запускает генерацию и сохранение всех типов рекомендаций."""
    logger.info("--- Starting recommendation cycle ---")
    status = "error";
    details = "Process did not complete.";
    generated_counts = {"project": 0, "team": 0, "post": 0}
    all_generated_recommendations: List[Dict] = []
    has_errors = False  # Флаг для отслеживания некритичных ошибок

    try:
        # Шаг 1: Загрузка данных вне транзакции
        logger.info("Phase 1: Loading data...")
        with engine.connect() as conn_read:
            all_skills, all_skills_map = load_all_skills(conn_read)
            all_user_data = load_all_user_data(conn_read)  # Включает навыки пользователей

        if not all_skills or not all_user_data:
            raise ValueError("Initial skill or user data is missing, cannot generate recommendations.")
        logger.info("Common data loaded successfully.")

        # Шаг 2: Генерация рекомендаций (с отловом ошибок для каждого типа)
        logger.info("Phase 2: Generating recommendations...")
        with engine.connect() as conn_gen:  # Отдельное соединение для чтения во время генерации
            try:
                # Убрали all_skills т.к. он не используется напрямую, только all_skills_map
                project_recs = generate_project_recommendations(conn_gen, all_skills_map, all_user_data)
                generated_counts["project"] = len(project_recs);
                all_generated_recommendations.extend(project_recs)
            except Exception:
                logger.exception("Project recommendation generation failed."); has_errors = True

            try:
                # Убрали all_skills
                team_recs = generate_team_recommendations(conn_gen, all_skills_map, all_user_data)
                generated_counts["team"] = len(team_recs);
                all_generated_recommendations.extend(team_recs)
            except Exception:
                logger.exception("Team recommendation generation failed."); has_errors = True

            try:
                post_recs = generate_post_recommendations_item_based(conn_gen, all_user_data)
                generated_counts["post"] = len(post_recs);
                all_generated_recommendations.extend(post_recs)
            except Exception:
                logger.exception("Post recommendation generation failed."); has_errors = True

        logger.info("Recommendation generation phase finished.")

        # Шаг 3: Сохранение в отдельной транзакции
        if all_generated_recommendations:
            logger.info("Phase 3: Saving recommendations...")
            with engine.connect() as conn_write:
                with conn_write.begin():  # Начинаем транзакцию для записи
                    save_recommendations_batch(conn_write, all_generated_recommendations)
            logger.info("Saving recommendations phase finished.")
        else:
            logger.info("Phase 3: No recommendations were generated to save.")

        status = "warning" if has_errors else "success"  # Статус warning, если были ошибки генерации
        details = f"Processed recommendations. Generated - Project: {generated_counts['project']}, Team: {generated_counts['team']}, Post: {generated_counts['post']}"

    except ValueError as ve:
        logger.error(f"Data or config error: {ve}"); status = "error"; details = str(ve)
    except SQLAlchemyError as db_err:
        logger.exception("Database error during cycle:"); status = "error"; details = f"Database error: {db_err}"
    except Exception as e:
        logger.exception("Critical error during cycle:"); status = "error"; details = str(e)

    logger.info(f"--- Recommendation cycle finished with status: {status} ---")
    return {"status": status, "details": details}


# --- 8. Точка входа для AWS Lambda ---
def lambda_handler(event: Dict, context: Any) -> Dict:
    """Обработчик для AWS Lambda."""
    # ... (Код без изменений) ...
    request_id = getattr(context, 'aws_request_id', 'N/A') if context else 'N/A';
    logger.info(f"Lambda handler started. Request ID: {request_id}");
    logger.debug(f"Received event: {json.dumps(event, indent=2)}")
    try:
        result = run_all_recommendations();
        statusCode = 200 if result["status"] != "error" else 500  # Считаем warning тоже успехом для statusCode
    except Exception as e:
        logger.exception(f"Unhandled error in lambda_handler. Request ID: {request_id}");
        result = {"status": "error", "details": "Internal server error."};
        statusCode = 500
    logger.info(f"Lambda handler finished. Request ID: {request_id}. Status Code: {statusCode}")
    return {'statusCode': statusCode, 'body': json.dumps(result)}


# --- 9. Точка входа для Локального Запуска ---
if __name__ == "__main__":
    # ... (Код без изменений) ...
    logger.info("Running recommendation generation locally...");
    local_result = run_all_recommendations();
    logger.info(f"Local run finished. Result: {local_result}")
