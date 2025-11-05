import { Container, Row, Col, Card } from "react-bootstrap";
import { EnvelopeFill, TelephoneFill } from "react-bootstrap-icons";

const RefundPolicy = () => {
  return (
    <Container className="py-5">
      <h2 className="text-center mb-5  fw-normal" style={{ fontFamily: 'Montserrat, Arial, sans-serif', letterSpacing: '1px' }}>
        Return, Exchange & Refund Policy
      </h2>

      <Row className="g-4">
        {/* Return Policy */}
        <Col md={12}>
          <Card className="shadow-sm border-0 rounded-4 p-4">
            <Card.Body>
              <Card.Title as="h3" className="mb-3">Return Policy</Card.Title>
              <p>At <strong>THE VIBE THREAD</strong>, your satisfaction is our priority. We offer an easy and transparent return process.</p>
              <br />
              <p>We offer an easy and transparent return process.</p>
              <h5 className="mt-4">Eligibility for Returns:</h5>
              <ul>
                <li>Return must be initiated within <strong>24 hours</strong> if product is defective/damaged.</li>
                <li>For other cases, return must be initiated within <strong>7 days</strong> of delivery.</li>
              </ul>

              <h5 className="mt-4">Conditions:</h5>
              <ul>
                <li>Product must be unused, clean, with original tags attached.</li>
                <li>Product packaging and freebies must also be returned in good condition.</li>
                <li>Any item returned without original tags or packaging will not be eligible.</li>
              </ul>

              <h5 className="mt-4">Return Charges:</h5>
              <p>We bear the return shipping charges.</p>

              <h5 className="mt-4">Important:</h5>
              <p>Products purchased under a discount offer are eligible for <strong>exchange only</strong>, not refund, if the offer period ends.</p>
            </Card.Body>
          </Card>
        </Col>

        {/* Exchange Policy */}
        <Col md={12}>
          <Card className="shadow-sm border-0 rounded-4 p-4">
            <Card.Body>
              <Card.Title as="h3" className="mb-3">Exchange Policy</Card.Title>

              <h5>Exchange Eligibility:</h5>
              <ul>
                <li>Initiate exchange within <strong>3 days</strong> of delivery.</li>
                <li>Applicable if sizing issue or wrong product received.</li>
                <li>Discounted items are eligible for <strong>exchange only</strong>, not refund.</li>
              </ul>

              <h5 className="mt-4">Conditions:</h5>
              <p>Same as return conditions (clean, tags intact, no damage).</p>

              <h5 className="mt-4">Process:</h5>
              <p>Fill the <strong>Exchange Request Form</strong> or contact our support.</p>
            </Card.Body>
          </Card>
        </Col>

        {/* Refund Policy */}
        <Col md={12}>
          <Card className="shadow-sm border-0 rounded-4 p-4">
            <Card.Body>
              <Card.Title as="h3" className="mb-3">Refund Policy</Card.Title>

              <h5>Refunds are processed:</h5>
              <ul>
                <li>Only if the product is eligible and meets the return conditions.</li>
                <li>Once we receive and inspect the returned item.</li>
              </ul>

              <h5 className="mt-4">Refund Method:</h5>
              <p>Refund will be made to the original payment method within <strong>5–7 business days</strong> after approval.</p>

              <h5 className="mt-4">Important Note:</h5>
              <p><strong>Free gift products</strong> are eligible for exchange only, not refund.</p>
            </Card.Body>
          </Card>
        </Col>

        {/* Customer Service Contact */}
        <Col md={12}>
          <Card className="shadow-sm border-0 rounded-4 p-4 bg-light mt-3">
            <Card.Body>
              <Card.Title as="h3" className="mb-3">
                <span role="img" aria-label="pin">📍</span> Customer Service Contact
              </Card.Title>
              <p>(For returns, exchanges, or queries)</p>
              <p>
                <EnvelopeFill className="me-2 text-primary" />
                <a href="mailto:thevibethread@gmail.com" style={{ color: '#212529', textDecoration: 'none' }}>
                  thevibethread@gmail.com
                </a>
              </p>
              <p>
                <TelephoneFill className="me-2 text-success" />
                <a href="tel:7579173892" style={{ color: '#212529', textDecoration: 'none' }}>
                  7579173892
                </a>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RefundPolicy;