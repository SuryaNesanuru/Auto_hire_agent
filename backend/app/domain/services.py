from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError
from typing import Optional, Dict
from app.config import settings
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

import bcrypt

class CryptoService:
    @staticmethod
    def get_password_hash(password: str) -> str:
        # Generate salt and hash using bcrypt directly
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            return bcrypt.checkpw(
                plain_password.encode('utf-8'), 
                hashed_password.encode('utf-8')
            )
        except Exception:
            return False

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
        return encoded_jwt

    @staticmethod
    def decode_access_token(token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
            return payload
        except JWTError:
            return None


class ColumnEncryptor:
    """
    Encrypts details using AES-GCM-256 for secure DB store elements.
    """
    def __init__(self, key_hex: Optional[str] = None):
        hex_str = key_hex or settings.DATABASE_AES_ENCRYPTION_KEY
        self.key = bytes.fromhex(hex_str)
        self.aesgcm = AESGCM(self.key)

    def encrypt(self, plain_text: str) -> bytes:
        if not plain_text:
            return b""
        nonce = os.urandom(12)
        encrypted_bytes = self.aesgcm.encrypt(nonce, plain_text.encode('utf-8'), None)
        return nonce + encrypted_bytes

    def decrypt(self, encrypted_bytes: bytes) -> str:
        if not encrypted_bytes:
            return ""
        nonce = encrypted_bytes[:12]
        payload = encrypted_bytes[12:]
        decrypted_bytes = self.aesgcm.decrypt(nonce, payload, None)
        return decrypted_bytes.decode('utf-8')
