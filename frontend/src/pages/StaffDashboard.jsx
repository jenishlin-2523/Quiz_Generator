import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
// import { Link } from "react-router-dom";
import "../styles/Dashboard.css";

const COURSE_DATA = {
  "AI-301": { 
    name: "Artificial Intelligence", 
    cos: [
      "CO1: Understand core AI concepts like agents, search algorithms, and knowledge representation.",
      "CO2: Apply uninformed and informed search techniques to solve planning problems.",
      "CO3: Implement logic-based reasoning using propositional and predicate logic.",
      "CO4: Design simple expert systems for decision-making tasks.",
      "CO5: Analyze game-playing algorithms like minimax for adversarial scenarios."
    ] 
  },
  "ML-401": { 
    name: "Machine Learning", 
    cos: [
      "CO1: Explain supervised, unsupervised, and reinforcement learning paradigms.",
      "CO2: Implement regression and classification models with evaluation metrics.",
      "CO3: Apply clustering and dimensionality reduction techniques to datasets.",
      "CO4: Optimize models using cross-validation and hyperparameter tuning.",
      "CO5: Assess ethical issues in ML deployment and bias mitigation."
    ] 
  },
  "DM-302": { 
    name: "Data Mining", 
    cos: [
      "CO1: Identify data mining tasks like classification, clustering, and association rules.",
      "CO2: Preprocess datasets including handling missing values and outliers.",
      "CO3: Apply decision trees, neural networks, and ensemble methods for prediction.",
      "CO4: Evaluate mining results using precision, recall, and ROC curves.",
      "CO5: Mine frequent patterns with algorithms like Apriori for real-world applications."
    ] 
  },
  "BDA-402": { 
    name: "Big Data Analytics", 
    cos: [
      "CO1: Understand big data characteristics (volume, velocity, variety) and Hadoop ecosystem.",
      "CO2: Process large datasets using MapReduce and Spark frameworks.",
      "CO3: Analyze streaming data with tools like Kafka and Spark Streaming.",
      "CO4: Implement NoSQL databases for scalable storage and querying.",
      "CO5: Visualize and interpret big data insights for business decision-making."
    ] 
  }
};

function StaffDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard"); 
  const [pdf, setPdf] = useState(null);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [message, setMessage] = useState("");
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // New States for Results Tab
  const [selectedCourseResults, setSelectedCourseResults] = useState(null);
  const [resultsData, setResultsData] = useState([]);
  const [isResultsLoading, setIsResultsLoading] = useState(false);

  const token = localStorage.getItem("access_token");
  const fileInputRef = useRef(null);

  // --- FETCH QUIZZES ---
  const fetchRecentQuizzes = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get("https://quiz-gen-hp29.onrender.com/staff/quizzes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentQuizzes(res.data.quizzes || []);
    } catch (err) {
      console.error("Error fetching quizzes:", err);
    }
  }, [token]);

  // --- FETCH RESULTS FOR SPECIFIC COURSE ---
  const fetchResultsByCourse = async (courseCode) => {
    setIsResultsLoading(true);
    setSelectedCourseResults(courseCode);
    try {
      const res = await axios.get(`https://quiz-gen-hp29.onrender.com/staff/results/${courseCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResultsData(res.data.results || []);
    } catch (err) {
      console.error("Error fetching results", err);
      setResultsData([]);
    } finally {
      setIsResultsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentQuizzes();
  }, [fetchRecentQuizzes]);

  // --- HANDLE QUIZ UPLOAD ---
  const handleUpload = async () => {
    if (!pdf || !courseId || !title || !numQuestions) {
      alert("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("pdf", pdf);
    formData.append("course_id", courseId);
    formData.append("title", title);
    formData.append("num_questions", numQuestions);
    formData.append("course_outcomes", JSON.stringify(COURSE_DATA[courseId].cos));

    try {
      setMessage("🔄 Analyzing content & generating questions...");
      await axios.post("https://quiz-gen-hp29.onrender.com/staff/quiz/upload", formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });

      setMessage("✅ Quiz generated successfully!");
      fetchRecentQuizzes();
      setPdf(null);
      setCourseId("");
      setTitle("");
      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (err) {
      setMessage("❌ Failed to generate quiz.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- VIEW INDIVIDUAL QUIZ POPUP ---
  const handleViewQuiz = async (quiz_id) => {
    if (!token) return;
    try {
      const res = await axios.get(`https://quiz-gen-hp29.onrender.com/staff/quiz/${quiz_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const quiz = res.data;
      const popup = window.open("", "_blank", "width=900,height=800");
      popup.document.write(`
        <html>
        <head>
          <title>${quiz.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 40px; color: #1e293b; }
            .container { max-width: 800px; margin: auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .q-box { border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; list-style: none; padding: 0; }
            .options li { background: #f1f5f9; padding: 10px; border-radius: 6px; font-size: 0.9rem; }
            .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
            .co-tag { font-size: 0.75rem; background: #eef2ff; color: #4338ca; padding: 4px 12px; border-radius: 99px; font-weight: 700; }
            .ans { font-weight: 700; color: #059669; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${quiz.title}</h1>
            <p>Course: ${quiz.course_id}</p>
            ${quiz.questions.map((q, i) => `
              <div class="q-box">
                <strong>Q${i + 1}: ${q.question}</strong>
                <ul class="options">${q.options.map(o => `<li>${o}</li>`).join("")}</ul>
                <div class="footer">
                  <span class="ans">✓ ${q.answer}</span>
                  <span class="co-tag">${q.co_tag}</span>
                </div>
              </div>
            `).join("")}
            <button class="no-print" onclick="window.print()">Print PDF</button>
          </div>
        </body>
        </html>
      `);
      popup.document.close();
    } catch (err) { alert("Error loading quiz."); }
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="side-nav" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
  <div className="logo">QUIZ<span>GEN</span></div>
  
  <ul className="nav-links" style={{ marginBottom: "10px" }}> {/* Removed flex: 1 to stop pushing down */}
    <li className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>Dashboard</li>
    <li className={activeTab === "quizzes" ? "active" : ""} onClick={() => setActiveTab("quizzes")}>My Quizzes</li>
    <li className={activeTab === "results" ? "active" : ""} onClick={() => { setActiveTab("results"); setSelectedCourseResults(null); }}>Results</li>
  </ul>

  {/* This container holds the line and the button. It is now moved up. */}
  <div style={{ 
    padding: "15px 20px", 
    borderTop: "1px solid #e2e8f0", 
    marginTop: "430px"  // Controls the gap between "Results" and the line
  }}>
    <button 
      style={{
        width: "100%",
        padding: "8px 10px", // Reduced from 30px to keep it small
        backgroundColor: "#f1f5f9",
        color: "#64748b",
        border: "1px solid #e2e8f0",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s ease"
      }} 
      onMouseOver={(e) => { 
        e.currentTarget.style.background = "#fee2e2"; 
        e.currentTarget.style.color = "#ef4444"; 
      }}
      onMouseOut={(e) => { 
        e.currentTarget.style.background = "#f1f5f9"; 
        e.currentTarget.style.color = "#64748b"; 
      }}
      onClick={() => { localStorage.clear(); window.location.assign("/"); }}
    >
      Logout
    </button>
  </div>
</nav>

      <main className="main-content">
        <header className="top-bar">
          <div>
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <p>Welcome back, Prof. Staff</p>
          </div>
          <div className="user-profile">Prof. Staff</div>
        </header>

        {/* --- DASHBOARD TAB --- */}
        {activeTab === "dashboard" && (
          <div className="content-grid">
            <section className="card generator-card">
              <h2 className="card-title">Quiz Generator</h2>
              <div className="form-group">
                <label>Upload Study Material (PDF)</label>
                <div className={`dropzone ${pdf ? 'has-file' : ''}`} onClick={() => fileInputRef.current.click()}>
                  {pdf ? <span>📄 {pdf.name}</span> : <span>Click to select PDF</span>}
                  <input type="file" ref={fileInputRef} hidden accept="application/pdf" onChange={(e) => setPdf(e.target.files[0])} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Select Course</label>
                  <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                    <option value="">Choose Subject</option>
                    {Object.keys(COURSE_DATA).map(code => <option key={code} value={code}>{code}: {COURSE_DATA[code].name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Questions</label>
                  <input type="number" min="5" max="50" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Quiz Title</label>
                <input type="text" placeholder="e.g. Unit 1 Quiz" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <button className="primary-btn" onClick={handleUpload} disabled={isLoading}>
                {isLoading ? "Generating..." : "Generate Smart Quiz"}
              </button>
              {message && <p className={`status-msg ${message.includes('✅') ? 'success' : ''}`}>{message}</p>}
            </section>

            <section className="card history-section">
              <h2 className="card-title">Recent Generations</h2>
              <div className="quiz-list mini">
                {recentQuizzes.slice(0, 5).map((quiz) => (
                  <div key={quiz.quiz_id} className="quiz-item-mini">
                    <div className="quiz-info">
                      <h4>{quiz.title}</h4>
                      <span>{quiz.course_id} • {quiz.questions_count} Qs</span>
                    </div>
                    <button className="icon-btn-view" onClick={() => handleViewQuiz(quiz.quiz_id)}>View</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* --- MY QUIZZES TAB --- */}
        {activeTab === "quizzes" && (
          <section className="card">
            <h2 className="card-title">Assessment Library</h2>
            <div className="quiz-grid-layout">
              {recentQuizzes.map((quiz) => (
                <div key={quiz.quiz_id} className="quiz-card-item">
                  <span className="course-badge">{quiz.course_id}</span>
                  <h3>{quiz.title}</h3>
                  <p>{quiz.questions_count} Questions</p>
                  <button className="secondary-btn" onClick={() => handleViewQuiz(quiz.quiz_id)}>View Quiz</button>
                </div>
              ))}
            </div>
          </section>
        )}
{/* --- RESULTS TAB --- */}
{activeTab === "results" && (
  <section className="results-container" style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
    {!selectedCourseResults ? (
      <>
        <div className="section-header" style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "1.8rem", color: "#1e293b", fontWeight: "700" }}>Subject Performance</h2>
          <p style={{ color: "#64748b" }}>Select a course to view detailed analytics and top performers.</p>
        </div>
        
        <div className="quiz-grid-layout" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {Object.keys(COURSE_DATA).map((code) => (
            <div 
              key={code} 
              className="subject-card-saas" 
              onClick={() => fetchResultsByCourse(code)}
              style={{
                background: "white",
                padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: "1px solid #f1f5f9"
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "#3b82f6"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "#f1f5f9"; }}
            >
              <span style={{ background: "#eff6ff", color: "#3b82f6", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" }}>{code}</span>
              <h3 style={{ marginTop: "12px", color: "#0f172a", fontSize: "1.2rem" }}>{COURSE_DATA[code].name}</h3>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "4px" }}>Click to view leaderboard</p>
            </div>
          ))}
        </div>
      </>
    ) : (
      <>
        <div className="results-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button 
              onClick={() => setSelectedCourseResults(null)}
              style={{ padding: "10px 16px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", cursor: "pointer", fontWeight: "600", color: "#475569", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
            >
              ← Back
            </button>
            <div>
              <h2 style={{ fontSize: "1.5rem", color: "#0f172a", margin: 0 }}>{selectedCourseResults} Analytics</h2>
              <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem" }}>Real-time student leaderboard</p>
            </div>
          </div>
          <div style={{ background: "#f1f5f9", padding: "8px 16px", borderRadius: "8px", color: "#475569", fontWeight: "600", fontSize: "0.9rem" }}>
            Total Submissions: {resultsData?.length || 0}
          </div>
        </div>

        {isResultsLoading ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <div className="spinner" style={{ border: "3px solid #f3f3f3", borderTop: "3px solid #3b82f6", borderRadius: "50%", width: "30px", height: "30px", animation: "spin 1s linear infinite", margin: "0 auto" }}></div>
            <p style={{ color: "#64748b", marginTop: "15px", fontWeight: "500" }}>Fetching topper list...</p>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden", border: "1px solid #f1f5f9" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #f1f5f9" }}>
                  <th style={{ padding: "16px 24px", color: "#64748b", fontWeight: "600", fontSize: "0.75rem", textTransform: "uppercase" }}>Rank</th>
                  <th style={{ padding: "16px 24px", color: "#64748b", fontWeight: "600", fontSize: "0.75rem", textTransform: "uppercase" }}>Student Name</th>
                  <th style={{ padding: "16px 24px", color: "#64748b", fontWeight: "600", fontSize: "0.75rem", textTransform: "uppercase" }}>Quiz</th>
                  <th style={{ padding: "16px 24px", color: "#64748b", fontWeight: "600", fontSize: "0.75rem", textTransform: "uppercase" }}>Performance</th>
                  <th style={{ padding: "16px 24px", color: "#64748b", fontWeight: "600", fontSize: "0.75rem", textTransform: "uppercase" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {resultsData && resultsData.length > 0 ? (
                  resultsData.map((res, index) => {
                    // DEFENSIVE: Convert to Number just in case they are strings
                    const currentScore = Number(res.score) || 0;
                    const currentTotal = Number(res.total) || 10;

                    // COLOR LOGIC (0-2: Red, 3-6: Orange, 7-10: Green)
                    let statusColor = "#ef4444"; 
                    let statusBg = "#fef2f2";
                    
                    if (currentScore >= 7) {
                      statusColor = "#10b981"; 
                      statusBg = "#ecfdf5";
                    } else if (currentScore >= 3) {
                      statusColor = "#f59e0b"; 
                      statusBg = "#fffbeb";
                    }

                    return (
                      <tr key={res.result_id || index} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{ 
                            fontWeight: "800", 
                            color: index === 0 ? "#f59e0b" : "#94a3b8",
                            fontSize: index < 3 ? "1.1rem" : "0.9rem"
                          }}>
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ fontWeight: "600", color: "#1e293b" }}>{res.username || "Unknown Student"}</div>
                        </td>
                        <td style={{ padding: "16px 24px", color: "#64748b", fontSize: "0.9rem" }}>{res.quiz_title}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            padding: "6px 12px", 
                            borderRadius: "20px", 
                            backgroundColor: statusBg, 
                            color: statusColor,
                            fontWeight: "700",
                            fontSize: "0.85rem"
                          }}>
                            {/* Rendering the mark here */}
                            {currentScore} / {currentTotal}
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px", color: "#94a3b8", fontSize: "0.85rem" }}>
                          {res.submitted_at ? new Date(res.submitted_at).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: "60px 24px", textAlign: "center" }}>
                       <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No student records found.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </>
    )}
  </section>
)}
      </main>
    </div>
  );
}

export default StaffDashboard;