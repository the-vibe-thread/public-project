import { Accordion, Container } from "react-bootstrap";
import "./FAQ.css"; // Make sure this CSS file is imported

const FAQ = () => {
  return (
    <Container className="py-5">
      <h2
        className="text-center mb-5 fw-normal"
        style={{
          fontFamily: "Montserrat Arial sans-serif",
          letterSpacing: "1px",
        }}
      >
        Frequently Asked Questions
      </h2>

      <Accordion
        defaultActiveKey="none"
        flush
        className="shadow-sm rounded-4 border"
      >
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            How long will it take to receive my order?
          </Accordion.Header>
          <Accordion.Body>
            <ul className="mb-0">
              <li> For metro cities: 2–3 business days.</li>
              <li> For non-metro areas: 3–5 business days.</li>
            </ul>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="1">
          <Accordion.Header>Do you ship internationally?</Accordion.Header>
          <Accordion.Body>
            • Currently, we ship within India only.
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="2">
          <Accordion.Header>How can I track my order?</Accordion.Header>
          <Accordion.Body>
            • Once dispatched, you will receive a tracking link on your
            email/SMS.
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="3">
          <Accordion.Header>
            Can I cancel my order after placing it?
          </Accordion.Header>
          <Accordion.Body>
            • Cancellation requests can be made within 12 hours of placing the
            order or before order dispatched. After that, cancellations are not
            possible as the order moves to processing.
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="4">
          <Accordion.Header>
            What if I receive a defective item?
          </Accordion.Header>
          <Accordion.Body>
            • Please initiate a return within 24 hours of delivery through our
            Returns Portal or contact Customer Support.
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="5">
          <Accordion.Header>
            Do you offer Cash on Delivery (COD)?
          </Accordion.Header>
          <Accordion.Body>
            • Currently we are not doing Cash on Delivery (COD)
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </Container>
  );
};

export default FAQ;
