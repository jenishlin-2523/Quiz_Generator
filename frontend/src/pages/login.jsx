// src/pages/Login.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:8000/auth/login", {
        email,
        password,
      });

      const { access_token, role } = response.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("role", role);

      if (role === "staff") {
        navigate("/staff");
      } else if (role === "student") {
        navigate("/student");
      } else {
        setErrorMsg("Unknown user role");
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        // Server responded with a status other than 2xx
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
        setErrorMsg(error.response.data.msg || "Login failed. Please try again.");
      } else if (error.request) {
        // Request was made but no response received
        console.error("No response received:", error.request);
        setErrorMsg("No response from server. Please try again later.");
      } else {
        // Something else happened while setting up the request
        console.error("Error message:", error.message);
        setErrorMsg("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "2rem auto",
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>Login</h2>
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Email:</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
            required
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>Password:</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
            required
          />
        </div>
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
