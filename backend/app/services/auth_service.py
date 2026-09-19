"""Authentication service — registration and login logic."""

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import hash_password, verify_password, create_access_token
from app.repositories.user_repository import UserRepository
from app.utils.exceptions import UserAlreadyExistsError, UnauthorizedError


class AuthService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def register(self, email: str, password: str) -> dict:
        """Register a new user."""
        existing = await self.repo.get_by_email(email)
        if existing:
            raise UserAlreadyExistsError()

        hashed = hash_password(password)
        user = await self.repo.create(email=email, password_hash=hashed)

        token = create_access_token(str(user.id))
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": str(user.id),
        }

    async def login(self, email: str, password: str) -> dict:
        """Authenticate a user and return a JWT."""
        user = await self.repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedError("Invalid email or password")

        token = create_access_token(str(user.id))
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": str(user.id),
        }
