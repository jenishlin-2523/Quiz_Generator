from pydantic import BaseModel, Field
from typing import List
from uuid import uuid4

class QuestionModel(BaseModel):
    question: str
    options: List[str]
    answer: str  # Correct answer

class QuizModel(BaseModel):
    quiz_id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    created_by: str  # staff username
    questions: List[QuestionModel]
