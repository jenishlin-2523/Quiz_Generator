// src/pages/StudentDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import '../styles/Dashboard.css';

const StudentDashboard = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/quiz/upload/get")
      .then((res) => {
        setQuestions(res.data.questions);
      })
      .catch((err) => {
        console.error("Failed to fetch quiz", err);
      });
  }, []);

  const handleOptionChange = (questionIndex, selectedOption) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: selectedOption,
    }));
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post("http://localhost:8000/quiz/submit", {
        answers,
      });
      setResult(res.data);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Student Dashboard</h2>

      {!submitted ? (
        <div>
          {questions.length === 0 ? (
            <p>No quiz available. Ask your staff to upload one.</p>
          ) : (
            <>
              {questions.map((q, index) => (
                <div key={index} style={{ marginBottom: "1.5rem" }}>
                  <p><strong>{index + 1}. {q.question}</strong></p>
                  {q.options.map((opt, i) => (
                    <div key={i}>
                      <label>
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={opt}
                          checked={answers[index] === opt}
                          onChange={() => handleOptionChange(index, opt)}
                        />
                        {opt}
                      </label>
                    </div>
                  ))}
                </div>
              ))}
              <button onClick={handleSubmit}>Submit Quiz</button>
            </>
          )}
        </div>
      ) : (
        <div>
          <h3>Results</h3>
          {result.map((res, idx) => (
            <div key={idx} style={{ marginBottom: "1rem" }}>
              <p><strong>{res.question}</strong></p>
              <p>Your answer: {res.selected || "No Answer"}</p>
              <p>Correct answer: {res.correct}</p>
              <p style={{ color: res.is_correct ? "green" : "red" }}>
                {res.is_correct ? "Correct ✅" : "Wrong ❌"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
