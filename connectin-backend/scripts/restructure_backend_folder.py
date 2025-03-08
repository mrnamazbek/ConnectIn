#!/usr/bin/env python3

import os
import shutil
from pathlib import Path


def ensure_dir(path: Path):
    """Create a directory if it doesn't exist."""
    if not path.exists():
        path.mkdir(parents=True)
        print(f"Created directory: {path}")


def move_file(src: Path, dest: Path):
    """Move a file from src to dest, preserving its contents."""
    if src.exists():
        print(f"Moving {src} -> {dest}")
        shutil.move(str(src), str(dest))


def main():
    # Adjust these names/paths to your desired final layout
    app_dir = Path("../app")  # Root for all your app code

    # Proposed structure
    core_dir = app_dir / "core"
    db_dir = app_dir / "db"
    api_dir = app_dir / "api"
    utils_dir = app_dir / "utils"
    models_dir = app_dir / "models"
    schemas_dir = app_dir / "schemas"

    # 1. Ensure directories exist
    for d in [core_dir, db_dir, api_dir, utils_dir, models_dir, schemas_dir]:
        ensure_dir(d)

    # 2. Move config.py into core/
    old_config_path = app_dir / "config.py"
    new_config_path = core_dir / "config.py"
    move_file(old_config_path, new_config_path)

    # 3. Move database-related files into db/
    #    (e.g. "database/connection.py" -> "db/connection.py")
    old_db_folder = app_dir / "database"
    connection_file = old_db_folder / "connection.py"
    move_file(connection_file, db_dir / "connection.py")

    # If you have a base.py or alembic, do something similar:
    # base_file = old_db_folder / "base.py"
    # move_file(base_file, db_dir / "base.py")
    # ... etc.

    # 4. Move your route files to api/ (e.g. "routes/" -> "api/")
    old_routes_dir = app_dir / "routes"
    if old_routes_dir.exists():
        for file in old_routes_dir.iterdir():
            if file.is_file() and file.suffix == ".py":
                move_file(file, api_dir / file.name)

    # 5. Move your model files to models/ (already have them, but if there's a leftover database/models.py, do it)
    # For example, if old_db_folder contains a 'models.py' you need to split or rename:
    leftover_models_file = old_db_folder / "models.py"
    if leftover_models_file.exists():
        move_file(leftover_models_file, models_dir / "old_models.py")  # rename to avoid overwriting

    # 6. Move your schemas if they're not already in schemas_dir
    # (Assuming you already have "app/schemas" - if not, do something similar to routes)

    # 7. Move utils if needed (if there's anything in old "utils/")
    old_utils_dir = app_dir / "utils"
    # If you've been using "app/utils", maybe you can skip this step.
    # Otherwise, do something like:
    # if old_utils_dir.exists():
    #     for file in old_utils_dir.iterdir():
    #         if file.is_file() and file.suffix == ".py":
    #             move_file(file, utils_dir / file.name)

    # 8. Clean up empty folders (like "database/" or "routes/" if they are now empty)
    for folder in [old_db_folder, old_routes_dir]:
        if folder.exists():
            try:
                folder.rmdir()  # only works if the folder is empty
                print(f"Removed empty directory: {folder}")
            except OSError:
                print(f"Directory not empty: {folder} - Please remove manually if needed.")

    print("Restructure complete! Remember to update your imports if necessary.")


if __name__ == "__main__":
    main()
