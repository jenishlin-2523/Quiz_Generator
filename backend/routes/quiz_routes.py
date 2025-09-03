from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from utils.decorators import staff_required, student_required
from services.quiz_service import generate_quiz_from_pdf, get_latest_quiz
from database.mongo import quizzes_collection, quiz_results_collection
from bson import ObjectId
from datetime import datetime

quiz_bp = Blueprint("quiz", __name__)

# ---------------- STAFF UPLOAD QUIZ ----------------
@quiz_bp.route("/staff/quiz/upload", methods=["POST"])
@staff_required
def staff_upload_quiz():
    if 'pdf' not in request.files:
        return jsonify({"message": "No PDF uploaded"}), 400
    
    pdf_file = request.files['pdf']
    course_id = request.form.get("course_id")
    identity = get_jwt_identity()

    if not course_id:
        return jsonify({"message": "Course ID is required"}), 400
    
    try:
        quiz = generate_quiz_from_pdf(pdf_file, created_by=identity, course_id=course_id)
        return jsonify({
            "message": "Quiz generated successfully!",
            "quiz": quiz["questions"],
            "quiz_id": quiz["quiz_id"]
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"message": str(e)}), 500


# ---------------- STUDENT GET LATEST QUIZ ----------------
@quiz_bp.route("/student/quiz/upload/get", methods=["GET"])
@student_required
def student_get_quiz():
    quiz = get_latest_quiz()
    if not quiz:
        return jsonify({"message": "No quiz available"}), 404
    
    # Sanitize questions before sending (remove answers)
    sanitized_questions = []
    for q in quiz.get("questions", []):
        q_copy = q.copy()
        q_copy.pop("answer", None)  # Remove the answer
        q_copy["id"] = str(quiz["_id"]) + "_" + str(quiz.get("questions", []).index(q)) # Add a unique question ID
        sanitized_questions.append(q_copy)
    
    return jsonify({"questions": sanitized_questions}), 200


# ---------------- STUDENT GET QUIZ LIST ----------------
@quiz_bp.route("/student/quizzes", methods=["GET"])
@student_required
def student_get_quizzes():
    course_id = request.args.get("course_id")
    query = {}
    if course_id:
        query["course_id"] = course_id

    quizzes_cursor = quizzes_collection.find(query).sort("_id", -1)

    quizzes = []
    for quiz in quizzes_cursor:
        quizzes.append({
            "quiz_id": str(quiz["_id"]),
            "course_id": quiz.get("course_id"),
            "questions_count": len(quiz.get("questions", [])),
            "title": quiz.get("title", "Untitled Quiz"),
            "description": quiz.get("description", ""),
        })

    return jsonify({"quizzes": quizzes}), 200


# ---------------- GET QUIZ BY ID ----------------
@quiz_bp.route("/student/quiz/<quiz_id>", methods=["GET"])
@student_required
def get_quiz_by_id(quiz_id):
    try:
        obj_id = ObjectId(quiz_id)
    except Exception:
        return jsonify({"message": "Invalid quiz ID format"}), 400

    quiz = quizzes_collection.find_one({"_id": obj_id})
    if not quiz:
        return jsonify({"message": "Quiz not found"}), 404
    
    questions = quiz.get("questions", [])
    sanitized_questions = []
    for q in questions:
        q_copy = q.copy()
        q_copy.pop("answer", None) # Remove the answer before sending
        q_copy["question_id"] = str(questions.index(q)) # Use index as a simple unique ID
        sanitized_questions.append(q_copy)

    return jsonify({"questions": sanitized_questions}), 200


# ---------------- SUBMIT QUIZ ANSWERS ----------------
@quiz_bp.route("/student/quiz/<quiz_id>/submit", methods=["POST"])
@student_required
def submit_quiz_answers(quiz_id):
    try:
        obj_id = ObjectId(quiz_id)
    except Exception:
        return jsonify({"message": "Invalid quiz ID format"}), 400

    data = request.get_json(force=True)
    user_answers = data.get("answers", {})

    if not isinstance(user_answers, dict):
        return jsonify({"message": "Invalid answers format; expected a dictionary"}), 400

    quiz = quizzes_collection.find_one({"_id": obj_id})
    if not quiz:
        return jsonify({"message": "Quiz not found"}), 404

    try:
        # Evaluate quiz properly
        results = evaluate_quiz(quiz, user_answers)

        total_questions = len(results)
        correct_answers = sum(1 for r in results if r.get("is_correct"))
        score_percentage = (correct_answers / total_questions) * 100 if total_questions > 0 else 0

        student_id = get_jwt_identity()

        quiz_results_collection.insert_one({
            "quiz_id": obj_id,
            "student_id": student_id,
            "score": correct_answers,
            "total_questions": total_questions,
            "percentage": score_percentage,
            "submitted_at": datetime.utcnow(),
            "details": results
        })

        return jsonify({
            "results": results,
            "score": correct_answers,
            "total": total_questions,
            "percentage": score_percentage
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"message": str(e)}), 500


# ---------------- QUIZ EVALUATION FUNCTION ----------------
def evaluate_quiz(quiz, user_answers):
    """
    Compare student answers with the correct ones from the quiz.
    Returns a list of per-question evaluation results.
    """
    results = []
    questions = quiz.get("questions", [])

    for idx, q in enumerate(questions):
        # Use the index as the key to match the user's answers
        q_id = str(idx)
        
        # Access the correct answer using the key "answer"
        correct_answer = q.get("answer") 
        student_answer = user_answers.get(q_id)

        results.append({
            "question_id": q_id,
            "question_text": q.get("question"),
            "student_answer": student_answer,
            "correct_answer": correct_answer,
            "is_correct": student_answer == correct_answer
        })

    return results