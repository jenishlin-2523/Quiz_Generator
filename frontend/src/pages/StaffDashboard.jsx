import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
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
  const [showModal, setShowModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const token = localStorage.getItem("access_token");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchRecentQuizzes();
  }, []);

  const fetchRecentQuizzes = async () => {
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:8000/staff/quizzes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentQuizzes(res.data.quizzes || []);
    } catch (err) {
      console.error("Error fetching quizzes:", err);
    }
  };

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
      setMessage("🔄 Analyzing content & generating OBE questions...");
      await axios.post("http://localhost:8000/staff/quiz/upload", formData, {
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

  const handleViewQuiz = async (quiz_id) => {
    if (!token) return;
    try {
      const res = await axios.get(`http://localhost:8000/staff/quiz/${quiz_id}`, {
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
      <nav className="side-nav">
        <div className="logo">OBE<span>GEN</span></div>
        <ul className="nav-links">
          <li className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>Dashboard</li>
          <li className={activeTab === "quizzes" ? "active" : ""} onClick={() => setActiveTab("quizzes")}>My Quizzes</li>
        </ul>
      </nav>

      <main className="main-content">
        <header className="top-bar">
          <div>
            <h1>{activeTab === "dashboard" ? "Staff Dashboard" : "My Quizzes"}</h1>
            <p>{activeTab === "dashboard" ? "Generate OBE quizzes from material." : "Manage your assessment library."}</p>
          </div>
          <div className="user-profile">Prof. Staff</div>
        </header>

        {activeTab === "dashboard" ? (
          <div className="content-grid">
            {/* GENERATOR */}
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
              {courseId && (
                <div className="form-group">
                  <label>Course Outcomes</label>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    {COURSE_DATA[courseId].cos.map((co, i) => <li key={i}>{co}</li>)}
                  </ul>
                </div>
              )}
              <div className="form-group">
                <label>Quiz Title</label>
                <input type="text" placeholder="e.g. Unit 1 Quiz" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <button className="primary-btn" onClick={handleUpload} disabled={isLoading}>
                {isLoading ? "Generating..." : "Generate Smart Quiz"}
              </button>
              {message && <p className={`status-msg ${message.includes('✅') ? 'success' : ''}`}>{message}</p>}
            </section>

            {/* RECENT GENERATIONS UI */}
            <section className="card history-section">
              <div className="section-header">
                <h2 className="card-title">Recent Generations</h2>
                <span className="badge-count">{recentQuizzes.length}</span>
              </div>
              <div className="quiz-list mini">
                {recentQuizzes.slice(0, 5).map((quiz) => (
                  <div key={quiz.quiz_id} className="quiz-item-mini">
                    <div className="quiz-status-indicator"></div>
                    <div className="quiz-info">
                      <div className="quiz-main-row">
                        <h4>{quiz.title}</h4>
                        <span className="mini-course-code">{quiz.course_id}</span>
                      </div>
                      <div className="quiz-sub-row">
                        <span>{quiz.questions_count} Qs</span>
                        <span className="dot">•</span>
                        <span>{new Date(quiz.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button className="icon-btn-view" onClick={() => handleViewQuiz(quiz.quiz_id)}>View</button>
                  </div>
                ))}
                {recentQuizzes.length > 0 && (
                  <button className="view-all-link" onClick={() => setActiveTab("quizzes")}>view all assessments →</button>
                )}
              </div>
            </section>
          </div>
        ) : (
          /* FULL LIBRARY VIEW */
          <section className="card">
            <h2 className="card-title">All Assessments</h2>
            <div className="quiz-grid-layout">
              {recentQuizzes.map((quiz) => (
                <div key={quiz.quiz_id} className="quiz-card-item">
                  <span className="course-badge">{quiz.course_id} / {COURSE_DATA[quiz.course_id]?.name || 'Unknown'}</span>
                  <h3>{quiz.title}</h3>
                  <p>{quiz.questions_count} Questions • {new Date(quiz.created_at).toLocaleDateString()}</p>
                  <div className="actions">
                    <button className="secondary-btn" onClick={() => handleViewQuiz(quiz.quiz_id)}>View</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default StaffDashboard;