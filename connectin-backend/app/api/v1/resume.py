# connectin-backend/app/api/v1/resumes.py

import os
import logging
from typing import Dict, Any
from io import BytesIO
from datetime import date

# --- FastAPI & SQLAlchemy ---
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# --- Проектные импорты ---
from app.database.connection import get_db
from app.models.user import User, Experience, Education # Модели из user.py
from app.models.skill import Skill # Модель Skill
from app.api.v1.auth import get_current_user # Ваша аутентификация
from app.core.config import settings # Импорт настроек с ключом

# --- AI & Форматирование ---
import openai
import markdown # Для конвертации Markdown -> HTML

# --- Настройка ---
logger = logging.getLogger(__name__)
openai.api_key = settings.OPENAI_API_KEY # Устанавливаем ключ для библиотеки OpenAI

# --- Роутер ---
router = APIRouter()

# --- Хелпер: Сбор данных пользователя ---
# (Эта функция может быть в сервисе или репозитории для чистоты кода)
def get_user_profile_data(user: User) -> dict:
    """Собирает данные профиля пользователя для передачи в AI."""
    logger.debug(f"Collecting profile data for user: {user.username}")
    # Формируем имя
    user_name = user.username
    if user.first_name and user.last_name:
        user_name = f"{user.first_name} {user.last_name}"
    elif user.first_name: user_name = user.first_name
    elif user.last_name: user_name = user.last_name

    # Форматируем Опыт
    experience_list = []
    if hasattr(user, 'experience') and user.experience:
        sorted_exp = sorted(
            [exp for exp in user.experience if exp],
            key=lambda x: (x.start_year, x.end_year is None, x.end_year), reverse=True
        )
        for exp in sorted_exp:
            # **ВАЖНО:** Добавьте поле description в модель Experience для качественного резюме!
            # Пока описания нет, формируем базовую строку.
            exp_str = f"- {exp.role} в {exp.company} ({exp.start_year} - {exp.end_year or 'н.в.'})"
            # if exp.description: exp_str += f"\n  Описание: {exp.description}" # Если добавите описание
            experience_list.append(exp_str)

    # Форматируем Образование
    education_list = []
    if hasattr(user, 'education') and user.education:
        sorted_edu = sorted(
            [edu for edu in user.education if edu],
            key=lambda x: (x.start_year, x.end_year is None, x.end_year), reverse=True
        )
        for edu in sorted_edu:
            # **ВАЖНО:** Добавьте field_of_study и description в модель Education для качества.
            edu_str = f"- {edu.institution}, {edu.degree} ({edu.start_year} - {edu.end_year or 'н.в.'})"
            # if edu.field_of_study: edu_str += f" (Специальность: {edu.field_of_study})"
            # if edu.description: edu_str += f"\n  Описание: {edu.description}"
            education_list.append(edu_str)

    # Форматируем Навыки
    skills_list = sorted([skill.name for skill in getattr(user, 'skills', []) if skill and skill.name])

    profile_data = {
        "name": user_name,
        "position": user.position or "", # Заголовок/Должность
        "city": user.city or "", # Город
        "email": user.email or "",
        "linkedin": user.linkedin or "",
        "github": user.github or "",
        "telegram": user.telegram or "",
        # Передаем как строки для простоты промпта
        "experience_details": "\n".join(experience_list) if experience_list else "Нет данных об опыте.",
        "education_details": "\n".join(education_list) if education_list else "Нет данных об образовании.",
        "skills_list": ", ".join(skills_list) if skills_list else "Нет данных о навыках.",
        # Добавьте поле "bio" или "about" в модель User, если хотите краткую сводку
        "about_me": getattr(user, 'bio', "") # Пример, если есть поле bio
    }
    logger.debug(f"Profile data collected for {user.username}: {list(profile_data.keys())}")
    return profile_data

