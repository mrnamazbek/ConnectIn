# connectin-backend/app/api/v1/resumes.py

import os
import logging
from typing import Dict, Any, List
from io import BytesIO
from datetime import date # Убедитесь, что date импортирован

# --- FastAPI & SQLAlchemy ---
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session # Убрали joinedload, будем использовать refresh
from starlette.responses import StreamingResponse

from app.api.v1.pdf_service import PDFService
# --- Проектные импорты ---
from app.database.connection import get_db
from app.models.user import User, Experience, Education # Модели из user.py (с обновленными полями Date, description и т.д.)
from app.models.skill import Skill
from app.api.v1.auth import get_current_user
from app.core.config import settings

# --- AI & Форматирование ---
import openai
import markdown

# --- Настройка ---
logger = logging.getLogger(__name__)
# logging.basicConfig(level=logging.INFO) # Настройте логгирование в main.py

# --- Роутер ---
router = APIRouter()

# --- Хелпер: Сбор данных пользователя (ОБНОВЛЕННЫЙ) ---
def get_user_profile_data(user: User, db: Session) -> dict:
    """
    Собирает и форматирует данные профиля пользователя для AI.
    Использует обновленные модели с Date и новыми полями.
    """
    logger.debug(f"Collecting profile data for user: {user.username}")

    # Принудительно обновляем user и его связи в текущей сессии,
    # чтобы получить актуальные данные, включая добавленные опыт/образование
    try:
        db.refresh(user)
        # Явно подгружаем связи, если они не загружаются автоматически
        # или если использовалась другая сессия для добавления данных
        user_exp = db.query(Experience).filter(Experience.user_id == user.id).order_by(Experience.start_year.desc()).all()
        user_edu = db.query(Education).filter(Education.user_id == user.id).order_by(Education.start_year.desc()).all()
        user_skills = db.query(Skill).join(User.skills).filter(User.id == user.id).order_by(Skill.name).all() # Пример явной загрузки с join
    except Exception as e:
         logger.exception(f"Failed to load relationships for user {user.username}")
         # Можно вернуть пустые списки или пробросить ошибку
         user_exp = []
         user_edu = []
         user_skills = []


    # Формируем имя
    user_name = user.username
    if user.first_name and user.last_name:
        user_name = f"{user.first_name} {user.last_name}"
    elif user.first_name: user_name = user.first_name
    elif user.last_name: user_name = user.last_name

    # --- Форматируем Опыт (с новыми полями) ---
    experience_list_str: List[str] = []
    for exp in user_exp: # Используем явно загруженные данные
        if not exp.start_year: continue # Пропускаем, если нет даты начала
        date_str = f"{exp.start_year.strftime('%B %Y')} - {exp.end_year.strftime('%B %Y') if exp.end_year else 'Present'}"
        exp_str = f"* **{exp.role}** at **{exp.company}** ({date_str})"
        # Используем поле description, если оно есть
        if exp.description:
            # Форматируем описание как подпункты с отступом
            description_lines = [f"    * {line.strip()}" for line in exp.description.split('\n') if line.strip()]
            exp_str += "\n" + "\n".join(description_lines)
        experience_list_str.append(exp_str)

    # --- Форматируем Образование (с новыми полями) ---
    education_list_str: List[str] = []
    for edu in user_edu: # Используем явно загруженные данные
        if not edu.start_year: continue
        date_str = f"{edu.start_year.strftime('%B %Y')} - {edu.end_year.strftime('%B %Y') if edu.end_year else 'Present'}"
        edu_str = f"* **{edu.institution}** - {edu.degree} ({date_str})"
        if edu.field_of_study:
            edu_str += f"\n    * *Field of Study:* {edu.field_of_study}"
        if edu.relevant_courses:
             edu_str += f"\n    * *Relevant Courses:* {edu.relevant_courses}"
        if edu.description:
            description_lines = [f"    * {line.strip()}" for line in edu.description.split('\n') if line.strip()]
            edu_str += "\n" + "\n".join(description_lines)
        education_list_str.append(edu_str)

    # --- Форматируем Навыки ---
    skills_list_str = sorted([skill.name for skill in user_skills if skill and skill.name])

    # --- Собираем все данные ---
    profile_data = {
        "name": user_name,
        "position": user.position or "",
        "city": user.city or "",
        "email": user.email or "",
        "linkedin": user.linkedin or "",
        "github": user.github or "",
        "telegram": user.telegram or "",
        "about_me": getattr(user, 'bio', "") or getattr(user, 'position', ""),
        # Используем двойной перенос строки для разделения записей в промпте
        "experience_entries": "\n\n".join(experience_list_str) if experience_list_str else "No professional experience provided.",
        "education_entries": "\n\n".join(education_list_str) if education_list_str else "No education details provided.",
        "skills_list": ", ".join(skills_list_str) if skills_list_str else "No skills listed.",
    }
    logger.debug(f"Profile data collected for {user.username}: Keys={list(profile_data.keys())}")
    return profile_data

