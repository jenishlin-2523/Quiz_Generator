import React, { useEffect, useState } from "react";
import axios from "axios";

const StudentDashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("access_token");

  // Optional: pass courseId from props/context
  const courseId = null;

  useEffect(() => {
    if (!token) {
      setError("Authentication required. Please login.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchQuizzes() {
      try {
        const { data, status } = await axios.get(
          "http://localhost:8000/quiz/student/quizzes",
          {
            headers: { Authorization: `Bearer ${token}` },
            params: courseId ? { course_id: courseId } : {},
            signal: controller.signal,
            timeout: 10000,
          }
        );

        if (status === 200 && Array.isArray(data.quizzes)) {
          setQuizzes(data.quizzes);
        } else {
          setError("Unexpected response from server.");
        }
      } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError") {
          // Request cancelled, do nothing
        } else if (err.response) {
          setError(
            `Error: ${err.response.data?.message || err.response.statusText}`
          );
        } else if (err.request) {
          setError("Network error: Unable to reach server.");
        } else {
          setError(`Error: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchQuizzes();
    return () => controller.abort();
  }, [token, courseId]);

  if (loading) return <p>Loading quizzes, please wait...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (quizzes.length === 0) return <p>No quizzes assigned to you.</p>;

  return (
    <div style={{ maxWidth: "800px", margin: "auto" }}>
      <h1>Your Quizzes</h1>
      <div className="quiz-grid">
        {quizzes.map(({ quiz_id, course_id, questions_count, title, description }) => (
          <div
            key={quiz_id}
            className="quiz-card"
            onClick={() => window.location.assign(`/quiz/${quiz_id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                window.location.assign(`/quiz/${quiz_id}`);
              }
            }}
            aria-label={`Open quiz ${title || quiz_id}`}
          >
            <h3>{title || `Quiz ID: ${quiz_id}`}</h3>
            <p>
              <strong>Course ID:</strong> {course_id}
            </p>
            <p>
              <strong>Number of Questions:</strong> {questions_count}
            </p>
            {description && <p>{description}</p>}
          </div>
        ))}
      </div>

      <style>{`
        .quiz-grid {
          display: grid;
          gap: 1rem;
        }
        .quiz-card {
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 1rem;
          background-color: #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: box-shadow 0.3s ease, transform 0.2s ease;
        }
        .quiz-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
