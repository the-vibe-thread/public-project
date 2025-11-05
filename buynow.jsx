import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Card,
  Spinner,
  Alert,
  Carousel,
  FloatingLabel,
} from "react-bootstrap";
import { debounce } from "lodash";
import { Toast, ToastContainer } from "react-bootstrap";
import { useLocation } from "react-router-dom";

import { FaTruck, FaCreditCard, FaTag } from "react-icons/fa";
import './buynow.css';
import { fetchApi } from '../api'; // Adjust the import path as necessary

const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY;

function BuyNowPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  // State variables
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState("");
  const [savedAddress, setSavedAddress] = useState("");
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pincode, setPincode] = useState("");
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [pincodeResult, setPincodeResult] = useState(null);
  const [isPincodeValid, setIsPincodeValid] = useState(false);
  const [name, setName] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [email, setEmail] = useState("");
  const { selectedColor = "", selectedSize = "" } = location.state || {};

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const res = await fetchApi(`/api/products/${slug}`);
        if (!res.ok) throw new Error("Failed to load product details.");
        const data = await res.json();
        setProduct(data.product);
      } catch {
        setError("⚠️ Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();

    const storedAddress = localStorage.getItem("shippingAddress");
    if (storedAddress) {
      setSavedAddress(storedAddress);
      setUseSavedAddress(true);
      setShippingAddress(storedAddress);
    }
  }, [slug]);

  useEffect(() => {
    if (!useSavedAddress && shippingAddress) {
      localStorage.setItem("shippingAddress", shippingAddress);
    }
  }, [shippingAddress, useSavedAddress]);

  useEffect(() => {
    if (!product) return;

    const orderValue = (product.discountPrice ?? product.price) * quantity;
    const debouncedFetchShippingCost = debounce(async () => {
      try {
        const response = await fetchApi(
          `/api/shipping/?orderValue=${orderValue}`
        );
        const data = await response.json();
        setShippingCost(data.shippingCost ?? 0);
      } catch {
        setShippingCost(0);
      }
    }, 500);

    debouncedFetchShippingCost(); // Call debounce function

    return () => debouncedFetchShippingCost.cancel(); // Cleanup function
  }, [product, quantity]);

  const basePrice = useMemo(
    () => product?.discount?.price ?? product?.price ?? 0,
    [product]
  );
  const subtotal = useMemo(
    () => (basePrice * quantity).toFixed(2),
    [basePrice, quantity]
  );
  const finalTotal = useMemo(() => {
    const discountedSubtotal = Math.max(
      parseFloat(subtotal) - discountAmount,
      0
    ); // Ensure non-negative value
    return (discountedSubtotal + shippingCost).toFixed(2);
  }, [subtotal, shippingCost, discountAmount]);

  const handleQuantityChange = useCallback((type) => {
    setQuantity((prev) =>
      type === "increase" ? prev + 1 : Math.max(prev - 1, 1)
    );
  }, []);

  const handleAddressChange = () => {
    setUseSavedAddress((prev) => {
      const newUseSavedAddress = !prev;
      setShippingAddress(newUseSavedAddress ? savedAddress : "");
      return newUseSavedAddress;
    });
  };

  const handleApplyDiscount = useCallback(async () => {
    if (!discountCode.trim()) {
      setDiscountError("⚠️ Please enter a discount code.");
      return;
    }

    setApplyingDiscount(true);
    setDiscountError("");

    try {
      const upperCaseCode = discountCode.trim().toUpperCase();

      const res = await fetchApi(`/api/discounts/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: upperCaseCode,
          orderAmount: parseFloat(subtotal), // Ensure API gets correct amount
        }),
      });

      const data = await res.json();

      if (data.success) {
        let calculatedDiscount =
          data.discountType === "percentage"
            ? (parseFloat(subtotal) * data.discountAmount) / 100 // Calculate % discount
            : parseFloat(data.discountAmount); // Fixed amount discount

        calculatedDiscount = Math.min(calculatedDiscount, parseFloat(subtotal)); // Ensure discount does not exceed subtotal

        setDiscountAmount(calculatedDiscount);
        showToastMessage(
          `✅ Discount applied successfully: ₹${calculatedDiscount.toFixed(2)}`
        );
      } else {
        setDiscountError(data.message || "Invalid discount code.");
        setDiscountAmount(0);
      }
    } catch {
      setDiscountError("❌ Error applying discount.");
      setDiscountAmount(0);
    } finally {
      setApplyingDiscount(false);
    }
  }, [discountCode, subtotal]);

  const handleCheckPincode = async () => {
    if (!pincode.trim()) return;

    setCheckingPincode(true);
    setPincodeResult(null);
    setIsPincodeValid(false);

    try {
      const res = await fetchApi(`/api/pincodes/${pincode}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setPincodeResult({ success: true, message: data.message });
        setIsPincodeValid(true);
      } else {
        setPincodeResult({
          success: false,
          message: data.message || "Pincode not serviceable",
        });
        setIsPincodeValid(false);
      }
    } catch {
      setPincodeResult({
        success: false,
        message: "Error checking pincode. Try again.",
      });
      setIsPincodeValid(false);
    } finally {
      setCheckingPincode(false);
    }
  };
  const sizeDetails = useMemo(() => {
    if (!product || !selectedColor || !selectedSize) return null;
  
    const colorVariant = product.variants?.find(
      (variant) => variant.color === selectedColor
    );
  
    return colorVariant?.sizes?.find((s) => s.size === selectedSize) || null;
  }, [product, selectedColor, selectedSize]);
  

  const handlePayment = () => {
    // Check if Razorpay is available first
    if (!window.Razorpay) {
      setError("⚠️ Payment service is unavailable. Please try again later.");
      return;
    }

    // Validate required fields
    const missingFields = [];
    if (!name.trim()) missingFields.push("Name");
    if (!deliveryPhone.trim()) missingFields.push("Delivery Phone Number");
    if (deliveryPhone.length !== 10)
      missingFields.push("Valid 10-digit Phone Number");
    if (!useSavedAddress && !shippingAddress.trim())
      missingFields.push("Shipping Address");

    // If any required field is missing, show error and stop execution
    if (missingFields.length > 0) {
      setError(`⚠️ Please enter: ${missingFields.join(", ")}`);
      return;
    }
    if (!isPincodeValid) {
      setError(
        "⚠️ Please enter a valid and serviceable pincode before proceeding."
      );
      return;
    }

    // Clear any previous errors
    setError("");

    try {
      if (!sizeDetails || !sizeDetails.sku) {
        setError("⚠️ Selected product variant is unavailable or invalid.");
        return;
      }
      const options = {
        key: RAZORPAY_KEY,
        amount: finalTotal * 100, // Convert to smallest currency unit (paise)
        currency: "INR",
        name: "Your Store",
        description: "E-commerce Order Payment",
        handler: async (response) => {
          try {
            const orderPayload = {
              productSlug: product.slug,
              sku: sizeDetails.sku,
              color: selectedColor,
              size: selectedSize,
              quantity,
              amount: parseFloat(finalTotal),
              shippingAddress: useSavedAddress ? savedAddress : shippingAddress,
              name,
              phone: deliveryPhone,
              email,
              pincode,
              razorpayPaymentId: response.razorpay_payment_id,
              discountCode: discountCode || null,
              discountAmount,
              shippingCost,
            };

            const res = await fetchApi(`/api/orders`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(orderPayload),
            });

            const data = await res.json();

            if (res.ok) {
              showToastMessage("✅ Order placed successfully!");
              navigate("/payment-success");
            } else {
              showToastMessage(`⚠️ Order failed: ${data.message}`);
            }
          } catch (error) {
            console.error("Order placement failed:", error);
            showToastMessage(
              "⚠️ Payment was successful, but order failed to save."
            );
          }
        },
        prefill: {
          name,
          email: email || "customer@example.com",
          contact: deliveryPhone,
        },
        theme: { color: "#3399cc" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Payment Error:", err);
      showToastMessage("❌ Payment failed. Please try again.");
    }
  };

  const estimatedDeliveryDate = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + 5); // Example: 5 days delivery
    return today.toDateString();
  }, []);

  return (
    <Container className="buy-now-container mt-4">
      {loading ? (
        // Use this instead of <Spinner ... /> when loading is true
        <div className="buy-now-loading-container">
          <div className="buy-now-bounce-loader">
            <span />
            <span />
            <span />
          </div>
          <div className="buy-now-loading-text">Loading your order...</div>
        </div>
      ) : error ? (
        <Alert variant="danger" className="mt-5 text-center">
          {error}
        </Alert>
      ) : (
        <Row>
          <Col md={6}>
            <Card className="buy-now-card shadow-lg">
              <Carousel className="buy-now-carousel">
                {product.images?.length ? (
                  product.images.map((img, index) => (
                    <Carousel.Item key={index}>
                      <img
                        className="d-block w-100"
                        src={
                          img.startsWith("http")
                            ? img
                            :`${process.env.REACT_APP_IMAGE_BASE_URL}${img}`
                        }
                        alt={`Product ${index + 1}`}
                        loading="lazy"
                        onError={(e) => (e.target.src = "/default-image.jpg")} // Fallback image if broken
                      />
                    </Carousel.Item>
                  ))
                ) : (
                  <Carousel.Item>
                    <img
                      className="d-block w-100"
                      src="/default-image.jpg"
                      alt="Default Product"
                    />
                  </Carousel.Item>
                )}
              </Carousel>
              <Card.Body>
                <Card.Title>{product.name}</Card.Title>
                <h4>₹{basePrice.toFixed(2)}</h4>
                <Card.Text>{product.description}</Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            {/* Quantity Controls with Validation */}
            <div className="d-flex align-items-center mb-3">
              <Button
                variant="outline-secondary"
                onClick={() => handleQuantityChange("decrease")}
                disabled={quantity <= 1} // Prevent negative values
              >
                -
              </Button>
              <span className="mx-3">{quantity}</span>
              <Button
                variant="outline-secondary"
                onClick={() => handleQuantityChange("increase")}
                disabled={quantity>=10}
              >
                +
              </Button>
            </div>

            {/* Shipping Address */}
            <Form.Group>
              <Form.Label>Shipping Address</Form.Label>
              {savedAddress && (
                <Form.Check
                  type="checkbox"
                  label={`Use saved address: ${savedAddress}`}
                  checked={useSavedAddress}
                  onChange={handleAddressChange}
                  className="mb-2"
                />
              )}
              <Form.Control
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter new shipping address"
                disabled={useSavedAddress}
                required
              />
            </Form.Group>

            {/* Customer Details */}
            <FloatingLabel controlId="floatingName" label="Full Name" className="mb-3">
              <Form.Control
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </FloatingLabel>

            <Form.Group>
              <Form.Label>Delivery Phone No *</Form.Label>
              <Form.Control
                type="text"
                value={deliveryPhone}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d{0,10}$/.test(value)) {
                    // ✅ Allows only numbers (max 10 digits)
                    setDeliveryPhone(value);
                  }
                }}
                placeholder="Enter delivery phone number"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email (Optional)</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email (optional)"
              />
            </Form.Group>

            {/* Payment Summary */}
            <Card className="buy-now-payment-summary shadow-sm p-3 mb-4">
              <Card.Body>
                <h5>🧾 Payment Summary</h5>
                <p>Price per item: ₹{basePrice.toFixed(2)}</p>
                <p>Quantity: {quantity}</p>
                <p>Subtotal: ₹{subtotal}</p>
                <p>Shipping Cost: ₹{shippingCost}</p>

                {discountAmount > 0 && (
                  <>
                    <p className="text-success">Discount: -₹{discountAmount}</p>
                    <p className="text-success">
                      🎉 Discount Applied: "<b>{discountCode}</b>"
                    </p>
                  </>
                )}

                <hr className="buy-now-divider" />
                <h5 className="fw-bold">Total: ₹{finalTotal}</h5>
              </Card.Body>
            </Card>

            {/* Discount Code */}
            <Form.Group className="mb-3">
              <Form.Label>🎟️ Discount Code</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Enter discount code"
                />
                {discountAmount > 0 ? (
                  <Button
                    variant="danger"
                    onClick={() => {
                      setDiscountAmount(0);
                      setDiscountCode("");
                    }}
                    className="ms-2"
                  >
                    Remove
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleApplyDiscount}
                    disabled={applyingDiscount || !discountCode.trim()} // 🚀 Disabled if input is empty
                    className="ms-2"
                  >
                    {applyingDiscount ? (
                      <Spinner as="span" animation="border" size="sm" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                )}
              </div>
              {discountError && (
                <p className="text-danger mt-2">{discountError}</p>
              )}
            </Form.Group>
            <h6>📅 Estimated Delivery: {estimatedDeliveryDate}</h6>

            <Form.Group className="mb-3">
              <Form.Label>📍 Delivery Pincode</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="Enter pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  maxLength={6}
                />
                <Button
                  onClick={handleCheckPincode}
                  className="ms-2"
                  disabled={checkingPincode || !pincode.trim()}
                >
                  {checkingPincode ? "Checking..." : "Check"}
                </Button>
              </div>
              {pincodeResult && (
                <p
                  className={`mt-2 ${
                    pincodeResult.success ? "text-success" : "text-danger"
                  }`}
                >
                  {pincodeResult.message}
                </p>
              )}
            </Form.Group>

            {/* Order Summary Section */}
            <Card className="buy-now-summary p-3 mt-3">
              <h5>Order Summary</h5>
              <p>
                <strong>Color:</strong> {selectedColor}
              </p>
              <p>
                <strong>Size:</strong> {selectedSize}
              </p>
              <p>
                <strong>Price:</strong> ₹
                {(product.discount?.price ?? product.price)?.toFixed(2)}
              </p>
              <p>
                <strong>Quantity:</strong> {quantity}
              </p>
            </Card>

            {/* Pay Now Button with Validation */}
            <Button
              variant="success"
              className="buy-now-btn-pay w-100"
              onClick={handlePayment}
              disabled={!isPincodeValid}
            >
              💳 Pay Now
            </Button>

            {/* Additional Info Icons */}
            <div className="mt-3">
              <div className="d-flex align-items-center mb-2">
                <FaTruck className="me-2 text-success" /> Fast Delivery
              </div>
              <div className="d-flex align-items-center mb-2">
                <FaCreditCard className="me-2 text-primary" /> Secure Payment
              </div>
              <div className="d-flex align-items-center mb-2">
                <FaTag className="me-2 text-warning" /> Apply Coupon
              </div>
            </div>
          </Col>
        </Row>
      )}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
        >
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}

export default BuyNowPage;
