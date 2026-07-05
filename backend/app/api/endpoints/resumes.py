from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.infrastructure.database import get_db
from app.infrastructure.repositories import ResumeRepository
from app.api.endpoints.auth import get_current_user_id
from pydantic import BaseModel
import uuid
import json

router = APIRouter()

class ResumeListItem(BaseModel):
    id: uuid.UUID
    name: str
    is_primary: bool
    base_file_path: str
    created_at: str

    class Config:
        from_attributes = True

@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_resume(
    name: str = Form(...),
    is_primary: bool = Form(False),
    file: UploadFile = File(...),
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # Enforce basic sizes and extensions guidelines matching PRD docs
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
         raise HTTPException(
             status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
             detail="Underlying file size limit exceeded. Maximum size: 10MB."
         )
         
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
             status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
             detail="Unsupported media format. Only PDF files can be parsed."
         )

    # In a full run, we would save to an S3-compatible structure. For now, simulate storage path:
    simulated_save_path = f"/uploads/resumes/{uuid.uuid4()[:8]}_{file.filename}"
    
    # Mock some parsed details context structure
    mock_parsed_cv = {
        "text_content": "Extracted resume lines showing Python development experience.",
        "skills": ["Python", "Kubernetes", "AWS", "FastAPI"],
        "education": [{"degree": "Bachelor of Science in Computer Science", "school": "State University"}],
        "experience": [{"company_name": "DevCorp", "role": "Software Engineer"}]
    }

    repo = ResumeRepository(db)
    resume = repo.create(
        user_id=user_id,
        name=name,
        file_path=simulated_save_path,
        parsed_content=mock_parsed_cv,
        is_primary=is_primary
    )
    
    return {
        "id": resume.id,
        "name": resume.name,
        "is_primary": resume.is_primary,
        "file_url": resume.base_file_path,
        "parsed_status": "COMPLETED",
        "created_at": resume.created_at.isoformat()
    }

@router.get("", response_model=list)
def get_user_resumes(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    repo = ResumeRepository(db)
    resumes = repo.list_by_user(user_id)
    return [
        {
            "id": r.id,
            "name": r.name,
            "is_primary": r.is_primary,
            "file_url": r.base_file_path,
            "created_at": r.created_at.isoformat()
        } for r in resumes
    ]
