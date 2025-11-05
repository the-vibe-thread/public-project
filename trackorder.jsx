import { useEffect, useState } from "react";
import { Container, Card, Spinner, Alert, Row, Col, ProgressBar, Button, Modal, Badge } from "react-bootstrap";
import { motion } from "framer-motion";
import { api } from "../api";

// Order statuses
const ORDER_STATUSES = [
  { key: "Pending", label: "Pending", icon: "bi-hourglass-split", emoji: "⏳" },
  { key: "Processing", label: "Processing", icon: "bi-gear", emoji: "⚙️" },
  { key: "Shipped", label: "Shipped", icon: "bi-truck", emoji: "🚚" },
  { key: "Delivered", label: "Delivered", icon: "bi-box-seam", emoji: "📦" },
  { key: "Return Requested", label: "Return Requested", icon: "bi-arrow-counterclockwise", emoji: "↩️" },
  { key: "Returned", label: "Returned", icon: "bi-x-circle", emoji: "❌" },
  { key: "Cancelled", label: "Cancelled", icon: "bi-x-circle", emoji: "❌" },
];

function getStatusIndex(status) {
  return ORDER_STATUSES.findIndex(s => s.key === status);
}

function StatusStepper({ status }) {
  const currentIdx = getStatusIndex(status);
  const progress =
    status === "Cancelled" || status === "Returned"
      ? 100
      : ((Math.max(currentIdx, 0) + 1) / 4) * 100;

  return (
    <div className="mb-4">
      <Row className="gx-2 align-items-center justify-content-center" style={{ minHeight: 64 }}>
        {ORDER_STATUSES.slice(0, 4).map((s, idx) => (
          <Col xs={3} key={s.key} className="text-center">
            <div
              className={`rounded-circle d-inline-flex justify-content-center align-items-center shadow-sm mb-1
                ${idx <= currentIdx && currentIdx < 4 ? "bg-success text-white" : "bg-light text-secondary"}`}
              style={{
                width: 40,
                height: 40,
                fontSize: 22,
                border: idx === currentIdx ? "3px solid #198754" : "2px solid #dee2e6",
                transition: "all 0.3s"
              }}
            >
              <i className={`bi ${s.icon} d-none d-md-inline`} />
              <span className="d-inline d-md-none">{s.emoji}</span>
            </div>
            <div style={{ fontSize: 13 }}>
              {s.label}
            </div>
            {idx < 3 && (
              <div
                style={{
                  height: 2,
                  width: "100%",
                  background: idx < currentIdx ? "#198754" : "#dee2e6",
                  margin: "0 auto",
                }}
              />
            )}
          </Col>
        ))}
      </Row>
      <ProgressBar
        now={progress}
        style={{ height: 6, borderRadius: 10, background: "#eee" }}
        variant={status === "Cancelled" || status === "Returned" ? "danger" : "success"}
        className="mb-2"
        animated
      />
      <div className="text-center" style={{ fontWeight: 500 }}>
        {status}
      </div>
    </div>
  );
}

