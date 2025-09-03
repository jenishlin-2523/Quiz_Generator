import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const StudentQuiz = () => {
    const { quizId } = useParams();
    const [quiz, setQuiz] = useState([]);
    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState(null);
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("access_token");

    useEffect(() => {
        if (!token) {
            setError("You must be logged in to access the quiz.");
            return;
        }
        if (!quizId) {
            setError("Quiz ID is missing from the URL.");
            return;
        }

        setLoading(true);
        axios
            .get(`http://localhost:8000/quiz/student/quiz/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => {
                // The API now returns a list of questions, where each question has a 'question_id'
                setQuiz(response.data.questions || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching quiz:", err);
                setError("Failed to load quiz.");
                setLoading(false);
            });
    }, [token, quizId]);

    const handleAnswerChange = (questionIndex, option) => {
        setAnswers((prevAnswers) => ({
            ...prevAnswers,
            [questionIndex]: option,
        }));
    };

    const handleSubmit = () => {
        if (!token) {
            setError("You must be logged in to submit the quiz.");
            return;
        }
        if (!quizId) {
            setError("Quiz ID is missing.");
            return;
        }

        setError("");
        axios
            .post(
                `http://localhost:8000/quiz/student/quiz/${quizId}/submit`,
                { answers },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            .then((response) => {
                setResults(response.data.results);
                setScore({
                    correct: response.data.score,
                    total: response.data.total,
                    percentage: response.data.percentage,
                });
            })
            .catch((err) => {
                console.error("Error submitting quiz:", err);
                // Log the full error response for better debugging
                if (err.response) {
                    console.log("Server response:", err.response.data);
                }
                setError("Failed to submit quiz.");
            });
    };

    if (loading) {
        return <p>Loading quiz...</p>;
    }

    if (error) {
        return <p style={{ color: "red" }}>{error}</p>;
    }

    if (results) {
        return (
            <div style={{ maxWidth: "700px", margin: "auto" }}>
                <h2>Quiz Results</h2>
                {score && (
                    <p>
                        Score: {score.correct} / {score.total} (
                        {score.percentage.toFixed(2)}%)
                    </p>
                )}
                {results.length > 0 ? (
                    <ol>
                        {results.map((res, idx) => (
                            <li key={idx} style={{ marginBottom: "1rem" }}>
                                <p>
                                    <strong>{res.question_text}</strong>
                                </p>
                                <p>Your answer: {res.student_answer || "No answer given"}</p>
                                <p>Correct answer: {res.correct_answer}</p>
                                <p style={{ color: res.is_correct ? "green" : "red" }}>
                                    {res.is_correct ? "Correct" : "Incorrect"}
                                </p>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p>No detailed results available.</p>
                )}
                <button
                    onClick={() => {
                        setResults(null);
                        setAnswers({});
                        setError("");
                        setScore(null);
                    }}
                    style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}
                >
                    Retake Quiz
                </button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "700px", margin: "auto" }}>
            <h1>Student Quiz</h1>
            {quiz.length === 0 ? (
                <p>No quiz available at the moment.</p>
            ) : (
                quiz.map((q, index) => (
                    <div key={index} style={{ marginBottom: "1.5rem" }}>
                        <h3>{q.question}</h3>
                        {q.options.map((option, i) => (
                            <label key={i} style={{ display: "block", cursor: "pointer" }}>
                                <input
                                    type="radio"
                                    name={`question-${index}`}
                                    value={option}
                                    checked={answers[index] === option}
                                    onChange={() => handleAnswerChange(index, option)}
                                    style={{ marginRight: "0.5rem" }}
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                ))
            )}
            <button
                onClick={handleSubmit}
                disabled={quiz.length === 0 || Object.keys(answers).length === 0}
                style={{
                    padding: "0.5rem 1rem",
                    cursor:
                        quiz.length === 0 || Object.keys(answers).length === 0
                            ? "not-allowed"
                            : "pointer",
                }}
            >
                Submit Quiz
            </button>
        </div>
    );
};

export default StudentQuiz;