# --- Хелпер: Формирование промпта ---
def create_resume_prompt(profile_data: dict) -> str:
    """Создает промпт для ChatGPT на основе данных профиля."""
    # Можно использовать Jinja2 для более сложных шаблонов промпта
    prompt = f"""
Ты — профессиональный составитель резюме (CV writer) для IT-специалистов.
Твоя задача - создать структурированное и профессиональное резюме на русском языке на основе предоставленных данных.

Требования к резюме:
1. Стиль: Профессиональный, современный, четкий и лаконичный. Используй сильные глаголы для описания опыта (если описание предоставлено).
2. Структура: Обязательно включи разделы: Контактная информация, Краткая сводка (Summary/About - 1-3 предложения на основе должности и данных 'Обо мне'), Опыт работы, Образование, Навыки. Не выдумывай информацию, которой нет в данных.
3. Формат вывода: Строго Markdown. Используй заголовки Markdown (##), списки (* или -) и выделение жирным (**текст**). Не добавляй никаких вступлений или заключений вне самого резюме.

Данные пользователя:
---
Имя: {profile_data['name']}
Должность/Заголовок: {profile_data['position']}
Город: {profile_data['city']}
Email: {profile_data['email']}
LinkedIn: {profile_data['linkedin']}
GitHub: {profile_data['github']}
Telegram: {profile_data['telegram']}
Обо мне (для Summary): {profile_data['about_me']}

Опыт работы (каждый пункт с новой строки):
{profile_data['experience_details']}

Образование (каждый пункт с новой строки):
{profile_data['education_details']}

Навыки (список через запятую):
{profile_data['skills_list']}
---

Сгенерируй текст резюме в формате Markdown. Начни с имени и контактной информации.
"""
    return prompt

# --- Хелпер: Вызов OpenAI API ---
async def generate_text_via_openai(prompt: str) -> str:
    """Асинхронно вызывает OpenAI API для генерации текста."""
    if not openai.api_key:
        logger.error("OpenAI API key is not configured.")
        raise HTTPException(status_code=500, detail="AI service is not configured (API key missing).")

    logger.info("Sending request to OpenAI API...")
    try:
        response = await openai.ChatCompletion.acreate( # Асинхронный вызов
            model="gpt-3.5-turbo", # Или gpt-4o-mini, gpt-4o, если доступны
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.6,
            n=1,
            stop=None
        )
        generated_text = response.choices[0].message.content.strip()
        logger.info("Received response from OpenAI API.")
        return generated_text
    except openai.error.RateLimitError as e:
        logger.warning(f"OpenAI Rate Limit Exceeded: {e}")
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="AI service rate limit exceeded. Please try again later.")
    except openai.error.AuthenticationError as e:
        logger.error(f"OpenAI Authentication Error: {e}. Check API Key.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AI service authentication failed.")
    except Exception as e:
        logger.exception(f"OpenAI API call failed: {e}") # Логгируем полный traceback
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Failed to communicate with AI service.")

# --- Основной API Эндпоинт ---
@router.post( # Используем POST, так как генерация - это действие
    "/generate-ai",
    summary="Сгенерировать резюме с помощью AI (возвращает HTML)",
    response_model=Dict[str, str] # Ожидаемый формат ответа
)
async def generate_ai_resume_endpoint(
    current_user: User = Depends(get_current_user),
    # db: Session = Depends(get_db) # db может понадобиться, если get_user_profile_data будет сложнее
):
    """
    Собирает данные профиля пользователя, генерирует текст резюме через OpenAI,
    конвертирует результат в HTML и возвращает его.
    """
    try:
        # 1. Собрать данные профиля
        profile_data = get_user_profile_data(current_user)

        # 2. Создать промпт
        prompt = create_resume_prompt(profile_data)

        # 3. Вызвать AI для генерации текста (Markdown)
        markdown_resume = await generate_text_via_openai(prompt)

        # 4. Конвертировать Markdown в HTML
        try:
             # Используем расширения для лучшего форматирования (таблицы, переносы строк и т.д.)
            html_resume = markdown.markdown(markdown_resume, extensions=['extra', 'nl2br', 'tables', 'fenced_code'])
        except Exception as e:
             logger.exception(f"Markdown to HTML conversion failed for user {current_user.username}: {e}")
             # Если конвертация не удалась, можно вернуть сам Markdown или ошибку
             # raise HTTPException(status_code=500, detail="Failed to format generated resume.")
             # Пока вернем Markdown как запасной вариант
             html_resume = f"<pre>{markdown_resume}</pre>" # Обернем в <pre> для сохранения форматирования

        # 5. Вернуть результат
        return {"resume_html": html_resume}

    except HTTPException as e:
        # Перебрасываем известные HTTP ошибки
        raise e
    except Exception as e:
        logger.exception(f"Error in generate_ai_resume_endpoint for user {current_user.username}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate AI resume.")