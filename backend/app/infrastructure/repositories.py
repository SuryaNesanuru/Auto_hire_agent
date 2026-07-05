from sqlalchemy.orm import Session
from app.domain.models import User, UserSetting, Resume, JobApplication, ApplicationEvent, ApplicationStatus
from typing import Optional, List, Dict
import uuid

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email.lower()).first()

    def create(self, email: str, password_hash: str) -> User:
        user = User(email=email.lower(), password_hash=password_hash)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        # Initialize default user settings as well
        settings = UserSetting(user_id=user.id)
        self.db.add(settings)
        self.db.commit()
        
        return user


class ResumeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, resume_id: uuid.UUID) -> Optional[Resume]:
        return self.db.query(Resume).filter(
            Resume.id == resume_id, 
            Resume.is_deleted == False
        ).first()

    def list_by_user(self, user_id: uuid.UUID) -> List[Resume]:
        return self.db.query(Resume).filter(
            Resume.user_id == user_id, 
            Resume.is_deleted == False
        ).all()

    def create(self, user_id: uuid.UUID, name: str, file_path: str, parsed_content: dict, is_primary: bool = False) -> Resume:
        if is_primary:
            # Shift existing primary references off
            self.db.query(Resume).filter(
                Resume.user_id == user_id, 
                Resume.is_primary == True
            ).update({"is_primary": False})

        resume = Resume(
            user_id=user_id,
            name=name,
            base_file_path=file_path,
            parsed_content=parsed_content,
            is_primary=is_primary
        )
        self.db.add(resume)
        self.db.commit()
        self.db.refresh(resume)
        return resume

    def delete(self, resume_id: uuid.UUID) -> bool:
        resume = self.get_by_id(resume_id)
        if resume:
            resume.is_deleted = True
            self.db.commit()
            return True
        return False


class JobApplicationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, app_id: uuid.UUID) -> Optional[JobApplication]:
        return self.db.query(JobApplication).filter(
            JobApplication.id == app_id, 
            JobApplication.is_deleted == False
        ).first()

    def list_by_user(self, user_id: uuid.UUID, status: Optional[str] = None) -> List[JobApplication]:
        query = self.db.query(JobApplication).filter(
            JobApplication.user_id == user_id, 
            JobApplication.is_deleted == False
        )
        if status:
            query = query.filter(JobApplication.status == status)
        return query.all()

    def create(self, user_id: uuid.UUID, resume_id: Optional[uuid.UUID], job_title: str, company_name: str, job_url: str, job_description: str, salary_range: Optional[str] = None, match_score: Optional[float] = None) -> JobApplication:
        app = JobApplication(
            user_id=user_id,
            resume_id=resume_id,
            job_title=job_title,
            company_name=company_name,
            job_url=job_url,
            job_description=job_description,
            salary_range=salary_range,
            match_score=match_score,
            status=ApplicationStatus.DISCOVERED
        )
        self.db.add(app)
        self.db.commit()
        self.db.refresh(app)

        # Emit status event history entry
        event = ApplicationEvent(
            application_id=app.id,
            event_type="APPLICATION_CREATED",
            new_status=ApplicationStatus.DISCOVERED,
            payload={"message": "Initial discovery record compiled."}
        )
        self.db.add(event)
        self.db.commit()

        return app

    def update_status(self, app_id: uuid.UUID, new_status: ApplicationStatus, payload: Optional[dict] = None) -> Optional[JobApplication]:
        app = self.get_by_id(app_id)
        if not app:
            return None
        
        old_status = app.status
        app.status = new_status
        self.db.commit()
        self.db.refresh(app)

        event = ApplicationEvent(
            application_id=app.id,
            event_type="STATUS_CHANGED",
            previous_status=old_status,
            new_status=new_status,
            payload=payload
        )
        self.db.add(event)
        self.db.commit()
        return app
