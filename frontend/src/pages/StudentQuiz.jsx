import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const StudentQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("access_token");

  // 1. Fetch Quiz Data and Check Status
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`https://quiz-gen-hp29.onrender.com/student/quiz/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Backend should return 'submitted: true' if the student already took this quiz
        if (res.data.submitted) {
          alert("You have already completed this quiz.");
          navigate("/student");
        } else {
          setQuizData(res.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Error loading quiz data. Ensure the quiz exists.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();

    // 2. Setup Message Listener: Redirects parent window when popup finishes
    const handleMessage = (event) => {
      if (event.data === "QUIZ_COMPLETE") {
        // Redirection logic to return to dashboard
        navigate("/student");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [quizId, token, navigate]);

  // 3. Launch the Secure Popup
  const startSecureExam = () => {
    if (!quizData || !quizData.questions) return;

    const width = window.screen.width;
    const height = window.screen.height;
    const popup = window.open("", "_blank", `width=${width},height=${height},left=0,top=0`);

    if (!popup) {
      alert("Popup Blocked! Please allow popups to begin the exam.");
      return;
    }

    // Escape scripts and handle tokens for the popup context
    const serializedQuestions = JSON.stringify(quizData.questions).replace(/<\/script/gi, "<\\/script");
    const safeToken = token.replace(/"/g, '\\"');

    const popupHtml = `
      <!doctype html>
      <html>
      <head>
        <title>SECURE EXAMINATION: ${quizId}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 0; background: #f8fafc; user-select: none; overflow: hidden; }
          .navbar { background: #1e293b; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; }
          .layout { display: flex; height: calc(100vh - 65px); }
          .main-pane { flex: 1; padding: 40px; overflow-y: auto; background: white; }
          .side-pane { width: 320px; border-left: 1px solid #e2e8f0; padding: 20px; background: #fdfdfd; display: flex; flex-direction: column; }
          .q-text { font-size: 1.4rem; color: #1e293b; margin-bottom: 2rem; line-height: 1.5; font-weight: 500; }
          .opt-card { border: 2px solid #e2e8f0; padding: 1.2rem; margin-bottom: 1rem; border-radius: 10px; cursor: pointer; transition: all 0.2s ease; position: relative; }
          .opt-card:hover { background: #f1f5f9; border-color: #cbd5e1; }
          .opt-card.selected { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; font-weight: 600; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1); }
          .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 20px; }
          .grid-item { height: 45px; border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; border-radius: 6px; cursor: pointer; font-weight: 500; }
          .grid-item.filled { background: #10b981; color: white; border-color: #10b981; }
          .grid-item.current { border: 3px solid #3b82f6; color: #3b82f6; }
          .btn-finish { background: #ef4444; color: white; border: none; padding: 1.2rem; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: auto; font-size: 1rem; transition: background 0.2s; }
          .btn-finish:hover { background: #dc2626; }
          #warn-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.95); color:white; z-index:9999; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 2rem; }
        </style>
      </head>
      <body oncontextmenu="return false;">
        <div id="warn-overlay">
          <h1 style="font-size: 5rem; margin:0;">⚠️</h1>
          <h1 id="warn-title">SECURITY BREACH</h1>
          <p id="warn-msg" style="font-size: 1.3rem; max-width: 600px;">Switching tabs or windows is strictly prohibited. Your actions are being recorded.</p>
          <button onclick="closeWarn()" style="padding: 1rem 3rem; margin-top: 2rem; cursor: pointer; border-radius: 5px; border:none; font-weight:bold;">Return to Exam</button>
        </div>

        <div class="navbar">
          <strong>Exam Portal | ${quizId}</strong>
          <div id="timer" style="font-family: monospace; font-size: 1.2rem;">Timer: 60:00</div>
        </div>

        <div class="layout">
          <div class="main-pane">
            <div id="q-box"></div>
            <div style="margin-top: 2.5rem; display: flex; justify-content: space-between;">
              <button onclick="changeQ(-1)" style="padding: 0.8rem 2.5rem; border-radius: 6px; border: 1px solid #ccc; cursor:pointer;">Previous</button>
              <button onclick="changeQ(1)" style="padding: 0.8rem 2.5rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight:bold;">Next Question</button>
            </div>
          </div>
          <div class="side-pane">
            <h3 style="margin-top:0;">Question Navigator</h3>
            <div class="grid" id="q-grid"></div>
            <div style="margin-top: 2rem; font-size: 0.85rem; color: #64748b;">
               Tip: Questions marked green are answered.
            </div>
            <button class="btn-finish" onclick="confirmSubmit()">SUBMIT EXAMINATION</button>
          </div>
        </div>

        <script>
          const QUESTIONS = ${serializedQuestions};
          const ANSWERS = {};
          let currentIdx = 0;
          let warnings = 0;
          let submitted = false;

          // Proctoring Logic
          window.onblur = () => {
            if(submitted) return;
            warnings++;
            if(warnings >= 3) {
              alert("3 security warnings reached. Your exam is being auto-submitted.");
              finalize();
            } else {
              document.getElementById('warn-overlay').style.display = 'flex';
              document.getElementById('warn-title').innerText = "WARNING " + warnings + "/3";
            }
          };

          function closeWarn() { document.getElementById('warn-overlay').style.display = 'none'; }

          function render() {
            const q = QUESTIONS[currentIdx];
            const qId = q.question_id; // Using the explicit ID from backend
            
            document.getElementById('q-box').innerHTML = \`
              <div style="color: #64748b; font-weight: bold; margin-bottom: 0.5rem;">QUESTION \${currentIdx + 1} OF \${QUESTIONS.length}</div>
              <div class="q-text">\${q.question}</div>
              <div>
                \${q.options.map((opt, index) => \`
                  <div class="opt-card \${ANSWERS[qId] === opt ? 'selected' : ''}" 
                       onclick="save('\${qId}', \\\`\${opt.replace(/'/g, "\\\\'")}\\\`)">
                    <span style="margin-right:10px; opacity:0.6;">\${String.fromCharCode(65 + index)}.</span> \${opt}
                  </div>
                \`).join('')}
              </div>
            \`;

            document.getElementById('q-grid').innerHTML = QUESTIONS.map((_, i) => {
              const id = QUESTIONS[i].question_id;
              let cls = 'grid-item';
              if (ANSWERS[id]) cls += ' filled';
              if (i === currentIdx) cls += ' current';
              return \`<div class="\${cls}" onclick="currentIdx=\${i};render()">\${i+1}</div>\`;
            }).join('');
          }

          window.save = (id, val) => { ANSWERS[id] = val; render(); };
          window.changeQ = (dir) => { 
            const newIdx = currentIdx + dir;
            if(newIdx >= 0 && newIdx < QUESTIONS.length) { currentIdx = newIdx; render(); }
          };

          function finalize() {
            if(submitted) return;
            submitted = true;
            
            // Post to the submission route we updated in the backend
            fetch("https://quiz-gen-hp29.onrender.com/student/quiz/${quizId}/submit", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json", 
                "Authorization": "Bearer ${safeToken}" 
              },
              body: JSON.stringify({ answers: ANSWERS })
            })
            .then(res => res.json())
            .then(data => {
              // Notify parent tab to redirect before closing
              if(window.opener) {
                window.opener.postMessage("QUIZ_COMPLETE", "*");
              }
              window.close();
            })
            .catch(() => { 
              submitted = false; 
              alert("Submission failed. Check your internet connection."); 
            });
          }

          window.confirmSubmit = () => { 
            if(confirm("Are you sure you want to finish the exam? This cannot be undone.")) {
               finalize(); 
            }
          };

          render();
        </script>
      </body>
      </html>
    `;
    popup.document.write(popupHtml);
  };

  // 4. UI Rendering
  if (loading) return <div style={{ textAlign: "center", marginTop: "100px", fontFamily: "sans-serif" }}>Verifying Examination Session...</div>;

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
      <div style={{ maxWidth: "500px", width: "100%", background: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", textAlign: "center" }}>
        <h1 style={{ marginBottom: "10px", color: "#0f172a", fontSize: "2rem" }}>Ready to Start?</h1>
        <h3 style={{ color: "#3b82f6", marginBottom: "20px", fontWeight: "500" }}>Quiz: {quizId}</h3>

        {error ? (
          <div style={{ padding: "15px", background: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "20px", border: "1px solid #fee2e2" }}>
            {error}
          </div>
        ) : (
          <>
            <div style={{ textAlign: "left", background: "#f8fafc", padding: "20px", borderRadius: "12px", marginBottom: "30px", fontSize: "0.95rem", color: "#475569", lineHeight: "1.6" }}>
              <p style={{ margin: "0 0 10px 0", fontWeight: "bold", color: "#1e293b" }}>Examination Rules:</p>
              <ul style={{ paddingLeft: "20px", margin: 0 }}>
                <li>The exam will open in a new secure window.</li>
                <li><strong>Tab-switching</strong> is tracked (3 strikes policy).</li>
                <li>Right-click and text copying are disabled.</li>
                <li>Progress is auto-submitted on strike-out.</li>
              </ul>
            </div>
            <button
              onClick={startSecureExam}
              style={{ width: "100%", padding: "16px", background: "#3b82f6", color: "white", border: "none", borderRadius: "10px", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer", transition: "transform 0.1s" }}
              onMouseDown={(e) => e.target.style.transform = "scale(0.98)"}
              onMouseUp={(e) => e.target.style.transform = "scale(1)"}
            >
              Enter Secure Portal
            </button>
          </>
        )}

        <button
          onClick={() => navigate("/student")}
          style={{ marginTop: "20px", background: "none", border: "none", color: "#64748b", cursor: "pointer", textDecoration: "none", fontSize: "0.9rem" }}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default StudentQuiz;