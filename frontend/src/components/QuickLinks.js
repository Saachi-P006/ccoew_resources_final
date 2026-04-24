import React, { useEffect, useState } from "react";
import "./QuickLinks.css";
import AOS from "aos";
import "aos/dist/aos.css";

function QuickLinks() {
  const [data, setData] = useState([]);

  useEffect(() => {
    AOS.init({
      duration: 600,
      once: true,
      easing: "ease-out-cubic",
    });

    fetch("http://localhost:5000/api/quicklinks")
      .then((res) => res.json())
      .then((result) => setData(result))
      .catch((err) => console.error("QuickLinks API error:", err));
  }, []);

  return (
    <div className="quick-links">
      <h2>Quick Links</h2>

      {data.map((category, idx) => (
        <div
          key={idx}
          className="category-section"
          data-aos="fade-up"
          data-aos-delay={idx * 50}
        >
          <h3>{category.category}</h3>

          <div className="links-grid">
            {category.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-card"
                style={{ backgroundColor: category.color }}
                data-aos="zoom-in"
                data-aos-delay={i * 50}
              >
                <p>{link.name}</p>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default QuickLinks;
