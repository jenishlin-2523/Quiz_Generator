import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const StudentQuiz = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) { setError("You must be logged in to access the quiz."); return; }
    if (!quizId) { setError("Quiz ID is missing from the URL."); return; }

    setLoading(true);
    axios.get(`https://quiz-gen-hp29.onrender.com/student/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setQuiz(response.data.questions || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load quiz.");
        setLoading(false);
      });
  }, [token, quizId]);

  const escapeForInline = (s = "") =>
    String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r");

  const openQuizInPopup = () => {
    if (!quiz || quiz.length === 0) { alert("Quiz data not loaded yet."); return; }

    const width = window.screen.width;
    const height = window.screen.height;
    const popupFeatures = `width=${width},height=${height},left=0,top=0,menubar=no,status=no,resizable=no`;
    const quizWindow = window.open("", "_blank", popupFeatures);

    if (!quizWindow) { alert("Popup blocked! Please allow popups."); return; }

    const safeToken = escapeForInline(token || "");
    const serializedQuiz = JSON.stringify(quiz).replace(/<\/script/gi, "<\\/script");

    const popupHtml = `
      <!doctype html>
      <html>
      <head>
        <title>Online Examination System</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
          .header { background: #2c3e50; color: white; padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; }
          .container { display: flex; flex: 1; overflow: hidden; }
          .question-area { flex: 1; padding: 40px; overflow-y: auto; background: white; }
          .option { display: flex; align-items: center; padding: 18px 20px; border: 2px solid #ddd; margin-bottom: 10px; cursor: pointer; border-radius: 4px; }
          .option.selected { border-color: #3498db; background: #e3f2fd; }
          .navigation { margin-top: 40px; display: flex; justify-content: space-between; }
          .nav-button { padding: 12px 30px; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
          .btn-next { background: #3498db; color: white; }
          .sidebar { width: 300px; background: white; border-left: 1px solid #e0e0e0; display: flex; flex-direction: column; }
          .question-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 20px; }
          .question-box { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border: 2px solid #ddd; cursor: pointer; border-radius: 4px; }
          .question-box.answered { background: #27ae60; color: white; border-color: #27ae60; }
          .question-box.current { border-color: #3498db; border-width: 3px; }
          .submit-button { width: 100%; padding: 15px; background: #e74c3c; color: white; border: none; cursor: pointer; font-weight: 600; }
          
          /* Success Screen Overlay */
          #success-screen {
            display: none;
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: white;
            z-index: 9999;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .success-icon { font-size: 80px; color: #27ae60; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div id="success-screen">
            <div class="success-icon">✓</div>
            <h1>Examination Submitted</h1>
            <p style="color: #666; margin: 10px 0 30px 0;">Your responses have been recorded successfully.</p>
            <button class="nav-button btn-next" onclick="window.close()">Close Window</button>
        </div>

        <div class="header">
          <h1>Examination System</h1>
          <div id="timer">Time Remaining: 60:00</div>
        </div>

        <div class="container" id="main-ui">
          <div id="start-screen" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;">
             <h2>Ready to begin?</h2>
             <button class="nav-button btn-next" id="startBtn" style="margin-top:20px; padding: 20px 50px;">Start Exam</button>
          </div>

          <div class="question-area" id="question-area" style="display:none;">
            <div id="question-container"></div>
            <div class="navigation">
              <button class="nav-button" id="prevBtn" style="background:#95a5a6; color:white;">Previous</button>
              <button class="nav-button btn-next" id="nextBtn">Next</button>
            </div>
          </div>

          <div class="sidebar" id="sidebar" style="display:none;">
            <div class="question-grid" id="question-grid"></div>
            <div style="padding: 20px; margin-top: auto;">
                <button class="submit-button" id="submitBtn">Submit Exam</button>
            </div>
          </div>
        </div>

        <script>
          (function() {
            const QUIZ = ${serializedQuiz};
            const TOKEN = "${safeToken}";
            const API_SUBMIT = "https://quiz-gen-hp29.onrender.com/student/quiz/${quizId}/submit";
            
            const answers = {}; 
            let currentIdx = 0;
            let submitted = false;

            function render() {
              const q = QUIZ[currentIdx];
              const qId = q.question_id || String(currentIdx);
              
              document.getElementById('question-container').innerHTML = \`
                <h2 style="margin-bottom:20px;">Question \${currentIdx + 1}</h2>
                <p style="font-size: 1.2rem; margin-bottom:30px;">\${q.question_text || q.question}</p>
                <div>
                  \${q.options.map((opt, i) => \`
                    <div class="option \${answers[qId] == i ? 'selected' : ''}" onclick="setAnswer('\${qId}', \${i})">
                      <span style="margin-right:15px; font-weight:bold;">\${String.fromCharCode(65 + i)}.</span>
                      \${opt}
                    </div>
                  \`).join('')}
                </div>
              \`;

              // Render Grid
              document.getElementById('question-grid').innerHTML = QUIZ.map((_, i) => {
                const id = QUIZ[i].question_id || String(i);
                let cls = 'question-box';
                if (answers[id] != null) cls += ' answered';
                if (i === currentIdx) cls += ' current';
                return \`<div class="\${cls}" onclick="goTo(\${i})">\${i+1}</div>\`;
              }).join('');

              document.getElementById('prevBtn').style.visibility = currentIdx === 0 ? 'hidden' : 'visible';
              document.getElementById('nextBtn').textContent = currentIdx === QUIZ.length - 1 ? 'Finish' : 'Next';
            }

            window.setAnswer = (qId, val) => { answers[qId] = String(val); render(); };
            window.goTo = (i) => { currentIdx = i; render(); };
            
            document.getElementById('nextBtn').onclick = () => {
              if(currentIdx < QUIZ.length - 1) { currentIdx++; render(); }
            };
            document.getElementById('prevBtn').onclick = () => {
              if(currentIdx > 0) { currentIdx--; render(); }
            };

            function submitQuiz() {
              if(submitted) return;
              submitted = true;
              
              fetch(API_SUBMIT, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + TOKEN },
                body: JSON.stringify({ answers: answers })
              })
              .then(res => res.json())
              .then(data => {
                document.getElementById('main-ui').style.display = 'none';
                document.getElementById('success-screen').style.display = 'flex';
                if(window.opener) window.opener.location.reload();
              })
              .catch(err => {
                alert("Submission failed. Check connection.");
                submitted = false;
              });
            }

            document.getElementById('submitBtn').onclick = () => {
              if(confirm("Are you sure you want to submit?")) submitQuiz();
            };

            document.getElementById('startBtn').onclick = () => {
              document.documentElement.requestFullscreen().catch(() => {});
              document.getElementById('start-screen').style.display = 'none';
              document.getElementById('question-area').style.display = 'block';
              document.getElementById('sidebar').style.display = 'flex';
              render();
            };
          })();
        </script>
      </body>
      </html>
    `;

    quizWindow.document.open();
    quizWindow.document.write(popupHtml);
    quizWindow.document.close();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "600px", background: "white", padding: "40px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", textAlign: "center" }}>
        <h1 style={{ color: "#2c3e50", marginBottom: "20px" }}>Quiz Portal</h1>
        {loading ? <p>Loading...</p> : error ? <p style={{ color: "red" }}>{error}</p> : (
          <>
            <p style={{ marginBottom: "30px", color: "#666" }}>You are about to start the examination for <strong>{quizId}</strong>.</p>
            <button onClick={openQuizInPopup} style={{ background: "#3498db", color: "white", padding: "15px 40px", border: "none", borderRadius: "5px", fontSize: "1.1rem", cursor: "pointer" }}>
              Launch Examination
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentQuiz;