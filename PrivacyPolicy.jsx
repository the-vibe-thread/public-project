import React from "react";
import { Container, Card } from "react-bootstrap";

export default function PrivacyPolicy() {
  return (
    <Container className="mt-5 mb-5">
      <Card>
        <Card.Body>
          <h2 className="mb-4 text-center">Privacy Policy</h2>
          <p><strong>Effective Date:</strong> 1 July 2025</p>
          <p>
            At <strong>THE VIBE THREAD</strong>, your privacy is extremely important to us.<br />
            We are committed to protecting your personal information and respecting your privacy rights.
          </p>
          <h5 className="mt-4">Information We Collect:</h5>
          <ul>
            <li>Name, address, phone number, email ID</li>
            <li>Payment information (secured through encrypted gateways)</li>
            <li>Order history and purchase details</li>
            <li>Communications with customer service</li>
          </ul>
          <h5 className="mt-4">Use of Information:</h5>
          <ul>
            <li>To fulfill your orders</li>
            <li>To improve our products and services</li>
            <li>To send promotional offers and updates (only if opted-in)</li>
          </ul>
          <h5 className="mt-4">Data Security:</h5>
          <p>
            We implement strong security measures to protect your information against unauthorized access.
          </p>
          <h5 className="mt-4">Third-Party Disclosure:</h5>
          <p>
            We do not sell, trade, or rent your personal information.<br />
            Trusted partners (e.g., payment gateways, courier services) may access limited information necessary to complete transactions.
          </p>
          <h5 className="mt-4">Cookies:</h5>
          <p>
            Our website uses cookies to enhance user experience. You can control cookies through your browser settings.
          </p>
          <h5 className="mt-4">Your Rights:</h5>
          <ul>
            <li>Access or correct your personal information</li>
            <li>Request deletion of your information</li>
            <li>Opt-out from marketing communications</li>
          </ul>
          <h5 className="mt-4">Contact Us:</h5>
          <p>
            For questions regarding privacy, contact us at: <a href="mailto:thevibethread@gmail.com">thevibethread@gmail.com</a>
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}