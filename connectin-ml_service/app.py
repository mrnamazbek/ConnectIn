from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, text
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Dict
import os
from dotenv import load_dotenv

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to ConnectIn ML Service! Use /docs for API documentation."}

# Загружаем переменные из .env файла
load_dotenv()

# Получаем DATABASE_URL из переменной окружения
DATABASE_URL = os.getenv("DATABASE_URL")

# Если DATABASE_URL не найден (например, в тестовой среде), можно указать значение по умолчанию
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in environment variables")

engine = create_engine(DATABASE_URL, pool_size=20, max_overflow=30, pool_timeout=60)

TECH_STACKS = {
    "Machine Learning": {
        "core": ["TensorFlow", "PyTorch", "scikit-learn", "Keras"],
        "related": ["NumPy", "Pandas", "Matplotlib", "Seaborn"],
        "advanced": ["XGBoost", "LightGBM", "CatBoost"]
    },
    "AI": {
        "core": ["TensorFlow", "PyTorch", "NLTK", "spaCy"],
        "related": ["OpenCV", "Scikit-image", "Transformers"],
        "advanced": ["DeepLearning4j", "H2O.ai"]
    },
    "Blockchain": {
        "core": ["Ethereum", "Solidity", "Web3.js", "Truffle"],
        "related": ["IPFS", "Ganache", "Metamask"],
        "advanced": ["Hyperledger", "Corda"]
    },
    "Web Development": {
        "core": ["React", "Node.js", "Express", "HTML/CSS"],
        "related": ["TypeScript", "Vue.js", "Angular"],
        "advanced": ["Next.js", "GraphQL", "WebSocket"]
    },
    "Data Science": {
        "core": ["Pandas", "NumPy", "SQL", "scikit-learn"],
        "related": ["Power BI", "Tableau", "R"],
        "advanced": ["Dask", "Spark", "Hadoop"]
    },
    "Cloud Computing": {
        "core": ["AWS", "Azure", "Google Cloud", "Docker"],
        "related": ["Kubernetes", "Terraform", "Ansible"],
        "advanced": ["Serverless", "CloudFormation"]
    },
    "Cybersecurity": {
        "core": ["Wireshark", "Metasploit", "Nmap", "Kali Linux"],
        "related": ["Burp Suite", "OWASP", "Snort"],
        "advanced": ["SIEM", "SOAR", "Splunk"]
    },
    "DevOps": {  # Добавлен новый стек
        "core": ["Docker", "Kubernetes", "Jenkins", "Git"],
        "related": ["CI/CD", "Terraform", "Prometheus"],
        "advanced": ["ArgoCD", "Helm", "Istio"]
    }
}


# Загрузка данных для проектов
def load_project_data():
    projects_dict, project_skills_dict, user_skills_dict, skill_ids = {}, {}, {}, []
    with engine.connect() as conn:
        projects = conn.execute(text("SELECT id, owner_id FROM projects")).mappings().fetchall()
        projects_dict = {p["id"]: p["owner_id"] for p in projects}
        project_skills = conn.execute(text("SELECT project_id, skill_id FROM project_skills")).mappings().fetchall()
        for ps in project_skills:
            project_skills_dict.setdefault(ps["project_id"], []).append(ps["skill_id"])
        user_skills = conn.execute(text("SELECT user_id, skill_id FROM user_skills")).mappings().fetchall()
        for us in user_skills:
            user_skills_dict.setdefault(us["user_id"], []).append(us["skill_id"])
        all_skills = conn.execute(text("SELECT id FROM skills")).mappings().fetchall()
        skill_ids = [s["id"] for s in all_skills]
    print(f"Loaded all_skills: {skill_ids}")
    return projects_dict, project_skills_dict, user_skills_dict, skill_ids

