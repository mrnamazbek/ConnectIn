import os
import logging
from typing import Dict, Any
from datetime import date

# --- FastAPI & SQLAlchemy ---
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# --- Project Imports ---
from app.database.connection import get_db
from app.models.user import User, Experience, Education
from app.models.skill import Skill
from app.api.v1.auth import get_current_user
from app.core.config import settings

# --- AI & Formatting ---
import openai
import markdown
from markdown.extensions import Extension

# --- Setup ---
logger = logging.getLogger(__name__)

# --- Router ---
router = APIRouter()

class LaTeXStyleExtension(Extension):
    def extendMarkdown(self, md):
        md.registerExtension(self)
        md.parser.blockprocessors.deregister('indent')
        md.inlinePatterns.deregister('emphasis')

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



def create_resume_prompt(profile_data: dict) -> str:
    prompt = f"""
Generate a professional resume in Russian using Markdown with this structure:

# {profile_data['name']}
**{profile_data['position']}**  
📍 {profile_data['city']}  
✉️ {profile_data['email']} | 🔗 LinkedIn: {profile_data['linkedin']} | 🐙 GitHub: {profile_data['github']} | 📨 Telegram: {profile_data['telegram']}

## Professional Summary
{profile_data['about_me'] or '[Provide professional summary]'}

## Technical Skills
{profile_data['skills_list'] or 'No skills listed'}

## Professional Experience
{profile_data['experience_details'] or 'No experience listed'}

## Education
{profile_data['education_details'] or 'No education listed'}

Use:
- ## for sections
- **bold** for company names
- *italic* for job titles
- - for list items
- Proper emojis
"""
    return prompt

# --- Хелпер: Вызов OpenAI API ---
async def generate_text_via_openai(prompt: str) -> str:
    """Асинхронно вызывает OpenAI API для генерации текста."""
    if not settings.OPENAI_API_KEY:
        logger.error("OpenAI API key is not configured.")
        raise HTTPException(status_code=500, detail="AI service is not configured (API key missing).")

    logger.info("Sending request to OpenAI API...")
    try:
        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.6,
            n=1,
            stop=None
        )
        generated_text = response.choices[0].message.content.strip()
        logger.info("Received response from OpenAI API.")
        return generated_text
    except openai.RateLimitError as e:
        logger.warning(f"OpenAI Rate Limit Exceeded: {e}")
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="AI service rate limit exceeded. Please try again later.")
    except openai.AuthenticationError as e:
        logger.error(f"OpenAI Authentication Error: {e}. Check API Key.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AI service authentication failed.")
    except Exception as e:
        logger.exception(f"OpenAI API call failed: {e}")  # Логгируем полный traceback
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Failed to communicate with AI service.")


def convert_to_professional_html(markdown_text: str) -> str:
    extensions = ['extra', 'smarty', LaTeXStyleExtension(), 'nl2br', 'tables']
    html_content = markdown.markdown(markdown_text, extensions=extensions)

    latex_style = """
    <style>
        body { font-family: 'Latin Modern Roman', Times, serif; line-height: 1.6; margin: 2cm; }
        h1 { font-size: 22pt; border-bottom: 2pt solid #333; padding-bottom: 3pt; }
        h2 { font-size: 16pt; margin-top: 18pt; }
        ul { margin: 6pt 0; padding-left: 15pt; }
        li { margin: 3pt 0; }
        .contact-info { margin: 9pt 0; font-size: 10.5pt; }
        .section { margin-bottom: 12pt; }
    </style>
    """
    return f"<!DOCTYPE html><html><head>{latex_style}</head><body>{html_content}</body></html>"


# --- Основной API Эндпоинт ---
@router.post("/generate-ai", response_model=Dict[str, str])
async def generate_ai_resume_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        profile_data = get_user_profile_data(current_user)
        prompt = create_resume_prompt(profile_data)
        markdown_resume = await generate_text_via_openai(prompt)
        html_resume = convert_to_professional_html(markdown_resume)
        return {"resume_html": html_resume}
    except Exception as e:
        logger.error(f"Resume generation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Resume generation failed")