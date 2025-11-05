import React, { useState, useEffect } from "react";

export default function BackToTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!show) return null;
  return (
    <button
      style={{
        position: "fixed",
        bottom: 40,
        right: 30,
        zIndex: 9999,
        borderRadius: "50%",
        background: "#007bff",
        color: "#fff",
        border: "none",
        width: 50,
        height: 50,
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        fontSize: 22,
      }}
      onClick={handleScrollToTop}
      aria-label="Scroll to top"
    >
      ↑
    </button>
  );
}