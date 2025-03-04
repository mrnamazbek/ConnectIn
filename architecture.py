import os

def create_project_structure(base_dir):
    structure = {
        "app": [
            "__init__.py",
            "main.py",
            {"models": ["__init__.py", "user.py", "team.py", "project.py"]},
            {"schemas": ["__init__.py", "user.py", "team.py", "project.py"]},
            {"routes": ["__init__.py", "auth_service.py", "users.py", "teams.py", "projects.py"]},
            {"database": ["__init__.py", "connection.py", "models.py"]},
            {"utils": ["__init__.py", "auth_service.py", "logger.py"]},
            "config.py",
        ],
        "tests": ["__init__.py", "test_users.py", "test_projects.py"],
        "docs": [],
        "scripts": [],
    }

    def create_dir_and_files(base, structure):
        for key, value in structure.items():
            if isinstance(value, dict):
                dir_path = os.path.join(base, key)
                os.makedirs(dir_path, exist_ok=True)
                create_dir_and_files(dir_path, value)
            elif isinstance(value, list):
                dir_path = os.path.join(base, key)
                os.makedirs(dir_path, exist_ok=True)
                for file in value:
                    if isinstance(file, dict):
                        create_dir_and_files(dir_path, file)
                    else:
                        open(os.path.join(dir_path, file), 'w').close()
            else:
                open(os.path.join(base, value), 'w').close()

    os.makedirs(base_dir, exist_ok=True)
    create_dir_and_files(base_dir, structure)

# Используйте имя вашей директории
create_project_structure("connecto-backend")
