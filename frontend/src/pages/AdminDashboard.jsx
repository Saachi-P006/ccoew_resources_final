import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:5000";

const TAB_PENDING   = "pending";
const TAB_PLAYLISTS = "playlists";
const TAB_TEACHERS  = "teachers";

function AdminDashboard() {
  const navigate = useNavigate();
  const isAdmin  = localStorage.getItem("is_admin");

  const [tab, setTab] = useState(TAB_PENDING);

  // Pending resources
  const [pending,     setPending]     = useState([]);
  const [pendingLoad, setPendingLoad] = useState(false);
  const [actionMsg,   setActionMsg]   = useState("");
  const [actingId,    setActingId]    = useState(null);

  // Pending playlists
  const [pendingPlaylists,  setPendingPlaylists]  = useState([]);
  const [playlistLoad,      setPlaylistLoad]      = useState(false);
  const [playlistActionMsg, setPlaylistActionMsg] = useState("");
  const [actingPlaylistId,  setActingPlaylistId]  = useState(null);

  // Teachers
  const [teachers,    setTeachers]    = useState([]);
  const [teacherLoad, setTeacherLoad] = useState(false);
  const [deptList,    setDeptList]    = useState([]);

  // Add teacher form
  const [newName,    setNewName]    = useState("");
  const [newEmail,   setNewEmail]   = useState("");
  const [newPass,    setNewPass]    = useState("");
  const [newDept,    setNewDept]    = useState("");
  const [addMsg,     setAddMsg]     = useState("");
  const [addLoad,    setAddLoad]    = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Auth guard
  useEffect(() => { if (!isAdmin) navigate("/admin/login"); }, [isAdmin, navigate]);

  // Fetch on mount
  useEffect(() => {
    fetchPending();
    fetchPendingPlaylists();
    fetchTeachers();
    fetchDepts();
  }, []);

  async function fetchPending() {
    setPendingLoad(true);
    try {
      const res  = await fetch(`${API}/admin/pending`);
      const data = await res.json();
      setPending(Array.isArray(data) ? data : []);
    } catch { setPending([]); }
    finally { setPendingLoad(false); }
  }

  async function fetchPendingPlaylists() {
    setPlaylistLoad(true);
    try {
      const res  = await fetch(`${API}/admin/pending-playlists`);
      const data = await res.json();
      setPendingPlaylists(Array.isArray(data) ? data : []);
    } catch { setPendingPlaylists([]); }
    finally { setPlaylistLoad(false); }
  }

  async function fetchTeachers() {
    setTeacherLoad(true);
    try {
      const res  = await fetch(`${API}/admin/teachers`);
      const data = await res.json();
      setTeachers(Array.isArray(data) ? data : []);
    } catch { setTeachers([]); }
    finally { setTeacherLoad(false); }
  }

  async function fetchDepts() {
    try {
      const res  = await fetch(`${API}/departments`);
      const data = await res.json();
      setDeptList(Array.isArray(data) ? data : []);
    } catch {}
  }

  // Approve resource
  async function handleApprove(id) {
    setActingId(id); setActionMsg("");
    try {
      const res  = await fetch(`${API}/admin/approve/${id}`, { method: "POST" });
      const data = await res.json();
      setActionMsg(res.ok ? "✅ " + data.message : "❌ " + data.error);
      if (res.ok) fetchPending();
    } catch { setActionMsg("❌ Something went wrong."); }
    finally { setActingId(null); }
  }

  // Reject resource
  async function handleReject(id) {
    if (!window.confirm("Reject this submission?")) return;
    setActingId(id); setActionMsg("");
    try {
      const res  = await fetch(`${API}/admin/reject/${id}`, { method: "POST" });
      const data = await res.json();
      setActionMsg(res.ok ? "🗑️ " + data.message : "❌ " + data.error);
      if (res.ok) fetchPending();
    } catch { setActionMsg("❌ Something went wrong."); }
    finally { setActingId(null); }
  }

  // Approve playlist
  async function handleApprovePlaylist(id) {
    setActingPlaylistId(id); setPlaylistActionMsg("");
    try {
      const res  = await fetch(`${API}/admin/approve-playlist/${id}`, { method: "POST" });
      const data = await res.json();
      setPlaylistActionMsg(res.ok ? "✅ " + data.message : "❌ " + data.error);
      if (res.ok) fetchPendingPlaylists();
    } catch { setPlaylistActionMsg("❌ Something went wrong."); }
    finally { setActingPlaylistId(null); }
  }

  // Reject playlist
  async function handleRejectPlaylist(id) {
    if (!window.confirm("Reject this playlist?")) return;
    setActingPlaylistId(id); setPlaylistActionMsg("");
    try {
      const res  = await fetch(`${API}/admin/reject-playlist/${id}`, { method: "POST" });
      const data = await res.json();
      setPlaylistActionMsg(res.ok ? "🗑️ " + data.message : "❌ " + data.error);
      if (res.ok) fetchPendingPlaylists();
    } catch { setPlaylistActionMsg("❌ Something went wrong."); }
    finally { setActingPlaylistId(null); }
  }

  // Add teacher
  async function handleAddTeacher(e) {
    e.preventDefault();
    setAddLoad(true); setAddMsg("");
    try {
      const res  = await fetch(`${API}/admin/teacher`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: newName, email: newEmail, password: newPass, department_id: newDept || null }),
      });
      const data = await res.json();
      if (!res.ok) { setAddMsg("❌ " + (data.error || "Failed")); return; }
      setAddMsg("✅ Teacher added!");
      setNewName(""); setNewEmail(""); setNewPass(""); setNewDept("");
      fetchTeachers();
    } catch { setAddMsg("❌ Server error"); }
    finally { setAddLoad(false); }
  }

  // Delete teacher
  async function handleDeleteTeacher(id) {
    if (!window.confirm("Delete this teacher?")) return;
    setDeletingId(id);
    try {
      const res  = await fetch(`${API}/admin/teacher/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) fetchTeachers();
      else alert(data.error || "Delete failed");
    } catch { alert("Server error"); }
    finally { setDeletingId(null); }
  }

  function logout() { localStorage.removeItem("is_admin"); navigate("/"); }

  // Styles
  const card = {
    background: "#fff", borderRadius: "10px", padding: "16px 18px",
    marginBottom: "10px", border: "1px solid #e8e8e8",
    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px",
  };
  const badge = (type) => ({
    display: "inline-block", fontSize: "11px", fontWeight: 600,
    padding: "2px 8px", borderRadius: "4px",
    background: type === "NOTES" ? "#eaf4ff" : type === "PYQ" ? "#fff4e6" : type === "Tutorial" ? "#f0fff4" : "#f5f0ff",
    color:      type === "NOTES" ? "#1a6fa8" : type === "PYQ" ? "#b85c00" : type === "Tutorial" ? "#1a7a3a" : "#5a2fa8",
  });
  const btnApprove = (disabled) => ({
    padding: "6px 14px", borderRadius: "6px", border: "none", fontWeight: 600,
    fontSize: "12px", cursor: disabled ? "not-allowed" : "pointer",
    background: disabled ? "#ccc" : "#27ae60", color: "white",
  });
  const btnReject = (disabled) => ({
    padding: "6px 14px", borderRadius: "6px", border: "none", fontWeight: 600,
    fontSize: "12px", cursor: disabled ? "not-allowed" : "pointer",
    background: disabled ? "#ccc" : "#800000", color: "white",
  });

  const pendingPlaylistCount = pendingPlaylists.length;
  const pendingResourceCount = pending.length;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f8", paddingBottom: "60px" }}>

      {/* Header */}
      <div style={{
        background: "#800000", color: "white",
        padding: "16px 32px", display: "flex",
        justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", color: "white" }}>Admin Dashboard</h2>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.8 }}>College Resource Portal</p>
        </div>
        <button onClick={logout} style={{
          background: "rgba(255,255,255,0.15)", color: "white",
          border: "1px solid rgba(255,255,255,0.3)", padding: "8px 16px",
          borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px",
        }}>
          Logout
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ background: "white", borderBottom: "1px solid #eee", padding: "0 32px", display: "flex", gap: "4px" }}>
        {[
          { key: TAB_PENDING,   label: `📋 Resources ${pendingResourceCount > 0 ? `(${pendingResourceCount})` : ""}` },
          { key: TAB_PLAYLISTS, label: `🎬 Playlists ${pendingPlaylistCount > 0 ? `(${pendingPlaylistCount})` : ""}` },
          { key: TAB_TEACHERS,  label: "👩‍🏫 Teachers" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "14px 20px", background: "none", border: "none",
            borderBottom: tab === t.key ? "3px solid #800000" : "3px solid transparent",
            color: tab === t.key ? "#800000" : "#666",
            fontWeight: tab === t.key ? 700 : 500,
            fontSize: "14px", cursor: "pointer", fontFamily: "Poppins, sans-serif",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: "860px", margin: "30px auto", padding: "0 20px" }}>

        {/* ════ PENDING RESOURCES ════ */}
        {tab === TAB_PENDING && (
          <>
            <h3 style={{ color: "#2c3e50", marginBottom: "6px" }}>Student Resource Submissions</h3>
            <p style={{ color: "#888", fontSize: "13px", marginBottom: "18px" }}>
              Review and approve or reject resources submitted by students.
            </p>
            {actionMsg && (
              <div style={{
                padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px",
                background: actionMsg.startsWith("✅") ? "#e8f8f0" : "#fdecea",
                color:      actionMsg.startsWith("✅") ? "#1a7a4a" : "#c0392b",
              }}>
                {actionMsg}
              </div>
            )}
            {pendingLoad && <p style={{ color: "#888" }}>Loading...</p>}
            {!pendingLoad && pending.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa", background: "white", borderRadius: "12px", border: "1px dashed #ddd" }}>
                <p style={{ fontSize: "32px", margin: "0 0 10px" }}>🎉</p>
                <p style={{ fontSize: "15px", margin: 0 }}>No pending submissions!</p>
              </div>
            )}
            {!pendingLoad && pending.map(item => (
              <div key={item.id} style={card}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "15px", color: "#2c3e50" }}>{item.title}</p>
                    <span style={badge(item.resource_type)}>{item.resource_type}</span>
                  </div>
                  <p style={{ margin: "2px 0", fontSize: "12px", color: "#888" }}>{item.department_name} · {item.subject_name}</p>
                  <p style={{ margin: "2px 0", fontSize: "12px", color: "#aaa" }}>
                    By: <strong style={{ color: "#555" }}>{item.submitted_by}</strong> · {new Date(item.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                  <a href={item.resource_url} target="_blank" rel="noopener noreferrer"
                    style={{ padding: "6px 14px", borderRadius: "6px", background: "#f0f0f0", color: "#444", fontSize: "12px", fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
                    👁 View
                  </a>
                  <button onClick={() => handleApprove(item.id)} disabled={actingId === item.id} style={btnApprove(actingId === item.id)}>
                    {actingId === item.id ? "..." : "✅ Approve"}
                  </button>
                  <button onClick={() => handleReject(item.id)} disabled={actingId === item.id} style={btnReject(actingId === item.id)}>
                    {actingId === item.id ? "..." : "❌ Reject"}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ════ PENDING PLAYLISTS ════ */}
        {tab === TAB_PLAYLISTS && (
          <>
            <h3 style={{ color: "#2c3e50", marginBottom: "6px" }}>Student Playlist Suggestions</h3>
            <p style={{ color: "#888", fontSize: "13px", marginBottom: "18px" }}>
              Review learning resource links submitted by students.
            </p>
            {playlistActionMsg && (
              <div style={{
                padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px",
                background: playlistActionMsg.startsWith("✅") ? "#e8f8f0" : "#fdecea",
                color:      playlistActionMsg.startsWith("✅") ? "#1a7a4a" : "#c0392b",
              }}>
                {playlistActionMsg}
              </div>
            )}
            {playlistLoad && <p style={{ color: "#888" }}>Loading...</p>}
            {!playlistLoad && pendingPlaylists.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa", background: "white", borderRadius: "12px", border: "1px dashed #ddd" }}>
                <p style={{ fontSize: "32px", margin: "0 0 10px" }}>🎉</p>
                <p style={{ fontSize: "15px", margin: 0 }}>No pending playlist suggestions!</p>
              </div>
            )}
            {!playlistLoad && pendingPlaylists.map(item => (
              <div key={item.id} style={card}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "15px", color: "#2c3e50" }}>{item.title}</p>
                  <p style={{ margin: "4px 0 2px", fontSize: "12px", color: "#3498db", wordBreak: "break-all" }}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "#3498db" }}>{item.url}</a>
                  </p>
                  <p style={{ margin: "2px 0", fontSize: "12px", color: "#aaa" }}>
                    By: <strong style={{ color: "#555" }}>{item.submitted_by}</strong> · {new Date(item.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                  <button onClick={() => handleApprovePlaylist(item.id)} disabled={actingPlaylistId === item.id} style={btnApprove(actingPlaylistId === item.id)}>
                    {actingPlaylistId === item.id ? "..." : "✅ Approve"}
                  </button>
                  <button onClick={() => handleRejectPlaylist(item.id)} disabled={actingPlaylistId === item.id} style={btnReject(actingPlaylistId === item.id)}>
                    {actingPlaylistId === item.id ? "..." : "❌ Reject"}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ════ TEACHERS ════ */}
        {tab === TAB_TEACHERS && (
          <>
            <div style={{ background: "white", borderRadius: "12px", padding: "24px", marginBottom: "24px", border: "1px solid #e8e8e8" }}>
              <h3 style={{ color: "#800000", margin: "0 0 16px" }}>Add New Teacher</h3>
              {addMsg && (
                <div style={{
                  padding: "8px 12px", borderRadius: "6px", marginBottom: "12px", fontSize: "13px",
                  background: addMsg.startsWith("✅") ? "#e8f8f0" : "#fdecea",
                  color:      addMsg.startsWith("✅") ? "#1a7a4a" : "#c0392b",
                }}>
                  {addMsg}
                </div>
              )}
              <form onSubmit={handleAddTeacher}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <input placeholder="Full Name" value={newName} required onChange={e => setNewName(e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #ccc", fontFamily: "Poppins, sans-serif" }} />
                  <input type="email" placeholder="Email" value={newEmail} required onChange={e => setNewEmail(e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #ccc", fontFamily: "Poppins, sans-serif" }} />
                  <input type="password" placeholder="Password" value={newPass} required onChange={e => setNewPass(e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #ccc", fontFamily: "Poppins, sans-serif" }} />
                  <select value={newDept} onChange={e => setNewDept(e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #ccc", fontFamily: "Poppins, sans-serif" }}>
                    <option value="">Select Department (optional)</option>
                    {deptList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={addLoad}
                  style={{ marginTop: "14px", padding: "10px 24px", background: addLoad ? "#aaa" : "#800000", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: addLoad ? "not-allowed" : "pointer", fontFamily: "Poppins, sans-serif", fontSize: "14px" }}>
                  {addLoad ? "Adding..." : "+ Add Teacher"}
                </button>
              </form>
            </div>

            <h3 style={{ color: "#2c3e50", marginBottom: "12px" }}>All Teachers ({teachers.length})</h3>
            {teacherLoad && <p style={{ color: "#888" }}>Loading...</p>}
            {!teacherLoad && teachers.length === 0 && (
              <p style={{ color: "#aaa", textAlign: "center", padding: "40px 0" }}>No teachers added yet.</p>
            )}
            {!teacherLoad && teachers.map(t => (
              <div key={t.id} style={{ ...card, alignItems: "center" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#800000", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "15px", flexShrink: 0 }}>
                  {t.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#2c3e50" }}>{t.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#888" }}>{t.email}{t.department_name ? ` · ${t.department_name}` : ""}</p>
                </div>
                <button onClick={() => handleDeleteTeacher(t.id)} disabled={deletingId === t.id}
                  style={{ padding: "6px 14px", borderRadius: "6px", border: "none", background: deletingId === t.id ? "#ccc" : "#fdecea", color: deletingId === t.id ? "#999" : "#c0392b", fontWeight: 600, fontSize: "12px", cursor: deletingId === t.id ? "not-allowed" : "pointer" }}>
                  {deletingId === t.id ? "Deleting..." : "🗑️ Remove"}
                </button>
              </div>
            ))}
          </>
        )}

      </div>
    </div>
  );
}

export default AdminDashboard;