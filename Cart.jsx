import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../components/loader";
import {
  Container,
  Button,
  Form,
  Card,
  Alert,
  ListGroup,
  Row,
  Col,
} from "react-bootstrap";
import { useCart } from "../components/cartContext";
import { ReactComponent as Trash } from "../icons/trash-2.svg";
import "./Cart.css";
import { fetchApi } from "../api";

// Add this helper function above your CartPage component
const getCartItemImage = (item) => {
  if (!item) return "/fallback-image.jpg";
  // Try to get image from selected color
  if (item.selectedColor && Array.isArray(item.colors)) {
    const colorObj = item.colors.find(
      (c) => c.name?.toLowerCase() === item.selectedColor?.toLowerCase()
    );
    if (colorObj && Array.isArray(colorObj.images) && colorObj.images[0]) {
      return colorObj.images[0].startsWith("http")
        ? colorObj.images[0]
        : `${process.env.REACT_APP_IMAGE_BASE_URL}${colorObj.images[0]}`;
    }
  }
  // Fallback to product images array
  if (Array.isArray(item.images) && item.images[0]) {
    return item.images[0].startsWith("http")
      ? item.images[0]
      : `${process.env.REACT_APP_IMAGE_BASE_URL}${item.images[0]}`;
  }
  // Fallback image
  return "/fallback-image.jpg";
};

