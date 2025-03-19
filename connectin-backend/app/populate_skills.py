from app.database import connection
from app.models.skill import Skill

def main():
    db = connection.get_db()
    skills = [
        "Python", "React", "Flask", "Django", "JavaScript", "HTML", "CSS", "SQL", "Git", "Docker",
        "Java", "C++", "C#", "Ruby", "PHP", "Swift", "Go", "Rust",
        "Angular", "AngularJS", "Ember", "Backbone", "jQuery", "Meteor",
        "Express.js", "Ruby on Rails", "Spring", "ASP.NET", "Node.js",
        "MongoDB", "PostgreSQL", "MySQL", "SQLite",
        "Agile", "Scrum", "Kanban", "Waterfall",
        "Коммуникация", "Работа в команде", "Решение проблем", "Лидерство",
        # Добавляем больше навыков
        "TypeScript", "Vue.js", "Next.js", "FastAPI", "GraphQL", "Kubernetes", "Terraform",
        "AWS", "Azure", "Google Cloud", "Redis", "RabbitMQ", "Kafka",
        "TDD", "BDD", "CI/CD", "DevOps", "Microservices"
    ]
    for skill_name in skills:
        existing_skill = db.query(Skill).filter(Skill.name == skill_name).first()
        if not existing_skill:
            new_skill = Skill(name=skill_name)
            db.add(new_skill)
    db.commit()

if __name__ == "__main__":
    main()