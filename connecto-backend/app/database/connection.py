from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://namazbek:admin1234@localhost:5433/connecto_db"

# Создаем асинхронный движок
engine = create_async_engine(DATABASE_URL, future=True, echo=True)

# Создаем фабрику сессий
async_session = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Получение сессии
async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session
