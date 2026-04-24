import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import QuickLinks from "../components/QuickLinks";
import Roadmaps from "../components/Roadmaps";
import ContactForm from "../components/ContactForm";
import Footer from "../components/Footer";
import InlineCalendar from "../components/InlineCalendar";
import "../App.css";
import option5 from "../assets/option5.jpg";
import AOS from "aos";
import "aos/dist/aos.css";

import cseIcon from "../assets/Comp.png";
import eceIcon from "../assets/IT.png";
import meIcon from "../assets/Mech.png";
import ceIcon from "../assets/Entc.png";
import eeIcon from "../assets/Instru.png";
import ceBg from "../assets/Comp.gif";

const API = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

// Map card titles → DB department name (must match your DB exactly)
const CARD_TO_DEPT_NAME = {
  CE:    "Computer Engineering",
  IT:    "Information Technology",
  Mech:  "Mechanical Engineering",
  Entc:  "Electronics & Telecommunication",
  Instru:"Instrumentation Engineering",
};

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 700, once: true });
    const handleScroll = () => AOS.refresh();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ---------- DEPT MAP (fetched once on mount) ----------
  const [deptMap, setDeptMap] = useState({});

  useEffect(() => {
    fetch(`${API}/departments`)
      .then((r) => r.json())
      .then((data) => {
        const map = {};
        data.forEach((d) => { map[d.name] = d.id; });
        setDeptMap(map);
      })
      .catch((err) => console.error("Failed to load departments", err));
  }, []);

  // ---------- CARDS (unchanged) ----------
  const cardsTop = [
    { title: "CE",   icon: cseIcon, bg: ceBg, color: "#3498db" },
    { title: "IT",   color: "#e67e22", icon: eceIcon },
    { title: "Mech", color: "#9b59b6", icon: meIcon },
  ];

  const cardsBottom = [
    { title: "Entc",   color: "#1abc9c", icon: ceIcon },
    { title: "Instru", color: "#f39c12", icon: eeIcon },
  ];

  const opportunitiesCards = [
    {
      title: "1st Year",
      items: [
        "WE Program by TalentSprint",
        "Explore different tech domains",
        "Ideathons",
        "Basic Web Development & DSA Courses",
      ],
    },
    {
      title: "2nd Year",
      items: [
        "Google STEP Internship",
        "Open Source Programs (GSoC, GSSoC, HackToberFest)",
        "AmazeWoW",
        "Uber She++",
        "American Express Makeathon",
        "Flipkart Runway",
      ],
    },
    {
      title: "3rd Year",
      items: [
        "Visa Code Your Way",
        "Adobe CoDiva",
        "LinkedIn Wintathon",
        "Scholarships & Mentorship Programs",
        "Open Source / Competitions",
      ],
    },
  ];

  // ---------- EXPLORER STATE ----------
  const [explorerOpen,   setExplorerOpen]   = useState(false);
  const [activeBranch,   setActiveBranch]   = useState(null);
  const [activeDeptId,   setActiveDeptId]   = useState(null);
  const [level,          setLevel]          = useState("year");
  const [activeYear,     setActiveYear]     = useState(null);
  const [activeSemester, setActiveSemester] = useState(null);
  const [activeSubject,  setActiveSubject]  = useState(null);
  const [activeFolder,   setActiveFolder]   = useState(null);

  // ---------- DYNAMIC DATA ----------
  const [years,     setYears]     = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects,  setSubjects]  = useState([]);

  const [loadingYears,     setLoadingYears]     = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingSubjects,  setLoadingSubjects]  = useState(false);

  const [resources,        setResources]        = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [resourceError,    setResourceError]    = useState("");

  // ---------- FOLDER COLORS (unchanged) ----------
  const folderColors = {
    PYQ:       "#808080",
    Notes:     "#800000",
    Tutorials: "#808080",
    Learn:     "#800000",
  };

  const resourceTypeMap = {
    PYQ:       "PYQ",
    Notes:     "NOTES",
    Tutorials: "Tutorial",
    Learn:     "Learn",
  };

  // ---------- OPEN EXPLORER ----------
  function openExplorer(cardTitle) {
    const deptName = CARD_TO_DEPT_NAME[cardTitle];
    const deptId   = deptMap[deptName];

    setActiveBranch(cardTitle);
    setActiveDeptId(deptId || null);
    setExplorerOpen(true);
    setLevel("year");
    setActiveYear(null);
    setActiveSemester(null);
    setActiveSubject(null);
    setActiveFolder(null);
    setYears([]);
    setSemesters([]);
    setSubjects([]);

    setLoadingYears(true);
    fetch(`${API}/years`)
      .then((r) => r.json())
      .then((data) => setYears(data))
      .catch((err) => console.error("Failed to load years", err))
      .finally(() => setLoadingYears(false));

    document.body.style.overflow = "hidden";
  }

  // ---------- CLOSE EXPLORER ----------
  function closeExplorer() {
    setExplorerOpen(false);
    setLevel("year");
    setActiveYear(null);
    setActiveSemester(null);
    setActiveSubject(null);
    setActiveFolder(null);
    document.body.style.overflow = "";
  }

  // ---------- CHOOSE YEAR ----------
  function chooseYear(year) {
    setActiveYear(year);
    setLevel("semester");
    setSemesters([]);

    setLoadingSemesters(true);
    fetch(`${API}/semesters?year_id=${year.id}`)
      .then((r) => r.json())
      .then((data) => setSemesters(data))
      .catch((err) => console.error("Failed to load semesters", err))
      .finally(() => setLoadingSemesters(false));
  }

  // ---------- CHOOSE SEMESTER ----------
  function chooseSemester(sem) {
    setActiveSemester(sem);
    setLevel("subject");
    setSubjects([]);

    if (!activeDeptId) {
      console.error("No department ID found for this branch");
      return;
    }

    setLoadingSubjects(true);
    fetch(`${API}/subjects?department_id=${activeDeptId}&semester_id=${sem.id}`)
      .then((r) => r.json())
      .then((data) => setSubjects(data))
      .catch((err) => console.error("Failed to load subjects", err))
      .finally(() => setLoadingSubjects(false));
  }

  // ---------- CHOOSE SUBJECT ----------
  function chooseSubject(subject) {
    setActiveSubject(subject);
    setLevel("folder");
  }

  // ---------- CHOOSE FOLDER ----------
  function chooseFolder(folderKey) {
    setActiveFolder(folderKey);
    setLevel("items");

    setLoadingResources(true);
    setResourceError("");
    setResources([]);

    fetch(
      `${API}/resources/by-subject?subject_id=${activeSubject.id}&resource_type=${resourceTypeMap[folderKey]}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) throw new Error(data.error || "Failed to fetch");
        setResources(data);
      })
      .catch((err) => setResourceError(err.message))
      .finally(() => setLoadingResources(false));
  }

  // ---------- BACK ----------
  function back() {
    if      (level === "items")    setLevel("folder");
    else if (level === "folder")   setLevel("subject");
    else if (level === "subject")  setLevel("semester");
    else if (level === "semester") setLevel("year");
    else closeExplorer();
  }

  // ---------- RENDER ----------
  return (
    <>
      <Navbar />

      {/* ── Hero Section (UNCHANGED) ── */}
      <div
        id="home"
        className="section hero-section-bg"
        style={{
          backgroundImage: `url(${option5})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          position: "relative",
        }}
      >
        <div className="hero-with-calendar">
          <Hero />
          <div className="hero-calendar-container">
            <InlineCalendar />
          </div>
        </div>

        {/* ── NEW: Submit a Resource button (bottom-center of hero) ── */}
        <div style={{
          position: "absolute",
          bottom: "28px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
        }}>
          <button
            onClick={() => navigate("/student/submit")}
            style={{
              padding: "11px 28px",
              background: "#800000",
              color: "white",
              border: "none",
              borderRadius: "999px",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            📤 Submit a Resource
          </button>
        </div>
      </div>

      {/* ── All other sections COMPLETELY UNCHANGED ── */}
      <div
        id="learn"
        className="section"
        style={{
          backgroundColor: "white",
          color: "#2c3e50",
          paddingTop: "120px",
          paddingBottom: "120px",
        }}
      >
        <h2 data-aos="fade-down">Learn</h2>
        <div
          className="cards-container"
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", justifyContent: "center" }}>
            {cardsTop.map((card, index) => (
              <div
                key={card.title}
                className="card"
                style={{ backgroundColor: card.color || "transparent" }}
                data-aos="fade-up"
                data-aos-delay={index * 120}
              >
                <div
                  className="card-front"
                  style={{
                    backgroundColor: card.color || "#3498db",
                    backgroundImage: card.bg ? `url(${card.bg})` : "none",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                >
                  <img src={card.icon} alt={card.title} className="card-icon" />
                </div>
                <div className="card-back">
                  <div className="back-left">
                    <h3>{card.title}</h3>
                  </div>
                  <div className="back-right">
                    <button onClick={() => openExplorer(card.title)}>Explore</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", justifyContent: "center" }}>
            {cardsBottom.map((card, index) => (
              <div
                key={card.title}
                className="card"
                style={{ backgroundColor: card.color }}
                data-aos="fade-up"
                data-aos-delay={300 + index * 120}
              >
                <div className="card-front">
                  <img src={card.icon} alt={card.title} className="card-icon" />
                </div>
                <div className="card-back">
                  <div className="back-left">
                    <h3>{card.title}</h3>
                  </div>
                  <div className="back-right">
                    <button onClick={() => openExplorer(card.title)}>Explore</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="opportunities" className="section" style={{ paddingTop: "120px", paddingBottom: "120px" }}>
        <h2 data-aos="fade-down" style={{ textAlign: "center" }}>
          Opportunities for Students
        </h2>
        <div className="opportunity-cards-container">
          {opportunitiesCards.map((card, index) => (
            <div key={index} className="opportunity-card" style={{ transform: `rotate(${Math.random() * 6 - 3}deg)` }}>
              <div className="card-front" style={{ backgroundColor: "#f9e79f" }}>
                <h3>{card.title}</h3>
              </div>
              <div className="card-back">
                <ul>
                  {card.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="quicklinks" className="section" style={{ paddingTop: "120px", paddingBottom: "140px" }}>
        <QuickLinks />
      </div>

      <div id="roadmaps" className="section" style={{ paddingTop: "120px", paddingBottom: "120px" }}>
        <Roadmaps />
      </div>

      <div id="contact" className="section" style={{ paddingTop: "120px", paddingBottom: "120px" }}>
        <ContactForm />
      </div>

      {/* ── NEW: Tiny admin link just above Footer ── */}
      <div style={{ textAlign: "center", padding: "10px 0 2px", background: "#f4f6f8" }}>
        <span
          onClick={() => navigate("/admin/login")}
          style={{
            fontSize: "11px",
            color: "#ccc",
            cursor: "pointer",
            fontFamily: "Poppins, sans-serif",
            userSelect: "none",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#800000"}
          onMouseLeave={e => e.currentTarget.style.color = "#ccc"}
        >
          Admin
        </span>
      </div>

      <Footer />

      {/* ── Explorer Modal (COMPLETELY UNCHANGED) ── */}
      {explorerOpen && (
        <div className="explorer-overlay" onClick={closeExplorer}>
          <div className="explorer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="explorer-header">
              <button className="explorer-back" onClick={back}>
                &larr;
              </button>
              <div className="explorer-breadcrumb">
                <strong>{activeBranch}</strong>
                <span className="crumb-sep">/</span>

                {level === "year" && <span>Years</span>}

                {level !== "year" && activeYear && (
                  <>
                    <span>{activeYear.year_name}</span>
                    <span className="crumb-sep">/</span>
                  </>
                )}

                {level === "semester" && <span>Semesters</span>}

                {level === "subject" && activeSemester && (
                  <span>{activeSemester.semester_name}</span>
                )}

                {level === "folder" && activeSemester && activeSubject && (
                  <span>
                    {activeSemester.semester_name}
                    <span className="crumb-sep">/</span>
                    {activeSubject.subject_name}
                  </span>
                )}

                {level === "items" && activeSemester && activeSubject && activeFolder && (
                  <span>
                    {activeSemester.semester_name}
                    <span className="crumb-sep">/</span>
                    {activeSubject.subject_name}
                    <span className="crumb-sep">/</span>
                    {activeFolder}
                  </span>
                )}
              </div>
              <button className="explorer-close" onClick={closeExplorer}>
                ✕
              </button>
            </div>

            <div className="explorer-content">

              {level === "year" && (
                <div className="explorer-grid">
                  {loadingYears && <p>Loading years...</p>}
                  {!loadingYears && years.map((year, index) => (
                    <div
                      key={year.id}
                      className="explorer-card"
                      style={{ backgroundColor: index % 2 === 0 ? "#800000" : "#808080", color: "white" }}
                      onClick={() => chooseYear(year)}
                    >
                      <h4>{year.year_name}</h4>
                    </div>
                  ))}
                </div>
              )}

              {level === "semester" && (
                <div className="explorer-grid">
                  {loadingSemesters && <p>Loading semesters...</p>}
                  {!loadingSemesters && semesters.map((sem, index) => (
                    <div
                      key={sem.id}
                      className="explorer-card"
                      style={{ backgroundColor: index % 2 === 0 ? "#808080" : "#800000", color: "white" }}
                      onClick={() => chooseSemester(sem)}
                    >
                      <h4>{sem.semester_name}</h4>
                    </div>
                  ))}
                </div>
              )}

              {level === "subject" && (
                <div className="explorer-grid">
                  {loadingSubjects && <p>Loading subjects...</p>}
                  {!loadingSubjects && subjects.length === 0 && (
                    <p>No subjects found for this semester</p>
                  )}
                  {!loadingSubjects && subjects.map((sub, index) => (
                    <div
                      key={sub.id}
                      className="explorer-card"
                      style={{ backgroundColor: index % 2 === 0 ? "#800000" : "#808080", color: "white" }}
                      onClick={() => chooseSubject(sub)}
                    >
                      <h4>{sub.subject_name}</h4>
                    </div>
                  ))}
                </div>
              )}

              {level === "folder" && activeSubject && (
                <div className="explorer-grid">
                  {Object.keys(folderColors).map((folderKey) => (
                    <div
                      key={folderKey}
                      className="explorer-card"
                      style={{ backgroundColor: folderColors[folderKey], color: "white" }}
                      onClick={() => chooseFolder(folderKey)}
                    >
                      <h4>{folderKey}</h4>
                    </div>
                  ))}
                </div>
              )}

              {level === "items" && (
                <div className="items-list">
                  {loadingResources && <p>Loading resources...</p>}
                  {resourceError && <p className="error">{resourceError}</p>}
                  {!loadingResources && !resourceError && resources.length === 0 && (
                    <p>No resources uploaded yet</p>
                  )}
                  {resources.map((res, idx) => (
                    <a
                      key={idx}
                      className="item-row"
                      href={res.resource_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="item-title">{res.title}</div>
                    </a>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Home;