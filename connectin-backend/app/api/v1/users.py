"""
Этот модуль управляет операциями над пользователями (User):
- Получение списка всех пользователей.
- Просмотр и обновление профиля текущего пользователя.
- Удаление своей учетной записи.
"""
#fix
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Union

from app.database.connection import get_db
from app.models.user import User, Education, Experience
from app.models.skill import Skill
from app.models.save import SavedPost
from app.models.post import Post
from app.schemas.user import UserOut, UserUpdate, EducationCreate, ExperienceCreate, EducationUpdate, ExperienceUpdate, EducationOut, ExperienceOut, AvatarUpdate, StatusUpdate, BasicInfoUpdate, SocialLinksUpdate, ContactInfoUpdate, UserOutWithToken
from app.schemas.skill import SkillOut
from app.api.v1.auth import get_current_user, create_access_token
from app.core.config import settings
from app.utils.s3 import s3_service
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.get("/", response_model=List[UserOut], summary="Получить список всех пользователей")
def read_users(db: Session = Depends(get_db)):
    """
    Возвращает список всех зарегистрированных пользователей.
    """
    users = db.query(User).all()
    return users

@router.get("/me", response_model=UserOut, summary="Мой профиль (требуется токен)")
def read_own_profile(current_user: User = Depends(get_current_user)):
    """
    Возвращает данные текущего пользователя.
    """
    return current_user

@router.get("/search", response_model=List[UserOut], summary="Поиск пользователей")
def search_users(
    query: str,
    db: Session = Depends(get_db)
):
    if not query:
        return []

    users = db.query(User).filter(
        (User.username.ilike(f"%{query}%")) |
        (User.email.ilike(f"%{query}%"))
    ).all()

    return users

@router.get("/{user_id}", response_model=UserOut, summary="Профиль конкретного пользователя")
def read_user(user_id: int, db: Session = Depends(get_db)):
    """
    Возвращает данные пользователя по его ID.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

@router.put("/me", response_model=Union[UserOut, UserOutWithToken], summary="Обновить свой профиль")
def update_own_profile(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Позволяет пользователю обновлять данные профиля:
    - Базовые данные (имя, фамилия, город, должность)
    - Контактная информация (email, username)
    - Социальные ссылки (GitHub, LinkedIn, Telegram)
    - Аватар (URL изображения)
    - Статус пользователя
    
    Если обновляется email или username, в ответе также возвращается новый токен доступа.
    """
    # Отслеживаем, изменился ли email или username
    identity_changed = False
    
    # Проверка уникальности email
    if user_data.email and user_data.email != current_user.email:
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Этот email уже используется другим пользователем."
            )
        identity_changed = True
    
    # Проверка уникальности username
    if user_data.username and user_data.username != current_user.username:
        existing_user = db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Это имя пользователя уже занято."
            )
        identity_changed = True
    
    # Валидация полей
    if user_data.first_name and len(user_data.first_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Имя должно содержать минимум 2 символа."
        )
    
    if user_data.last_name and len(user_data.last_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Фамилия должна содержать минимум 2 символа."
        )
    
    # Получаем данные из запроса, исключая пустые поля
    update_data = user_data.dict(exclude_unset=True)
    
    # Обработка URL полей
    for field in ['github', 'linkedin', 'telegram']:
        if field in update_data:
            # Если поле пустое или None, устанавливаем его как None
            if update_data[field] is None or update_data[field] == "":
                update_data[field] = None
            # Если поле не пустое, проверяем что это валидный URL
            elif update_data[field]:
                if not update_data[field].startswith(('http://', 'https://')):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"URL для {field} должен начинаться с http:// или https://"
                    )
    
    # Обновляем каждое поле
    for key, value in update_data.items():
        # Проверяем, что поле существует в модели User
        if hasattr(current_user, key):
            setattr(current_user, key, value)
    
    try:
        db.commit()
        db.refresh(current_user)
        
        # Если изменился email или username, нужно обновить токен
        if identity_changed:
            access_token = create_access_token(current_user)
            
            # Создаем ответ вручную, так как функция from_orm в модели может вызывать ошибки
            user_dict = {
                "id": current_user.id,
                "email": current_user.email,
                "username": current_user.username,
                "first_name": current_user.first_name,
                "last_name": current_user.last_name,
                "city": current_user.city,
                "position": current_user.position,
                "github": current_user.github,
                "linkedin": current_user.linkedin,
                "telegram": current_user.telegram,
                "avatar_url": current_user.avatar_url,
                "skills": [{"id": skill.id, "name": skill.name} for skill in current_user.skills],
                "projects": [{"id": project.id, "name": project.name, "description": project.description} for project in current_user.projects],
                "education": [{"id": edu.id, "institution": edu.institution, "degree": edu.degree, "start_year": edu.start_year, "end_year": edu.end_year} for edu in current_user.education],
                "experience": [{"id": exp.id, "company": exp.company, "role": exp.role, "start_year": exp.start_year, "end_year": exp.end_year} for exp in current_user.experience],
                "status": current_user.status,
                "access_token": access_token,
                "token_type": "bearer"
            }
            
            return user_dict
        
        return current_user
    except Exception as e:
        db.rollback()
        # Добавляем логирование для отладки
        import logging
        logging.error(f"Error updating profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при обновлении профиля: {str(e)}"
        )