function CartPage() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity } = useCart();

  // Add this: check login status (example: using localStorage token)
  const isLoggedIn = !!localStorage.getItem("user"); // Adjust key as per your auth logic

  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError] = useState("");
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  useEffect(() => {
    if (!cart.length) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    const fetchCartItems = async () => {
      try {
        const validCart = cart.filter((item) => item?.slug);
        // Inside fetchCartItems
        const responses = await Promise.allSettled(
          validCart.map(async (item) => {
            try {
              const data = await fetchApi(`/api/products/${item.slug}`);
              console.log("API data for slug:", item.slug, data);
              let sku = "";
              if (
                data.product &&
                Array.isArray(data.product.colors) &&
                item.selectedColor &&
                item.selectedSize
              ) {
                const colorObj = data.product.colors.find(
                  (c) =>
                    c.name?.toLowerCase() === item.selectedColor.toLowerCase()
                );
                let sizeDetails;
                if (colorObj) {
                  sizeDetails = colorObj.sizes.get
                    ? colorObj.sizes.get(item.selectedSize)
                    : colorObj.sizes[item.selectedSize];
                  sku = sizeDetails?.sku || "";
                }
              }
              return {
                ...data.product,
                quantity: item.quantity,
                selectedColor: item.selectedColor || "",
                selectedSize: item.selectedSize || "",
                sku,
                slug: item.slug || data.product.slug || "", // <-- save slug here!
              };
            } catch (err) {
              console.error("API error for slug:", item.slug, err.message);
              throw err;
            }
          })
        );

        // Optionally log rejected promises
        responses.forEach((res) => {
          if (res.status === "rejected") {
            console.error("Promise rejected:", res.reason);
          }
        });

        setCartItems(
          responses
            .filter((res) => res.status === "fulfilled" && res.value)
            .map((res) => res.value)
        );
      } catch (error) {
        console.error("Error fetching cart items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [cart]);

  useEffect(() => {
    fetchApi(`/api/discounts/available`, { withCredentials: true })
      .then((data) => setAvailableDiscounts(data || []))
      .catch(() => setAvailableDiscounts([]));
  }, []);

  const applyDiscount = useCallback(() => {
    if (!discountCode.trim()) {
      setDiscountError("Please enter a discount code.");
      setDiscountAmount(0);
      return;
    }
    fetchApi(`/api/discounts/apply`, {
      withCredentials: true,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: discountCode.toUpperCase(),
        orderAmount: cartItems.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        ),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDiscountAmount(data.discountAmount);
          setDiscountError("");
          setAppliedDiscount(data.discount);
          // Save to localStorage
          localStorage.setItem(
            "appliedDiscount",
            JSON.stringify({
              discountAmount: data.discountAmount,
              discount: data.discount,
            })
          );
        } else {
          setDiscountError(data.message || "Invalid or expired discount code.");
          setDiscountAmount(0);
        }
      })
      .catch(() => setDiscountError("Error applying discount."));
  }, [discountCode, cartItems]);

  const applyAvailableDiscount = (discount) => {
    if (appliedDiscount) return;
    setDiscountCode(discount.code);
    setDiscountAmount(discount.discountValue);
    setAppliedDiscount(discount);
    setDiscountError("");
    // Save to localStorage so Payment page can read it
    localStorage.setItem(
      "appliedDiscount",
      JSON.stringify({
        discountAmount: discount.discountValue,
        discount: discount,
      })
    );
  };

  const proceedToCheckout = () => {
    if (!isLoggedIn) {
      navigate("/auth"); // or "/login" or "/signup" as per your route
    } else {
      navigate("/payment");
    }
  };

  if (loading) return null;
  // Calculate totals here
  const originalPriceTotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.discount?.price ?? item.price) * item.quantity,
    0
  );
  const discountApplied = Math.min(discountAmount, subtotal);
  const finalTotal = (subtotal - discountApplied).toFixed(2);

  console.log("cart from context", cart);
  console.log("cartItems after API", cartItems);

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Shopping Cart</h2>

      {cartItems.length === 0 ? (
        <p>
          Your cart is empty. <Link to="/">Shop Now</Link>
        </p>
      ) : (
        <>
          <div className="cart-list-custom">
            {cartItems.map((item) =>
              !item ? null : (
                <Card className="mb-3 cart-item-custom" key={item.slug}>
                  <Card.Body>
                    <Row className="cart-item-row align-items-center flex-nowrap">
                      <Col xs="auto" className="cart-item-img-col">
                        <img
                          src={getCartItemImage(item)}
                          alt={item.name}
                          className="cart-item-img-custom img-fluid"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/fallback-image.jpg";
                          }}
                        />
                      </Col>
                      <Col className="cart-item-info-col px-0">
                        <div className="cart-item-title-row d-flex align-items-center justify-content-between">
                          <span className="cart-item-title-custom">
                            {item.name}
                          </span>
                          <button
                            className="cart-item-remove-custom"
                            onClick={() => removeFromCart(item)}
                            aria-label="Remove"
                          >
                            <Trash />
                          </button>
                        </div>
                        <div className="cart-item-prices-custom">
                          {item.discount?.price && (
                            <span className="cart-item-oldprice-custom">
                              ₹{item.price}
                            </span>
                          )}
                          <span className="cart-item-price-custom">
                            ₹{item.discount?.price ?? item.price}
                          </span>
                        </div>
                        {item.selectedColor && (
                          <div className="cart-item-color-custom">
                            Color: <span>{item.selectedColor}</span>
                          </div>
                        )}
                        {item.selectedSize && (
                          <div className="cart-item-size-custom">
                            Size:{" "}
                            <span style={{ fontWeight: 500 }}>
                              {item.selectedSize}
                            </span>
                          </div>
                        )}
                        <div className="cart-item-controls-row d-flex align-items-center mt-2">
                          <div className="cart-item-qty-controls d-flex align-items-center">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => updateQuantity(item, "decrease")}
                              disabled={item.quantity <= 1}
                            >
                              –
                            </Button>
                            <span className="mx-2">{item.quantity}</span>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() =>
                                updateQuantity(
                                  item,
                                  "increase",
                                  item.countInStock
                                )
                              }
                              disabled={item.quantity >= 10}
                            >
                              +
                            </Button>
                          </div>
                          <span className="cart-item-total-custom ms-3">
                            ₹
                            {(
                              (item.discount?.price ?? item.price) *
                              item.quantity
                            ).toFixed(2)}
                          </span>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )
            )}
          </div>

          {/* Discount Code Section */}
          <Card className="mt-4 shadow-sm">
            <Card.Body>
              <h5>Apply Discount Code</h5>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="Enter discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  disabled={appliedDiscount !== null}
                />
                <Button
                  variant="primary"
                  className="ms-2"
                  onClick={applyDiscount}
                  disabled={appliedDiscount !== null}
                >
                  Apply
                </Button>
              </div>
              {discountError && (
                <Alert variant="danger" className="mt-2">
                  {discountError}
                </Alert>
              )}
            </Card.Body>
          </Card>

          {/* Available Discounts List */}
          <Card className="mt-4 shadow-sm">
            <Card.Body>
              <h5>Available Discounts</h5>
              <ListGroup>
                {availableDiscounts.map((discount) => (
                  <ListGroup.Item
                    key={discount._id}
                    action
                    onClick={() => applyAvailableDiscount(discount)}
                    disabled={appliedDiscount !== null}
                    active={appliedDiscount?._id === discount._id}
                  >
                    {discount.code} -{" "}
                    {discount.discountType === "percentage"
                      ? `${discount.discountValue}%`
                      : `₹${discount.discountValue}`}{" "}
                    Off
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Order Summary */}
          <Card className="mt-4 shadow-sm">
            <Card.Body>
              <h5>Order Summary</h5>
              <p>Original price: ₹{originalPriceTotal.toFixed(2)}</p>
              <p>discounted price: ₹{subtotal.toFixed(2)}</p>
              <p>Discount coupon applied: -₹{discountApplied.toFixed(2)}</p>
              <h4>Total: ₹{finalTotal}</h4>
              <Button
                variant="success"
                className="w-100 mt-3 payment-btn-custom"
                onClick={proceedToCheckout}
              >
                Proceed to Checkout
              </Button>
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
}

export default CartPage;
