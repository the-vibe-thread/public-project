import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Carousel from "react-bootstrap/Carousel";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import style from "./hero.module.css";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";
import FilterSortBar from "./Filter-SortBar";
import { fetchApi } from "../api"; // Adjust the import path as necessary;
import ConfindeceBar from "./ConfindeceBar";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;
// Reusable Product Card component
function ProductCard({ product, idx, showLabels = false, minimal = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.5, delay: idx * 0.08, ease: "easeOut" }}
      style={{ height: "100%" }}
    >
      <Card
        className={`h-100  ${style["product-card"]}`}
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
          {/* Show first color's first image as main card image */}
          <Card.Img
            variant="top"
            src={
              product.colors?.find((c) => c.images?.length)?.images?.[0]
                ? product.colors
                    .find((c) => c.images?.length)
                    .images[0].startsWith("http")
                  ? product.colors.find((c) => c.images?.length).images[0]
                  : `${BASE_URL}${
                      product.colors.find((c) => c.images?.length).images[0]
                    }`
                : "https://via.placeholder.com/200"
            }
            className={`${style["product-img"]} ${
              style["carousel-product-img"]
            }${showLabels ? "" : " " + style["product-img-large"]}`}
            alt={product.name}
          />
          <Card.Body
            className={`text-start ${style["card-body-custom"]}`}
            style={{ backgroundColor: "#fff" }}
          >
            <Card.Title
              className="small fw-normal "
              style={{ color: "#000000ff" }}
            >
              {product.name}
            </Card.Title>
            {/* Minimal mode: only show name and discounted price */}
            {minimal ? (
              <Card.Text className="fw-normal" style={{ color: "#000000ff" }}>
                ₹
                {product.discount?.price && product.discount?.price > 0
                  ? `${product.discount.price}`
                  : `${product.price}`}
              </Card.Text>
            ) : (
              <>
                <Card.Text className="fw-normal" style={{ color: "#000000ff" }}>
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
              </>
            )}
          </Card.Body>
        </Link>
      </Card>
    </motion.div>
  );
}

function GalleryCard({
  video,
  paused,
  onPauseToggle,
  idx,
  onMouseEnter,
  onMouseLeave,
}) {
  const videoRef = useRef(null);
  // Effect to play/pause video based on paused state
  useEffect(() => {
    if (!videoRef.current) return;
    if (paused) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [paused]);
  return (
    <motion.div
      className={style.galleryCardModern}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 60 }}
      transition={{ duration: 0.6, delay: idx * 0.8, ease: "easeOut" }}
    >
      <video
        ref={videoRef}
        src={video.url}
        autoPlay={!paused}
        loop
        muted
        playsInline
        className={style.galleryVideoModern}
      />
      <button
        className={style.pauseBtn}
        onClick={onPauseToggle}
        aria-label={paused ? "Play video" : "Pause video"}
        type="button"
      >
        {paused ? (
          <svg width="18" height="18" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="16" fill="#fff" />
            <polygon points="13,10 24,16 13,22" fill="#222" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="16" fill="#fff" />
            <rect x="12" y="10" width="3" height="12" rx="1.5" fill="#222" />
            <rect x="17" y="10" width="3" height="12" rx="1.5" fill="#222" />
          </svg>
        )}
      </button>
    </motion.div>
  );
}

