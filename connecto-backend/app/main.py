from fastapi import FastAPI
from app.api import auth, projects, teams, users

app = FastAPI()

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(teams.router, prefix="/teams", tags=["Teams"])
app.include_router(users.router, prefix="/users", tags=["Users"])
