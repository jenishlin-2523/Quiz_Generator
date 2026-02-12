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
        <title>Secure Exam Environment</title>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; }
          body { 
            margin:0; 
            padding:0; 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display:flex; 
            height:100vh; 
            flex-direction: row-reverse;
            overflow: hidden;
          }
          
          .sidebar { 
            width: 320px; 
            background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
            color:#fff; 
            padding: 30px 25px; 
            display:flex; 
            flex-direction:column; 
            box-shadow: -4px 0 20px rgba(0,0,0,0.3);
            border-left: 1px solid rgba(255,255,255,0.1);
          }
          
          .sidebar h3 { 
            margin: 0 0 10px 0; 
            font-size: 1.4rem; 
            font-weight: 700;
            background: linear-gradient(90deg, #60a5fa, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .progress-stats {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.1);
          }
          
          .stat-box {
            flex: 1;
            text-align: center;
          }
          
          .stat-number {
            font-size: 1.8rem;
            font-weight: 700;
            color: #60a5fa;
            display: block;
          }
          
          .stat-label {
            font-size: 0.75rem;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .grid { 
            display: grid; 
            grid-template-columns: repeat(5, 1fr); 
            gap: 10px; 
            margin-top: 20px;
            max-height: calc(100vh - 400px);
            overflow-y: auto;
            padding-right: 10px;
          }
          
          .grid::-webkit-scrollbar { width: 6px; }
          .grid::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
          .grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
          
          .q-bubble { 
            width: 50px; 
            height: 50px; 
            border-radius: 12px; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            cursor: pointer; 
            font-weight: 700; 
            font-size: 0.95rem;
            border: 2px solid transparent; 
            transition: all 0.3s ease;
            position: relative;
          }
          
          .q-bubble:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }
          
          .answered { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
          } 
          
          .unanswered { 
            background: #334155;
            color: #94a3b8;
          }
          
          .current-q { 
            border-color: #3b82f6;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.6); }
            50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.8); }
          }
          
          .main { 
            flex: 1; 
            padding: 50px; 
            overflow: auto; 
            background: #ffffff;
          }
          
          .main::-webkit-scrollbar { width: 8px; }
          .main::-webkit-scrollbar-track { background: #f1f5f9; }
          .main::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          
          .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
          }
          
          .question-number {
            font-size: 0.9rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .question-text { 
            font-size: 1.5rem; 
            line-height: 1.8; 
            color: #1e293b; 
            margin-bottom: 35px;
            font-weight: 500;
          }
          
          .options-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          
          .option-label { 
            display: flex;
            align-items: center;
            padding: 20px 25px; 
            border: 2px solid #e2e8f0; 
            border-radius: 12px; 
            cursor: pointer; 
            transition: all 0.2s ease;
            background: #ffffff;
            position: relative;
            overflow: hidden;
          }
          
          .option-label::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 4px;
            background: #3b82f6;
            transform: scaleY(0);
            transition: transform 0.2s ease;
          }
          
          .option-label:hover { 
            background: #f8fafc;
            border-color: #3b82f6;
            transform: translateX(5px);
          }
          
          .option-label:hover::before {
            transform: scaleY(1);
          }
          
          .selected { 
            border-color: #3b82f6 !important;
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          }
          
          .selected::before {
            transform: scaleY(1);
          }
          
          .option-radio {
            width: 24px;
            height: 24px;
            border: 2px solid #cbd5e1;
            border-radius: 50%;
            margin-right: 15px;
            flex-shrink: 0;
            position: relative;
            transition: all 0.2s ease;
          }
          
          .selected .option-radio {
            border-color: #3b82f6;
            background: #3b82f6;
          }
          
          .selected .option-radio::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
          }
          
          .controls { 
            margin-top: 40px; 
            display: flex; 
            gap: 15px;
            justify-content: space-between;
          }
          
          button { 
            padding: 14px 32px; 
            border-radius: 10px; 
            border: none; 
            cursor: pointer; 
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.2s ease;
            font-family: inherit;
          }
          
          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          
          button:active {
            transform: translateY(0);
          }
          
          #submitBtn { 
            margin-top: auto; 
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white; 
            width: 100%;
            padding: 18px;
            font-size: 1.1rem;
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
          }
          
          #submitBtn:hover { 
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
          }
          
          #nextBtn { 
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            flex: 1;
          }
          
          #prevBtn { 
            background: #64748b;
            color: white;
          }
          
          .security-notice {
            margin-top: auto;
            padding: 15px;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 10px;
            border: 1px solid rgba(239, 68, 68, 0.3);
            font-size: 0.85rem;
            color: #fca5a5;
            line-height: 1.5;
          }
          
          .start-screen {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: #ffffff;
            padding: 40px;
          }
          
          .start-screen h2 {
            font-size: 2.5rem;
            color: #1e293b;
            margin-bottom: 15px;
            font-weight: 700;
          }
          
          .start-screen p {
            font-size: 1.1rem;
            color: #64748b;
            margin-bottom: 40px;
          }
          
          #startBtn {
            padding: 20px 60px;
            font-size: 1.3rem;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
          }
          
          #startBtn:hover {
            box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4);
          }
        </style>
      </head>
      <body>
        <div class="sidebar">
          <h3>Progress Tracker</h3>
          
          <div class="progress-stats">
            <div class="stat-box">
              <span class="stat-number" id="answered-count">0</span>
              <span class="stat-label">Answered</span>
            </div>
            <div class="stat-box">
              <span class="stat-number" id="remaining-count">${quiz.length}</span>
              <span class="stat-label">Remaining</span>
            </div>
          </div>
          
          <div id="grid" class="grid"></div>
          
          <div class="security-notice">
            ⚠️ <strong>Security Notice:</strong> Do not switch tabs, exit fullscreen, or minimize this window. Doing so will automatically submit your exam.
          </div>
          
          <button id="submitBtn">🎯 Submit Exam</button>
        </div>

        <div class="main" id="exam-ui" style="display:none;">
          <div id="question-container"></div>
          <div class="controls">
            <button id="prevBtn">← Previous</button>
            <button id="nextBtn">Next Question →</button>
          </div>
        </div>

        <div id="start-screen" class="start-screen">
          <h2>🎓 Ready to Begin?</h2>
          <p>Your exam will open in fullscreen mode for security.</p>
          <button id="startBtn">Start Exam Now</button>
        </div>

        <script>
          (function() {
            const QUIZ = ${serializedQuiz};
            const TOKEN = "${safeToken}";
            const API_SUBMIT = "https://quiz-gen-hp29.onrender.com/student/quiz/${quizId}/submit";
            
            // CRITICAL FIX: Store answers as strings to match backend
            const answers = {}; 
            let currentIdx = 0;
            let submitted = false;

            const handleUnload = (e) => { if(!submitted) { e.preventDefault(); e.returnValue = ""; } };
            window.addEventListener("beforeunload", handleUnload);

            function updateStats() {
              const answeredCount = Object.keys(answers).length;
              const remainingCount = QUIZ.length - answeredCount;
              document.getElementById('answered-count').textContent = answeredCount;
              document.getElementById('remaining-count').textContent = remainingCount;
            }

            function render() {
              const q = QUIZ[currentIdx];
              const qId = q.question_id || String(currentIdx);
              
              console.log("Rendering question:", qId, "Current answer:", answers[qId]);
              
              document.getElementById('question-container').innerHTML = \`
                <div class="question">
                  <div class="question-header">
                    <span class="question-number">Question \${currentIdx + 1} of \${QUIZ.length}</span>
                  </div>
                  <p class="question-text">\${q.question_text || q.question}</p>
                  <div class="options-list">
                    \${q.options.map((opt, i) => \`
                      <label class="option-label \${answers[qId] === String(i) ? 'selected' : ''}">
                        <div class="option-radio"></div>
                        <input type="radio" name="q_choice" value="\${i}" \${answers[qId] === String(i) ? 'checked' : ''} style="display:none"> 
                        <span>\${opt}</span>
                      </label>
                    \`).join('')}
                  </div>
                </div>\`;
              
              // Update Navigation Grid
              document.getElementById('grid').innerHTML = QUIZ.map((item, i) => {
                const id = item.question_id || String(i);
                let statusClass = answers[id] !== undefined ? 'answered' : 'unanswered';
                if(i === currentIdx) statusClass += ' current-q';
                return \`<div class="q-bubble \${statusClass}" onclick="goTo(\${i})">\${i+1}</div>\`;
              }).join('');

              // Button States
              document.getElementById('prevBtn').style.display = currentIdx === 0 ? 'none' : 'block';
              document.getElementById('nextBtn').innerHTML = currentIdx === QUIZ.length - 1 ? 'Review & Submit →' : 'Next Question →';
              
              updateStats();
            }

            window.goTo = (i) => { currentIdx = i; render(); };

            document.body.addEventListener('change', (e) => {
              if(e.target.name === 'q_choice') { 
                const qId = QUIZ[currentIdx].question_id || String(currentIdx);
                // CRITICAL FIX: Store as string to match backend expectation
                answers[qId] = String(e.target.value);
                console.log("Answer saved - Question ID:", qId, "Answer:", answers[qId]);
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
              
              console.log("Submitting answers:", answers);
              
              fetch(API_SUBMIT, {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json", 
                  "Authorization": "Bearer " + TOKEN 
                },
                body: JSON.stringify({ 
                  answers: answers
                })
              })
              .then(response => response.json())
              .then(data => {
                console.log("Submission response:", data);
                alert(\`Exam Submitted Successfully!\\n\\nYour Score: \${data.score}/\${data.total} (\${data.percentage}%)\`);
                window.close();
                if(window.opener) window.opener.location.reload();
              })
              .catch(err => {
                console.error("Submission error:", err);
                alert("Error submitting exam. Please contact your instructor.");
                submitted = false;
              });
            }

            document.getElementById('submitBtn').onclick = () => { 
              const total = QUIZ.length;
              const answered = Object.keys(answers).length;
              if(answered < total) {
                if(!confirm(\`You have only answered \${answered} out of \${total} questions.\\n\\nAre you sure you want to submit?\`)) {
                  return;
                }
              } else {
                if(!confirm(\`Submit your exam now?\\n\\nYou answered all \${total} questions.\`)) {
                  return;
                }
              }
              submitQuiz("user");
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

            document.addEventListener("visibilitychange", () => { 
              if(document.hidden && !submitted) { 
                console.warn("Security Violation: Tab switched.");
                submitQuiz("tab-switch-violation"); 
              } 
            });

            document.addEventListener("fullscreenchange", () => {
              if (!document.fullscreenElement && !submitted) {
                console.warn("Security Violation: Exited fullscreen.");
                submitQuiz("fullscreen-exit-violation");
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
    <div style={{ 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{ 
        maxWidth: "600px", 
        width: "100%",
        padding: "50px", 
        background: "#fff", 
        borderRadius: "20px", 
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        textAlign: "center"
      }}>
        <h1 style={{ 
          color: "#1e293b", 
          marginBottom: "15px",
          fontSize: "2.5rem",
          fontWeight: "700"
        }}>
          🎓 Secure Exam Portal
        </h1>
        <p style={{ 
          color: "#64748b", 
          marginBottom: "30px",
          fontSize: "1.1rem"
        }}>
          Quiz ID: <code style={{ 
            background: "#f1f5f9", 
            padding: "4px 12px",
            borderRadius: "6px",
            fontWeight: "600",
            color: "#3b82f6"
          }}>{quizId}</code>
        </p>
        
        {loading ? (
          <div style={{
            padding: "30px",
            fontSize: "1.1rem",
            color: "#64748b"
          }}>
            ⏳ Loading your exam...
          </div>
        ) : (
          <button 
            onClick={openQuizInPopup} 
            disabled={!quiz.length}
            style={{ 
              padding: "18px 50px", 
              background: quiz.length 
                ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" 
                : "#cbd5e1", 
              color: "#fff", 
              border: "none", 
              borderRadius: "12px", 
              cursor: quiz.length ? "pointer" : "not-allowed", 
              fontSize: "1.2rem",
              fontWeight: "700",
              boxShadow: quiz.length ? "0 8px 25px rgba(59, 130, 246, 0.3)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            🚀 Launch Secure Browser
          </button>
        )}
        {error && (
          <p style={{ 
            color: "#ef4444", 
            marginTop: "25px", 
            fontWeight: "600",
            padding: "15px",
            background: "#fee2e2",
            borderRadius: "8px"
          }}>
            ⚠️ {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default StudentQuiz;