function ProductListing() {
  const swiperRef = useRef(null);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [carouselImages, setCarouselImages] = useState([]);
  const [visibleProducts, setVisibleProducts] = useState(8);
  const [isFiltering, setIsFiltering] = useState(false);
  const [galleryVideos, setGalleryVideos] = useState([]);
  const [pausedVideos, setPausedVideos] = useState({}); // New: track paused state

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const fetchWithCache = useCallback(
    async (url, cacheKey, cacheTime = 10 * 60 * 1000) => {
      const cachedData = localStorage.getItem(cacheKey);
      const cachedTime = Number(localStorage.getItem(`${cacheKey}_time`));

      if (cachedData && cachedTime && Date.now() - cachedTime < cacheTime) {
        return JSON.parse(cachedData);
      }

      let retries = 3;
      let delay = 1000;

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const res = await fetch(url);
          if (res.status === 429) {
            await wait(delay);
            delay *= 2;
          } else {
            const data = await res.json();
            localStorage.setItem(cacheKey, JSON.stringify(data));
            localStorage.setItem(`${cacheKey}_time`, Date.now());
            return data;
          }
        } catch (err) {
          console.error(`Error fetching ${url}:`, err);
        }
      }
      throw new Error(`Failed to fetch ${url} after multiple retries.`);
    },
    []
  );

  useEffect(() => {
    // Always clear the product cache before fetching
    localStorage.removeItem("cachedProducts");
    localStorage.removeItem("cachedProducts_time");
    const fetchData = async () => {
      try {
        console.log("Fetching products and carousel data...");
        const [productData, carouselData] = await Promise.all([
          fetchWithCache(`${BASE_URL}/api/products/`, "cachedProducts"),
          fetchWithCache(`${BASE_URL}/api/carousel/`, "cachedCarousel"),
        ]);
        console.log("API Response:", productData, carouselData);
        const products = Array.isArray(productData.products)
          ? productData.products
          : productData.product
          ? [productData.product]
          : [];

        setAllProducts(products);
        setFilteredProducts(products);
        setTrendingProducts(products.filter((product) => product.Trending));
        setNewArrivals(products.filter((product) => product.NewArrival));
        setCarouselImages(carouselData.images || []);
      } catch (err) {
        // Handle error
      }
    };

    fetchData();
  }, [fetchWithCache]);

  useEffect(() => {
    // Fetch gallery videos from your API
    fetchApi("/api/gallery/")
      .then((data) => setGalleryVideos(data.videos || []))
      .catch((err) => setGalleryVideos([]));
  }, []);

  // Shimmer loader for filtering
  const Shimmer = () => (
    <Row className="justify-content-center">
      {Array.from({ length: 8 }).map((_, idx) => (
        <Col key={idx} xs={6} sm={6} md={4} lg={3} className="mb-4">
          <motion.div
            className={style["product-card"]}
            style={{
              height: 340,
              background:
                "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
              borderRadius: 12,
              animation: "shimmer 1.2s infinite linear",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        </Col>
      ))}
      <style>
        {`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .product-card {
          background-size: 800px 340px;
        }
        `}
      </style>
    </Row>
  );

  function CarouselMedia({ src, alt }) {
    const isVideo = src.match(/\.(mp4|webm|ogg)$/i);

    return isVideo ? (
      <video
        src={src}
        className={`d-block w-100 ${style[`carousel-media-video`]}`}
        autoPlay
        loop
        muted
        playsInline
      />
    ) : (
      <img
        src={src}
        className={`d-block w-100 ${style[`carousel-image`]}`}
        alt={alt}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <Container
        className={`mt-4 ${style["main-carousel"]} `}
        style={{ minHeight: 600 }}
      >
        {/* Main Carousel */}
        {carouselImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <Carousel
              className="mb-5"
              interval={3000}
              pause="hover"
              indicators={false}
            >
              {carouselImages.map((image, index) => (
                <Carousel.Item key={image._id || index}>
                  <Link to={image.link || "#"}>
                    <CarouselMedia
                      src={
                        image.imageUrl?.startsWith("http")
                          ? image.imageUrl
                          : `${BASE_URL}${
                              image.imageUrl || "/default-image.jpg"
                            }`
                      }
                      alt={image.caption || "Carousel Image"}
                    />
                  </Link>
                  {image.caption && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <Carousel.Caption className="bg-dark bg-opacity-50 p-2 rounded">
                        <h5>{image.caption}</h5>
                      </Carousel.Caption>
                    </motion.div>
                  )}
                </Carousel.Item>
              ))}
            </Carousel>
          </motion.div>
        )}

        <ConfindeceBar />

        {/* Trending Products Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ minHeight: "300px" }}
        >
          {trendingProducts.length > 0 && (
            <div>
              <motion.h3
                className="text-center mt-5 mb-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                Trending Products
              </motion.h3>
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                navigation
                pagination={false}
                spaceBetween={20}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                breakpoints={{
                  0: { slidesPerView: 2 },
                  576: { slidesPerView: 2 },
                  768: { slidesPerView: 2 },
                  992: { slidesPerView: 3 },
                }}
              >
                {trendingProducts.map((product, idx) => (
                  <SwiperSlide key={product._id}>
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{
                        duration: 0.5,
                        delay: idx * 0.1,
                        ease: "easeOut",
                      }}
                      style={{ height: "100%" }}
                    >
                      <ProductCard product={product} idx={idx} minimal={true} />
                    </motion.div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </motion.div>

        {/* New Arrivals Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ minHeight: "300px" }}
        >
          {newArrivals.length > 0 && (
            <div>
              <motion.h3
                className="text-center mt-5 mb-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                New Arrival
              </motion.h3>
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                navigation
                pagination={false}
                spaceBetween={20}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                breakpoints={{
                  0: { slidesPerView: 2 },
                  576: { slidesPerView: 2 },
                  768: { slidesPerView: 2 },
                  992: { slidesPerView: 3 },
                }}
              >
                {newArrivals.map((product, idx) => (
                  <SwiperSlide key={product._id}>
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{
                        duration: 0.5,
                        delay: idx * 0.1,
                        ease: "easeOut",
                      }}
                      style={{ height: "100%" }}
                    >
                      <ProductCard product={product} idx={idx} minimal={true} />
                    </motion.div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </motion.div>

        <div className={style.photoGalleryModern}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={style.galleryTitleLine}
          >
            <span className={style.galleryTitleLineText}>GALLERY</span>
            <span className={style.galleryTitleLineBar} />
          </motion.div>

          {/* Desktop: Horizontal Row with AnimatePresence */}
          <AnimatePresence>
            <div className={`${style.galleryRowModern} d-none d-md-flex`}>
              {galleryVideos.map((video, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                >
                  <GalleryCard
                    key={video._id || idx}
                    video={video}
                    paused={pausedVideos[idx] || false}
                    onPauseToggle={() =>
                      setPausedVideos((prev) => ({
                        ...prev,
                        [idx]: !(prev[idx] || false),
                      }))
                    }
                    idx={idx}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {/* Mobile: Swiper Carousel with framer motion for each slide */}
          <div className={`d-block d-md-none`}>
            <Swiper
              ref={swiperRef}
              navigation={false}
              modules={[Navigation, Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              pagination={false}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              style={{ paddingBottom: 32 }}
            >
              {galleryVideos.map((video, idx) => (
                <SwiperSlide key={video._id || idx}>
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  >
                    <GalleryCard
                      video={video}
                      paused={pausedVideos[idx] || false}
                      onPauseToggle={() =>
                        setPausedVideos((prev) => ({
                          ...prev,
                          [idx]: !(prev[idx] || false),
                        }))
                      }
                      idx={idx}
                      onMouseEnter={() =>
                        swiperRef.current?.swiper?.autoplay?.stop()
                      }
                      onMouseLeave={() =>
                        swiperRef.current?.swiper?.autoplay?.start()
                      }
                    />
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
        {/* All Products Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <motion.h3
            className="text-center mt-5 mb-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              fontFamily: "Montserrat Arial sans-serif",
              fontWeight: 600,
              letterSpacing: "0.04em",
              margin: "32px 0 18px 0",
              textAlign: "center",
            }}
          >
            ALL PRODUCTS
          </motion.h3>

          <FilterSortBar>
            {({ products, loading }) => (
              <>
                <AnimatePresence>
                  {(loading || isFiltering) && (
                    <motion.div
                      key="shimmer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.3 } }}
                    >
                      <Shimmer />
                    </motion.div>
                  )}
                </AnimatePresence>
                {!loading && products.length === 0 && (
                  <div className="text-center my-5">
                    <span style={{ fontSize: 60, color: "#e04a7e" }}>🔍</span>
                    <h5>No products found.</h5>
                  </div>
                )}
                <Row className="justify-content-center">
                  {products.slice(0, visibleProducts).map((product, idx) => (
                    <Col
                      key={product._id}
                      xs={6}
                      sm={6}
                      md={4}
                      lg={3}
                      className="mb-4"
                    >
                      <ProductCard
                        product={product}
                        idx={idx}
                        showLabels={true}
                        minimal={true}
                      />
                    </Col>
                  ))}
                </Row>
                {products.length > visibleProducts && (
                  <div className="text-center mt-3">
                    <Button
                      className={style.loadMoreBtn}
                      onClick={() => setVisibleProducts((prev) => prev + 8)}
                      whileTap={{ scale: 0.96 }}
                      as={motion.button}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </FilterSortBar>
        </motion.div>
      </Container>
    </motion.div>
  );
}

export default ProductListing;