def load_team_data():
    teams_list, user_teams, user_skills_dict, skill_ids = [], [], {}, []
    with engine.connect() as conn:
        teams = conn.execute(text("SELECT id FROM teams")).mappings().fetchall()
        teams_list = [t["id"] for t in teams]
        user_teams = conn.execute(text("SELECT user_id, team_id FROM user_teams")).mappings().fetchall()
        user_skills = conn.execute(text("SELECT user_id, skill_id FROM user_skills")).mappings().fetchall()
        for us in user_skills:
            user_skills_dict.setdefault(us["user_id"], []).append(us["skill_id"])
        all_skills = conn.execute(text("SELECT id FROM skills")).mappings().fetchall()
        skill_ids = [s["id"] for s in all_skills]
    print(f"Loaded all_skills: {skill_ids}")
    return teams_list, user_teams, user_skills_dict, skill_ids

def load_post_data():
    posts_dict, post_tags_dict, tags_dict, all_tag_ids, user_skills_dict = {}, {}, {}, [], {}
    with engine.connect() as conn:
        posts = conn.execute(text("SELECT id, author_id FROM posts")).mappings().fetchall()
        posts_dict = {p["id"]: p["author_id"] for p in posts}
        post_tags = conn.execute(text("SELECT post_id, tag_id FROM post_tags")).mappings().fetchall()
        for pt in post_tags:
            post_tags_dict.setdefault(pt["post_id"], []).append(pt["tag_id"])
        tags = conn.execute(text("SELECT id, name FROM tags")).mappings().fetchall()
        tags_dict = {t["id"]: t["name"] for t in tags}
        all_tag_ids = [t["id"] for t in tags]
        user_skills = conn.execute(text("SELECT user_id, skill_id FROM user_skills")).mappings().fetchall()
        for us in user_skills:
            user_skills_dict.setdefault(us["user_id"], []).append(us["skill_id"])
    print(f"Loaded all_tag_ids: {all_tag_ids}")
    print(f"Loaded all_skills: {[s['id'] for s in engine.connect().execute(text('SELECT id FROM skills')).mappings().fetchall()]}")
    return posts_dict, post_tags_dict, tags_dict, all_tag_ids, user_skills_dict

# Создание бинарного вектора навыков
def create_skill_vector(skill_list: List[int], all_skills: List[int]) -> np.ndarray:
    vector = np.zeros(len(all_skills))
    for skill_id in skill_list:
        if skill_id in all_skills:  # Проверяем, есть ли skill_id в all_skills
            idx = all_skills.index(skill_id)
            vector[idx] = 1
        else:
            print(f"Warning: Skill ID {skill_id} not found in all_skills")
    return vector

# Генерация рекомендаций для проектов
def generate_project_recommendations():
    projects_dict, project_skills_dict, user_skills_dict, all_skills = load_project_data()
    print(f"Project skills dict: {project_skills_dict}")
    print(f"User skills dict: {user_skills_dict}")
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
                    "post_id": None,
                    "text": f"Recommendation for project {project_id} based on skills",
                    "score": round(score, 2)
                })
    return project_recommendations

# Генерация рекомендаций для команд
def generate_team_recommendations():
    teams_list, user_teams, user_skills_dict, all_skills = load_team_data()
    team_recommendations = []
    print(f"Teams: {teams_list}")
    print(f"User teams: {user_teams}")
    print(f"User skills: {user_skills_dict}")
    print(f"All skills: {all_skills}")

    for team_id in teams_list:
        members = [ut["user_id"] for ut in user_teams if ut["team_id"] == team_id]
        if not members:
            continue
        initiator = members[0]
        team_skills = set()
        for member in members:
            team_skills.update(user_skills_dict.get(member, []))
        team_vector = create_skill_vector(list(team_skills), all_skills)
        print(f"Team {team_id} skills: {team_skills}")

        for user_id in user_skills_dict:
            if user_id in members:
                continue
            user_skills = set(user_skills_dict[user_id])
            user_vector = create_skill_vector(user_skills_dict[user_id], all_skills)
            similarity = cosine_similarity([team_vector], [user_vector])[0][0]
            common_skills = team_skills & user_skills
            unique_skills = user_skills - team_skills
            common_bonus = len(common_skills) / len(team_skills) if team_skills else 0
            unique_bonus = len(unique_skills) / len(all_skills) if all_skills else 0
            score = min(9.99, (similarity * 5) + (unique_bonus * 4) + (common_bonus * 1))
            print(f"User {user_id} for Team {team_id}: similarity={similarity}, common_bonus={common_bonus}, unique_bonus={unique_bonus}, score={score}")
            if score > 0:
                team_recommendations.append({
                    "from_user_id": initiator,
                    "to_user_id": user_id,
                    "project_id": None,
                    "team_id": team_id,
                    "post_id": None,
                    "text": f"Recommendation to join team {team_id} based on complementary skills",
                    "score": round(score, 2)
                })
    return team_recommendations

