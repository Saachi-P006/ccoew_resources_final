import React, { useState, useEffect } from "react";
import "./Roadmaps.css";
import scrapbookBg from "../assets/image.png";

// Images
import DSARoadmap             from "../assets/DSARoadmap.jpg";
import JavaRoadmap            from "../assets/JavaRoadmap.jpg";
import AndroidRoadmap         from "../assets/AndroidRoadmap.svg";
import WebDevelopmentRoadmap  from "../assets/WebdevelopmentRoadmap.png";
import MLRoadmap              from "../assets/MLRoadmap.webp";
import CybersecurityRoadmap   from "../assets/CybersecurityRoadmap.jpg";
import StartupRoadmap         from "../assets/StartupRoadmap.jpg";
import AIRoadmap              from "../assets/AIRoadmap.gif";
import FullstackRoadmap       from "../assets/FullstackRoadmap.jpg";
import DatascienceRoadmap     from "../assets/DatascienceRoadmap.png";

const API = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:5000";

function Roadmaps() {
  const [selectedImage, setSelectedImage] = useState(null);

  // Playlists
  const [playlists,     setPlaylists]     = useState([]);
  const [showModal,     setShowModal]     = useState(false);
  const [newTitle,      setNewTitle]      = useState("");
  const [newUrl,        setNewUrl]        = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitMsg,     setSubmitMsg]     = useState("");
  const [submitting,    setSubmitting]    = useState(false);

  // Detect if teacher is logged in
  const teacherId   = localStorage.getItem("teacher_id");
  const teacherName = localStorage.getItem("teacher_name");
  const isTeacher   = !!teacherId;

  const roadmapData = [
    { title: "Roadmap to DSA",     img: DSARoadmap,            side: "left"  },
    { title: "Java Roadmap",       img: JavaRoadmap,           side: "left"  },
    { title: "Android Development",img: AndroidRoadmap,        side: "left"  },
    { title: "Startup Roadmap",    img: StartupRoadmap,        side: "left"  },
    { title: "AI Roadmap",         img: AIRoadmap,             side: "left"  },
    { title: "Web Development",    img: WebDevelopmentRoadmap, side: "right" },
    { title: "Machine Learning",   img: MLRoadmap,             side: "right" },
    { title: "Cyber Security",     img: CybersecurityRoadmap,  side: "right" },
    { title: "Fullstack Roadmap",  img: FullstackRoadmap,      side: "right" },
    { title: "Data Science",       img: DatascienceRoadmap,    side: "right" },
  ];

  useEffect(() => { fetchPlaylists(); }, []);

  function fetchPlaylists() {
    fetch(`${API}/playlists`)
      .then(r => r.json())
      .then(data => setPlaylists(Array.isArray(data) ? data : []))
      .catch(console.error);
  }

  // ---------- CLICK TRACKING ----------
  function handleResourceClick(playlistId) {
    // Fire and forget — don't block navigation
    fetch(`${API}/playlists/${playlistId}/click`, { method: "POST" }).catch(console.error);
  }

  function openModal() {
    setNewTitle(""); setNewUrl(""); setSubmitterName("");
    setSubmitMsg(""); setShowModal(true);
  }

  function closeModal() { setShowModal(false); setSubmitMsg(""); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true); setSubmitMsg("");

    try {
      if (isTeacher) {
        const res  = await fetch(`${API}/teacher/playlist`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ title: newTitle, url: newUrl, teacher_name: teacherName }),
        });
        const data = await res.json();
        if (!res.ok) { setSubmitMsg("❌ " + (data.error || "Failed")); return; }
        setSubmitMsg("✅ Added successfully!");
        fetchPlaylists();
      } else {
        const res  = await fetch(`${API}/student/playlist`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ title: newTitle, url: newUrl, submitted_by: submitterName }),
        });
        const data = await res.json();
        if (!res.ok) { setSubmitMsg("❌ " + (data.error || "Failed")); return; }
        setSubmitMsg("✅ Submitted! Pending admin approval.");
      }
      setNewTitle(""); setNewUrl(""); setSubmitterName("");
      setTimeout(closeModal, 1500);
    } catch {
      setSubmitMsg("❌ Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  // Split into two groups for the section label
  const teacherResources = playlists.filter(p => p.role === "teacher");
  const studentResources = playlists.filter(p => p.role === "student");

  return (
    <div className="roadmaps-wrapper">

      {/* ── SCRAPBOOK (unchanged) ── */}
      <div
        className="scrapbook-container"
        style={{ backgroundImage: `url(${scrapbookBg})` }}
      >
        {roadmapData.map((item, index) => (
          <div
            key={index}
            className={`roadmap-strip ${item.side}-strip`}
            onClick={() => setSelectedImage(item.img)}
          >
            {item.title}
          </div>
        ))}
      </div>

      {/* ── RESOURCES PANEL ── */}
      <div className="resources-panel">

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ margin: 0 }}>Top Learning Resources</h3>
          <button
            onClick={openModal}
            title={isTeacher ? "Add a resource" : "Suggest a resource"}
            style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "#800000", color: "white", border: "none",
              fontSize: "18px", cursor: "pointer", lineHeight: "28px",
              textAlign: "center", flexShrink: 0,
            }}
          >
            +
          </button>
        </div>

        {/* Scrollable list */}
        <div className="resources-grid">

          {/* ── Teacher resources ── */}
          {teacherResources.length > 0 && (
            <>
              <p style={{
                fontSize: "10px", fontWeight: 700, color: "#800000",
                textTransform: "uppercase", letterSpacing: "0.8px",
                margin: "0 0 2px",
              }}>
                📌 By Teachers
              </p>
              {teacherResources.map((res) => (
                <a
                  key={res.id}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card"
                  onClick={() => handleResourceClick(res.id)}
                  style={{
                    borderLeft: "6px solid #800000",
                    background: "#fff0f0",
                    color: "#5a0000",
                  }}
                >
                  {res.title}
                </a>
              ))}
            </>
          )}

          {/* ── Student resources ── */}
          {studentResources.length > 0 && (
            <>
              <p style={{
                fontSize: "10px", fontWeight: 700, color: "#555",
                textTransform: "uppercase", letterSpacing: "0.8px",
                margin: "8px 0 2px",
              }}>
                🔥 Popular from Students
              </p>
              {studentResources.map((res) => (
                <a
                  key={res.id}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card"
                  onClick={() => handleResourceClick(res.id)}
                >
                  {res.title}
                  {res.clicks > 0 && (
                    <span style={{
                      marginLeft: "8px", fontSize: "10px",
                      color: "#888", fontWeight: 400,
                    }}>
                      {res.clicks} {res.clicks === 1 ? "click" : "clicks"}
                    </span>
                  )}
                </a>
              ))}
            </>
          )}

          {playlists.length === 0 && (
            <p style={{ color: "#aaa", fontSize: "13px" }}>No resources yet.</p>
          )}

        </div>
      </div>

      {/* ── ADD / SUGGEST MODAL (unchanged) ── */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: "white", borderRadius: "12px",
              padding: "28px", width: "min(420px, 92vw)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#800000", fontSize: "16px" }}>
                {isTeacher ? "➕ Add Learning Resource" : "💡 Suggest a Resource"}
              </h3>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#888" }}>✕</button>
            </div>

            {!isTeacher && (
              <p style={{ fontSize: "12px", color: "#888", marginBottom: "14px", background: "#fff8e1", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ffe082" }}>
                ⏳ Your suggestion will be reviewed by an admin before going live.
              </p>
            )}

            {submitMsg && (
              <div style={{
                padding: "8px 12px", borderRadius: "6px", marginBottom: "12px", fontSize: "13px",
                background: submitMsg.startsWith("✅") ? "#e8f8f0" : "#fdecea",
                color:      submitMsg.startsWith("✅") ? "#1a7a4a" : "#c0392b",
              }}>
                {submitMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {!isTeacher && (
                <input
                  type="text" placeholder="Your Name"
                  value={submitterName} onChange={e => setSubmitterName(e.target.value)} required
                  style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #ccc", fontFamily: "Poppins, sans-serif", fontSize: "14px" }}
                />
              )}
              <input
                type="text" placeholder="Resource Title (e.g. Python – Tech With Tim)"
                value={newTitle} onChange={e => setNewTitle(e.target.value)} required
                style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #ccc", fontFamily: "Poppins, sans-serif", fontSize: "14px" }}
              />
              <input
                type="url" placeholder="URL (YouTube, GitHub, Coursera...)"
                value={newUrl} onChange={e => setNewUrl(e.target.value)} required
                style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #ccc", fontFamily: "Poppins, sans-serif", fontSize: "14px" }}
              />
              <button
                type="submit" disabled={submitting}
                style={{
                  padding: "11px", background: submitting ? "#aaa" : "#800000",
                  color: "white", border: "none", borderRadius: "8px",
                  fontWeight: 600, fontSize: "14px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                {submitting ? "Submitting..." : isTeacher ? "Add Resource" : "Submit for Approval"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── ROADMAP IMAGE MODAL (unchanged) ── */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedImage(null)}>×</button>
            <img src={selectedImage} alt="Roadmap" className="modal-image" />
          </div>
        </div>
      )}
    </div>
  );
}

export default Roadmaps;