import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function ConfirmationPage() {
  const navigate = useNavigate();

  return (
    <Container className="mt-5 text-center">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="p-4 shadow-lg">
            <Card.Body>
              <h2 className="text-success">Order Confirmed! 🎉</h2>
              <p className="mt-3">
                Thank you for your purchase. Your order has been successfully placed.  
              </p>
              <p>A confirmation email will be sent to you shortly.</p>
              <Button variant="primary" className="mt-3" onClick={() => navigate("/")}>
                Continue Shopping
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ConfirmationPage;
