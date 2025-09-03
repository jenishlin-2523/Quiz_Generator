from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF
from groq import Groq
import json
import re

app = Flask(__name__)
CORS(app)

# Groq API setup
GROQ_API_KEY = "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"
GROQ_MODEL = "llama3-70b-8192"
groq_client = Groq(api_key=GROQ_API_KEY)

# Store the quiz globally for now (in-memory)
stored_quiz = {
    "questions": []
}

def text_chunk_limit(text, max_tokens=1500):
    return text[:max_tokens]

@app.route("/")
def home():
    return "✅ Flask server is running!"

@app.route("/quiz/upload", methods=["POST"])
def generate_quiz():
    if 'pdf' not in request.files:
        return jsonify({"message": "No PDF uploaded"}), 400

    pdf_file = request.files['pdf']

    # Extract text from PDF
    try:
        doc = fitz.open(stream=pdf_file.read(), filetype="pdf")
        extracted_text = ""
        for page in doc:
            extracted_text += page.get_text()
        doc.close()
    except Exception as e:
        return jsonify({"message": "Failed to read PDF", "error": str(e)}), 500

    # Create Groq prompt
    prompt = f"""
Generate 10 multiple choice questions based on the following content:

{text_chunk_limit(extracted_text)}

Format:
[
  {{
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Correct Option"
  }}
]
"""

    # Generate quiz using Groq
    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )

        content = response.choices[0].message.content.strip()
        json_match = re.search(r"\[\s*{.*?}\s*]", content, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON block found.")

        json_str = json_match.group(0)
        quiz_data = json.loads(json_str)

        # Store it globally
        stored_quiz["questions"] = quiz_data

        return jsonify({
            "message": "Quiz generated successfully!",
            "quiz": quiz_data,
            "total": len(quiz_data)
        })

    except Exception as e:
        return jsonify({
            "message": "Quiz generation failed.",
            "error": str(e),
            "raw_response": content
        }), 500

# ✅ Endpoint for frontend to fetch quiz
@app.route("/quiz/upload/get", methods=["GET"])
def get_quiz():
    if not stored_quiz["questions"]:
        return jsonify({"message": "No quiz available"}), 404
    return jsonify({"questions": stored_quiz["questions"]})

# ✅ Endpoint to submit quiz
@app.route("/quiz/submit", methods=["POST"])
def submit_quiz():
    data = request.json
    user_answers = data.get("answers", {})
    quiz = stored_quiz["questions"]

    results = []
    for idx, q in enumerate(quiz):
        selected = user_answers.get(str(idx)) or user_answers.get(idx)
        results.append({
            "question": q["question"],
            "correct": q["answer"],
            "selected": selected,
            "is_correct": selected == q["answer"]
        })

    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True, port=8000)
