import { useState } from "react";
import { Container, Form, Button, Card, Alert, Spinner } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import  {api, fetchApi } from "../api";


function SignupForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [flat, setFlat] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState(""); // <-- This is the correct state setter
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Pincode check states
  const [pincodeError, setPincodeError] = useState("");
  const [pincodeResult, setPincodeResult] = useState(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const validatePhone = (phone) => /^[0-9]{10,15}$/.test(phone);
  const validatePincode = (pin) => /^[0-9]{4,10}$/.test(pin);

  const handleCheckPincode = async () => {
    if (!pincode.trim()) return;

    setCheckingPincode(true);
    setPincodeResult(null);

    try {
      const data = await fetchApi(`/api/pincodes/${pincode}`);

      if (data.success) {
        setPincodeResult({ success: true, message: data.message });
        setCity(data.city || "");
        setState(data.state || ""); // <-- Use setState, not setStateName
      } else {
        setPincodeResult({ success: false, message: data.message });
        setCity("");
        setState(""); // <-- Use setState
      }
    } catch (error) {
      setPincodeResult({
        success: false,
        message: "Error checking pincode. Try again later.",
      });
      setCity("");
      setState(""); // <-- Use setState
    } finally {
      setCheckingPincode(false);
    }
  };

  // Pincode validation
  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setPincode(val);
    setPincodeError(val.length === 6 || val.length === 0 ? "" : "Enter a valid 6-digit PIN");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !name.trim() ||
      !email.trim() ||
      !phoneNumber.trim() ||
      !flat.trim() ||
      !city.trim() ||
      !state.trim() ||
      !pincode.trim()
    ) {
      setError("All fields except landmark are required.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!validatePhone(phoneNumber)) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (!validatePincode(pincode)) {
      setError("Please enter a valid pincode.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/api/auth/signup", {
        phoneNumber,
        name,
        email,
        address: `${flat}, ${landmark}, ${city}, ${state}, ${pincode}`,
      });

      if (response.data.success) {
        setSuccess("Signup successful! Redirecting...");
        setTimeout(() => navigate("/"), 3000);
      } else {
        setError(response.data.message || "Signup failed. Please try again.");
      }
    } catch (error) {
      setError("An error occurred during signup. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-120">
      <Card className="shadow-lg p-4" style={{ width: "600px" }}>
        <h4 className="text-center mb-3">Complete Your Signup</h4>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSignup}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              disabled
              readOnly
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              isInvalid={phoneNumber && !validatePhone(phoneNumber)}
            />
            <Form.Control.Feedback type="invalid">
              Please enter a valid phone number.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Flat/House No./Locality</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your flat or house number"
              value={flat}
              onChange={(e) => setFlat(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Landmark</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter a landmark (optional)"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>City</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>State</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Pincode</Form.Label>
            <div style={{ display: "flex", gap: 8 }}>
              <Form.Control
                type="text"
                placeholder="Enter your pincode"
                value={pincode}
                onChange={handlePincodeChange}
                required
                isInvalid={pincode && !validatePincode(pincode)}
                maxLength={6}
                style={{ flex: 1 }}
              />
              <Button
                variant="secondary"
                type="button"
                onClick={handleCheckPincode}
                disabled={checkingPincode || !pincode || !!pincodeError}
              >
                {checkingPincode ? "Checking..." : "Check"}
              </Button>
            </div>
            <Form.Control.Feedback type="invalid">
              Please enter a valid pincode.
            </Form.Control.Feedback>
            {pincodeResult && (
              <Alert
                className="mt-2"
                variant={pincodeResult.success ? "success" : "danger"}
              >
                {pincodeResult.message}
              </Alert>
            )}
            <div className="text-muted" style={{ fontSize: "0.95em" }}>
              Please enter PIN code to check delivery time & Pay on Delivery Availability
            </div>
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : "Signup"}
          </Button>
        </Form>
      </Card>
    </Container>
  );
}

export default SignupForm;