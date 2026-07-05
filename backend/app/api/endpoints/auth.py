from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.infrastructure.database import get_db
from app.infrastructure.repositories import UserRepository
from app.domain.services import CryptoService
from pydantic import BaseModel, EmailStr
import uuid

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from typing import Optional

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")
security_bearer = HTTPBearer(auto_error=False)

class UserRegister(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> uuid.UUID:
    if settings.DEPLOY_MODE == "DEV" and (not credentials or not credentials.credentials):
        repo = UserRepository(db)
        dev_email = "developer@autohire.ai"
        dev_user = repo.get_by_email(dev_email)
        if not dev_user:
            hashed_pwd = CryptoService.get_password_hash("DevPassword999")
            dev_user = repo.create(dev_email, hashed_pwd)
        return dev_user.id

    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = CryptoService.decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id_str: str = payload.get("sub")
    if not user_id_str:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier",
        )
    return uuid.UUID(user_id_str)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    existing_user = repo.get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    hashed_pwd = CryptoService.get_password_hash(user_data.password)
    user = repo.create(user_data.email, hashed_pwd)
    return {"id": user.id, "email": user.email, "message": "User registered successfully."}


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_email(form_data.username)
    if not user or not CryptoService.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email address or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = CryptoService.create_access_token(data={"sub": str(user.id), "role": "Candidate"})
    # Expires in matches seconds configuration from JWT settings
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 7200
    }
