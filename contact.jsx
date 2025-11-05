import { useState ,useEffect,useRef} from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import "./Footer.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faFacebook } from "@fortawesome/free-brands-svg-icons";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { api, fetchApi } from "../api";
import { useInView } from "react-intersection-observer";

// import VibeThreadLogo from "./thumbnail_image.png"; // SVG will be used instead
import vibeThreadVideo from "./AnimatedLogo.mp4";

const Footer = () => {
  const location = useLocation();

  const [feedback, setFeedback] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [newsletterEmail, setNewsletterEmail] = useState("");

  const handleChange = (e) => {
    setFeedback({ ...feedback, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchApi("/api/feedback/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedback),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Feedback submitted successfully!");
        setFeedback({ name: "", email: "", message: "" });
      } else {
        toast.error("Error submitting feedback.");
      }
    } catch (error) {
      toast.error("Server error.");
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/newsletter/subscribe", {
        email: newsletterEmail,
      });
      toast.success(res.data.message || "Subscribed successfully!");
      setNewsletterEmail("");
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Subscription failed. Please try again.";
      toast.error(msg);
    }
  };

  // Intersection Observer hook
  const { ref: videoRef, inView } = useInView({
    triggerOnce: false, // can toggle playback as user scrolls
    threshold: 0.25, // 25% visible to consider "in view"
  });

  // Control video playback via ref
  const vidEl = useRef(null);

  useEffect(() => {
    if (vidEl.current) {
      if (inView) {
        vidEl.current.play();
      } else {
        vidEl.current.pause();
      }
    }
  }, [inView]);

  return (
    <motion.div key={location.pathname} initial={false} animate={false}>
      <Container fluid id="contact-footer" className="mt-4 mb-4 footer-section">
        <Row className="footer-row justify-content-center align-items-start">
          <Col md={4} className="footer-col">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h5>Helpful Links</h5>
              <ul className="list-unstyled">
                <li>
                  <Link to="/faq">FAQ</Link>
                </li>
                <li>
                  <Link to="/terms">Terms & Conditions</Link>
                </li>
                <li>
                  <Link to="/privacy">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/return">Return Policy</Link>
                </li>
                <li>
                  <Link to="/shipping">Shipping Policy</Link>
                </li>
                <li>
                  <Link to="/blogs">Blogs</Link>
                </li>
              </ul>
            </motion.div>
          </Col>

          <Col md={4} className="footer-col">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h5>Contact</h5>
              <p>thevibethread@gmail.com</p>
              <p>+91-7579279921</p>
              <div className="d-flex px-3">
                <Link to={"https://www.instagram.com/the_vibe_thread/?__pwa=1"}>
                  <FontAwesomeIcon
                    icon={faInstagram}
                    className="me-4"
                    size="xl"
                    color="white"
                  />
                </Link>
                <Link to={"https://www.facebook.com/prashu.chaudhary.568/"}>
                  <FontAwesomeIcon
                    icon={faFacebook}
                    className="me-4"
                    size="xl"
                    color="white"
                  />
                </Link>
              </div>
            </motion.div>
          </Col>

          <Col md={4} className="footer-col">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="feedback-form-container"
            >
              <h5>Feedback</h5>
              <div className="feedback-form-container">
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-2">
                    <Form.Control
                      className="form-input"
                      type="text"
                      name="name"
                      placeholder="Your Name"
                      value={feedback.name}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Control
                      className="form-input"
                      type="email"
                      name="email"
                      placeholder="Your Email"
                      value={feedback.email}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Control
                      className="form-input"
                      as="textarea"
                      name="message"
                      rows={3}
                      placeholder="Your Message"
                      value={feedback.message}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                  <Button
                    type="submit"
                    variant="dark"
                    className="w-100 newsletter-btn"
                  >
                    Submit
                  </Button>
                </Form>
              </div>
            </motion.div>
          </Col>
        </Row>
        <Row>
          <Col md={12} className="mt-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="newsletter-subscribe-box p-4 rounded mb-3">
                <h5 style={{ fontWeight: 600 }}>Subscribe</h5>
                <p style={{ marginBottom: "1rem" }}>
                  Subscribe to our newsletter and be among the first to hear
                  about new arrivals, events and special offers.
                </p>
                <Form
                  className="newsletter-form d-flex flex-column flex-md-row align-items-md-center gap-2"
                  onSubmit={handleNewsletterSubmit}
                >
                  <Form.Group className="flex-grow-1 mb-2 mb-md-0">
                    <Form.Label htmlFor="newsletter-email" visuallyHidden>
                      Email *
                    </Form.Label>
                    <Form.Control
                      id="newsletter-email"
                      type="email"
                      placeholder="Email *"
                      required
                      className="newsletter-input"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                    />
                  </Form.Group>
                  <Button
                    type="submit"
                    variant="dark"
                    className="newsletter-btn"
                    style={{
                      borderRadius: "2rem",
                      padding: "0.7rem 2.5rem",
                      fontSize: "1.15rem",
                      fontWeight: 400,
                      background: "#000",
                      border: "none",
                    }}
                  >
                    Subscribe
                  </Button>
                </Form>
              </div>
            </motion.div>
          </Col>
        </Row>
        <Row className="justify-content-center mt-4">
          <Col md="auto" className="text-center">
            <div
              style={{
                width: "100%",
                maxWidth: "500px",
                margin: "0 auto",
                display: "block",
              }}
              ref={videoRef}
            >
              <video
                ref={vidEl}
                src={vibeThreadVideo}
                loop
                muted
                playsInline
                style={{ width: "100%", height: "auto", display: "block" }}
                aria-label="The Vibe Thread Animation Video"
                // autoPlay removed; we control play/pause via JS
              />
            </div>
          </Col>
        </Row>
      </Container>
      <ToastContainer position="top-center" autoClose={2000} />
    </motion.div>
  );
};

export default Footer;
