import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import { api } from "../api";

const REASONS = [
  "Size Issue",
  "Color Issue",
  "Damaged Product",
  "Received Wrong Item",
  "Other",
];

const RESOLUTIONS = [
  { value: "Refund", label: "Refund" },
  { value: "Replacement", label: "Exchange/Replacement" },
];

export default function ReturnRequestModal({
  show,
  onHide,
  orderId,
  productId,
  onSuccess,
  availableSizes = [],
  availableColors = [],
  colorObjects = [], // <-- Add this prop if you need color-to-size mapping
}) {
  const [reason, setReason] = useState("");
  const [desc, setDesc] = useState("");
  const [resolution, setResolution] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [sizesForColor, setSizesForColor] = useState([]);

  // Update available sizes when color or resolution changes
  useEffect(() => {
    if (
      resolution === "Replacement" &&
      selectedColor &&
      availableColors.length
    ) {
      // Find the color object by name
      const colorObj = (colorObjects || []).find(
        (c) => c.name === selectedColor
      );
      if (colorObj && colorObj.sizes) {
        setSizesForColor(Object.keys(colorObj.sizes));
      } else {
        setSizesForColor([]);
      }
    } else {
      setSizesForColor([]);
    }
  }, [selectedColor, resolution, availableColors, colorObjects]);

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("returnIssueType", reason);
      formData.append("returnIssueDesc", desc);
      formData.append("returnResolutionType", resolution);
      images.forEach((file) => formData.append("returnImages", file));
      // Add exchange/replace info if applicable
      if (resolution === "Replacement") {
        formData.append("selectedColor", selectedColor);
        formData.append("selectedSize", selectedSize);
      }

      const url = productId
        ? `/api/orders/${orderId}/return/${productId}`
        : `/api/orders/${orderId}/return`;

      await api.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setSubmitting(false);
      if (onSuccess) onSuccess();
      onHide();
    } catch (err) {
      setSubmitting(false);
      setError(err.response?.data?.message || "Failed to request return.");
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="md" centered style={{top: '60px'}}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Request Return</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Resolution</Form.Label>
            <Form.Select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              required
            >
              <option value="">Select Refund or Replacement</option>
              {RESOLUTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          {/* Show size/color only if Replacement/Exchange selected */}
          {resolution === "Replacement" && (
            <>
              <div className="mb-2" style={{ fontSize: 15, color: "#0d6efd" }}>
                <strong>
                  If you want another size/color, select it below. If you want
                  the same, select your original size/color.
                </strong>
              </div>
              <Form.Group className="mb-3">
                <Form.Label>
                  Select Color <span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  required
                >
                  <option value="">Select Color</option>
                  {availableColors.map((clr) => (
                    <option key={clr} value={clr}>
                      {clr}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>
                  Select Size <span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  required
                  disabled={sizesForColor.length === 0}
                >
                  <option value="">Select Size</option>
                  {sizesForColor.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Reason</Form.Label>
            <Form.Select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="">Select a reason</option>
              {REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Elaborate (required)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
              placeholder="Describe your issue in detail"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Upload Images (up to 5, jpg/png/webp)</Form.Label>
            <Form.Control
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageChange}
              required
            />
          </Form.Group>
          {error && <Alert variant="danger">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : "Submit Return"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}