# --- Хелпер: Формирование промпта (Английский, ОБНОВЛЕННЫЙ) ---
def create_resume_prompt_en(profile_data: dict) -> str:
    """Создает промпт для ChatGPT на английском, используя обновленные данные."""
    # Формируем строку с контактами, только если они есть
    contact_parts = [profile_data['email']] # Email обязателен
    if profile_data['city']: contact_parts.insert(0, profile_data['city'])
    if profile_data['linkedin']: contact_parts.append(f"LinkedIn: {profile_data['linkedin']}")
    if profile_data['github']: contact_parts.append(f"GitHub: {profile_data['github']}")
    # Telegram обычно менее релевантен для резюме, но можно добавить
    # if profile_data['telegram']: contact_parts.append(f"Telegram: {profile_data['telegram']}")
    contact_line = " | ".join(filter(None, contact_parts)) # Объединяем через |

    prompt = f"""
Act as an expert technical CV writer creating a professional resume for "{profile_data['name']}".
The output language MUST be English.

**Resume Requirements:**
1.  **Language:** English ONLY.
2.  **Style:** Professional, modern, results-oriented. Use strong action verbs for experience descriptions. Be concise and factual, using ONLY the data provided below.
3.  **Structure:** Create the following sections in this order:
    * **Contact Information:** Include Name (as main heading H1/Markdown #), then a single line below with City, Email, LinkedIn URL, GitHub URL separated by "|". Do NOT include Telegram.
    * **Summary:** A brief (2-3 sentences) professional summary based on the 'Position/Headline' and 'About Me' data. Start with the Position/Headline.
    * **Experience:** Section heading "Experience". List each entry chronologically (newest first). For each entry, include: `**Role** at **Company** (Month Year - Month Year or Present)`. Below this, list points from the provided description using bullets (* or -), ensuring they start with action verbs.
    * **Education:** Section heading "Education". List each entry chronologically (newest first). For each entry, include: `**Institution** - Degree (Month Year - Month Year or Present)`. Below this, add bullets for *Field of Study: ...*, *Relevant Courses: ...*, and description points if provided.
    * **Skills:** Section heading "Skills". List the provided skills, attempting to categorize them logically (e.g., Languages, Backend, Frontend, Databases, Cloud, Tools). Use simple comma separation or bullet points within categories.
4.  **Output Format:** **Strictly Markdown**. Use Markdown level 1 heading (#) ONLY for the Name. Use level 2 headings (##) for section titles (Summary, Experience, Education, Skills). Use bullet points (* or -) for items within Experience and Education descriptions. Use bold text (**text**) for emphasis on Name, Role, Company, Institution, Degree.

**User Data to Use:**
---
Name: {profile_data['name']}
Position/Headline: {profile_data['position']}
City/Location: {profile_data['city']}
Email: {profile_data['email']}
LinkedIn URL: {profile_data['linkedin']}
GitHub URL: {profile_data['github']}
About Me (for Summary): {profile_data['about_me']}

Experience Entries (process each entry):
{profile_data['experience_entries']}

Education Entries (process each entry):
{profile_data['education_entries']}

Skills List (comma-separated):
{profile_data['skills_list']}
---

Generate ONLY the resume text in English Markdown format according to the structure and format specified. Start directly with the name (# Name). Do not add any introductory or concluding text.
"""
    # Используем .join() для сборки, чтобы избежать проблем с f-string в Python 3.11+
    # (Хотя в этом промпте уже нет сложных выражений, оставим для надежности)
    return "\n".join(line.strip() for line in prompt.splitlines() if line.strip())


# --- Хелпер: Вызов OpenAI API (Async) ---
# (Функция generate_text_via_openai остается такой же, как в моем предыдущем ответе)
async def generate_text_via_openai(prompt: str) -> str:
    # ... (код функции без изменений) ...
    if not settings.OPENAI_API_KEY:
        logger.error("OpenAI API key is not configured.")
        raise HTTPException(status_code=500, detail="AI service is not configured (API key missing).")

    logger.info("Sending request to OpenAI API...")
    try:
        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model="gpt-4o", # Можно попробовать "gpt-4o-mini" - дешевле и быстрее
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.5,
            n=1,
            stop=None
        )
        # Проверка наличия ответа
        if not response.choices or not response.choices[0].message or not response.choices[0].message.content:
             logger.error("OpenAI API returned an empty or invalid response.")
             raise HTTPException(status_code=500, detail="AI service returned an empty response.")

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
        logger.exception(f"OpenAI API call failed: {e}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Failed to communicate with AI service.")


