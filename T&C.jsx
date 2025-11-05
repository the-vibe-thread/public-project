import React from "react";
import { Container, Card } from "react-bootstrap";

export default function TermsAndConditions() {
  return (
    <Container className="mt-5 mb-5">
      <Card>
        <Card.Body>
          <h2 className="mb-4 text-center">Terms &amp; Conditions</h2>
          <p>
            Welcome to <strong>THE VIBE THREAD</strong>!<br />
            By accessing or using our website, you agree to the following Terms &amp; Conditions.
          </p>
          <ol>
            <li>
              <strong>Intellectual Property:</strong><br />
              All content, including logo, product images, and designs are the exclusive property of THE VIBE THREAD.
            </li>
            <li>
              <strong>Product Information:</strong><br />
              We make every effort to display accurate information. However, minor color differences may occur due to screen variations.
            </li>
            <li>
              <strong>Pricing:</strong><br />
              Prices are subject to change without notice. Any offers/discounts are valid until stock lasts or until revoked by the brand.
            </li>
            <li>
              <strong>Order Acceptance:</strong><br />
              We reserve the right to accept or cancel orders at our sole discretion, including after payment is processed.
            </li>
            <li>
              <strong>Prohibited Use:</strong><br />
              You may not misuse our site for any unlawful activities.
            </li>
            <li>
              <strong>Limitation of Liability:</strong><br />
              We shall not be held liable for any direct, indirect, or incidental damages arising from the use of the website or products.
            </li>
            <li>
              <strong>Governing Law:</strong><br />
              These terms are governed by the laws of India.
            </li>
          </ol>
        </Card.Body>
      </Card>
    </Container>
  );
}