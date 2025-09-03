// src/pages/StaffDashboard.jsx
import React, { useState } from "react";
import axios from "axios";

function StaffDashboard() {
  const [pdf, setPdf] = useState(null);
  const [message, setMessage] = useState("");
  const [total, setTotal] = useState(0);

  const handleFileChange = (e) => {
    setPdf(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!pdf) {
      alert("Please select a PDF file first.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", pdf);

    try {
      const res = await axios.post("http://localhost:8000/quiz/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(res.data.message);
      setTotal(res.data.total);
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage("Upload failed. Try again.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Staff Dashboard</h2>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} style={{ marginLeft: "1rem" }}>Upload PDF</button>

      {message && (
        <div style={{ marginTop: "1rem" }}>
          <p>{message}</p>
          {total > 0 && <p>Total Questions Generated: {total}</p>}
        </div>
      )}
    </div>
  );
}

export default StaffDashboard;
