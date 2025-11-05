import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
} from "react-bootstrap";
import { useCart } from "./cartContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import style from "./payment.module.css";
import { fetchApi } from "../api";

function PaymentPage() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const [totalPrice, setTotalPrice] = useState(0);
  const [shippingCost, setShippingCost] = useState(5);
  const [giftWrap, setGiftWrap] = useState(false);
  const [finalTotal, setFinalTotal] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pincode, setPincode] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  //const [pincodeError, setPincodeError] = useState("");
  //const [pincodeResult, setPincodeResult] = useState(null);
  //const [checkingPincode, setCheckingPincode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flat, setFlat] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [selectedShipping, setSelectedShipping] = useState("Standard");

  const originalPriceTotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const forbiddenChars = /[.'"\\;]/;

  function hasEscapeChars(input) {
    return forbiddenChars.test(input);
  }
  const escapeSequence = /\\./;

  function hasEscapeSequence(input) {
    return escapeSequence.test(input);
  }

  useEffect(() => {
    if (cart) setLoading(false);
  }, [cart]);

  useEffect(() => {
    if (!cart.length) return;

    const subtotal = cart.reduce(
      (acc, item) => acc + item.discount?.price * item.quantity,
      0
    );
    const giftWrapCharge = giftWrap ? 100 : 0;
    // Only subtract up to subtotal, never allow negative subtotal
    const discountApplied = Math.min(discountAmount, subtotal);
    const subtotalAfterDiscount = subtotal - discountApplied;

    fetchShippingCost(subtotalAfterDiscount).then((shipping) => {
      setShippingCost(shipping);
      setTotalPrice(subtotal); // subtotal before discount
      setFinalTotal(subtotalAfterDiscount + shipping + giftWrapCharge);
    });
  }, [cart, giftWrap, discountAmount]);

  useEffect(() => {
    const stored = localStorage.getItem("appliedDiscount");
    if (stored) {
      const { discountAmount } = JSON.parse(stored);
      setDiscountAmount(discountAmount);
    }
  }, []);

  // --- NEW: Split Razorpay flow ---
  const handlePayment = async () => {
    if (
      !name ||
      !flat ||
      !city ||
      !stateName ||
      !pincode ||
      !deliveryPhone ||
      !email ||
      !city ||
      !stateName
    ) {
      toast.warning(
        "Please fill in all required fields: Name, Address, City, State, Pincode, and Phone."
      );
      return;
    }

    // Prepare products array for backend
    const products = cart.map((item) => ({
      product: item._id,
      productId: item.productId || item.sku || item._id,
      sku: item.sku || "",
      quantity: item.quantity,
      price: item.discount?.price ?? item.price,
      priceAtOrder: item.discount?.price ?? item.price,
      color: item.selectedColor, // correct!
      size: item.selectedSize, // correct!
      slug: item.slug, // correct!
    }));
    console.log("Products for order:", products);

    // 1. Create Razorpay order (get order ID, no DB order yet)
    const razorOrderResp = await fetchApi(
      "/api/orders/prepaid/validate-and-initiate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products,
          totalPrice: finalTotal,
          shippingCost,
          name,
          email,
          address: `${flat}, ${city}, ${stateName}, ${pincode}`,
          pincode,
          deliveryPhone,
          city,
          state: stateName,
          giftWrap,
        }),
      }
    );

    if (!razorOrderResp.success) {
      toast.error(razorOrderResp.message || "Failed to initiate payment.");
      return;
    }
    // 2. Open Razorpay checkout
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: finalTotal * 100,
      currency: "INR",
      name: "Your Store",
      description: "E-commerce Order Payment",
      image: "your-logo-url",
      order_id: razorOrderResp.razorpayOrderId,
      handler: async function (response) {
        try {
          // 3. On payment success, verify and create order in DB (with preorder logic)
          const verifyResp = await fetchApi("/api/orders/verify-and-create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: razorOrderResp.razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderDetails: {
                products: cart.map((item) => ({
                  product: item._id,
                  productId: item.productId || item.sku || item._id,
                  sku: item.sku || "", // <-- Add this line
                  quantity: item.quantity,
                  price: item.discount?.price ?? item.price,
                  priceAtOrder: item.discount?.price ?? item.price, // <-- Added
                  color: item.selectedColor, // correct!
                  size: item.selectedSize, // correct!
                  slug: item.slug, // correct!
                })),
                totalPrice: finalTotal,
                shippingMethod: selectedShipping,
                shippingCost,
                paymentMethod: "razorpay",
                giftWrap,
                name,
                email,
                address: `${flat}, ${city}, ${stateName}, ${pincode}`,
                pincode,
                deliveryPhone,
                city,
                state: stateName,
              },
            }),
          });
          if (!verifyResp.success)
            throw new Error(
              verifyResp.message || "Payment verification failed."
            );

          toast.success("Payment successful! Order confirmed.");
          clearCart();
          localStorage.removeItem("appliedDiscount");
          navigate("/confirmation");
        } catch (error) {
          console.error("Payment verification failed:", error);
          toast.error("Payment verification failed. Please contact support.");
        }
      },
      prefill: {
        name,
        email,
        contact: deliveryPhone,
      },
      theme: { color: "#3399cc" },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  // --- END NEW SPLIT FLOW ---

  /*const handleCheckPincode = async () => {
    if (!pincode.trim()) return;

    setCheckingPincode(true);
    setPincodeResult(null);

    try {
      const data = await fetchApi(`/api/pincodes/${pincode}`);

      if (data.success) {
        setPincodeResult({ success: true, message: data.message });
        setCity(data.city || "");
        setStateName(data.state || "");
      } else {
        setPincodeResult({ success: false, message: data.message });
        setCity("");
        setStateName("");
      }
    } catch (error) {
      setPincodeResult({
        success: false,
        message: "Error checking pincode. Try again later.",
      });
      setCity("");
      setStateName("");
    } finally {
      setCheckingPincode(false);
    }
  };*/

  // Pincode validation
  /*const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setPincode(val);
    setPincodeError(
      val.length === 6 || val.length === 0 ? "" : "Enter a valid 6-digit PIN"
    );
  };*/

  const fetchShippingCost = async (orderValue) => {
    try {
      const data = await fetchApi(`/api/shipping?orderValue=${orderValue}`);
      return data.shippingCost ?? 0;
    } catch {
      return 0;
    }
  };

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="danger">Error: {error}</Alert>
      </Container>
    );
  }
  // Add these before return
  const discountApplied = Math.min(discountAmount, totalPrice);
  const subtotalAfterDiscount = totalPrice - discountApplied;

  return (
    <motion.div
      className={style.paymentPageWrapper}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.5 }}
    >
      <Container className={style.paymentContainer}>
        <ToastContainer position="top-right" autoClose={3000} />
        <motion.h2
          className="text-center mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          delivery details
        </motion.h2>
        <Row className="justify-content-center">
          <Col md={10} lg={10}>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <Card className={style.paymentCard}>
                <Card.Body>
                  <motion.h4
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    Customer Details
                  </motion.h4>
                  <Form.Group className="mb-2">
                    <Form.Label>Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={name}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (hasEscapeChars(value) && hasEscapeSequence(value)) {
                          toast.warning(
                            "Special characters ( ' \" \\ ; ) are not allowed."
                          );
                          return;
                        }
                        setName(value);
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (hasEscapeChars(value) && hasEscapeSequence(value)) {
                          toast.warning(
                            "Special characters ( ' \" \\ ; ) are not allowed."
                          );
                          return;
                        }
                        setEmail(value);
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Delivery Phone Number *</Form.Label>
                    <Form.Control
                      type="tel"
                      value={deliveryPhone}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (hasEscapeChars(value) && hasEscapeSequence(value)) {
                          toast.warning(
                            "Special characters ( ' \" \\ ; ) are not allowed."
                          );
                          return;
                        }
                        setDeliveryPhone(value);
                      }}
                      placeholder="Enter delivery phone number"
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Flat/House No. & Locality *</Form.Label>
                    <Form.Control
                      type="text"
                      value={flat}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (hasEscapeChars(value) && hasEscapeSequence(value)) {
                          toast.warning(
                            "Special characters ( ' \" \\ ; ) are not allowed."
                          );
                          return;
                        }
                        setFlat(value);
                      }}
                      placeholder="Flat/House No., Locality"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>City *</Form.Label>
                    <Form.Control
                      type="text"
                      value={city}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (hasEscapeChars(value) && hasEscapeSequence(value)) {
                          toast.warning(
                            "Special characters ( ' \" \\ ; ) are not allowed."
                          );
                          return;
                        }
                        setCity(value);
                      }}
                      placeholder="City"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>State *</Form.Label>
                    <Form.Control
                      type="text"
                      value={stateName}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (hasEscapeChars(value) && hasEscapeSequence(value)) {
                          toast.warning(
                            "Special characters ( ' \" \\ ; ) are not allowed."
                          );
                          return;
                        }
                        setStateName(value);
                      }}
                      placeholder="State"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Pincode *</Form.Label>
                    <Form.Control
                      type="text"
                      value={pincode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (hasEscapeChars(value) && hasEscapeSequence(value)) {
                          toast.warning(
                            "Special characters ( ' \" \\ ; ) are not allowed."
                          );
                          return;
                        }
                        setPincode(value);
                      }}
                      maxLength={6}
                      placeholder="Enter pincode"
                      required
                    />
                  </Form.Group>

                  {/*<Form.Group className="mb-2">
                    <Form.Label>City *</Form.Label>
                    <Form.Control
                      type="text"
                      value={city}
                      readOnly
                      placeholder="City"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>State *</Form.Label>
                    <Form.Control
                      type="text"
                      value={stateName}
                      readOnly
                      placeholder="State"
                      required
                    />
                  </Form.Group>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <Card
                      className={`${style["pincode-card"]} p-3 shadow-sm mt-3`}
                    >
                      <motion.h5
                        style={{ paddingLeft: "8px" }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.45 }}
                      >
                        Pincode
                      </motion.h5>
                      <div
                        className={`${style["pincode-input-group"]} mb-2`}
                        style={{ gap: 12, flexWrap: "wrap" }}
                      >
                        <input
                          type="text"
                          className={style["pincode-input"]}
                          placeholder="Enter pincode"
                          value={pincode}
                          onChange={handlePincodeChange}
                          maxLength={6}
                        />
                      </div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                      >
                        <Button
                          className={`${style["pincode-check-btn"]} mt-2`}
                          disabled={
                            checkingPincode || !pincode || !!pincodeError
                          }
                          onClick={handleCheckPincode}
                          type="button"
                        >
                          {checkingPincode ? "Checking..." : "Check"}
                        </Button>
                      </motion.div>
                      <AnimatePresence>
                        {pincodeError && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="text-danger mb-2"
                          >
                            {pincodeError}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className={style["pincode-help-text"]}>
                        Please enter PIN code to check delivery time & Pay on
                        Delivery Availability
                      </div>
                      <AnimatePresence>
                        {pincodeResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                          >
                            <Alert
                              className="mt-2"
                              variant={
                                pincodeResult.success ? "success" : "danger"
                              }
                            >
                              {pincodeResult.message}
                            </Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div> */}

                  <hr />

                  <motion.h4
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    Payment Summary
                  </motion.h4>
                  <motion.p>
                    original Price : ₹{originalPriceTotal.toFixed(2)}
                  </motion.p>
                  <motion.p>
                    Subtotal (before discount coupon aplied): ₹
                    {totalPrice.toFixed(2)}
                  </motion.p>
                  <motion.p>
                    Discount coupon applied : -₹{discountApplied.toFixed(2)}
                  </motion.p>
                  <motion.p>
                    Subtotal (after discount coupon applied): ₹
                    {subtotalAfterDiscount.toFixed(2)}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                  >
                    Shipping: ₹{shippingCost.toFixed(2)}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                  >
                    Gift Wrap: {giftWrap ? "₹100.00" : "₹0.00"}
                  </motion.p>
                  <motion.h5
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    Total: ₹{finalTotal.toFixed(2)}
                  </motion.h5>

                  <Form.Group className="mt-2">
                    <Form.Check
                      type="checkbox"
                      label="Gift Wrap (+₹100)"
                      checked={giftWrap}
                      onChange={() => setGiftWrap(!giftWrap)}
                    />
                  </Form.Group>

                  {/* COD Disabled */}
                  {/* 
              <Form.Group className="mt-2">
                <Form.Label>Select Payment Method</Form.Label>
                <Form.Check
                  type="radio"
                  label="Credit/Debit Card, Net Banking, UPI (via Razorpay)"
                  value="razorpay"
                  checked={paymentMethod === "razorpay"}
                  onChange={() => setPaymentMethod("razorpay")}
                />
                <Form.Check
                  type="radio"
                  label="Cash on Delivery (COD)"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
              </Form.Group>
              */}

                  <Button
                    variant="success"
                    className={`${style["pay-now"]} w-100 mt-3`}
                    onClick={handlePayment}
                  >
                    Pay Now
                  </Button>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </motion.div>
  );
}

export default PaymentPage;
