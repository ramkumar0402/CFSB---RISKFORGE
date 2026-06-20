"""
RISKFORGE — Authentication & JWT
JWT-based auth with bcrypt password hashing. Role-based access control.
"""
from __future__ import annotations
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from database import get_db
from models import UserRole, UserCreate, UserOut, Token

# ── Config ──────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_hex(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_TTL_MINUTES", "60"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ── Password helpers ────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── Token helpers ───────────────────────────────────────────────────────────
def create_access_token(subject: str, role: UserRole, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "sub": subject,
        "role": role.value if isinstance(role, UserRole) else role,
        "exp": expire,
        "iat": datetime.utcnow(),
        "iss": "riskforge",
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    """FastAPI dependency — returns the authenticated user doc or raises 401."""
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = await db.users.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_role(*roles: UserRole):
    """Dependency factory — restricts an endpoint to specific roles."""
    async def _check(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in {r.value for r in roles}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user
    return _check


# ── Service methods ─────────────────────────────────────────────────────────
async def register_user(payload: UserCreate, db: AsyncIOMotorDatabase) -> UserOut:
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    doc = {
        "name": payload.name,
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "role": payload.role.value,
        "status": "Active",
        "last_active": datetime.utcnow(),
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return UserOut(
        id=doc["id"],
        name=doc["name"],
        email=doc["email"],
        role=UserRole(doc["role"]),
        status=doc["status"],
        last_active=doc["last_active"],
    )


async def authenticate_user(email: str, password: str, db: AsyncIOMotorDatabase) -> Token:
    user = await db.users.find_one({"email": email.lower()})
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_active": datetime.utcnow()}},
    )
    token = create_access_token(user["email"], UserRole(user["role"]))
    return Token(access_token=token, role=UserRole(user["role"]))
