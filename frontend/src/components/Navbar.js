import React, { useState, useEffect } from "react";
import "./Navbar.css";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="logo">College Resources</div>

      <div className="hamburger" onClick={toggleMenu}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>

      <ul className={`nav-links ${isOpen ? "open" : ""}`}>
        <li><a href="#home" onClick={closeMenu}>Home</a></li>
        <li><a href="#learn" onClick={closeMenu}>Learn</a></li>
        <li><a href="#opportunities" onClick={closeMenu}>Opportunities</a></li>
        <li><a href="#quicklinks" onClick={closeMenu}>Quick Links</a></li>
        <li><a href="#roadmaps" onClick={closeMenu}>Roadmaps</a></li>
        <li><a href="#contact" onClick={closeMenu}>Contact</a></li>

        {/* ✅ Teacher Button */}
        <li>
          <button
            className="teacher-btn"
            onClick={() => window.location.href = "/teacher/login"}
          >
            Teacher
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
