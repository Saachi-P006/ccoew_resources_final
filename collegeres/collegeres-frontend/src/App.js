import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import TeacherLogin from "./pages/TeacherLogin";
import TeacherUpload from "./pages/TeacherUpload";

function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Home />} />

        {/* TEACHER */}
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/teacher/upload" element={<TeacherUpload />} />
      </Routes>
    </Router>
  );
}

export default App;
