from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api.router_page import router as router_page
from app.api.router_socket import router as router_socket
app = FastAPI()

# Подключаем папку со статическими файлами
app.mount('/static', StaticFiles(directory='app/static'), 'static')

# Регистрируем маршруты
app.include_router(router_socket)
app.include_router(router_page)
