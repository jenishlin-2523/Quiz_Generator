import React from "react";
import "../styles/global.css";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-center">
      <div className="container">
        <h1>Welcome to Quiz Generator</h1>
        <p>Select your role to proceed:</p>
        <div className="role-buttons">
          <button className="button" onClick={() => navigate("/staff")}>
            Staff Dashboard
          </button>
          <button className="button" onClick={() => navigate("/student")}>
            Student Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
