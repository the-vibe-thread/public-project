import { useState, useEffect } from "react";
import { Form, Button, Container, Row, Col, ListGroup, Spinner, Alert } from "react-bootstrap";
import {api} from "../api"; // Adjust the import path as necessary
import { useNavigate } from "react-router-dom";

const EditProfile = () => {
  const [user, setUser] = useState({ name: "", email: "", addresses: [] });
  const [newAddress, setNewAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data } = await api.get("/api/auth/me");
        setUser(data.user);
      } catch (error) {
        setError("Failed to fetch user details. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleAddAddress = () => {
    if (newAddress.trim() && !user.addresses.includes(newAddress)) {
      setUser({ ...user, addresses: [...user.addresses, newAddress] });
      setNewAddress("");
    } else {
      setError("Address is either empty or already added.");
    }
  };

  const handleRemoveAddress = (index) => {
    setUser({
      ...user,
      addresses: user.addresses.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put("/api/auth/update-profile", user);
      setSuccess("Profile updated successfully!");
      setTimeout(() => navigate("/"), 2000); // Redirect after 2 seconds
    } catch (error) {
      setError("Error updating profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p>Loading profile...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>Edit Profile</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="name">
          <Form.Label>Name</Form.Label>
          <Form.Control type="text" name="name" value={user.name} onChange={handleChange} required />
        </Form.Group>

        <Form.Group controlId="email" className="mt-3">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" name="email" value={user.email} onChange={handleChange} required />
        </Form.Group>

        <Form.Group controlId="addresses" className="mt-3">
          <Form.Label>Saved Addresses</Form.Label>
          <ListGroup>
            {user.addresses.map((address, index) => (
              <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                {address}
                <Button variant="danger" size="sm" onClick={() => handleRemoveAddress(index)}>Remove</Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
          <Row className="mt-2">
            <Col xs={9}>
              <Form.Control
                type="text"
                placeholder="Add new address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
              />
            </Col>
            <Col xs={3}>
              <Button variant="primary" onClick={handleAddAddress}>Add</Button>
            </Col>
          </Row>
        </Form.Group>

        <Button variant="success" type="submit" className="mt-3" disabled={updating}>
          {updating ? <Spinner animation="border" size="sm" /> : "Save Changes"}
        </Button>
      </Form>
    </Container>
  );
};

export default EditProfile;