# ✅ Add Education Entry
@router.post("/me/education", summary="Добавить образование", response_model=EducationOut)
def add_education(
    education_data: EducationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_education = Education(user_id=current_user.id, **education_data.dict())
    db.add(new_education)
    db.commit()
    db.refresh(new_education)
    return new_education


# ✅ Update Education Entry
@router.put("/me/education/{education_id}", summary="Обновить запись об образовании", response_model=EducationCreate)
def update_education(
    education_id: int,
    education_data: EducationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    education = db.query(Education).filter(Education.id == education_id, Education.user_id == current_user.id).first()
    if not education:
        raise HTTPException(status_code=404, detail="Запись об образовании не найдена")

    for key, value in education_data.dict(exclude_unset=True).items():
        setattr(education, key, value)

    db.commit()
    db.refresh(education)
    return education


# ✅ Delete Education Entry
@router.delete("/me/education/{education_id}", summary="Удалить запись об образовании")
def delete_education(
    education_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    education = db.query(Education).filter(Education.id == education_id, Education.user_id == current_user.id).first()
    if not education:
        raise HTTPException(status_code=404, detail="Запись об образовании не найдена")

    db.delete(education)
    db.commit()
    return {"detail": "Образование удалено"}


# ✅ Add Experience Entry
@router.post("/me/experience", summary="Добавить опыт работы", response_model=ExperienceOut)
def add_experience(
    experience_data: ExperienceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_experience = Experience(user_id=current_user.id, **experience_data.dict())
    db.add(new_experience)
    db.commit()
    db.refresh(new_experience)
    return new_experience


# ✅ Update Experience Entry
@router.put("/me/experience/{experience_id}", summary="Обновить запись о работе", response_model=ExperienceCreate)
def update_experience(
    experience_id: int,
    experience_data: ExperienceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    experience = db.query(Experience).filter(Experience.id == experience_id, Experience.user_id == current_user.id).first()
    if not experience:
        raise HTTPException(status_code=404, detail="Запись о работе не найдена")

    for key, value in experience_data.dict(exclude_unset=True).items():
        setattr(experience, key, value)

    db.commit()
    db.refresh(experience)
    return experience


# ✅ Delete Experience Entry
@router.delete("/me/experience/{experience_id}", summary="Удалить запись о работе")
def delete_experience(
    experience_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    experience = db.query(Experience).filter(Experience.id == experience_id, Experience.user_id == current_user.id).first()
    if not experience:
        raise HTTPException(status_code=404, detail="Запись о работе не найдена")

    db.delete(experience)
    db.commit()
    return {"detail": "Опыт работы удален"}

@router.post("/me/skills", response_model=SkillOut, status_code=status.HTTP_201_CREATED, summary="Добавить навык пользователю")
def add_skill_to_user(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Добавляет навык текущему пользователю по ID навыка.
    """
    # Проверяем существование навыка
    skill = db.query(Skill).get(skill_id)
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Навык не найден"
        )
    
    # Проверяем, что навык еще не добавлен
    if skill in current_user.skills:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Навык уже добавлен"
        )
    
    # Добавляем связь
    current_user.skills.append(skill)
    db.commit()
    
    return skill

@router.delete("/me/skills/{skill_id}", summary="Удалить навык у пользователя")
def remove_skill_from_user(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Удаляет навык у текущего пользователя по ID навыка.
    """
    # Ищем навык среди добавленных у пользователя
    skill = next((s for s in current_user.skills if s.id == skill_id), None)
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Навык не найден у пользователя"
        )
    
    # Удаляем связь
    current_user.skills.remove(skill)
    db.commit()
    
    return {"message": "Навык успешно удален"}

@router.get("/me/skills", response_model=List[SkillOut], summary="Получить навыки пользователя")
def get_user_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Возвращает список всех навыков текущего пользователя.
    """
    return current_user.skills

@router.delete("/me", summary="Удалить свою учётную запись")
def delete_own_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Позволяет пользователю удалить свою учетную запись.
    """
    db.delete(current_user)
    db.commit()
    return {"detail": "Ваш аккаунт был удалён"}

@router.patch("/me/avatar", response_model=UserOut)
async def update_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update user avatar with file upload.
    """
    try:
        # Upload new avatar to S3
        avatar_url = await s3_service.upload_avatar(file, current_user.id)
        
        # Store old avatar URL for cleanup
        old_avatar_url = current_user.avatar_url
        
        # Update user's avatar URL
        current_user.avatar_url = avatar_url
        db.commit()
        db.refresh(current_user)
        
        # If there was an old avatar, try to delete it
        if old_avatar_url:
            try:
                # Extract object name from URL
                object_name = old_avatar_url.split(f"{settings.AWS_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/")[-1]
                s3_service.delete_file(object_name)
            except Exception as e:
                logger.error(f"Failed to delete old avatar: {str(e)}")
                # Don't raise error, as the new avatar is already uploaded
        
        return current_user
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error in avatar update: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update avatar"
        )

@router.delete("/me/avatar", response_model=UserOut)
async def delete_avatar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete user's avatar and set it to null.
    """
    try:
        # Store old avatar URL for cleanup
        old_avatar_url = current_user.avatar_url
        
        # Set avatar URL to null
        current_user.avatar_url = None
        db.commit()
        db.refresh(current_user)
        
        # If there was an old avatar, try to delete it from S3
        if old_avatar_url:
            try:
                # Extract object name from URL
                object_name = old_avatar_url.split(f"{settings.AWS_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/")[-1]
                s3_service.delete_file(object_name)
            except Exception as e:
                logger.error(f"Failed to delete old avatar from S3: {str(e)}")
                # Don't raise error, as the avatar URL is already set to null
        
        return current_user
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error in avatar deletion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete avatar"
        )

@router.patch("/me/status", response_model=UserOut, summary="Обновить статус пользователя")
def update_status(
    status_data: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Обновляет статус пользователя.
    Принимает JSON с полем status, содержащим текст статуса.
    """
    current_user.status = status_data.status
    db.commit()
    db.refresh(current_user)
    return current_user

@router.patch("/me/basic-info", response_model=UserOut, summary="Обновить основную информацию")
def update_basic_info(
    basic_info: BasicInfoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Обновляет основную информацию пользователя (имя, фамилия, город, должность).
    """
    # Валидация полей
    if basic_info.first_name and len(basic_info.first_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Имя должно содержать минимум 2 символа."
        )
    
    if basic_info.last_name and len(basic_info.last_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Фамилия должна содержать минимум 2 символа."
        )
    
    # Обновляем поля
    update_data = basic_info.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.patch("/me/social-links", response_model=UserOut, summary="Обновить социальные ссылки")
def update_social_links(
    social_links: SocialLinksUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Обновляет ссылки на социальные профили пользователя (GitHub, LinkedIn, Telegram).
    """
    # Обновляем поля
    update_data = social_links.dict(exclude_unset=True)
    
    # Валидация URL полей
    for field, value in update_data.items():
        # Если поле пустое или None, устанавливаем его как None
        if value is None or value == "":
            setattr(current_user, field, None)
        # Если поле не пустое, проверяем что это валидный URL
        elif value:
            if field == 'telegram':
                # Для Telegram, убираем @ и https:// если они есть
                telegram_username = value.replace('@', '').replace('https://', '').replace('http://', '').replace('t.me/', '')
                setattr(current_user, field, f"https://t.me/{telegram_username}")
            else:
                if not value.startswith(('http://', 'https://')):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"URL для {field} должен начинаться с http:// или https://"
                    )
                setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.patch("/me/contact-info", response_model=Union[UserOut, UserOutWithToken], summary="Обновить контактную информацию")
def update_contact_info(
    contact_info: ContactInfoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Обновляет контактную информацию пользователя (email, username).
    
    Если обновляется email или username, в ответе также возвращается новый токен доступа.
    """
    # Отслеживаем, изменился ли email или username
    identity_changed = False
    
    # Проверка уникальности email
    if contact_info.email and contact_info.email != current_user.email:
        existing_user = db.query(User).filter(User.email == contact_info.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Этот email уже используется другим пользователем."
            )
        identity_changed = True
      ## fix
    # Проверка уникальности username
    if contact_info.username and contact_info.username != current_user.username:
        existing_user = db.query(User).filter(User.username == contact_info.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Это имя пользователя уже занято."
            )
        identity_changed = True
            
    # Валидация полей
    if contact_info.username and len(contact_info.username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Имя пользователя должно содержать минимум 3 символа."
        )
    
    # Обновляем поля
    update_data = contact_info.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    try:
        db.commit()
        db.refresh(current_user)
        
        # Если изменился email или username, нужно обновить токен
        if identity_changed:
            access_token = create_access_token(current_user)
            
            # Создаем ответ вручную, так как функция from_orm в модели может вызывать ошибки
            user_dict = {
                "id": current_user.id,
                "email": current_user.email,
                "username": current_user.username,
                "first_name": current_user.first_name,
                "last_name": current_user.last_name,
                "city": current_user.city,
                "position": current_user.position,
                "github": current_user.github,
                "linkedin": current_user.linkedin,
                "telegram": current_user.telegram,
                "avatar_url": current_user.avatar_url,
                "skills": [{"id": skill.id, "name": skill.name} for skill in current_user.skills],
                "projects": [{"id": project.id, "name": project.name, "description": project.description} for project in current_user.projects],
                "education": [{"id": edu.id, "institution": edu.institution, "degree": edu.degree, "start_year": edu.start_year, "end_year": edu.end_year} for edu in current_user.education],
                "experience": [{"id": exp.id, "company": exp.company, "role": exp.role, "start_year": exp.start_year, "end_year": exp.end_year} for exp in current_user.experience],
                "status": current_user.status,
                "access_token": access_token,
                "token_type": "bearer"
            }
            
            return user_dict
            
        return current_user
    except Exception as e:
        db.rollback()
        # Добавляем логирование для отладки
        import logging
        logging.error(f"Error updating contact info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при обновлении контактной информации: {str(e)}"
        )

@router.get("/me/saved-posts")
def get_saved_posts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    saved_posts = db.query(SavedPost).filter(SavedPost.user_id == current_user.id).join(Post).all()
    return [saved_post.post for saved_post in saved_posts]
