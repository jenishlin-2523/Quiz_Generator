import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import '../styles/login.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "student" // Automatically set to student
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const response = await axios.post("https://quiz-gen-hp29.onrender.com/auth/register", formData);
      
      if (response.status === 201) {
        alert("Registration successful! You can now login.");
        navigate("/");
      }
    } catch (error) {
      if (error.response) {
        setErrorMsg(error.response.data.msg || "Registration failed.");
      } else {
        setErrorMsg("Server is unreachable. Try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-image">
          <img src="/login.jpg" alt="Register Visual" />
        </div>
        <div className="login-form">
          <h2>Student Registration</h2>
          {errorMsg && <p className="login-error">{errorMsg}</p>}
          
          <form onSubmit={handleSubmit}>
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              required
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />

            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              required
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Create a password"
              required
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="register-link-text" style={{ marginTop: "20px", textAlign: "center", fontSize: "0.9rem" }}>
            Already have an account?{" "}
            <Link to="/" style={{ color: "#007bff", textDecoration: "none", fontWeight: "bold" }}>
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;