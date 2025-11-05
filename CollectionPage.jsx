import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Spinner, Toast } from "react-bootstrap";
import ProductCard from "./Productcard";
import { api } from "../api";

console.log("CollectionPage mounted"); // Will run on every render

const LIMIT = 20;

export default function CollectionPage() {
  const params = useParams();
  console.log("useParams result:", params); // Log all params

  // Correct destructuring: get category directly from params
  const { category } = params;
  const trimmedCategory = category ? category.trim() : "";
  console.log("category param:", category, "trimmedCategory:", trimmedCategory);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loaderRef = useRef();

  useEffect(() => {
    let cancel = false;
    console.log("cancel flag:", cancel);
    console.log(
      "useEffect running, trimmedCategory:",
      trimmedCategory,
      "page:",
      page
    );

    async function fetchProducts() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(
          `/api/products?category=${encodeURIComponent(
            trimmedCategory
          )}&limit=${LIMIT}&page=${page}`
        );
        console.log("API response:", res);
        const data = await res.data;
        console.log(
          "Fetched products:",
          data.products,
          "Page:",
          page,
          "Pages:",
          data.pages
        );
        if (cancel) return;
        if (Array.isArray(data.products)) {
          setProducts((prev) =>
            page === 1 ? data.products : [...prev, ...data.products]
          );
          setHasMore(page < (data.pages || 1) && data.products.length > 0);
        } else {
          setProducts([]);
          console.log(setProducts)
          setHasMore(false);
          console.log(setHasMore)
        }
      } catch (err) {
        console.log("Error fetching products:", err);
        setError("Failed to fetch products.");
        setShowToast(true);
        setHasMore(false);
      }
      setLoading(false);
    }

    if (trimmedCategory) {
      fetchProducts();
    }

    return () => {
      cancel = true;
    };
    // eslint-disable-next-line
  }, [trimmedCategory, page]);

  // Reset products and page when category changes
  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setError("");
  }, [category]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loading || !hasMore) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [loading, hasMore]);

  // Patch products to ensure images are available at root
  const patchedProducts = products.map((product) => ({
    ...product,
    images:
      product.images && product.images.length
        ? product.images
        : product.colors?.[0]?.images || [],
  }));

  // Log what is being rendered
  console.log("Rendering products array:", patchedProducts);

  return (
    <Container className="my-5">
      <h2 style={{ textTransform: "capitalize" }}>
        {trimmedCategory} Collection
      </h2>
      <Row className="gy-4">
        {patchedProducts.map((product, idx) => (
          <Col xs={6} sm={6} md={4} lg={3} key={product._id}>
            <ProductCard minimal={true} product={product} idx={idx} />
          </Col>
        ))}
      </Row>
      {loading && (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" />
        </div>
      )}
      {hasMore && !loading && patchedProducts.length > 0 && (
        <div ref={loaderRef} style={{ height: 50 }} />
      )}
      {!loading && patchedProducts.length === 0 && (
        <p>No products found for this collection.</p>
      )}
      <Toast
        show={showToast && !!error}
        onClose={() => setShowToast(false)}
        delay={3500}
        autohide
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          minWidth: "250px",
          zIndex: 9999,
        }}
        bg="danger"
      >
        <Toast.Header>
          <strong className="me-auto">Error</strong>
        </Toast.Header>
        <Toast.Body className="text-white">{error}</Toast.Body>
      </Toast>
    </Container>
  );
}
