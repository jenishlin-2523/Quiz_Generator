from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Dummy in-memory user store (for testing only)
users = {
    "staff1": {"password": "staffpass", "role": "staff"},
    "student1": {"password": "studentpass", "role": "student"}
}

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(request: LoginRequest):
    user = users.get(request.username)
    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "username": request.username,
        "role": user["role"]
    }
