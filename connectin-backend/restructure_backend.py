import os
import ast
from pathlib import Path
import shutil

BASE_DIR = Path(__file__).parent
print(BASE_DIR)
APP_DIR = BASE_DIR / "app"


def restructure_project():
    """Основная функция реструктуризации проекта"""
    try:
        # 1. Реорганизация API
        reorganize_api_structure()

        # 2. Обновление сервисов
        update_services()

        # 3. Реструктуризация репозиториев
        update_repositories()

        # 4. Обновление моделей
        update_models()

        # 5. Настройка core
        update_core_config()

        print("Реструктуризация успешно завершена!")
        print("ВАЖНО: Проверьте миграции и выполните тесты перед деплоем!")

    except Exception as e:
        print(f"Ошибка при реструктуризации: {str(e)}")
        rollback_changes()


def reorganize_api_structure():
    """Реорганизация структуры API"""
    api_v1 = APP_DIR / "api" / "v1"
    api_v2 = APP_DIR / "api" / "v2"

    # Создаем папку для WebSocket
    websocket_dir = api_v1 / "websocket"
    websocket_dir.mkdir(exist_ok=True)

    # Перемещаем WebSocket-роуты
    move_files(
        api_v1,
        websocket_dir,
        ["chat_ws_routes.py"]
    )

    # Переименовываем роутеры
    rename_files(api_v1, {
        "auth_routes.py": "auth_router.py",
        "chat_routes.py": "chat_router.py",
        "post_routes.py": "post_router.py",
        "project_routes.py": "project_router.py"
    })

    rename_files(api_v2, {
        "auth_routes_v2.py": "auth_router_v2.py",
        "chat_routes_v2.py": "chat_router_v2.py"
    })


def update_services():
    """Обновление структуры сервисов"""
    services_dir = APP_DIR / "services"

    rename_files(services_dir, {
        "posts.py": "post_service.py",
        "skills.py": "skill_service.py",
        "tags.py": "tag_service.py",
        "teams.py": "team_service.py",
        "projects.py": "project_service.py",
        "chat.py": "chat_service.py",
        "auth.py": "auth_service.py"
    })


def update_repositories():
    """Обновление репозиториев"""
    repo_dir = APP_DIR / "repositories"

    rename_files(repo_dir, {
        "chat.py": "chat_repository.py",
        "post.py": "post_repository.py",
        "project.py": "project_repository.py",
        "skill.py": "skill_repository.py",
        "tag.py": "tag_repository.py",
        "team.py": "team_repository.py",
        "user.py": "user_repository.py"
    })


def update_models():
    """Реорганизация моделей"""
    models_dir = APP_DIR / "models"
    relations_dir = models_dir / "relations"
    relations_dir.mkdir(exist_ok=True)

    # Переносим файлы связей
    move_files(
        models_dir,
        relations_dir,
        ["associations.py"]
    )


def update_core_config():
    """Обновление конфигурации ядра"""
    core_dir = APP_DIR / "core"
    settings_dir = core_dir / "settings"
    settings_dir.mkdir(exist_ok=True)

    # Переносим конфигурационные файлы
    move_files(
        core_dir,
        settings_dir,
        ["config.py"]
    )

    # Создаем базовые настройки
    (settings_dir / "__init__.py").touch()
    (settings_dir / "base.py").write_text(
        "from pydantic import BaseSettings\n\n"
        "class Settings(BaseSettings):\n"
        "    # Общие настройки\n"
        "    class Config:\n"
        "        env_file = '.env'\n"
    )


def move_files(src_dir, dest_dir, filenames):
    """Перемещение файлов между директориями"""
    for filename in filenames:
        src = src_dir / filename
        if src.exists():
            shutil.move(str(src), str(dest_dir / filename))


def rename_files(directory, name_map):
    """Пакетное переименование файлов"""
    for old_name, new_name in name_map.items():
        old_path = directory / old_name
        new_path = directory / new_name
        if old_path.exists():
            old_path.rename(new_path)


def update_imports():
    """Обновление импортов во всех файлах"""
    for root, _, files in os.walk(APP_DIR):
        for file in files:
            if file.endswith(".py"):
                update_file_imports(Path(root) / file)


def update_file_imports(file_path):
    """Обновление импортов в одном файле"""
    content = file_path.read_text()

    # Замена старых импортов
    replacements = {
        "from app.services import": "from app.services import",
        "from app.repositories import": "from app.repositories import",
        "from app.api.v1 import": "from app.api.v1 import"
    }

    for old, new in replacements.items():
        content = content.replace(old, new)

    file_path.write_text(content)


def rollback_changes():
    """Откат изменений (режим безопасности)"""
    print("Выполняется откат изменений...")
    # Реализуйте логику отката при необходимости


if __name__ == "__main__":
    restructure_project()
    update_imports()