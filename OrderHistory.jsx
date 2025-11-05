import { useEffect, useState } from "react";
import {
  Container,
  Card,
  Badge,
  Modal,
  Button,
  Form,
  Spinner,
  Alert,
  Row,
  Col,
  InputGroup,
} from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import InfiniteScroll from "react-infinite-scroll-component";
import { api } from "../api";
import ReturnRequestModal from "./ReturnnRequestModel";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Helper for status color badges
const statusColor = {
  Pending: "secondary",
  Processing: "info",
  Shipped: "primary",
  Delivered: "success",
  Cancelled: "danger",
  Returned: "dark",
  "Return Requested": "warning",
  Refunded: "info",
  Pickedup: "primary",
};

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [orderToSync, setOrderToSync] = useState(null);

  // Support modal
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportOrderId, setSupportOrderId] = useState(null);

  // Return modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState(null);
  const [returnProductId, setReturnProductId] = useState(null);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [colorObjects, setColorObjects] = useState([]);

  // Cancel confirmation modal state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelTarget, setCancelTarget] = useState({
    orderId: null,
    productId: null,
    type: null,
  });

  // Infinite scroll & filter
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterProduct, setFilterProduct] = useState("");
  const [filtering, setFiltering] = useState(false);

  useEffect(() => {
    fetchOrders(1, true);
    // eslint-disable-next-line
  }, []);

  const fetchOrders = async (pageNum = 1, reset = false) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/api/orders/myorders?page=${pageNum}&product=${encodeURIComponent(
          filterProduct
        )}`,
        { withCredentials: true }
      );
      const fetchedOrders = res.data.orders || [];
      if (reset) {
        setOrders(fetchedOrders);
      } else {
        setOrders((prev) => [...prev, ...fetchedOrders]);
      }
      setHasMore(fetchedOrders.length > 0);
      setPage(pageNum);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to fetch orders. Please login."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreOrders = () => {
    fetchOrders(page + 1);
  };

  useEffect(() => {
    if (orderToSync) {
      const updatedOrder = orders.find((o) => o._id === orderToSync);
      if (updatedOrder) setSelectedOrder(updatedOrder);
      setOrderToSync(null);
    }
  }, [orders, orderToSync]);
  const handleFilterChange = (e) => {
    setFilterProduct(e.target.value);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setFiltering(true);
    fetchOrders(1, true);
    setFiltering(false);
  };

  // Download Invoice PDF (only for Delivered/Returned/Refunded)
  const handleDownloadInvoice = async (orderId) => {
    try {
      const res = await api.get(`/api/invoices/${orderId}`, {
        responseType: "blob",
        withCredentials: true,
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Invoice downloaded!");
    } catch (err) {
      toast.error("Failed to download invoice.");
    }
  };

  // Support Modal logic
  const openSupportModal = (orderId) => {
    setSupportOrderId(orderId);
    setShowSupportModal(true);
  };

  // Cancel return for a single product
  const handleCancelReturnProduct = async (orderId, productId) => {
    try {
      await api.post(
        `/api/orders/${orderId}/cancel-return/${productId}`,
        {},
        { withCredentials: true }
      );
      toast.success("Return request cancelled for product!");
      await fetchOrders(1, true);
      setOrderToSync(orderId); // <-- Add this line
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to cancel return request."
      );
    }
  };

  // Cancel return for entire order
  const handleCancelReturnOrder = async (orderId) => {
    try {
      await api.post(
        `/api/orders/${orderId}/cancel-return`,
        {},
        { withCredentials: true }
      );
      toast.success("Return request cancelled for order!");
      fetchOrders(1, true);
      setOrderToSync(orderId); // <-- Add this line
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to cancel return request."
      );
    }
  };

  // Show confirmation modal before cancelling
  const promptCancelReturnProduct = (orderId, productId) => {
    setCancelTarget({ orderId, productId, type: "product" });
    setShowCancelConfirm(true);
  };

  const promptCancelReturnOrder = (orderId) => {
    setCancelTarget({ orderId, productId: null, type: "order" });
    setShowCancelConfirm(true);
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleOpenReturnModal = (orderId, productId) => {
    setReturnOrderId(orderId);
    setReturnProductId(productId);

    let colors = [];
    let colorObjs = [];

    if (productId && selectedOrder) {
      // Per-product return
      const item = selectedOrder.products.find(
        (p) => (p.product?._id || p.product) === productId
      );
      if (item && item.product && Array.isArray(item.product.colors)) {
        colors = item.product.colors.map((c) => c.name);
        colorObjs = item.product.colors;
      }
    } else if (!productId && selectedOrder) {
      // Return Entire Order
      const allColors = [];
      const allColorObjs = [];
      selectedOrder.products.forEach((item) => {
        if (item.product && Array.isArray(item.product.colors)) {
          item.product.colors.forEach((colorObj) => {
            allColors.push(colorObj.name);
            allColorObjs.push(colorObj);
          });
        }
      });
      // Get unique color names and objects
      colors = Array.from(new Set(allColors));
      const uniqueObjs = {};
      allColorObjs.forEach((obj) => {
        uniqueObjs[obj.name] = obj; // overwrite duplicates
      });
      colorObjs = Object.values(uniqueObjs);
    }

    setAvailableColors(colors);
    setColorObjects(colorObjs);
    setAvailableSizes([]);
    setShowReturnModal(true);
  };

  const handleReturnSuccess = () => {
    fetchOrders(1, true);
    toast.success("Return request submitted!");
    setOrderToSync(returnOrderId); // <-- ADD THIS LINE!
  };

  return (
    <Container className="py-5" style={{ maxWidth: 900 }}>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="mb-4 text-center fw-bold">Order History</h2>
        {/* Filter by product name */}
        <Form
          className="mb-3"
          onSubmit={handleFilterSubmit}
          style={{ maxWidth: 400, margin: "0 auto" }}
        >
          <InputGroup>
            <Form.Control
              type="text"
              value={filterProduct}
              onChange={handleFilterChange}
              placeholder="Search orders by product name..."
              aria-label="Filter by product name"
            />
            <Button
              variant="primary"
              type="submit"
              disabled={filtering}
              aria-label="Filter"
            >
              {filtering ? "Filtering..." : "Search"}
            </Button>
          </InputGroup>
        </Form>
        {error && <Alert variant="danger">{error}</Alert>}
        {loading && (
          <div className="text-center my-4">
            <Spinner animation="border" variant="primary" />
          </div>
        )}
        {!loading && !error && orders.length === 0 && (
          <div className="text-center text-muted py-4">No orders found.</div>
        )}

        {/* Flipkart-style Order Cards */}
        <InfiniteScroll
          dataLength={orders.length}
          next={fetchMoreOrders}
          hasMore={hasMore}
          loader={
            <div className="text-center my-3">
              <Spinner animation="border" variant="primary" />
            </div>
          }
          endMessage={
            <div className="text-center text-muted py-4">
              {orders.length === 0
                ? "No orders found."
                : "No more orders to load."}
            </div>
          }
        >
          <Row>
            <AnimatePresence>
              {orders.map((order) => {
                return (
                  <Col key={order._id} xs={12} md={12} className="mb-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="shadow-sm border-0 rounded-3 order-card">
                        <Card.Body>
                          <div className="d-flex justify-content-between">
                            <div>
                              <div
                                className="fw-semibold"
                                style={{ color: "#0d6efd", cursor: "pointer" }}
                                onClick={() => openOrderDetails(order)}
                              >
                                Order ID: {order.orderId || order._id}
                              </div>
                              <div style={{ fontSize: "14px", color: "#555" }}>
                                {new Date(order.createdAt).toLocaleDateString()}{" "}
                                |{" "}
                                <Badge
                                  bg={statusColor[order.status] || "secondary"}
                                >
                                  {order.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-end fw-bold text-success">
                              ₹{order.totalPrice}
                            </div>
                          </div>
                          <hr />
                          {/* Product Thumbnails */}
                          <div className="d-flex align-items-center mb-2 flex-wrap">
                            {order.products?.map((item) => (
                              <div
                                key={item.product._id}
                                className="me-3 mb-1 d-flex flex-column align-items-center"
                              >
                                <Link to={`/product/${item.product.slug}`}>
                                  <img
                                    src={
                                      item.product.image ||
                                      "https://via.placeholder.com/48"
                                    }
                                    alt={item.product.name}
                                    style={{
                                      width: 48,
                                      height: 48,
                                      objectFit: "cover",
                                      borderRadius: 6,
                                      border: "1px solid #eee",
                                    }}
                                  />
                                </Link>
                                <span style={{ fontSize: 12, marginTop: 2 }}>
                                  {item.product.name || item.name}
                                </span>
                              </div>
                            ))}
                          </div>
                          {/* Tracking & Delivery Info */}
                          {order.status === "Shipped" &&
                            order.estimatedDelivery && (
                              <div className="mb-2">
                                <Badge bg="success" className="me-2">
                                  Est. Delivery:{" "}
                                  {new Date(
                                    order.estimatedDelivery
                                  ).toLocaleDateString()}
                                </Badge>
                                {order.trackingUrl && (
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    href={order.trackingUrl}
                                    target="_blank"
                                    className="ms-2"
                                  >
                                    Track Package
                                  </Button>
                                )}
                              </div>
                            )}
                          {/* Order Actions */}
                          <div className="d-flex flex-wrap gap-2 mt-3">
                            {["Delivered", "Returned", "Refunded"].includes(
                              order.status
                            ) && (
                              <>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() =>
                                    handleDownloadInvoice(order._id)
                                  }
                                >
                                  Download Invoice
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => openSupportModal(order._id)}
                            >
                              Need Help?
                            </Button>
                          </div>
                        </Card.Body>
                        <Card.Footer className="bg-white border-0 pt-0 pb-3">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openOrderDetails(order)}
                          >
                            View Details
                          </Button>
                        </Card.Footer>
                      </Card>
                    </motion.div>
                  </Col>
                );
              })}
            </AnimatePresence>
          </Row>
        </InfiniteScroll>
      </motion.div>

      {/* Order Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Order Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder ? (
            <>
              <h5>Order ID: {selectedOrder.orderId || selectedOrder._id}</h5>
              <p>Date: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              <p>
                Status:{" "}
                <Badge bg={statusColor[selectedOrder.status] || "secondary"}>
                  {selectedOrder.status}
                </Badge>
              </p>
              {selectedOrder.status === "Shipped" &&
                selectedOrder.estimatedDelivery && (
                  <p>
                    <strong>Estimated Delivery:</strong>{" "}
                    {new Date(
                      selectedOrder.estimatedDelivery
                    ).toLocaleDateString()}
                  </p>
                )}
              <hr />
              {/* Show "Return Entire Order" only if: delivered, >1 product, at least one eligible for return */}
              {selectedOrder.status === "Delivered" &&
                selectedOrder.products &&
                selectedOrder.products.length > 1 &&
                selectedOrder.products.some(
                  (p) =>
                    !["Return Requested", "Returned", "Refunded"].includes(
                      p.status
                    )
                ) && (
                  <Button
                    size="sm"
                    variant="outline-danger"
                    className="mb-3"
                    onClick={() =>
                      handleOpenReturnModal(selectedOrder._id, null)
                    }
                  >
                    Return Entire Order
                  </Button>
                )}
              {/* Cancel Return for Entire Order */}
              {selectedOrder.status === "Return Requested" &&
                selectedOrder.products.every(
                  (p) => p.status === "Return Requested"
                ) && (
                  <Button
                    size="sm"
                    variant="outline-danger"
                    className="mb-3"
                    onClick={() => promptCancelReturnOrder(selectedOrder._id)}
                  >
                    Cancel Return for Entire Order
                  </Button>
                )}
              <h6>Products:</h6>
              <ul className="list-unstyled">
                {selectedOrder.products?.map((item, idx) => {
                  // Updated logic for product status and messages
                  const canReturn =
                    selectedOrder.status === "Delivered" &&
                    ![
                      "Return Requested",
                      "Returned",
                      "Refunded",
                      "Return Approved",
                      "Pickedup",
                    ].includes(item.status);

                  // Show badges based on product status
                  let productBadge = null;
                  if (item.status === "Refunded") {
                    productBadge = (
                      <Badge bg="info" className="me-2">Refunded</Badge>
                    );
                  } else if (item.status === "Returned") {
                    productBadge = (
                      <Badge bg="dark" className="me-2">Returned</Badge>
                    );
                  } else if (item.pickupStatus === "Picked Up") {
                    productBadge = (
                      <Badge bg="primary" className="me-2">Picked Up</Badge>
                    );
                  } else if (item.status === "Return Approved") {
                    productBadge = (
                      <Badge bg="success" className="me-2">Return Approved</Badge>
                    );
                  } else if (item.status === "Return Requested") {
                    productBadge = (
                      <Badge bg="warning" className="me-2">Return Requested</Badge>
                    );
                  }

                  // Show details/message below badge
                  let productDetails = null;
                  if (item.status === "Refunded") {
                    productDetails = (
                      <div className="text-info" style={{ fontSize: 13, marginTop: 4 }}>
                        {item.refundAmount && <>Refund of ₹{item.refundAmount} processed</>}
                        {item.refundDate && <> on {new Date(item.refundDate).toLocaleDateString()}</>}
                        {item.resolution && <> &bull; Resolution: {item.resolution}</>}
                      </div>
                    );
                  } else if (item.status === "Returned") {
                    if ( item.replacementOrderId) {
                      console.log("item:", item);
                    }
                    productDetails = (
                      <div className="text-dark" style={{ fontSize: 13, marginTop: 4 }}>
                        Replacement order has been generated.
                        {item.replacementOrderId && (
                          <> Replacement Order ID: <b>{item.replacementOrderId}</b></>
                        )}
                      </div>
                    );
                  } else if (item.pickupStatus === "Picked Up") {
                    productDetails = (
                      <div className="text-primary" style={{ fontSize: 13, marginTop: 4 }}>
                        Your returned product has been picked up. Refund or replacement will be processed soon as per your request.
                      </div>
                    );
                  } else if (item.status === "Return Approved") {
                    productDetails = (
                      <div className="text-success" style={{ fontSize: 13, marginTop: 4 }}>
                        Pickup will be done within 2-3 days. You will get details via message/WhatsApp.
                      </div>
                    );
                  }

                  return (
                    <li key={idx} className="mb-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          {item.product?.image && (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              style={{
                                width: 40,
                                height: 40,
                                objectFit: "cover",
                                borderRadius: 4,
                                marginRight: 10,
                              }}
                            />
                          )}
                          <span>
                            <h5 className="fw-normal">
                              {item.product?.name || item.name}
                            </h5>
                            {item.color && (
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#555",
                                  marginLeft: 6,
                                }}
                              >
                                • Color: {item.color}
                              </span>
                            )}
                            {item.size && (
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#555",
                                  marginLeft: 6,
                                }}
                              >
                                • Size: {item.size}
                              </span>
                            )}
                            <span style={{ fontSize: 12, marginLeft: 6 }}>
                              × {item.quantity}
                            </span>
                          </span>
                        </div>
                        <div>
                          {canReturn && (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              className="me-2"
                              onClick={() =>
                                handleOpenReturnModal(
                                  selectedOrder._id,
                                  item.product?._id || item._id
                                )
                              }
                            >
                              Return
                            </Button>
                          )}

                          {productBadge}
                          {productDetails}

                          {/* Cancel Return for single product */}
                          {item.status === "Return Requested" && (
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() =>
                                promptCancelReturnProduct(
                                  selectedOrder._id,
                                  item.product?._id || item._id
                                )
                              }
                            >
                              Cancel Return
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <hr />
              <h6>Shipping Address:</h6>
              <div>
                {selectedOrder.shippingAddress &&
                typeof selectedOrder.shippingAddress === "object" ? (
                  <>
                    {selectedOrder.shippingAddress.address && (
                      <>
                        {selectedOrder.shippingAddress.address}
                        <br />
                      </>
                    )}
                    {selectedOrder.shippingAddress.city && (
                      <>{selectedOrder.shippingAddress.city}, </>
                    )}
                    {selectedOrder.shippingAddress.postalCode && (
                      <>{selectedOrder.shippingAddress.postalCode}, </>
                    )}
                    {selectedOrder.shippingAddress.country && (
                      <>
                        {selectedOrder.shippingAddress.country}
                        <br />
                      </>
                    )}
                    {selectedOrder.shippingAddress.email && (
                      <>Email: {selectedOrder.shippingAddress.email}</>
                    )}
                  </>
                ) : (
                  selectedOrder.shippingAddress
                )}
              </div>
              <hr />
              <h6>Payment:</h6>
              <p>Method: {selectedOrder.paymentMethod}</p>
              <p>Total Paid: ₹{selectedOrder.totalPrice}</p>
            </>
          ) : (
            <p>No details</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Cancel Return Confirmation Modal */}
      <Modal
        show={showCancelConfirm}
        onHide={() => setShowCancelConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Cancel Return</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {cancelTarget.type === "product"
            ? "Are you sure you want to cancel the return request for this product?"
            : "Are you sure you want to cancel the return request for the entire order?"}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowCancelConfirm(false)}
          >
            No, Keep Return
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              setShowCancelConfirm(false);
              if (cancelTarget.type === "product") {
                await handleCancelReturnProduct(
                  cancelTarget.orderId,
                  cancelTarget.productId
                );
              } else {
                await handleCancelReturnOrder(cancelTarget.orderId);
              }
            }}
          >
            Yes, Cancel Return
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Support Modal */}
      <Modal show={showSupportModal} onHide={() => setShowSupportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Contact Support</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <strong>Email:</strong>{" "}
            <a href="mailto:thevibethread@gmail.com">thevibethread@gmail.com</a>
            <br />
            <strong>Phone:</strong>{" "}
            <a href="tel:+917579173892">+91 7579173892</a>
          </div>
          <hr />
          <div>
            For quick help, you can email us or call the above number.
            <br />
            Please mention your Order ID in your message for faster support.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowSupportModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Return Request Modal */}
      <ReturnRequestModal
        show={showReturnModal}
        onHide={() => setShowReturnModal(false)}
        orderId={returnOrderId}
        productId={returnProductId}
        onSuccess={handleReturnSuccess}
        availableSizes={availableSizes}
        availableColors={availableColors}
        colorObjects={colorObjects}
      />
    </Container>
  );
}

export default OrderHistory;