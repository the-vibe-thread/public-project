import { useEffect, useState } from "react";
import { Container, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { api} from "../api"; // Adjust the import based on your project structure

function AccountSettings() {
  const [user, setUser] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/api/users/profile", { withCredentials: true });
        setUser({ name: res.data.name, email: res.data.email });
      } catch (err) {
        setError("Unable to load profile. Please login.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.put(
        "/api/users/profile",
        { name: user.name, email: user.email|| undefined },
        { withCredentials: true }
      );
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: 500 }}>
      <Card className="p-4 shadow">
        <h3 className="mb-3 text-center">Account Settings</h3>
        {loading ? (
          <div className="text-center my-4"><Spinner animation="border" /></div>
        ) : (
          <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={user.name}
                onChange={e => setUser({ ...user, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={user.email}
                onChange={e => setUser({ ...user, email: e.target.value })}
                required
              />
            </Form.Group>
            <Button type="submit" variant="primary" className="w-100" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Form>
        )}
      </Card>
    </Container>
  );
}

export default AccountSettings;