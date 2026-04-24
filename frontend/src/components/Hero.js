import React from "react";
import "./Hero.css";

function Hero() {
  return (
    <section className="hero-content-wrapper">
      <div className="hero-content">
        <h1>Welcome to the CCOEW Resource Hub!</h1>
        <p>
        📚 Your one-stop destination for all things academic — thoughtfully designed
  to make your study experience smoother and more effective. This platform
  brings together a well-organized collection of PYQs, assignments,
  lecture notes, and essential study materials — all just a click away.
  <br /><br />
  ✨ Whether you're revisiting concepts, solving past papers, or collaborating
  with friends, this hub supports your academic journey. Explore, learn,
  and achieve — we’ll keep improving with content that helps you succeed 🚀
</p>
        <a href="#learn" className="hero-btn">Start Learning</a>
      </div>
    </section>
  );
}

export default Hero;
