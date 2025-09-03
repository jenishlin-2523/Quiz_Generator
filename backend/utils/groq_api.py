import requests
import os

GROQ_API_KEY = os.getenv("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")  # or hardcode your key here for testing
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

def generate_mcqs_from_text(text: str, num_questions: int = 10) -> list:
    """
    Send text to Groq API to generate MCQs.

    :param text: Extracted text from PDF
    :param num_questions: Number of MCQs to generate
    :return: List of dictionaries with 'question', 'options', and 'answer'
    """
    prompt = f"""
    Based on the following content, generate {num_questions} multiple choice questions.
    Each question should include 4 options and specify the correct answer.

    Content:
    \"\"\"
    {text}
    \"\"\"

    Output format:
    [
      {{
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "answer": "B"
      }},
      ...
    ]
    """

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "mixtral-8x7b-32768",
        "messages": [
            {"role": "system", "content": "You are an educational content generator."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7
    }

    response = requests.post(GROQ_API_URL, headers=headers, json=payload)

    if response.status_code == 200:
        try:
            content = response.json()["choices"][0]["message"]["content"]
            mcqs = eval(content)  # Use json.loads() if the output is proper JSON
            return mcqs
        except Exception as e:
            print("Failed to parse response:", e)
            return []
    else:
        print("Groq API Error:", response.status_code, response.text)
        return []