function ShipCorrectTrackingTimeline({ tracking }) {
  if (!tracking) return null;
  // tracking = { order_no, awb, courier_name, tracking_status, scan_stages: [{ date, status, description }], status }
  return (
    <div style={{ background: "#f6f6f6", borderRadius: 8, padding: 16, marginTop: 16 }}>
      <h6 className="mb-2">Live Shipment Tracking</h6>
      <div className="mb-2">
        <Badge bg="info" className="me-2">{tracking.tracking_status}</Badge>
        <strong>Courier:</strong> {tracking.courier_name || "N/A"}<br/>
        <strong>AWB:</strong> {tracking.awb || "N/A"}<br/>
        <strong>Order No:</strong> {tracking.order_no || "N/A"}
      </div>
      {Array.isArray(tracking.scan_stages) && tracking.scan_stages.length > 0 ? (
        <div className="timeline">
          {tracking.scan_stages.map((stage, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ width: 12, marginRight: 10, textAlign: "center" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: idx === 0 ? "#198754" : "#adb5bd",
                    marginTop: 4
                  }}
                ></span>
                {idx < tracking.scan_stages.length - 1 && (
                  <div style={{ width: 2, height: 32, background: "#dee2e6", margin: "0 auto" }} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 500, color: idx === 0 ? "#198754" : "#495057" }}>
                  {stage.status}
                </div>
                <div style={{ fontSize: 13, color: "#555" }}>
                  {stage.description}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {new Date(stage.date).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted">No tracking events yet.</div>
      )}
    </div>
  );
}

function TrackOrder() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ShipCorrect tracking per order state
  const [shipcorrectTracking, setShipcorrectTracking] = useState({});
  const [trackingLoading, setTrackingLoading] = useState(null);

  // Support modal states
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportOrderId, setSupportOrderId] = useState(null);

  // Polling for live updates
  useEffect(() => {
    let interval;
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/api/orders/track", { withCredentials: true });
        setOrders(res.data.orders || []);
      } catch (err) {
        setOrders([]);
        setError(
          err.response?.data?.message ||
          "Unable to fetch orders. Please login to track your orders."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
    interval = setInterval(fetchOrders, 20000); // every 20 seconds
    return () => clearInterval(interval);
  }, []);

  // Cancel order function
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancellingOrderId(orderId);
    try {
      await api.put(`/api/orders/${orderId}/status`, {
        status: "Cancelled",
      }, { withCredentials: true });
      alert("Order cancelled!");
      setOrders(orders => orders.map(o => (o._id === orderId || o.orderId === orderId) ? { ...o, status: "Cancelled" } : o));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel order.");
    }
    setCancellingOrderId(null);
  };

  // ShipCorrect tracking function
  const fetchShipcorrectTracking = async (orderId) => {
    setTrackingLoading(orderId);
    try {
      const res = await api.get(`/api/orders/${orderId}/shipcorrect-tracking`, { withCredentials: true });
      setShipcorrectTracking((prev) => ({
        ...prev,
        [orderId]: res.data.tracking,
      }));
    } catch (err) {
      setShipcorrectTracking((prev) => ({
        ...prev,
        [orderId]: { error: "Failed to fetch ShipCorrect tracking info." },
      }));
    }
    setTrackingLoading(null);
  };

  // Support modal logic
  const openSupportModal = (orderId) => {
    setSupportOrderId(orderId);
    setShowSupportModal(true);
  };

  return (
    <Container className="py-5" style={{ maxWidth: 640 }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="p-4 shadow-lg border-0 rounded-4">
          <h3 className="mb-4 text-center fw-bold" style={{ letterSpacing: 1 }}>
            Track Your Live Orders
          </h3>
          {loading && (
            <div className="text-center my-4">
              <Spinner animation="border" variant="success" />
            </div>
          )}
          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}
          {!loading && !error && orders.length === 0 && (
            <div className="text-center text-muted py-4">
              No active orders found. Place a new order to track its progress.
            </div>
          )}
          {orders.map((order) => {
            const canCancel = ["Pending", "Processing", "Shipped"].includes(order.status);
            return (
              <Card key={order._id || order.orderId} className="my-4 p-3 border-0 bg-light rounded-3 shadow-sm">
                <StatusStepper status={order.status} />
                <h5 className="mb-2">Order Details</h5>
                <div className="mb-1 text-muted" style={{ fontSize: 15 }}>
                  <strong>Order ID:</strong> {order.orderId || order._id}
                  <br />
                  <strong>Placed On:</strong>{" "}
                  {new Date(order.createdAt).toLocaleString()}
                </div>
                <div className="mb-2">
                  <strong>Total:</strong> ₹{order.totalPrice}
                </div>
                {/* Estimated Delivery */}
                {order.status === "Shipped" && order.estimatedDelivery && (
                  <div className="mb-2">
                    <span className="badge bg-success">
                      Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {/* Items List with Image & Name */}
                <div>
                  <strong>Items:</strong>
                  <ul className="mb-2 list-unstyled" style={{ fontSize: 15 }}>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <li key={idx} className="d-flex align-items-center mb-2">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={typeof item.name === "object" && item.name.name ? item.name.name : item.name}
                              style={{
                                width: 50,
                                height: 50,
                                objectFit: "cover",
                                borderRadius: 6,
                                marginRight: 10
                              }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 500 }}>
                              {typeof item.name === "object" && item.name.name
                                ? item.name.name
                                : item.name}
                            </div>
                            <div className="text-muted">× {item.quantity}</div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li>No items found.</li>
                    )}
                  </ul>
                </div>
                <div style={{ fontSize: 15 }}>
                  <strong>Shipping Address:</strong>
                  <br />
                  {order.shippingAddress && typeof order.shippingAddress === "object"
                    ? <>
                        {order.shippingAddress.address && <>{order.shippingAddress.address}<br /></>}
                        {order.shippingAddress.city && <>{order.shippingAddress.city}, </>}
                        {order.shippingAddress.postalCode && <>{order.shippingAddress.postalCode}, </>}
                        {order.shippingAddress.country && <>{order.shippingAddress.country}<br /></>}
                        {order.shippingAddress.email && <>Email: {order.shippingAddress.email}</>}
                      </>
                    : order.shippingAddress}
                </div>
                {order.trackingNumber && (
                  <div className="mt-2">
                    <strong>Tracking Number:</strong> {order.trackingNumber}
                    {order.shippingCarrier && <> ({order.shippingCarrier})</>}
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="mt-2">
                    <strong>Delivered At:</strong> {new Date(order.deliveredAt).toLocaleString()}
                  </div>
                )}

                {/* --- LIVE SHIPCORRECT TRACKING --- */}
                {order.shipcorrectOrderNo && (
                  <div className="mt-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      disabled={trackingLoading === order._id}
                      onClick={() => fetchShipcorrectTracking(order._id)}
                    >
                      {trackingLoading === order._id ? "Loading..." : "Show Live ShipCorrect Tracking"}
                    </Button>
                    {shipcorrectTracking[order._id] && (
                      <div style={{ marginTop: 12 }}>
                        {shipcorrectTracking[order._id].error ? (
                          <span className="text-danger">{shipcorrectTracking[order._id].error}</span>
                        ) : (
                          <ShipCorrectTrackingTimeline tracking={shipcorrectTracking[order._id]} />
                        )}
                      </div>
                    )}
                  </div>
                )}
                {/* CANCEL BUTTON */}
                {canCancel && (
                  <Button
                    variant="danger"
                    className="mt-3 me-2"
                    disabled={cancellingOrderId === order._id || cancellingOrderId === order.orderId}
                    onClick={() => handleCancelOrder(order._id || order.orderId)}
                  >
                    {cancellingOrderId === order._id || cancellingOrderId === order.orderId ? "Cancelling..." : "Cancel Order"}
                  </Button>
                )}
                {/* NEED HELP BUTTON */}
                <Button
                  variant="outline-info"
                  className="mt-3"
                  onClick={() => openSupportModal(order._id || order.orderId)}
                >
                  Need Help?
                </Button>
              </Card>
            );
          })}
        </Card>
      </motion.div>

      {/* Support Modal */}
      <Modal show={showSupportModal} onHide={() => setShowSupportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Contact Support</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <strong>Email:</strong> <a href="mailto:thevibethread@gmail.com">thevibethread@gmail.com</a><br />
            <strong>Phone:</strong> <a href="tel:+917579173892">+91 7579173892</a>
          </div>
          <hr />
          <div>
            For quick help, you can email us or call the above number.<br />
            Please mention your Order ID in your message for faster support.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSupportModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default TrackOrder;