import React from "react";
import { Container, Card } from "react-bootstrap";

export default function ShippingPolicy() {
  return (
    <Container className="mt-5 mb-5">
      <Card>
        <Card.Body>
          <h2 className="mb-4 text-center">Shipping Policy</h2>
          
          <h5 className="mt-4">Processing Time:</h5>
          <ul>
            <li>1–2 business days (including weekends).</li>
          </ul>

          <h5 className="mt-4">Shipping Partners:</h5>
          <ul>
            <li>We currently ship orders through trusted logistics services, likely XpressBees via Ship Correct.</li>
          </ul>

          <h5 className="mt-4">Shipping Times:</h5>
          <ul>
            <li><strong>Metro Cities:</strong> 2–3 business days</li>
            <li><strong>Other Areas:</strong> 3–5 business days</li>
          </ul>

          <h5 className="mt-4">Shipping Fee:</h5>
          <ul>
            <li>Free shipping above ₹499.</li>
          </ul>

          <h5 className="mt-4">Delivery Delays:</h5>
          <p>
            We are not responsible for delays caused by natural disasters, courier issues, or other unforeseen circumstances.
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}