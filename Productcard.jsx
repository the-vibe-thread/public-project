import React from "react";
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import style from "./hero.module.css"; // <-- import the CSS module

function getProductImage(product, BASE_URL = "") {
  if (product.colors && product.colors.length > 0) {
    const firstColor = product.colors[0];
    if (firstColor.images && firstColor.images.length > 0) {
      return firstColor.images[0].startsWith("http")
        ? firstColor.images[0]
        : `${BASE_URL}${firstColor.images[0]}`;
    }
  }
  return "https://via.placeholder.com/200";
}

export default function ProductCard({ product, idx = 0, showLabels = false, minimal = false, BASE_URL = "" }) {
  const controls = useAnimation();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.12 });

  React.useEffect(() => {
    if (inView) {
      controls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.48, delay: idx * 0.08, ease: "easeOut" }
      });
    }
  }, [controls, inView, idx]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={controls}
      style={{ height: "100%" }}
    >
      <Card
        className={`h-100 ${style["product-card"]}`}
        style={{
          border: "none",
          borderRadius: "5px",
          position: "relative",
          overflow: "visible",
        }}
      >
        <Link
          to={`/product/${product.slug}${
            product.colors &&
            product.colors[0] &&
            product.colors[0].name &&
            product.colors[0].name !== "undefined"
              ? `?color=${encodeURIComponent(product.colors[0].name)}`
              : ""
          }`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Card.Img
            variant="top"
            src={getProductImage(product, BASE_URL)}
            className={`${style["product-img"]} ${style["carousel-product-img"]}${showLabels ? "" : " " + style["product-img-large"]}`}
            alt={product.name}
            loading="lazy"
          />
          <Card.Body
            className={`text-center ${style["card-body-custom"]}`}
            style={{ backgroundColor: "#fff" }}
          >
            <Card.Title className="small fw-normal" style={{ color: "#58595b" }}>
              {product.name}
            </Card.Title>
            {minimal ? (
              <Card.Text className="fw-normal" style={{ color: "#58595b" }}>
                ₹
                {product.discount?.price && product.discount?.price > 0
                  ? product.discount.price
                  : product.price}
              </Card.Text>
            ) : (
              <Card.Text className="fw-normal" style={{ color: "#58595b" }}>
                ₹
                {product.discount?.price && product.discount?.price > 0
                  ? product.discount.price
                  : product.price}
                {product.discount?.price && product.discount?.price > 0 && (
                  <span
                    className="text-muted ms-2"
                    style={{ textDecoration: "line-through" }}
                  >
                    ₹{product.price}
                  </span>
                )}
              </Card.Text>
            )}
          </Card.Body>
        </Link>
      </Card>
    </motion.div>
  );
}