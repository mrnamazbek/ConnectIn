#!/usr/bin/env python3
"""
Скрипт для реорганизации структуры "models/" в соответствии с желаемой схемой:

models/
├── __init__.py
├── base.py
├── user.py
├── team.py
├── project.py
├── skill.py
├── article.py
├── tag.py
├── request.py
├── review.py
└── recommendation.py

Шаги:
1. Создать нужные файлы (если их нет) и папки.
2. Перенести существующие файлы (например, "old_models.py", "interaction.py") в
   соответствующие новые файлы. При необходимости - поместить код в "user.py", "project.py" и т.д.
3. Подкорректировать пути/имена, если нужно.

ВНИМАНИЕ:
 - Обязательно сделайте git commit перед запуском.
 - После переноса придётся вручную проверить import'ы и логику, т.к. скрипт не
   анализирует содержимое файлов, он лишь перемещает/создаёт.
"""

import os
import shutil
from pathlib import Path


def ensure_file(path: Path):
    """Создаёт пустой файл, если он не существует."""
    if not path.exists():
        print(f"Creating empty file: {path}")
        path.touch()


def move_or_append(src: Path, dest: Path):
    """
    Примерная логика: если исходный файл src существует,
    переносим (или дописываем содержимое) в dest.
    - Если dest пуст, можно просто переместить src -> dest.
    - Если нужно объединять, то читаем src и append в dest.
    """
    if not src.exists():
        print(f"File not found (skip): {src}")
        return

    print(f"Moving/Appending from {src} to {dest}")
    with src.open("r", encoding="utf-8") as f_src:
        src_content = f_src.read()

    # Дописать в конец dest
    with dest.open("a", encoding="utf-8") as f_dest:
        f_dest.write(f"\n\n# --- Moved from {src.name} ---\n")
        f_dest.write(src_content)

    # Удаляем старый файл
    src.unlink()


def main():
    base_dir = Path("models")
    if not base_dir.exists():
        print("Папка app/models не найдена. Скрипт завершается.")
        return

    # 1. Создаём структуру файлов согласно шаблону
    files_needed = [
        "base.py",
        "user.py",
        "team.py",
        "project.py",
        "skill.py",
        "article.py",
        "tag.py",
        "request.py",
        "review.py",
        "recommendation.py",
    ]

    # __init__.py тоже нужен, но обычно пустой или с импортами
    init_file = base_dir / "__init__.py"
    ensure_file(init_file)

    for fname in files_needed:
        fpath = base_dir / fname
        ensure_file(fpath)

    # 2. Пример переноса. Дополните под свои реальные файлы:
    # Например, move interaction.py -> user.py, если там есть связи user-article?
    old_models = base_dir / "old_models.py"
    interaction = base_dir / "interaction.py"

    # Пример: переносим всё содержимое old_models.py в user.py (или куда вам логичнее)
    move_or_append(old_models, base_dir / "user.py")

    # Если interaction.py содержит, скажем, user_article_interactions,
    # можно склеить это в user.py или article.py. Для примера — user.py:
    move_or_append(interaction, base_dir / "user.py")

    # Если у вас есть "article.py" (уже создан), но хотим объединить
    # комментарии, теги, и т.д. - можно по аналогии:
    # move_or_append( Path("app/models/comment.py"), base_dir / "article.py" )
    # (Используйте по ситуации. Если таких файлов нет, пропустите.)

    print("\n=== Done! ===")
    print("Теперь проверьте, всё ли перенеслось правильно, и скорректируйте импорт в коде.")


if __name__ == "__main__":
    main()
