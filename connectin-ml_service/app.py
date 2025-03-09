from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, text
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Dict
import os

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "Welcome to ConnectIn ML Service! Use /docs for API documentation."}


DATABASE_URL = os.getenv("DATABASE_URL",
                         "postgresql://postgres:connectinamazon123@connectin-core-eu-db.cx4gaywwm3rk.eu-north-1.rds.amazonaws.com:5432/connectin")
engine = create_engine(DATABASE_URL)


# Загрузка данных для проектов
def load_project_data():
    with engine.connect() as conn:
        projects = conn.execute(text("SELECT id, owner_id FROM projects")).mappings().fetchall()
        projects_dict = {p["id"]: p["owner_id"] for p in projects}
        project_skills = conn.execute(text("SELECT project_id, skill_id FROM project_skills")).mappings().fetchall()
        project_skills_dict = {}
        for ps in project_skills:
            if ps["project_id"] not in project_skills_dict:
                project_skills_dict[ps["project_id"]] = []
            project_skills_dict[ps["project_id"]].append(ps["skill_id"])
        user_skills = conn.execute(text("SELECT user_id, skill_id FROM user_skills")).mappings().fetchall()
        user_skills_dict = {}
        for us in user_skills:
            if us["user_id"] not in user_skills_dict:
                user_skills_dict[us["user_id"]] = []
            user_skills_dict[us["user_id"]].append(us["skill_id"])
        all_skills = conn.execute(text("SELECT DISTINCT id FROM skills")).mappings().fetchall()
        skill_ids = [s["id"] for s in all_skills]
        return projects_dict, project_skills_dict, user_skills_dict, skill_ids


# Загрузка данных для команд
def load_team_data():
    with engine.connect() as conn:
        teams = conn.execute(text("SELECT id FROM teams")).mappings().fetchall()
        teams_list = [t["id"] for t in teams]
        user_teams = conn.execute(text("SELECT user_id, team_id FROM user_teams")).mappings().fetchall()
        user_skills = conn.execute(text("SELECT user_id, skill_id FROM user_skills")).mappings().fetchall()
        user_skills_dict = {}
        for us in user_skills:
            if us["user_id"] not in user_skills_dict:
                user_skills_dict[us["user_id"]] = []
            user_skills_dict[us["user_id"]].append(us["skill_id"])
        all_skills = conn.execute(text("SELECT DISTINCT id FROM skills")).mappings().fetchall()
        skill_ids = [s["id"] for s in all_skills]
        return teams_list, user_teams, user_skills_dict, skill_ids


# Создание бинарного вектора навыков
def create_skill_vector(skill_list: List[int], all_skills: List[int]) -> np.ndarray:
    vector = np.zeros(len(all_skills))
    for skill_id in skill_list:
        idx = all_skills.index(skill_id)
        vector[idx] = 1
    return vector


# Генерация рекомендаций для проектов
def generate_project_recommendations():
    projects_dict, project_skills_dict, user_skills_dict, all_skills = load_project_data()
    project_recommendations = []
    print(f"Projects: {projects_dict}")
    print(f"Project skills: {project_skills_dict}")
    print(f"User skills: {user_skills_dict}")
    print(f"All skills: {all_skills}")

    for project_id, owner_id in projects_dict.items():
        project_skills = project_skills_dict.get(project_id, [])
        project_vector = create_skill_vector(project_skills, all_skills)
        print(f"Project {project_id} skills: {project_skills}")
        for user_id, user_skill_list in user_skills_dict.items():
            if user_id == owner_id:
                continue
            user_vector = create_skill_vector(user_skill_list, all_skills)
            similarity = cosine_similarity([project_vector], [user_vector])[0][0]
            common_skills = set(project_skills) & set(user_skill_list)
            bonus = len(common_skills) / len(project_skills) if project_skills else 0
            score = min(9.99, similarity * 8 + bonus * 1.99)
            print(f"User {user_id} for Project {project_id}: similarity={similarity}, bonus={bonus}, score={score}")
            if score > 0:
                project_recommendations.append({
                    "from_user_id": owner_id,
                    "to_user_id": user_id,
                    "project_id": project_id,
                    "team_id": None,
                    "text": f"Recommendation for project {project_id} based on skills",
                    "score": round(score, 2)
                })
    return project_recommendations