# --- Основной API Эндпоинт (ОБНОВЛЕННЫЙ) ---
@router.post(
    "/generate-ai",
    summary="Generate Resume via AI (returns HTML in English)",
    response_model=Dict[str, str]
)
async def generate_ai_resume_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db) # Передаем сессию для сбора данных
):
    """
    Собирает обновленные данные профиля, генерирует текст резюме через OpenAI
    (на английском в Markdown), конвертирует в HTML и возвращает.
    """
    try:
        # 1. Собрать обновленные данные профиля
        profile_data = get_user_profile_data(current_user, db)

        # 2. Создать промпт на английском
        prompt = create_resume_prompt_en(profile_data)

        # 3. Вызвать AI для генерации текста (Markdown)
        markdown_resume = await generate_text_via_openai(prompt)

        # ===> ВОТ ЗДЕСЬ ДОБАВЬТЕ ЛОГГИРОВАНИЕ <===
        logger.info("--- Generated Markdown Start ---")
        logger.info(f"\n{markdown_resume}\n")  # Выводим Markdown в лог
        logger.info("--- Generated Markdown End ---")
        # ==========================================

        # 4. Конвертировать Markdown в HTML
        try:
            # Добавляем расширения для лучшей поддержки Markdown
            html_resume = markdown.markdown(markdown_resume, extensions=['extra', 'nl2br', 'tables', 'fenced_code'])
        except Exception as e:
            logger.exception(f"Markdown to HTML conversion failed for user {current_user.username}: {e}")
            # В случае ошибки конвертации, возвращаем Markdown в <pre> теге
            html_resume = f"<p><strong>Error formatting resume. Raw Markdown content:</strong></p><pre>{markdown_resume}</pre>"

        # 5. Вернуть результат
        return {"resume_html": html_resume}

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception(f"Error in generate_ai_resume_endpoint for user {current_user.username}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate AI resume.")

# --- /Основной API Эндпоинт ---

# --- НОВЫЙ ЭНДПОИНТ (Generate PDF) ---
@router.post( # Используем POST, т.к. это запускает генерацию
    "/generate-ai-pdf",
    summary="Generate AI Resume and return as PDF download",
    response_class=StreamingResponse # Важно указать класс ответа
)
async def generate_ai_resume_pdf_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Генерирует AI резюме (Markdown -> HTML), затем конвертирует HTML в PDF
    и возвращает PDF для скачивания.
    """
    logger.info(f"Received request to generate AI resume PDF for user: {current_user.username}")
    try:
        # 1. Собрать данные профиля
        profile_data = get_user_profile_data(current_user, db)

        # 2. Создать промпт на английском
        prompt = create_resume_prompt_en(profile_data)

        # 3. Вызвать AI для генерации текста (Markdown)
        markdown_resume = await generate_text_via_openai(prompt)

        # 4. Конвертировать Markdown в HTML
        try:
            # Используем те же расширения для консистентности
            html_resume = markdown.markdown(markdown_resume, extensions=['extra', 'nl2br', 'tables', 'fenced_code'])
            # Добавим базовую HTML структуру для PDF
            full_html_content = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><title>Resume {profile_data['name']}</title></head>
            <body>{html_resume}</body>
            </html>
            """
        except Exception as e:
            logger.exception(f"Markdown to HTML conversion failed for PDF generation (user: {current_user.username}): {e}")
            raise HTTPException(status_code=500, detail="Failed to format resume content for PDF.")

        # 5. Конвертировать HTML в PDF с помощью сервиса
        # base_url может быть полезен, если в HTML есть относительные ссылки на изображения/стили
        pdf_bytes = PDFService.generate_pdf(html_content=full_html_content, base_url=str(settings.SERVER_HOST) if hasattr(settings, 'SERVER_HOST') else None)

        # 6. Подготовить ответ для скачивания PDF
        buffer = BytesIO(pdf_bytes)
        filename = f"resume_{current_user.username}_ai.pdf" # Имя файла для скачивания
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"'
        }

        logger.info(f"Successfully generated PDF for user {current_user.username}. Filename: {filename}")
        # Возвращаем StreamingResponse для файла
        return StreamingResponse(buffer, media_type="application/pdf", headers=headers)

    except HTTPException as e:
        # Логгируем и перебрасываем известные ошибки
        logger.error(f"HTTP error during AI PDF resume generation for {current_user.username}: {e.detail}")
        raise e
    except Exception as e:
        # Логгируем другие ошибки
        logger.exception(f"Unexpected error generating AI PDF resume for user {current_user.username}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate AI resume PDF.")

# --- /НОВЫЙ ЭНДПОИНТ ---