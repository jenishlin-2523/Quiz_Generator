import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const StudentQuiz = () => {
  const { quizId } = useParams();
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) { setError("Please login to continue."); return; }
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`https://quiz-gen-hp29.onrender.com/student/quiz/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuizData(res.data);
      } catch (err) { setError("Failed to load quiz."); }
      setLoading(false);
    };
    fetchQuiz();
  }, [quizId, token]);

  const openQuizInPopup = () => {
    if (!quizData) return;
    const width = window.screen.width, height = window.screen.height;
    const popup = window.open("", "_blank", `width=${width},height=${height},menubar=no,status=no`);
    
    const serializedQuiz = JSON.stringify(quizData.questions || quizData).replace(/<\/script/gi, "<\\/script");

    popup.document.write(`
      <html>
      <head>
        <title>Secure Exam Portal</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; display: flex; height: 100vh; overflow: hidden; }
          .sidebar { width: 300px; background: #1e293b; color: white; padding: 25px; display: flex; flex-direction: column; order: 2; }
          .main { flex: 1; padding: 50px; overflow-y: auto; order: 1; background: white; }
          .q-card { border: 1px solid #e2e8f0; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .option { display: block; padding: 15px; border: 2px solid #f1f5f9; margin: 12px 0; border-radius: 10px; cursor: pointer; transition: 0.2s; }
          .option:hover { background: #f8fafc; border-color: #cbd5e0; }
          .option.selected { border-color: #3b82f6; background: #eff6ff; font-weight: 600; }
          .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 20px; }
          .bubble { width: 40px; height: 40px; background: #334155; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; }
          .bubble.active { background: #3b82f6; color: white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
          .bubble.done { background: #10b981; color: white; }
          .btn { padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; transition: 0.2s; }
          .btn-primary { background: #3b82f6; color: white; }
          .btn-finish { background: #ef4444; color: white; margin-top: auto; width: 100%; }
        </style>
      </head>
      <body>
        <div class="sidebar">
          <h3>Exam Progress</h3>
          <div class="grid" id="grid"></div>
          <button class="btn btn-finish" id="submitBtn">Submit Exam</button>
        </div>
        <div class="main">
          <div id="q-container"></div>
          <div style="margin-top: 30px; display: flex; gap: 15px;">
            <button class="btn" style="background:#e2e8f0" id="prevBtn">Previous</button>
            <button class="btn btn-primary" id="nextBtn">Next Question</button>
          </div>
        </div>
        <script>
          const QUESTIONS = ${serializedQuiz};
          const answers = {};
          let current = 0;

          function render() {
            const q = QUESTIONS[current];
            document.getElementById('q-container').innerHTML = \`
              <div class="q-card">
                <span style="color: #64748b; font-size: 0.85rem;">QUESTION \${current + 1} OF \${QUESTIONS.length}</span>
                <h2 style="margin: 10px 0 25px 0; color: #1e293b;">\${q.question}</h2>
                \${q.options.map((opt, i) => \`
                  <label class="option \${answers[current] == i ? 'selected' : ''}">
                    <input type="radio" name="opt" value="\${i}" \${answers[current] == i ? 'checked' : ''} style="display:none"> 
                    \${opt}
                  </label>
                \`).join('')}
              </div>\`;
            
            document.getElementById('grid').innerHTML = QUESTIONS.map((_, i) => 
              \`<div class="bubble \${current === i ? 'active' : ''} \${answers[i] !== undefined ? 'done' : ''}" onclick="goTo(\${i})">\${i+1}</div>\`
            ).join('');
          }

          window.goTo = (i) => { current = i; render(); };
          document.body.addEventListener('change', (e) => { 
            if(e.target.name === 'opt') { answers[current] = e.target.value; render(); } 
          });

          document.getElementById('nextBtn').onclick = () => { if(current < QUESTIONS.length - 1) { current++; render(); }};
          document.getElementById('prevBtn').onclick = () => { if(current > 0) { current--; render(); }};
          
          document.getElementById('submitBtn').onclick = () => {
            if(!confirm("Are you sure you want to finish the exam?")) return;
            fetch("https://quiz-gen-hp29.onrender.com/student/quiz/${quizId}/submit", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": "Bearer ${token}" },
              body: JSON.stringify({ answers })
            }).then(() => { 
              alert("Exam Submitted Successfully!"); 
              window.close(); 
              if(window.opener) window.opener.location.reload(); 
            });
          };

          render();
        </script>
      </body>
      </html>
    `);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
      <div style={{ background: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", textAlign: "center", maxWidth: "450px" }}>
        <h1 style={{ color: "#1e293b", margin: "0 0 10px 0" }}>Start Quiz</h1>
        <p style={{ color: "#64748b", marginBottom: "30px" }}>Open the secure exam portal. Please ensure popups are enabled.</p>
        <button onClick={openQuizInPopup} style={{ padding: "14px 28px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: "600", cursor: "pointer" }}>
          Launch Secure Window
        </button>
      </div>
    </div>
  );
};

export default StudentQuiz;