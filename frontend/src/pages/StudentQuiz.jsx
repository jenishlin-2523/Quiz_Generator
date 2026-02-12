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
        // Ensure each question has an ID for identification
        setQuiz(response.data.questions || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load quiz.");
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
        <title>Secure Exam Environment</title>
        <style>
          body { margin:0; padding:0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f3f4f6; display:flex; height:100vh; flex-direction: row-reverse; }
          .sidebar { width: 280px; background:#111827; color:#fff; padding: 20px; display:flex; flex-direction:column; box-shadow: -2px 0 5px rgba(0,0,0,0.1); }
          .main { flex:1; padding:40px; overflow:auto; background: #fff; }
          .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 20px; }
          .q-bubble { width:40px; height:40px; border-radius:8px; display:inline-flex; justify-content:center; align-items:center; cursor:pointer; font-weight:bold; border: 2px solid transparent; transition: 0.3s; }
          .answered { background:#10b981; color: white; } 
          .unanswered { background:#374151; color: #9ca3af; }
          .current-q { border-color: #3b82f6; }
          .option-label { display:block; padding:15px; margin:10px 0; border:1px solid #d1d5db; border-radius:8px; cursor:pointer; transition: 0.2s; position: relative; }
          .option-label:hover { background:#f9fafb; border-color: #2563eb; }
          .selected { border-color:#2563eb; background:#eff6ff !important; font-weight: 600; }
          .controls { margin-top:30px; display: flex; gap: 10px; }
          button { padding:12px 24px; border-radius:6px; border:none; cursor:pointer; font-weight:600; transition: 0.2s; }
          #submitBtn { margin-top:auto; background:#ef4444; color:white; width: 100%; }
          #submitBtn:hover { background:#dc2626; }
          #nextBtn { background:#2563eb; color:white; }
          #prevBtn { background:#6b7280; color:white; }
          .question-text { font-size: 1.25rem; line-height: 1.6; color: #1f2937; margin-bottom: 25px; }
        </style>
      </head>
      <body>
        <div class="sidebar">
          <h3 style="margin-top:0;">Progress</h3>
          <div id="grid" class="grid"></div>
          <p style="font-size: 0.8rem; color: #9ca3af; margin-top: 20px;">Do not switch tabs or exit fullscreen. Doing so will auto-submit the exam.</p>
          <button id="submitBtn">Submit Exam</button>
        </div>

        <div class="main" id="exam-ui" style="display:none;">
          <div id="question-container"></div>
          <div class="controls">
            <button id="prevBtn">Previous</button>
            <button id="nextBtn">Next Question</button>
          </div>
        </div>

        <div id="start-screen" style="flex:1; display:flex; flex-direction: column; justify-content:center; align-items:center; background: #fff;">
          <h2>Ready to start?</h2>
          <p>The exam will open in fullscreen mode.</p>
          <button id="startBtn" style="padding:20px 40px; font-size:1.2rem; background: #2563eb; color: white;">Start Exam Now</button>
        </div>

        <script>
          (function() {
            const QUIZ = ${serializedQuiz};
            const TOKEN = "${safeToken}";
            const API_SUBMIT = "https://quiz-gen-hp29.onrender.com/student/quiz/${quizId}/submit";
            
            // Core Logic: Identifies answers by Question ID
            const answers = {}; 
            let currentIdx = 0;
            let submitted = false;

            const handleUnload = (e) => { if(!submitted) { e.preventDefault(); e.returnValue = ""; } };
            window.addEventListener("beforeunload", handleUnload);

            function render() {
              const q = QUIZ[currentIdx];
              const qId = q.question_id || currentIdx; // Use ID if available, fallback to index
              
              document.getElementById('question-container').innerHTML = \`
                <div class="question">
                  <span style="color: #6b7280; font-weight: bold; text-transform: uppercase; font-size: 0.8rem;">Question \${currentIdx + 1} of \${QUIZ.length}</span>
                  <p class="question-text">\${q.question_text || q.question}</p>
                  <div class="options-list">
                    \${q.options.map((opt, i) => \`
                      <label class="option-label \${answers[qId] == i ? 'selected' : ''}">
                        <input type="radio" name="q_choice" value="\${i}" \${answers[qId] == i ? 'checked' : ''} style="display:none"> 
                        \${opt}
                      </label>
                    \`).join('')}
                  </div>
                </div>\`;
              
              // Update Navigation Grid
              document.getElementById('grid').innerHTML = QUIZ.map((item, i) => {
                const id = item.question_id || i;
                let statusClass = answers[id] !== undefined ? 'answered' : 'unanswered';
                if(i === currentIdx) statusClass += ' current-q';
                return \`<div class="q-bubble \${statusClass}" onclick="goTo(\${i})">\${i+1}</div>\`;
              }).join('');

              // Button States
              document.getElementById('prevBtn').style.visibility = currentIdx === 0 ? 'hidden' : 'visible';
              document.getElementById('nextBtn').innerText = currentIdx === QUIZ.length - 1 ? 'Finish Review' : 'Next Question';
            }

            window.goTo = (i) => { currentIdx = i; render(); };

            document.body.addEventListener('change', (e) => {
              if(e.target.name === 'q_choice') { 
                const qId = QUIZ[currentIdx].question_id || currentIdx;
                answers[qId] = e.target.value; 
                render(); 
              }
            });

            document.getElementById('nextBtn').onclick = () => { 
              if(currentIdx < QUIZ.length - 1) { currentIdx++; render(); }
            };
            document.getElementById('prevBtn').onclick = () => { 
              if(currentIdx > 0) { currentIdx--; render(); }
            };

            function submitQuiz(reason = "user") {
              if(submitted) return;
              submitted = true;
              window.removeEventListener("beforeunload", handleUnload);
              
              // Identification: Sends Object mapping question_ids to chosen_indices
              fetch(API_SUBMIT, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + TOKEN },
                body: JSON.stringify({ 
                  answers,
                  submission_metadata: {
                    reason: reason,
                    timestamp: new Date().toISOString()
                  }
                })
              }).then(() => {
                alert("Exam Submitted Successfully!");
                window.close();
                if(window.opener) window.opener.location.reload();
              }).catch(err => {
                alert("Error submitting. Please contact invigilator.");
                submitted = false; // Allow retry on failure
              });
            }

            document.getElementById('submitBtn').onclick = () => { 
              const total = QUIZ.length;
              const answered = Object.keys(answers).length;
              if(confirm(\`You have answered \${answered}/\${total} questions. Submit?\`)) submitQuiz(); 
            };

            document.getElementById('startBtn').onclick = () => {
              document.documentElement.requestFullscreen().then(() => {
                document.getElementById('start-screen').style.display = 'none';
                document.getElementById('exam-ui').style.display = 'block';
                render();
              }).catch(() => {
                alert("Fullscreen is required to take this exam.");
              });
            };

            // Security Identification: Auto-submit if student leaves tab
            document.addEventListener("visibilitychange", () => { 
              if(document.hidden && !submitted) { 
                console.warn("Security Violation: Tab switched.");
                submitQuiz("tab-switch-violation"); 
              } 
            });
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
    <div style={{ maxWidth: "600px", margin: "80px auto", textAlign: "center", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ padding: "40px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
        <h1 style={{ color: "#111827", marginBottom: "10px" }}>Secure Exam Portal</h1>
        <p style={{ color: "#4b5563", marginBottom: "30px" }}>
          Quiz ID: <code style={{ background: "#f3f4f6", padding: "2px 6px" }}>{quizId}</code>
        </p>
        
        {loading ? (
          <div className="loader">Loading your exam...</div>
        ) : (
          <button 
            onClick={openQuizInPopup} 
            disabled={!quiz.length}
            style={{ 
              padding: "15px 40px", 
              background: quiz.length ? "#2563eb" : "#9ca3af", 
              color: "#fff", 
              border: "none", 
              borderRadius: "8px", 
              cursor: quiz.length ? "pointer" : "not-allowed", 
              fontSize: "1.1rem",
              fontWeight: "600"
            }}
          >
            Launch Secure Browser
          </button>
        )}
        {error && <p style={{ color: "#ef4444", marginTop: "20px", fontWeight: "500" }}>{error}</p>}
      </div>
    </div>
  );
};

export default StudentQuiz;