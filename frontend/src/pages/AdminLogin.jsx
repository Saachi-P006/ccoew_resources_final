import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:5000";

function AdminLogin() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API}/admin/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      localStorage.setItem("is_admin", "true");
      navigate("/admin/dashboard");
    } catch {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ borderTop: "4px solid #800000" }}>
        <p
          style={{ textAlign: "left", cursor: "pointer", color: "#800000", marginBottom: "12px", fontSize: "14px" }}
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </p>

        <h2 style={{ color: "#800000" }}>Admin Login</h2>
        <p className="login-sub">College Resource Portal</p>

        {error && <p className="error-msg">{error}</p>}

        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email" placeholder="Admin Email"
            value={email} onChange={e => setEmail(e.target.value)} required
          />
          <input
            type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)} required
          />
          <button
            type="submit" disabled={loading}
            style={{ background: loading ? "#aaa" : "#800000" }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;