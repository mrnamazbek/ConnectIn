# Пример функции вызова API (async)
import openai
from app.core.config import settings # Ваш config
from fastapi import HTTPException
import logging # Добавляем логгер

logger = logging.getLogger(__name__)
openai.api_key = settings.OPENAI_API_KEY # Загружаем ключ из настроек

async def generate_resume_text_openai(profile_data: dict) -> str:
    # Формирование промпта (лучше использовать Jinja2 для сложных промптов)
    prompt = f"""Ты — профессиональный составитель резюме... (ВЕСЬ ПРОМПТ С ПОДСТАНОВКОЙ ДАННЫХ ИЗ profile_data) ... Формат вывода: Строго Markdown."""
    logger.info(f"Generating resume for: {profile_data.get('name')}. Prompt length: {len(prompt)}")

    try:
        response = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo", # Или gpt-4, если доступен и нужен
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500, # Лимит ответа (подберите)
            temperature=0.6, # Баланс между предсказуемостью и креативностью
            n=1, # Количество вариантов ответа
            stop=None # Условия остановки генерации
        )

        generated_text = response.choices[0].message.content.strip()
        logger.info(f"Resume generated successfully for: {profile_data.get('name')}. Response length: {len(generated_text)}")
        return generated_text

    except openai.error.RateLimitError as e:
        logger.warning(f"OpenAI Rate Limit Exceeded: {e}")
        raise HTTPException(status_code=429, detail="AI service rate limit exceeded. Please try again later.")
    except openai.error.AuthenticationError as e:
        logger.error(f"OpenAI Authentication Error: {e}. Check API Key.")
        raise HTTPException(status_code=500, detail="AI service authentication failed.")
    except Exception as e:
        logger.exception(f"OpenAI API call failed for user {profile_data.get('name')}: {e}")
        raise HTTPException(status_code=503, detail="Failed to generate resume using AI service.")