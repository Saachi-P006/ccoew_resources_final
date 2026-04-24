import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

// PAGES
import Home         from "./pages/Home";
import TeacherLogin  from "./pages/TeacherLogin";
import TeacherUpload from "./pages/TeacherUpload";
import AdminLogin    from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import StudentSubmit from "./pages/StudentSubmit";

function App() {
  useEffect(() => {
    AOS.init({ duration: 700, once: true });
  }, []);

  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/"               element={<Home />} />

        {/* Teacher */}
        <Route path="/teacher/login"  element={<TeacherLogin />} />
        <Route path="/teacher/upload" element={<TeacherUpload />} />

        {/* Admin */}
        <Route path="/admin/login"     element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Student */}
        <Route path="/student/submit"  element={<StudentSubmit />} />
      </Routes>
    </Router>
  );
}

export default App;