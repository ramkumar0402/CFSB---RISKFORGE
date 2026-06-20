"""
RISKFORGE — Users & Auth API routes
Registration, login, user listing, and role management.
"""
from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from database import get_db
from auth import register_user, authenticate_user, get_current_user, require_role
from models import UserCreate, UserLogin, UserOut, Token, UserRole

router = APIRouter(prefix="/api/users", tags=["users"])


def _serialize(doc: dict) -> UserOut:
    return UserOut(
        id=str(doc["_id"]),
        name=doc["name"],
        email=doc["email"],
        role=UserRole(doc["role"]),
        status=doc.get("status", "Active"),
        last_active=doc.get("last_active"),
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    return await register_user(payload, db)


@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    return await authenticate_user(payload.email, payload.password, db)


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return _serialize(user)


@router.get("", response_model=List[UserOut])
async def list_users(
    _user: dict = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    cursor = db.users.find({}).sort("created_at", -1)
    return [_serialize(doc) async for doc in cursor]


@router.patch("/{user_id}/role", response_model=UserOut)
async def update_role(
    user_id: str,
    role: UserRole,
    _admin: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    result = await db.users.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": role.value}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return _serialize(result)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    _admin: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
