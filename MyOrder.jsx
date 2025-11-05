import React, { useEffect, useState } from "react";
import { Container, Table, ProgressBar, Button, Spinner, Badge, Form, InputGroup, Pagination } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faBoxOpen, faShippingFast, faCheckCircle, faTimesCircle, faSearch,faUndo } from "@fortawesome/free-solid-svg-icons";
import { io } from "socket.io-client";
import {api} from "../api"; // Adjust the import path as necessary

const socket = io(`${process.env.REACT_APP_API_BASE_URL}`); // Replace with your backend URL

const OrderStatusSteps = {
  "Pending": 25,
  "Processing": 50,
  "Shipped": 75,
  "Delivered": 100,
  "Returned": 100,
};

const statusIcons = {
  "Pending": <FontAwesomeIcon icon={faClock} className="text-warning" />,
  "Processing": <FontAwesomeIcon icon={faBoxOpen} className="text-info" />,
  "Shipped": <FontAwesomeIcon icon={faShippingFast} className="text-primary" />,
  "Delivered": <FontAwesomeIcon icon={faCheckCircle} className="text-success" />,
  "Returned": <FontAwesomeIcon icon={faUndo} className="text-secondary" />,
  "Cancelled": <FontAwesomeIcon icon={faTimesCircle} className="text-danger" />,
};

const getStatusVariant = (status) => {
  switch (status) {
    case "Pending": return "warning";
    case "Processing": return "info";
    case "Shipped": return "primary";
    case "Delivered": return "success";
    case "Returned": return "secondary";
    case "Cancelled": return "danger";
    default: return "secondary";
  }
};

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get("/api/orders/my-orders");
        setOrders(data.orders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    socket.on("orderUpdated", (updatedOrder) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
    });

    return () => {
      socket.off("orderUpdated");
    };
  }, []);

  const handleReturnRequest = async (orderId) => {
    try {
      const reason = prompt("Enter reason for return:");
      if (!reason) return;

      await api.post("/api/orders/request-return", { orderId, reason });
      alert("Return request submitted!");
      window.location.reload();
    } catch (error) {
      alert("Error submitting return request.");
    }
  };

  const filteredOrders = orders.filter(order => 
    (statusFilter === "All" || order.status === statusFilter) &&
    order.orderId.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  return (
    <Container className="mt-4">
      <h2 className="mb-3">🛒 My Orders</h2>

      <InputGroup className="mb-3">
        <Form.Control
          type="text"
          placeholder="Search by Order ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button variant="outline-primary"><FontAwesomeIcon icon={faSearch} /></Button>
        <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Returned">Returned</option>
          <option value="Cancelled">Cancelled</option>
        </Form.Select>
      </InputGroup>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
          <p>Loading orders...</p>
        </div>
      ) : currentOrders.length === 0 ? (
        <div className="text-center">
          <h5>No orders found.</h5>
          <p>Start shopping now and track your orders here!</p>
          <Button as={Link} to="/shop" variant="primary">Go to Shop</Button>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Return</th>
              <th>Refund</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order) => (
              <tr key={order._id}>
                <td>{order.orderId}</td>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
                <td>${order.totalPrice.toFixed(2)}</td>
                <td>
                  {statusIcons[order.status]} <Badge bg={getStatusVariant(order.status)}>{order.status}</Badge>
                </td>
                <td>
                  <ProgressBar now={OrderStatusSteps[order.status] || 0} label={`${OrderStatusSteps[order.status] || 0}%`} />
                </td>
                <td>
                  {order.returnRequest ? (
                    <Badge bg={order.returnRequest.status === "Pending" ? "warning" : order.returnRequest.status === "Approved" ? "success" : "danger"}>
                      {order.returnRequest.status}
                    </Badge>
                  ) : (
                    order.status === "Delivered" && (
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleReturnRequest(order.orderId)}
                      >
                        Request Return
                      </Button>
                    )
                  )}
                </td>
                <td>
                  {order.refund ? (
                    <Badge bg="success">Refunded</Badge>
                  ) : (
                    order.returnRequest?.status === "Approved" && <Badge bg="warning">Processing</Badge>
                  )}
                </td>
                <td>
                  <Button 
                    as={Link} 
                    to={`/order/${order.orderId}`} 
                    variant="primary"
                    className="me-2"
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Pagination className="justify-content-center mt-3">
        <Pagination.Prev 
          disabled={currentPage === 1} 
          onClick={() => setCurrentPage(prev => prev - 1)}
        />
        {Array.from({ length: totalPages }, (_, i) => (
          <Pagination.Item 
            key={i + 1} 
            active={i + 1 === currentPage} 
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next 
          disabled={currentPage === totalPages || totalPages === 0} 
          onClick={() => setCurrentPage(prev => prev + 1)}
        />
      </Pagination>
    </Container>
  );
}

export default MyOrders;
