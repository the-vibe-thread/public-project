import { Container, Card, Button } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircleFill } from "react-bootstrap-icons";

function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderDetails = location.state?.order || null;

  return (
    <Container className="mt-5 d-flex justify-content-center">
      <Card className="p-4 shadow-lg text-center" style={{ maxWidth: "500px" }}>
        <CheckCircleFill color="green" size={60} className="mb-3" />
        <h2 className="text-success">Payment Successful!</h2>
        <p>Thank you for your purchase. Your payment has been received.</p>
        <p>We will ship your order soon. 📦</p>
        <p className="fw-bold">You will receive an SMS confirmation with your order details.</p>

        {orderDetails && (
          <Card className="p-3 mt-3 text-start">
            <h5>Order Summary</h5>
            <p><strong>Order ID:</strong> {orderDetails._id}</p>
            <p><strong>Total Amount:</strong> ${orderDetails.totalPrice}</p>
            <p><strong>Items:</strong></p>
            <ul>
              {orderDetails.items.map((item) => (
                <li key={item._id}>{item.name} - ${item.price} x {item.quantity}</li>
              ))}
            </ul>
            <p><strong>Estimated Delivery:</strong> {orderDetails.estimatedDeliveryDate}</p>
          </Card>
        )}

        <div className="mt-4">
          <Button variant="primary" className="me-2" onClick={() => navigate("/")}>
            Continue Shopping 🛍️
          </Button>
          {orderDetails && (
            <Button variant="outline-success" onClick={() => navigate(`/orders/${orderDetails._id}`)}>
              View Order Details 📄
            </Button>
          )}
        </div>
      </Card>
    </Container>
  );
}

export default PaymentSuccess;
