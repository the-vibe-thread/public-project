import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Container, Row, Col, Alert } from "react-bootstrap";
import { api } from "../api"; // Adjust the import path as necessary
import style from './OTPAuth.module.css'; // Custom CSS file

function Auth() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const OTP_LENGTH = 6; // or 8 if you want 8 digits
  const [otpArray, setOtpArray] = useState(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef([]);

  // Handle OTP input change
  const handleOtpChange = (e, idx) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (!val) return;
    const newOtp = [...otpArray];
    newOtp[idx] = val[0];
    setOtpArray(newOtp);

    // Move to next input
    if (idx < OTP_LENGTH - 1 && val) {
      inputRefs.current[idx + 1].focus();
    }
  };

  // Handle backspace
  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      const newOtp = [...otpArray];
      newOtp[idx] = "";
      setOtpArray(newOtp);

      // Move to previous input if Backspace and current is empty
      if (e.key === "Backspace" && idx > 0) {
        inputRefs.current[idx - 1].focus();
      }
    }
  };

  // Combine OTP for submit
  const otp = otpArray.join("");

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await api.post("/api/auth/login", { email }); // <-- use /login
      setOtpSent(true);
      setInfo("OTP sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    }
    setLoading(false);
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/verify-otp", { email, otp });
      if (res.data.exists) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/");
        window.location.reload(); // Ensures navbar updates immediately
      } else {
        navigate("/signup", { state: { email } });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP.");
    }
    setLoading(false);
  };

  return (
    <Container className={`${style[`otp-auth-container`]} d-flex justify-content-center align-items-start`}>
      <Row>
        <Col md={6} className={style["otp-form-card"]}>
          <h2 className="text-center">Login/Signup</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {info && <Alert variant="success">{info}</Alert>}
          {!otpSent ? (
            <Form onSubmit={handleSendOtp}>
              <Form.Group>
                <Form.Label className={style["otp-label"]}>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={style["otp-input"]}
                  autoComplete="username"
                  required
                />
              </Form.Group>
              <Button
                className={`${style[`otp-button`]} mt-3`}
                type="submit"
                disabled={!email || loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </Form>
          ) : (
            <Form onSubmit={handleVerifyOtp}>
              <Form.Group>
                <Form.Label className={style["otp-label"]}>Enter code</Form.Label>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  {otpArray.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(e, idx)}
                      onKeyDown={e => handleOtpKeyDown(e, idx)}
                      ref={el => (inputRefs.current[idx] = el)}
                      style={{
                        width: 40,
                        height: 48,
                        fontSize: 28,
                        textAlign: "center",
                        border: "1px solid #ccc",
                        borderRadius: 8,
                        outline: "none",
                        background: "#fff",
                        fontWeight: 600,
                      }}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </Form.Group>
              <Button
                className={`${style["otp-button"]} mt-3`}
                type="submit"
                disabled={otp.length !== OTP_LENGTH || loading}
              >
                {loading ? "Verifying..." : "Continue"}
              </Button>
              <Button
                variant="link"
                className="mt-2"
                onClick={handleSendOtp}
                disabled={loading}
                style={{ color: "black" }}
              >
                Resend OTP
              </Button>
            </Form>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default Auth;
