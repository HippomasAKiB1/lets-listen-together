from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from app.database import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse
from app.auth.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check username uniqueness
    result = await db.execute(select(User).where(User.username == body.username))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Hash password and create user
    hashed = pwd_context.hash(body.password)
    user = User(username=body.username, password_hash=hashed)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return RegisterResponse(user_id=user.user_id, username=user.username)


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()

    if not user or not pwd_context.verify(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token({"sub": user.user_id, "username": user.username})
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.user_id,
        username=user.username,
    )
