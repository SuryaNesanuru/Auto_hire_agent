from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.infrastructure.database import get_db
from app.infrastructure.repositories import JobApplicationRepository, ResumeRepository
from app.api.endpoints.auth import get_current_user_id
from app.domain.ai_service import AIService
from pydantic import BaseModel
import uuid

router = APIRouter()

class JobParseRequest(BaseModel):
    job_url: str
    raw_html: str

class TestMatchRequest(BaseModel):
    resume_id: uuid.UUID
    job_id: uuid.UUID

@router.post("/parse", status_code=status.HTTP_200_OK)
async def parse_job_posting(
    payload: JobParseRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    if not payload.job_url:
         raise HTTPException(
             status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
             detail="Request payload must contain a valid job url."
         )

    # If raw HTML is empty, generic boilerplate, or has minimal length, fetch server-side
    html_content = payload.raw_html
    if not html_content or "Mock HTML content" in html_content or len(html_content) < 300:
        fetched_content = await AIService.fetch_job_html(payload.job_url)
        if fetched_content:
            html_content = fetched_content
        else:
            # Keep payload raw html if fetch fails completely
            html_content = payload.raw_html or "<html><body>Job Posting URL Ingestion</body></html>"

    # 1. Trigger AI parsing heuristics
    parsed_job = await AIService.parse_job_html(html_content)
    
    # 2. Check user resumes for matching
    resume_repo = ResumeRepository(db)
    resumes = resume_repo.list_by_user(user_id)
    primary_resume = next((r for r in resumes if r.is_primary), None) or (resumes[0] if resumes else None)

    match_score = 75.0
    skills_data = {
        "matched": [],
        "missing": [],
        "alignment_summary": "Upload a resume on the dashboard to calculate custom match percentages."
    }

    if primary_resume and isinstance(primary_resume.parsed_content, dict):
        resume_skills = primary_resume.parsed_content.get("skills", [])
        match_score, skills_data = await AIService.compute_match_score(
            resume_skills,
            payload.raw_html
        )

    # 3. Save to database
    repo = JobApplicationRepository(db)
    app = repo.create(
        user_id=user_id,
        resume_id=primary_resume.id if primary_resume else None,
        job_title=parsed_job.get("job_title", "Software Engineer"),
        company_name=parsed_job.get("company_name", "Target Corp"),
        job_url=payload.job_url,
        job_description=payload.raw_html[:3000],  # Save core DOM snippet
        salary_range=parsed_job.get("salary_range", "$110k - $140k"),
        match_score=match_score
    )

    return {
        "job_id": app.id,
        "job_title": app.job_title,
        "company_name": app.company_name,
        "requirements": parsed_job.get("requirements", []),
        "match_score": float(app.match_score) if app.match_score else None,
        "salary_range": app.salary_range,
        "skills_overlap": skills_data
    }

@router.post("/match", status_code=status.HTTP_200_OK)
async def calculate_match_score(
    payload: TestMatchRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    resume_repo = ResumeRepository(db)
    job_repo = JobApplicationRepository(db)

    resume = resume_repo.get_by_id(payload.resume_id)
    job = job_repo.get_by_id(payload.job_id)

    if not resume or not job:
         raise HTTPException(
             status_code=status.HTTP_404_NOT_FOUND,
             detail="Resume or Job record matching parameters not found."
         )

    skills = resume.parsed_content.get("skills", [])
    score, breakdown = await AIService.compute_match_score(skills, job.job_description)

    # Update database entry
    job.match_score = score
    db.commit()

    return {
        "similarity_score": score / 100.0,
        "skills_overlap": {
            "matched": breakdown["matched"],
            "missing": breakdown["missing"]
        },
        "alignment_summary": breakdown["alignment_summary"]
    }

@router.get("", status_code=status.HTTP_200_OK)
def list_active_applications(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    repo = JobApplicationRepository(db)
    apps = repo.list_by_user(user_id)
    return [
        {
            "id": str(app.id),
            "jobTitle": app.job_title,
            "companyName": app.company_name,
            "jobUrl": app.job_url,
            "status": app.status.value,
            "matchScore": float(app.match_score) if app.match_score else None,
            "salaryRange": app.salary_range,
            "created_at": app.created_at.isoformat()
        } for app in apps
    ]
