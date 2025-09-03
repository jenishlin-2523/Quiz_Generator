# db.py

# In-memory storage for quizzes and results
quizzes_db = {}       # key: quiz_id, value: QuizModel
results_db = {}       # key: (student_name, quiz_id), value: QuizResult