# Генерация рекомендаций для команд с определением инициатора
def generate_team_recommendations():
    teams_list, user_teams, user_skills_dict, all_skills = load_team_data()
    team_recommendations = []
    print(f"Teams: {teams_list}")
    print(f"User teams: {user_teams}")
    print(f"User skills: {user_skills_dict}")
    print(f"All skills: {all_skills}")

    for team_id in teams_list:
        # Определяем первого участника команды как инициатора (владельца)
        members = [ut["user_id"] for ut in user_teams if ut["team_id"] == team_id]
        if not members:
            continue  # Пропускаем команды без участников
        initiator = members[0]  # Первый участник как инициатор

        # Уникальные навыки команды
        team_skills = set()
        for member in members:
            team_skills.update(user_skills_dict.get(member, []))
        team_vector = create_skill_vector(list(team_skills), all_skills)
        print(f"Team {team_id} skills: {team_skills}")

        # Оценка каждого пользователя, не входящего в команду
        for user_id in user_skills_dict:
            if user_id in members:
                continue  # Пропускаем текущих участников

            user_skills = set(user_skills_dict[user_id])
            user_vector = create_skill_vector(user_skills_dict[user_id], all_skills)

            # Косинусное сходство для пересечения навыков
            similarity = cosine_similarity([team_vector], [user_vector])[0][0]

            # Бонус за уникальные и общие навыки
            common_skills = team_skills & user_skills
            unique_skills = user_skills - team_skills
            common_bonus = len(common_skills) / len(team_skills) if team_skills else 0
            unique_bonus = len(unique_skills) / len(all_skills) if all_skills else 0

            # Итоговый балл: 50% сходство + 40% уникальность + 10% общие
            score = min(9.99, (similarity * 5) + (unique_bonus * 4) + (common_bonus * 1))

            print(
                f"User {user_id} for Team {team_id}: similarity={similarity}, common_bonus={common_bonus}, unique_bonus={unique_bonus}, score={score}")
            if score > 0:
                team_recommendations.append({
                    "from_user_id": initiator,  # Инициатор команды рекомендует
                    "to_user_id": user_id,  # Пользователь, которого рекомендуют добавить
                    "project_id": None,
                    "team_id": team_id,
                    "text": f"Recommendation to join team {team_id} based on complementary skills",
                    "score": round(score, 2)
                })
    return team_recommendations


# Сохранение всех рекомендаций
def save_recommendations(recommendations: List[Dict]):
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM recommendations"))  # Очищаем таблицу
        for rec in recommendations:
            conn.execute(
                text("""
                    INSERT INTO recommendations (from_user_id, to_user_id, project_id, team_id, text, score)
                    VALUES (:from_user_id, :to_user_id, :project_id, :team_id, :text, :score)
                """),
                rec
            )
        conn.commit()


# Эндпоинт для генерации всех рекомендаций (проектов и команд)
@app.post("/generate_recommendations")
def generate_and_save_recommendations():
    try:
        project_recommendations = generate_project_recommendations()
        team_recommendations = generate_team_recommendations()
        all_recommendations = project_recommendations + team_recommendations
        save_recommendations(all_recommendations)
        return {"status": "success", "recommendations": all_recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")


# Эндпоинт для получения рекомендаций пользователя
@app.get("/recommendations/{user_id}")
def get_recommendations(user_id: int):
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT * FROM recommendations 
                    WHERE to_user_id = :user_id OR from_user_id = :user_id
                """),
                {"user_id": user_id}
            ).mappings().fetchall()
            return [{
                "id": r["id"] if r["id"] else None,
                "from_user_id": r["from_user_id"],
                "to_user_id": r["to_user_id"],
                "project_id": r["project_id"],
                "team_id": r["team_id"],
                "text": r["text"],
                "score": float(r["score"]),
                "created_at": r["created_at"]
            } for r in result]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recommendations: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)