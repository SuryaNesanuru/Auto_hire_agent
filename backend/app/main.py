from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.endpoints import auth, resumes, jobs
from app.infrastructure.database import Base, engine

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to dashboard origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# App routes injection
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(resumes.router, prefix=f"{settings.API_V1_STR}/resumes", tags=["Resumes"])
app.include_router(jobs.router, prefix=f"{settings.API_V1_STR}/jobs", tags=["Jobs"])

@app.get("/")
def get_root_status():
    return {
        "status": "active",
        "service": settings.PROJECT_NAME,
        "mode": settings.DEPLOY_MODE
    }