# Генерация рекомендаций для постов
def generate_post_recommendations():
    posts_dict, post_tags_dict, tags_dict, all_tag_ids, user_skills_dict = load_post_data()
    post_recommendations = []

    for post_id, author_id in posts_dict.items():
        post_tag_ids = post_tags_dict.get(post_id, [])
        post_tags = [tags_dict[tag_id] for tag_id in post_tag_ids if tag_id in tags_dict]
        post_vector = create_skill_vector(post_tag_ids, all_tag_ids)

        main_stack = None
        for stack_name, stack_tools in TECH_STACKS.items():
            if any(tag in stack_tools["core"] + stack_tools["related"] + stack_tools["advanced"]
                   for tag in post_tags):
                main_stack = stack_name
                break

        for user_id, user_skill_list in user_skills_dict.items():
            if user_id == author_id:
                continue
            # Используем all_skills для user_vector, а не all_tag_ids
            all_skills = [s["id"] for s in
                          engine.connect().execute(text("SELECT id FROM skills")).mappings().fetchall()]
            user_vector = create_skill_vector(user_skill_list, all_skills)
            # Приводим векторы к одинаковой длине для сравнения
            max_len = max(len(post_vector), len(user_vector))
            post_vector_padded = np.pad(post_vector, (0, max_len - len(post_vector)), 'constant')
            user_vector_padded = np.pad(user_vector, (0, max_len - len(user_vector)), 'constant')
            similarity = cosine_similarity([post_vector_padded], [user_vector_padded])[0][0]

            stack_bonus = 0
            if main_stack:
                user_skills = set(user_skill_list)
                stack_tools = TECH_STACKS[main_stack]
                core_matches = sum(1 for skill in user_skills if skill in
                                   [t for t in all_skills if tags_dict.get(t, '') in stack_tools["core"]])
                related_matches = sum(1 for skill in user_skills if skill in
                                      [t for t in all_skills if tags_dict.get(t, '') in stack_tools["related"]])
                advanced_matches = sum(1 for skill in user_skills if skill in
                                       [t for t in all_skills if tags_dict.get(t, '') in stack_tools["advanced"]])
                stack_bonus = (core_matches * 0.3 + related_matches * 0.2 + advanced_matches * 0.5)

            score = min(9.99, similarity * 7 + stack_bonus * 2.99)

            if score > 0:
                recommendation_text = f"Recommendation for post {post_id}"
                if main_stack:
                    recommendation_text += f" related to {main_stack}"
                post_recommendations.append({
                    "from_user_id": author_id,
                    "to_user_id": user_id,
                    "project_id": None,
                    "team_id": None,
                    "post_id": post_id,
                    "text": recommendation_text,
                    "score": round(score, 2)
                })
    return post_recommendations

# Сохранение всех рекомендаций
def save_recommendations(recommendations: List[Dict]):
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM recommendations"))
        if recommendations:
            conn.execute(
                text("""
                    INSERT INTO recommendations (from_user_id, to_user_id, project_id, team_id, post_id, text, score)
                    VALUES (:from_user_id, :to_user_id, :project_id, :team_id, :post_id, :text, :score)
                """),
                recommendations
            )
        conn.commit()

# Эндпоинт для генерации всех рекомендаций (проектов, команд, постов)
@app.post("/generate_recommendations")
def generate_and_save_recommendations():
    try:
        project_recommendations = generate_project_recommendations()
        team_recommendations = generate_team_recommendations()
        post_recommendations = generate_post_recommendations()
        all_recommendations = project_recommendations + team_recommendations + post_recommendations
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
                "post_id": r["post_id"],
                "text": r["text"],
                "score": float(r["score"]),
                "created_at": r["created_at"]
            } for r in result]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recommendations: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)