import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Accordion, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import "./NavbarOffcanvas.css";
import style from "./navbar.module.css"; // Adjust the import path as necessary
import { fetchApi } from "../api";

import { ReactComponent as Close } from "../icons/x.svg";

export default function NavbarOffcanvas({ closeOffcanvas }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchApi("/api/products").then((data) => {
      // Extract unique categories from products, and trim them
      const cats = Array.from(
        new Set(
          data.products
            ?.map((p) => (p.category ? p.category.trim() : null))
            .filter(Boolean)
        )
      );
      setCategories(cats);
    });
  }, []);
  return (
    <motion.div
      className={style["offcanvas"]}
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: "90vw",
        maxWidth: "400px",
        minWidth: "220px",
        zIndex: 2000, // Increase z-index to ensure it stays above other elements
        background: "white",
        boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
      }}
    >
      {/* Home and Close Button Row */}
      <div
        className="d-flex align-items-center justify-content-between px-3"
        style={{
          minHeight: "56px",
          borderBottom: "1px solid #ddd",
        }}
      >
        <Button
          variant="light"
          onClick={closeOffcanvas}
          aria-label="Close menu"
          className={style["offcanvas-close-btn"]}
          style={{
            position: "absolute",
            top: "5px", // adjust this value as needed
            right: "15px",
            zIndex: 2000,
            border: "none",
            background: "transparent",
            padding: "0.5rem",
            borderRadius: "50%",
            boxShadow: "none",
          }}
        >
          <Close />
        </Button>
      </div>
      <div className="list-group list-group-flush">
        <div className="accordion-static-links">
          <div className="accordion-link">
            <Link to="/" onClick={closeOffcanvas}>
              Home
            </Link>
          </div>
          <div className="accordion-link">
            <Link to="/trending" onClick={closeOffcanvas}>
              Trending
            </Link>
          </div>
          <div className="accordion-link">
            <Link to="/new-arrivals" onClick={closeOffcanvas}>
              New Arrivals
            </Link>
          </div>
          <div className="accordion-link">
            <Link to="/best-sellers" onClick={closeOffcanvas}>
              Bestseller
            </Link>
          </div>
        </div>
        <Accordion alwaysOpen flush>
          <Accordion.Item eventKey="0">
            <Accordion.Header>Collections</Accordion.Header>
            <Accordion.Body className="px-3">
              {categories.map((cat) => (
                <div className="submenu-item" key={cat}>
                  <Link
                    to={`/collection/${encodeURIComponent(cat)}`}
                    onClick={closeOffcanvas}
                  >
                    {cat[0].toUpperCase() + cat.slice(1)}
                  </Link>
                </div>
              ))}
            </Accordion.Body>
          </Accordion.Item>
          {/* <Accordion.Item eventKey="1">
            <Accordion.Header>The Occasion Edit</Accordion.Header>
            <Accordion.Body className="px-3">
              <div className="submenu-item">
                <Link to="/occasion/wedding" onClick={closeOffcanvas}>
                  Wedding
                </Link>
              </div>
              <div className="submenu-item">
                <Link to="/occasion/party" onClick={closeOffcanvas}>
                  Party
                </Link>
              </div>
              <div className="submenu-item">
                <Link to="/occasion/casual" onClick={closeOffcanvas}>
                  Casual
                </Link>
              </div>
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="2">
            <Accordion.Header>Gifting</Accordion.Header>
            <Accordion.Body className="px-3">
              <div className="submenu-item">
                <Link to="/gifting" onClick={closeOffcanvas}>
                  Gift Cards
                </Link>
              </div>
              <div className="submenu-item">
                <Link to="/gifting/personalized" onClick={closeOffcanvas}>
                  Personalized Gifts
                </Link>
              </div>
              <div className="submenu-item">
                <Link to="/gifting/occasion-based" onClick={closeOffcanvas}>
                  Occasion-based Gifts
                </Link>
              </div>
            </Accordion.Body>
          </Accordion.Item>*/}
        </Accordion>
        <div className="accordion-static-links">
          <div className="accordion-link">
            <a href="#contact-footer" onClick={closeOffcanvas}>
              Contact
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
