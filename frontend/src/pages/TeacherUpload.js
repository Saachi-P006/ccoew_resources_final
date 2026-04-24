import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
];
const ALLOWED_LABEL = "PDF, DOCX, PPTX, JPG, PNG";

const TRUSTED_DOMAINS = [
  "drive.google.com",
  "docs.google.com",
  "youtube.com",
  "youtu.be",
  "coursera.org",
  "udemy.com",
  "github.com",
  "notion.so",
  "notion.site",
];

function validateUrl(url) {
  if (!url) return null;
  try {
    const parsed   = new URL(url);
    const hostname = parsed.hostname.replace("www.", "");
    if (parsed.pathname.endsWith(".pdf") || parsed.pathname.endsWith(".docx")) return null;
    if (TRUSTED_DOMAINS.some((d) => hostname === d || hostname.endsWith("." + d))) return null;
    return "⚠️ This URL doesn't look like a PDF, DOCX, or a known platform (Google Drive, YouTube, Coursera, Udemy, GitHub, Notion). Make sure it's correct and publicly accessible.";
  } catch {
    return "⚠️ Please enter a valid URL.";
  }
}

function TeacherUpload() {
  const navigate    = useNavigate();
  const teacherId   = localStorage.getItem("teacher_id");
  const teacherName = localStorage.getItem("teacher_name");

  // Upload mode
  const [uploadMode, setUploadMode] = useState("url");

  // Dropdowns
  const [departments, setDepartments] = useState([]);
  const [years,       setYears]       = useState([]);
  const [semesters,   setSemesters]   = useState([]);
  const [subjects,    setSubjects]    = useState([]);

  const [departmentId, setDepartmentId] = useState("");
  const [yearId,       setYearId]       = useState("");
  const [semesterId,   setSemesterId]   = useState("");
  const [subjectId,    setSubjectId]    = useState("");

  const [title,        setTitle]        = useState("");
  const [resourceType, setResourceType] = useState("");

  // URL mode
  const [resourceUrl, setResourceUrl] = useState("");
  const [urlWarning,  setUrlWarning]  = useState("");

  // File mode
  const [selectedFile,   setSelectedFile]   = useState(null);
  const [fileError,      setFileError]      = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Upload status
  const [msg,     setMsg]     = useState("");
  const [loading, setLoading] = useState(false);

  // My uploads
  const [myResources,        setMyResources]        = useState([]);
  const [loadingMyResources, setLoadingMyResources] = useState(false);
  const [deletingId,         setDeletingId]         = useState(null);
  const [deleteMsg,          setDeleteMsg]          = useState("");

  // ---------- AUTH ----------
  useEffect(() => {
    if (!teacherId) navigate("/teacher/login");
  }, [teacherId, navigate]);

  // ---------- FETCH DROPDOWNS ----------
  useEffect(() => {
    fetch(`${API}/departments`).then(r => r.json()).then(setDepartments).catch(console.error);
    fetch(`${API}/years`).then(r => r.json()).then(setYears).catch(console.error);
  }, []);

  useEffect(() => {
    if (!yearId) { setSemesters([]); setSemesterId(""); return; }
    fetch(`${API}/semesters?year_id=${yearId}`).then(r => r.json()).then(setSemesters).catch(console.error);
  }, [yearId]);

  useEffect(() => {
    if (!departmentId || !semesterId) { setSubjects([]); setSubjectId(""); return; }
    fetch(`${API}/subjects?department_id=${departmentId}&semester_id=${semesterId}`)
      .then(r => r.json()).then(setSubjects).catch(console.error);
  }, [departmentId, semesterId]);

  // ---------- FETCH MY UPLOADS ----------
  function fetchMyResources() {
    if (!teacherId) return;
    setLoadingMyResources(true);
    fetch(`${API}/teacher/my-resources?teacher_id=${teacherId}`)
      .then(r => r.json())
      .then(data => setMyResources(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadingMyResources(false));
  }

  useEffect(() => { fetchMyResources(); }, [teacherId]);

  // ---------- DELETE ----------
  async function handleDelete(resourceId) {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    setDeletingId(resourceId);
    setDeleteMsg("");
    try {
      const res = await fetch(`${API}/teacher/resource/${resourceId}?teacher_id=${teacherId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) { setDeleteMsg(data.error || "Delete failed"); return; }
      setDeleteMsg("✅ Resource deleted.");
      fetchMyResources();
    } catch {
      setDeleteMsg("❌ Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  // ---------- HANDLERS ----------
  function handleUrlChange(e) {
    const val = e.target.value;
    setResourceUrl(val);
    setUrlWarning(validateUrl(val) || "");
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    setFileError("");
    setSelectedFile(null);
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError(`❌ File type not allowed. Please upload: ${ALLOWED_LABEL}`);
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setFileError("❌ File too large. Maximum size is 25 MB.");
      return;
    }
    setSelectedFile(file);
  }

  function switchMode(mode) {
    setUploadMode(mode);
    setResourceUrl(""); setUrlWarning("");
    setSelectedFile(null); setFileError("");
    setUploadProgress(0); setMsg("");
  }

  function resetForm() {
    setTitle(""); setResourceUrl(""); setResourceType("");
    setUrlWarning(""); setSelectedFile(null); setFileError("");
    setUploadProgress(0); setDepartmentId(""); setYearId("");
    setSemesterId(""); setSubjectId(""); setSubjects([]);
  }

  // ---------- SUBMIT ----------
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setUploadProgress(0);

    try {
      let res;

      if (uploadMode === "url") {
        res = await fetch(`${API}/teacher/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title, resource_url: resourceUrl,
            resource_type: resourceType,
            subject_id: subjectId, teacher_id: teacherId,
          }),
        });
      } else {
        if (!selectedFile) { setMsg("Please select a file."); setLoading(false); return; }

        const formData = new FormData();
        formData.append("file",          selectedFile);
        formData.append("title",         title);
        formData.append("resource_type", resourceType);
        formData.append("subject_id",    subjectId);
        formData.append("teacher_id",    teacherId);

        res = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `${API}/teacher/upload-file`);
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable)
              setUploadProgress(Math.round((event.loaded / event.total) * 100));
          });
          xhr.onload = () => resolve({
            ok:   xhr.status >= 200 && xhr.status < 300,
            json: () => Promise.resolve(JSON.parse(xhr.responseText)),
          });
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(formData);
        });
      }

      const data = await res.json();
      if (!res.ok) { setMsg(data.error || "Upload failed"); return; }

      setMsg("✅ Resource uploaded successfully!");
      resetForm();
      fetchMyResources(); // refresh the list

    } catch (err) {
      setMsg("❌ Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function logout() { localStorage.clear(); navigate("/"); }

  // ---------- RENDER ----------
  return (
    <div className="upload-page">
      <div className="upload-card" style={{ maxWidth: "600px" }}>

        {/* Header */}
        <div className="upload-header">
          <h2>Upload Resource</h2>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>

        <p className="upload-sub">Welcome, {teacherName}</p>
        {msg && <div className="success-msg">{msg}</div>}

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
          {["url", "file"].map((mode) => (
            <button
              key={mode} type="button" onClick={() => switchMode(mode)}
              style={{
                flex: 1, padding: "10px", borderRadius: "8px", border: "2px solid",
                borderColor:     uploadMode === mode ? "#800000" : "#ccc",
                backgroundColor: uploadMode === mode ? "#800000" : "white",
                color:           uploadMode === mode ? "white"   : "#555",
                fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {mode === "url" ? "🔗 Paste URL" : "📁 Upload File"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>

          <select value={departmentId} required
            onChange={(e) => { setDepartmentId(e.target.value); setSemesterId(""); setSubjectId(""); }}>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <select value={yearId} required
            onChange={(e) => { setYearId(e.target.value); setSemesterId(""); setSubjectId(""); }}>
            <option value="">Select Year</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
          </select>

          <select value={semesterId} required disabled={!yearId}
            onChange={(e) => { setSemesterId(e.target.value); setSubjectId(""); }}>
            <option value="">Select Semester</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.semester_name}</option>)}
          </select>

          <select value={subjectId} required disabled={!semesterId || !departmentId}
            onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
          </select>

          <input type="text" placeholder="Resource Title" value={title} required
            onChange={(e) => setTitle(e.target.value)} />

          <select value={resourceType} required onChange={(e) => setResourceType(e.target.value)}>
            <option value="">Select Type</option>
            <option value="NOTES">Notes</option>
            <option value="PYQ">PYQ</option>
            <option value="Tutorial">Tutorial</option>
            <option value="Learn">Learn</option>
          </select>

          {/* URL mode */}
          {uploadMode === "url" && (
            <>
              <input type="url" placeholder="Resource URL (Google Drive, YouTube, PDF link...)"
                value={resourceUrl} required onChange={handleUrlChange} />
              {urlWarning && (
                <p style={{ color:"#b7860b", backgroundColor:"#fffbe6", border:"1px solid #ffe58f",
                  borderRadius:"6px", padding:"8px 12px", fontSize:"13px", margin:"4px 0 8px" }}>
                  {urlWarning}
                </p>
              )}
              {resourceUrl && !urlWarning && (
                <p style={{ color:"#555", fontSize:"12px", margin:"4px 0 8px" }}>
                  ✅ Looks good! Make sure the link is <strong>publicly accessible</strong> so students can open it.
                </p>
              )}
            </>
          )}

          {/* File mode */}
          {uploadMode === "file" && (
            <>
              <input type="file" accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png"
                required onChange={handleFileChange} style={{ padding:"8px 0" }} />
              <p style={{ color:"#888", fontSize:"12px", margin:"2px 0 8px" }}>
                Allowed: {ALLOWED_LABEL} · Max size: 25 MB
              </p>
              {fileError && (
                <p style={{ color:"#c0392b", backgroundColor:"#fdecea", border:"1px solid #f5c6cb",
                  borderRadius:"6px", padding:"8px 12px", fontSize:"13px", margin:"4px 0 8px" }}>
                  {fileError}
                </p>
              )}
              {selectedFile && !fileError && (
                <p style={{ color:"#555", fontSize:"12px", margin:"4px 0 8px" }}>
                  ✅ <strong>{selectedFile.name}</strong> ({(selectedFile.size/1024/1024).toFixed(2)} MB) ready to upload
                </p>
              )}
              {loading && uploadProgress > 0 && (
                <div style={{ margin:"8px 0" }}>
                  <div style={{ height:"6px", borderRadius:"4px", backgroundColor:"#eee", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${uploadProgress}%`,
                      backgroundColor:"#800000", transition:"width 0.2s" }} />
                  </div>
                  <p style={{ fontSize:"12px", color:"#555", margin:"4px 0" }}>
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </>
          )}

          <button type="submit" disabled={loading || (uploadMode === "file" && !!fileError)}>
            {loading
              ? uploadMode === "file" ? `Uploading... ${uploadProgress}%` : "Uploading..."
              : "Upload"}
          </button>

        </form>

        {/* ===== MY UPLOADS ===== */}
        <div style={{ marginTop: "40px" }}>
          <h3 style={{
            color: "#800000", marginBottom: "14px",
            borderBottom: "2px solid #800000", paddingBottom: "8px",
          }}>
            📂 My Uploads
          </h3>

          {deleteMsg && (
            <p style={{
              fontSize: "13px", marginBottom: "10px",
              color: deleteMsg.startsWith("✅") ? "#27ae60" : "#c0392b",
            }}>
              {deleteMsg}
            </p>
          )}

          {loadingMyResources && (
            <p style={{ color: "#888", fontSize: "14px" }}>Loading your uploads...</p>
          )}

          {!loadingMyResources && myResources.length === 0 && (
            <p style={{ color: "#888", fontSize: "14px" }}>
              You haven't uploaded any resources yet.
            </p>
          )}

          {!loadingMyResources && myResources.map((res) => (
            <div key={res.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", marginBottom: "8px", borderRadius: "8px",
              border: "1px solid #e0e0e0", backgroundColor: "#fafafa",
            }}>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontWeight: "600", fontSize: "14px", color: "#2c3e50",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {res.title}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#888" }}>
                  {res.department_name} · {res.subject_name} · {res.resource_type}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px", marginLeft: "12px", flexShrink: 0 }}>
                <a
                  href={res.resource_url} target="_blank" rel="noopener noreferrer"
                  style={{
                    padding: "5px 12px", borderRadius: "6px",
                    backgroundColor: "#808080", color: "white",
                    fontSize: "12px", fontWeight: "600", textDecoration: "none",
                  }}
                >
                  View
                </a>
                <button
                  onClick={() => handleDelete(res.id)}
                  disabled={deletingId === res.id}
                  style={{
                    padding: "5px 12px", borderRadius: "6px", border: "none",
                    backgroundColor: deletingId === res.id ? "#ccc" : "#800000",
                    color: "white", fontSize: "12px", fontWeight: "600",
                    cursor: deletingId === res.id ? "not-allowed" : "pointer",
                  }}
                >
                  {deletingId === res.id ? "Deleting..." : "🗑️ Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default TeacherUpload;