import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Spinner,
  Alert,
  Form,
  Modal,
  Accordion,
} from "react-bootstrap";
import { useCart } from "./cartContext";
import { FaStar } from "react-icons/fa";
import "./productDetail.css"; // Import your CSS file
import { motion } from "framer-motion";
import { BsFillPersonFill } from "react-icons/bs";
import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import InnerImageZoom from "react-inner-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchApi } from "../api"; // Adjust the import path as necessary
import ProductCard from "./Productcard"; // Adjust the import path as necessary
import SizeChartModal from "./Sizechartmodel"; // Adjust the import path as necessary

const BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_IMAGE_BASE_URL ||
  "http://localhost:5000"; // Change this when deploying

function ProductDetails() {
  const { slug } = useParams();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  // Get color from query string
  const queryParams = new URLSearchParams(location.search);
  let initialColor = queryParams.get("color");
  if (!initialColor || initialColor === "undefined") initialColor = "";

  // Use initialColor as the default for selectedColor
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedSize, setSelectedSize] = useState("");

  const { addToCart, cart = [] } = useCart();
  const isInCart =
    product &&
    cart.some(
      (item) =>
        item.slug === product.slug &&
        item.selectedColor === selectedColor &&
        item.selectedSize === selectedSize
    );
  const [detailSection, setDetailSection] = useState("details"); // Default: "Details"

  // ⭐ Review State
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewError, setReviewError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [similarProducts, setSimilarProducts] = useState([]);
  const [reviewSort, setReviewSort] = useState("newest");
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetchApi(`/api/products/${slug}`)
      .then((data) => {
        console.log("DETAIL DATA", data);
        const product =
          data.product ||
          (Array.isArray(data.products) && data.products.length > 0
            ? data.products[0]
            : undefined);
        if (!product) throw new Error("Product not found");
        setProduct(product);
        setError(null);
        fetchApi(
          `/api/products?category=${encodeURIComponent(
            product.category
          )}&exclude=${product._id}&limit=8`
        ).then((simData) => setSimilarProducts(simData.products || []));
      })
      .catch((err) => setError(err?.message || "Something went wrong"))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (
      initialColor &&
      product &&
      product.colors?.some((c) => c.name === initialColor)
    ) {
      setSelectedColor(initialColor);
    }
    // Only run when product or initialColor changes
  }, [product, initialColor]);

  useEffect(() => {
    if (product) {
      // If no color is selected (from query or state), select the first color automatically
      if (
        (!selectedColor ||
          !product.colors?.some((c) => c.name === selectedColor)) &&
        product.colors &&
        product.colors.length > 0
      ) {
        setSelectedColor(product.colors[0].name);
      }
    }
    // Only run when product changes
    // eslint-disable-next-line
  }, [product]);

  const handleAddToCart = () => {
    if (!selectedColor) {
      toast.warn("Please select a color.", { position: "top-center" });
      return;
    }
    if (!selectedSize) {
      toast.warn("Please select a size.", { position: "top-center" });
      return;
    }
    if (product && !isInCart && selectedColor && selectedSize) {
      setAddingToCart(true);
      addToCart({ ...product, selectedColor, selectedSize });
      setTimeout(() => {
        setAddingToCart(false);
      }, 500);
    }
  };

  const handlePreorder = async () => {
    if (!selectedColor) {
      toast.warn("Please select a color.", { position: "top-center" });
      return;
    }
    if (!selectedSize) {
      toast.warn("Please select a size.", { position: "top-center" });
      return;
    }
    setAddingToCart(true);
    try {
      // Call backend to create a preorder (with ₹100 payment)
      const res = await fetchApi(`/api/preorders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: product._id,
          color: selectedColor,
          size: selectedSize,
          amount: 100,
        }),
      });
      if (res.ok) {
        toast.success("Preorder placed! ₹100 paid as deposit.", {
          position: "top-center",
        });
        // Optionally update UI or cart
      } else {
        toast.error(res.message || "Failed to place preorder.");
      }
    } catch (err) {
      toast.error("Error placing preorder.");
    }
    setAddingToCart(false);
  };
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");
    setSuccessMessage("");

    if (!rating || !review.trim()) {
      setReviewError("❗ Please provide a rating and a comment.");
      return;
    }

    try {
      const data = await fetchApi(`/api/products/${slug}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, comment: review }),
      });

      if (data.ok) {
        setSuccessMessage("✅ Review submitted successfully!");
        setReview("");
        setRating(0);

        // Optimistically add the review to state
        const newReview = {
          rating,
          comment: review,
          username: data.username || "You",
          date: new Date().toISOString(),
          avatarUrl: data.avatarUrl || null,
        };
        setProduct((prevProduct) => ({
          ...prevProduct,
          reviews: [newReview, ...(prevProduct.reviews || [])],
        }));

        // Re-fetch product after a short delay to sync with backend (optional)
        setTimeout(async () => {
          const updatedProduct = await fetchApi(`/api/products/${slug}`);
          const newProduct =
            updatedProduct.product ||
            (Array.isArray(updatedProduct.products) &&
            updatedProduct.products.length > 0
              ? updatedProduct.products[0]
              : undefined);
          setProduct(newProduct);
        }, 1000);
      } else {
        if (data.message) {
          setReviewError(data.message);
        } else {
          setReviewError("❌ Failed to submit review. Please try again.");
        }
      }
    } catch (error) {
      setReviewError("❌ Error submitting review. Please try again later.");
    }
  };

  // Carousel images logic
  const images = product
    ? selectedColor &&
      product.colors?.find((c) => c.name === selectedColor) &&
      product.colors.find((c) => c.name === selectedColor).images?.length > 0
      ? product.colors.find((c) => c.name === selectedColor).images
      : product.colors?.[0]?.images?.length > 0
      ? product.colors[0].images
      : product.images || []
    : [];

  // Review sorting logic
  const sortedReviews =
    product && product.reviews
      ? [...product.reviews].sort((a, b) => {
          if (reviewSort === "newest")
            return new Date(b.date) - new Date(a.date);
          if (reviewSort === "highest") return b.rating - a.rating;
          if (reviewSort === "lowest") return a.rating - b.rating;
          return 0;
        })
      : [];

  if (loading) {
    return null; // or a loading spinner
  }
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }
  if (!product) {
    return <div>NO PRODUCT FOUND</div>;
  }

  return (
    <>
      <ToastContainer position="top-center" autoClose={2000} />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.5 }}
      >
        <Container fluid className="product-details-container px-0">
          <Row className="gx-0">
            <Col md={6}>
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {/* Carousel with thumbnails, now with lightbox on click */}
                {images?.length > 0 ? (
                  <>
                    <Swiper
                      navigation={false}
                      pagination={false}
                      thumbs={{
                        swiper:
                          thumbsSwiper && !thumbsSwiper.destroyed
                            ? thumbsSwiper
                            : null,
                      }}
                      modules={[Thumbs]}
                      className="product-main-swiper"
                      style={{}}
                    >
                      {images.map((img, index) => (
                        <SwiperSlide key={index}>
                          <img
                            src={
                              img.startsWith("http") ? img : `${BASE_URL}${img}`
                            }
                            alt={product.name}
                            width={400}
                            height={480}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: 12,
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              setLightboxIndex(index);
                              setLightboxOpen(true);
                            }}
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                    <Swiper
                      onSwiper={setThumbsSwiper}
                      spaceBetween={8}
                      slidesPerView={Math.min(images.length, 5)}
                      freeMode
                      watchSlidesProgress
                      modules={[Thumbs]}
                      className="product-thumb-swiper mt-2"
                      style={{ maxWidth: 340 }}
                    >
                      {images.map((img, idx) => (
                        <SwiperSlide
                          key={idx}
                          style={{ height: 70, width: 70 }}
                        >
                          <img
                            src={
                              img.startsWith("http") ? img : `${BASE_URL}${img}`
                            }
                            alt={`thumb-${idx}`}
                            style={{
                              borderRadius: 8,
                              objectFit: "cover",
                              width: "100%",
                              height: "100%",
                              border: "2px solid #eee",
                              cursor: "pointer",
                            }}
                            onError={(e) =>
                              (e.target.src = "/fallback-image.jpg")
                            }
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                    {/* Lightbox Modal */}
                    <Modal
                      show={lightboxOpen}
                      onHide={() => setLightboxOpen(false)}
                      centered
                      size="lg"
                      contentClassName="bg-dark"
                    >
                      <Modal.Body
                        className="d-flex flex-column align-items-center"
                        style={{
                          position: "relative",
                          padding: 0,
                          background: "#111",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "70vh",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            overflow: "hidden",
                            background: "#111",
                          }}
                        >
                          <img
                            src={
                              images[lightboxIndex]?.startsWith("http")
                                ? images[lightboxIndex]
                                : `${BASE_URL}${images[lightboxIndex]}`
                            }
                            alt={`large-${lightboxIndex}`}
                            width={400}
                            height={480}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "70vh",
                              borderRadius: 8,
                              objectFit: "contain",
                              background: "#111",
                              margin: "auto",
                              display: "block",
                              transition: "box-shadow 0.2s",
                            }}
                          />
                          {/* Close button */}
                          <Button
                            variant="light"
                            size="sm"
                            style={{
                              position: "absolute",
                              top: 16,
                              right: 16,
                              zIndex: 10,
                              borderRadius: "50%",
                              width: 32,
                              height: 32,
                              padding: 0,
                              fontWeight: 700,
                              fontSize: 18,
                              background: "#fff",
                            }}
                            onClick={() => setLightboxOpen(false)}
                          >
                            ×
                          </Button>
                        </div>
                        <div
                          className="text-center text-light mt-2"
                          style={{ fontSize: 15 }}
                        >
                          {lightboxIndex + 1} / {images.length}
                        </div>
                      </Modal.Body>
                    </Modal>
                  </>
                ) : (
                  <p className="text-muted">No images available</p>
                )}
              </motion.div>
            </Col>
            <Col md={6}>
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2>{product.name}</h2>
                <div className="product-price-section">
                  <div>
                    <span className="product-price">
                      {product.discount?.price
                        ? `₹${product.discount.price.toFixed(2)}`
                        : "Price on request"}
                    </span>
                    {product.price &&
                      product.discount?.price !== product.price && (
                        <span className="product-old-price">
                          ₹{product.price.toFixed(2)}
                        </span>
                      )}
                  </div>
                  <div className="product-stock-status">
                    {product.countInStock < 0 ? "Out of Stock" : null}
                  </div>
                </div>
                {/* ⭐ Color Selection */}
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={{
                    hidden: {},
                    visible: {
                      transition: {
                        staggerChildren: 0.07,
                        delayChildren: 0.22,
                      },
                    },
                  }}
                >
                  <h5>Choose Color:</h5>
                  <div
                    className="d-flex gap-2 mb-3 align-items-end flex-wrap"
                    style={{
                      overflowX: "auto",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    {product.colors?.map((color, index) => {
                      const colorObj = product.outOfStockColors?.find(
                        (c) => c.name === color.name
                      );
                      const isColorOutOfStock = colorObj?.outOfStock;

                      return (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                          }}
                          whileHover={{
                            scale: !isColorOutOfStock ? 1.1 : 1,
                            boxShadow: !isColorOutOfStock
                              ? "0 4px 16px rgba(224,74,126,0.15)"
                              : "none",
                          }}
                          whileTap={{
                            scale: !isColorOutOfStock ? 0.96 : 1,
                          }}
                          animate={{
                            borderColor:
                              selectedColor === color.name ? "#e04a7e" : "#ccc",
                            boxShadow:
                              selectedColor === color.name
                                ? "0 0 0 4px rgba(224,74,126,0.10)"
                                : "none",
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                          className={`color-thumb${
                            selectedColor === color.name ? " selected" : ""
                          }${isColorOutOfStock ? " out-of-stock" : ""}`}
                          style={{
                            borderRadius: 5,
                            padding: "12px 8px 8px 8px", // Increased top and bottom padding
                            marginRight: 12, // More space between swatches
                            opacity: isColorOutOfStock ? 0.5 : 1,
                            cursor: isColorOutOfStock
                              ? "not-allowed"
                              : "pointer",
                            width: 80, // Slightly wider for better layout
                            height: 120, // Slightly taller for more space
                            background: "#fff",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            filter: isColorOutOfStock ? "grayscale(1)" : "none",
                            position: "relative",
                            overflow: "hidden",
                            boxSizing: "border-box",
                            transition:
                              "box-shadow 0.2s, border-color 0.2s, opacity 0.2s",
                          }}
                          onClick={(e) => {
                            if (!isColorOutOfStock) {
                              setSelectedColor(color.name);
                              // Ripple effect
                              const ripple = document.createElement("span");
                              ripple.className = "ripple";
                              ripple.style.left = `${e.nativeEvent.offsetX}px`;
                              ripple.style.top = `${e.nativeEvent.offsetY}px`;
                              e.currentTarget.appendChild(ripple);
                              setTimeout(() => ripple.remove(), 500);
                            }
                          }}
                          tabIndex={isColorOutOfStock ? -1 : 0}
                          aria-disabled={isColorOutOfStock}
                          aria-label={
                            color.name +
                            (isColorOutOfStock ? " (Out of Stock)" : "")
                          }
                        >
                          <img
                            src={
                              color.icon?.startsWith("http")
                                ? color.icon
                                : `${BASE_URL}${color.icon}`
                            }
                            alt={color.name}
                            style={{
                              width: 58,
                              height: 68,
                              objectFit: "cover",
                              borderRadius: 8,
                              marginBottom: 8,
                              border:
                                selectedColor === color.name
                                  ? "2px solid #e04a7e"
                                  : "1px solid #ccc",
                              background: "#f8f9fa",
                              boxShadow:
                                selectedColor === color.name
                                  ? "0 2px 8px rgba(224,74,126,0.10)"
                                  : "none",
                              transition: "border 0.2s, box-shadow 0.2s",
                              display: "block",
                            }}
                            onError={(e) =>
                              (e.target.src = "/fallback-image.jpg")
                            }
                          />
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              textAlign: "center",
                              color:
                                selectedColor === color.name
                                  ? "#e04a7e"
                                  : "#333",
                              letterSpacing: 0.2,
                              marginTop: 4,
                              textShadow:
                                selectedColor === color.name
                                  ? "0 1px 4px #f7e3ec"
                                  : "none",
                              transition: "color 0.2s, text-shadow 0.2s",
                            }}
                          >
                            {color.name}
                          </div>
                          {isColorOutOfStock && (
                            <div
                              style={{
                                color: "#e04a7e",
                                fontSize: 13,
                                marginTop: 2,
                                position: "absolute",
                                top: 4,
                                right: 4,
                                background: "rgba(255,255,255,0.85)",
                                borderRadius: "50%",
                                width: 22,
                                height: 22,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "bold",
                                boxShadow: "0 1px 4px #eee",
                              }}
                            >
                              ✕
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
                {/* Size Selection */}
                {/* ⭐ Size Selection (fallback for outOfStockSizes) */}
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={{
                    hidden: {},
                    visible: {
                      transition: {
                        staggerChildren: 0.07,
                        delayChildren: 0.25,
                      },
                    },
                  }}
                >
                  <h5
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    Choose Size:
                    <SizeChartModal />
                  </h5>
                  <div
                    className="d-flex gap-2 mb-2 flex-wrap"
                    style={{
                      overflowX: "visible",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    {(() => {
                      if (!product) return null;
                      // Collect all unique sizes from all colors
                      const allSizes = [
                        ...new Set(
                          product.colors?.flatMap((c) =>
                            Object.keys(c.sizes || {})
                          ) || []
                        ),
                      ];
                      if (allSizes.length === 0) {
                        return (
                          <span className="text-muted">No sizes available</span>
                        );
                      }
                      return allSizes.map((size) => {
                        // Check if this size is out of stock for ALL colors
                        const isOutOfStock = product.colors.every(
                          (c) =>
                            !c.sizes?.[size] || c.sizes[size].quantity === 0
                        );
                        return (
                          <motion.button
                            type="button"
                            key={size}
                            variants={{
                              hidden: { opacity: 0, y: 20 },
                              visible: { opacity: 1, y: 0 },
                            }}
                            className={`size-badge-btn${
                              selectedSize === size ? " selected" : ""
                            }${isOutOfStock ? " out-of-stock" : ""}`}
                            tabIndex={isOutOfStock ? -1 : 0}
                            aria-disabled={isOutOfStock}
                            aria-label={
                              size + (isOutOfStock ? " (Out of Stock)" : "")
                            }
                            aria-pressed={selectedSize === size}
                            style={{
                              position: "relative",
                              minWidth: 48,
                              minHeight: 48,
                              borderRadius: 12,
                              border:
                                selectedSize === size
                                  ? "2px solidrgb(11, 11, 11)"
                                  : "1px solid #ccc",
                              background:
                                selectedSize === size ? "#fbeaf2" : "#fff",
                              color: isOutOfStock ? "#aaa" : "#222",
                              fontWeight: 600,
                              fontSize: 16,
                              boxShadow:
                                selectedSize === size
                                  ? "0 2px 8pxrgb(127, 127, 127)"
                                  : "none",
                              cursor: isOutOfStock ? "not-allowed" : "pointer",
                              outline: "none",
                              marginRight: 8,
                              marginBottom: 8,
                              transition: "all 0.18s cubic-bezier(.4,2,.6,1)",
                              overflow: "hidden",
                            }}
                            whileHover={
                              !isOutOfStock
                                ? {
                                    scale: 1.08,
                                    boxShadow:
                                      "0 4px 16px rgba(61, 61, 61, 0.13)",
                                  }
                                : {}
                            }
                            whileTap={!isOutOfStock ? { scale: 0.96 } : {}}
                            onClick={() => {
                              if (!isOutOfStock) setSelectedSize(size);
                            }}
                          >
                            {size}
                            {isOutOfStock && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: "rgba(255,255,255,0.7)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 20,
                                  color: "#e04a7e",
                                  borderRadius: 12,
                                  pointerEvents: "none",
                                  fontWeight: "bold",
                                }}
                              >
                                ✕
                              </span>
                            )}
                          </motion.button>
                        );
                      });
                    })()}
                  </div>
                </motion.div>

                {/* Highlights Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <h3>Highlights</h3>
                  <ul>
                    {product.description
                      .split("•")
                      .map((point, index) =>
                        point.trim() ? (
                          <li key={index}>{point.trim()}</li>
                        ) : null
                      )}
                  </ul>
                </motion.div>
                {/* Accordion */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                >
                  <Accordion>
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>More Details</Accordion.Header>
                      <Accordion.Body>
                        {/* Toggle Buttons */}
                        <div className="d-flex justify-content-around mb-3">
                          <Button
                            className={`detail-toggle-button${
                              detailSection === "details" ? " selected" : ""
                            }`}
                            onClick={() => setDetailSection("details")}
                          >
                            Details
                          </Button>
                          <Button
                            className={`detail-toggle-button${
                              detailSection === "care" ? " selected" : ""
                            }`}
                            onClick={() => setDetailSection("care")}
                          >
                            How to Care
                          </Button>
                        </div>

                        {/* Toggle Content */}
                        <Card className="p-3">
                          <div
                            style={{
                              maxHeight: "200px",
                              overflowY: "auto",
                              paddingRight: "10px",
                            }}
                          >
                            {detailSection === "details" ? (
                              <p>
                                {product.moreDetails ||
                                  "No additional details available."}
                              </p>
                            ) : (
                              <p>
                                {product.howToCare ||
                                  "Care instructions not available."}
                              </p>
                            )}
                          </div>
                        </Card>
                      </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="1">
                      <Accordion.Header>
                        Return & Refund Policy
                      </Accordion.Header>
                      <Accordion.Body>
                        {product.returnPolicy ||
                          "Enjoy hassle-free returns within 7 days if the product is damaged or incorrect."}
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </motion.div>
                {/* Delivery & Pincode */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <p style={{ fontFamily: "Montserrat Arial sans-serif" }}>
                    <strong>Estimated Delivery:</strong>{" "}
                    <span className="text-primary" style={{ color: "black" }}>
                      {new Date(
                        Date.now() + 5 * 24 * 60 * 60 * 1000
                      ).toDateString()}{" "}
                      (5 Days)
                    </span>
                  </p>
                  {/* Pincode with validation and animated feedback */}
                </motion.div>
                {/* Buttons Grouped */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                  className="d-flex gap-2 align-items-center btn-grouped"
                >
                  {product.isPreorder ? (
                    <Button
                      variant="warning"
                      className="btn-preorder"
                      disabled={
                        !selectedColor ||
                        !selectedSize ||
                        isInCart ||
                        addingToCart
                      }
                      onClick={handlePreorder}
                    >
                      {isInCart ? (
                        "Preordered"
                      ) : addingToCart ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        "Preorder (Pay ₹100)"
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      className="btn-add-to-cart"
                      disabled={
                        !selectedColor ||
                        !selectedSize ||
                        isInCart ||
                        addingToCart ||
                        product.countInStock === 0
                      }
                      onClick={handleAddToCart}
                    >
                      {isInCart ? (
                        "Added to Cart"
                      ) : addingToCart ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        "Add to Cart"
                      )}
                    </Button>
                  )}
                </motion.div>
                {/* Review Form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  {/* ⭐ Write a Review Section */}
                  <h5 className="mt-4">Write a Review</h5>
                  <Form onSubmit={handleReviewSubmit}>
                    <div className="d-flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          size={24}
                          className={`modern-star ${
                            (hoverRating || rating) >= star ? "filled" : ""
                          }`}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          style={{ cursor: "pointer" }}
                        />
                      ))}
                    </div>

                    <Form.Group className="mt-2">
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Write your review here..."
                      />
                    </Form.Group>

                    {reviewError && (
                      <Alert variant="danger" className="mt-2">
                        {reviewError}
                      </Alert>
                    )}
                    {successMessage && (
                      <Alert variant="success" className="mt-2">
                        {successMessage}
                      </Alert>
                    )}

                    <Button type="submit" variant="primary" className="mt-3">
                      Submit Review
                    </Button>
                  </Form>
                </motion.div>
                {/* Customer Reviews */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: 0.55 }}
                >
                  <h5 className="mt-4">Customer Reviews</h5>
                  <div className="d-flex align-items-center mb-2 gap-2">
                    <span>Sort by:</span>
                    <Form.Select
                      size="sm"
                      style={{ width: 140 }}
                      value={reviewSort}
                      onChange={(e) => setReviewSort(e.target.value)}
                    >
                      <option value="newest">Newest</option>
                      <option value="highest">Highest Rated</option>
                      <option value="lowest">Lowest Rated</option>
                    </Form.Select>
                  </div>
                  {sortedReviews.length > 0 ? (
                    <div className="review-list">
                      {sortedReviews.map((review, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: index * 0.08,
                            duration: 0.5,
                            type: "spring",
                            stiffness: 120,
                          }}
                        >
                          <Card className="mb-3 p-3 shadow-sm review-card-custom d-flex flex-row align-items-center">
                            <div className="review-avatar me-3 d-flex align-items-center justify-content-center">
                              {review.avatarUrl ? (
                                <img
                                  src={review.avatarUrl}
                                  alt={review.username}
                                  className="rounded-circle"
                                  style={{
                                    width: 48,
                                    height: 48,
                                    objectFit: "cover",
                                    border: "2px solid #e04a7e",
                                  }}
                                />
                              ) : (
                                <span
                                  className="avatar-placeholder rounded-circle d-flex align-items-center justify-content-center"
                                  style={{
                                    width: 48,
                                    height: 48,
                                    background: "#fbeaf2",
                                    color: "#e04a7e",
                                    fontSize: 28,
                                    fontWeight: 700,
                                  }}
                                >
                                  {review.username?.[0]?.toUpperCase() || (
                                    <BsFillPersonFill size={32} />
                                  )}
                                </span>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div className="d-flex align-items-center mb-1">
                                <strong className="me-2">
                                  {review.username}
                                </strong>
                                <div className="d-flex align-items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <motion.span
                                      key={star}
                                      initial={{ scale: 0.8 }}
                                      animate={{
                                        scale: review.rating >= star ? 1.2 : 1,
                                        color:
                                          review.rating >= star
                                            ? "#FFD700"
                                            : "#ccc",
                                      }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 15,
                                      }}
                                    >
                                      <FaStar />
                                    </motion.span>
                                  ))}
                                  <span className="ms-2 small text-muted">
                                    ({review.rating}/5)
                                  </span>
                                </div>
                              </div>
                              <p className="mb-1" style={{ fontSize: 15 }}>
                                {review.comment}
                              </p>
                              <span className="text-muted small">
                                {new Date(
                                  review.createdAt || review.date
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No reviews yet</p>
                  )}
                </motion.div>
              </motion.div>
            </Col>
          </Row>
        </Container>
        {/* Similar Products Section with hover and quick view */}
        {similarProducts.length > 0 && (
          <motion.div
            className="similar-products-section"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.08, delayChildren: 0.7 },
              },
            }}
          >
            <h4
              className="mb-4"
              style={{
                fontFamily: "Montserrat Arial sans-serif",
                color: "var(--gucci-black)",
              }}
            >
              Similar Products
            </h4>
            <Row className="g-4">
              {similarProducts
                .filter((prod) => prod._id !== product._id)
                .map((prod, idx) => (
                  <Col md={3} sm={6} xs={12} key={prod._id}>
                    <ProductCard
                      product={prod}
                      idx={idx}
                      BASE_URL={BASE_URL} // Pass BASE_URL if you use it
                    />
                  </Col>
                ))}
            </Row>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
export default ProductDetails;
