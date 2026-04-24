import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherLogin.css";

function TeacherLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/teacher/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
});


      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("teacher_id", data.teacher_id);
      localStorage.setItem("teacher_name", data.name);

      navigate("/teacher/upload");
    } catch (err) {
  console.error(err);
  setError("Cannot connect to server");
}

  }

  return (
    <div className="login-page">
      <div className="login-card">
        <p className="back-home" onClick={() => navigate("/")}>
          &larr; Back to Home
        </p>

        <h2>Teacher Login</h2>

        {error && <p className="error-msg">{error}</p>}

        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default TeacherLogin;
