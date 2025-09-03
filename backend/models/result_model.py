from pydantic import BaseModel
from typing import List

class AnswerSubmission(BaseModel):
    question: str
    selected_option: str

class EvaluatedAnswer(BaseModel):
    question: str
    selected_option: str
    correct_option: str
    is_correct: bool

class QuizResult(BaseModel):
    student_name: str
    quiz_id: str
    results: List[EvaluatedAnswer]
    total_correct: int
    total_wrong: int
