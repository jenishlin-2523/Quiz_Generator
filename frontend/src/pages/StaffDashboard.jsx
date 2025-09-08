// src/pages/StaffDashboard.jsx
import React, { useState } from "react";
import axios from "axios";
import '../styles/Dashboard.css';

function StaffDashboard() {
  const [pdf, setPdf] = useState(null);
  const [courseId, setCourseId] = useState(""); // New state for course ID
  const [message, setMessage] = useState("");
  const [questions, setQuestions] = useState([]);

  // Get stored token (e.g., from localStorage)
  const token = localStorage.getItem("access_token");

  const handleFileChange = (e) => {
    setPdf(e.target.files[0]);
  };

  const handleCourseIdChange = (e) => {
    setCourseId(e.target.value);
  };

  const handleUpload = async () => {
    if (!pdf) {
      alert("Please select a PDF file first.");
      return;
    }
    if (!courseId) {
      alert("Please enter the course ID.");
      return;
    }
    if (!token) {
      alert("You are not logged in!");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", pdf);
    formData.append("course_id", courseId); // Send course ID with form data

    try {
      const res = await axios.post(
        "http://localhost:8000/staff/quiz/upload", // <-- updated path here
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,  // send token here
          },
        }
      );

      setMessage(res.data.message || "Quiz generated successfully!");
      setQuestions(res.data.quiz || []);
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage("Upload failed. Try again.");
      setQuestions([]);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Staff Dashboard</h2>

      <input
        type="text"
        placeholder="Enter Course ID"
        value={courseId}
        onChange={handleCourseIdChange}
        style={{ marginRight: "1rem", padding: "0.3rem" }}
      />

      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        style={{ marginRight: "1rem" }}
      />

      <button onClick={handleUpload}>
        Upload PDF
      </button>

      {message && (
        <div style={{ marginTop: "1rem" }}>
          <p>{message}</p>
        </div>
      )}

      {questions.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Generated Quiz Questions:</h3>
          <ol>
            {questions.map((q, idx) => (
              <li key={idx}>
                <p><strong>Q:</strong> {q.question}</p>
                <ul>
                  {q.options.map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
                <p><em>Answer: {q.answer}</em></p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default StaffDashboard;
