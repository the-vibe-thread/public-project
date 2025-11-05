import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import InfiniteScroll from "react-infinite-scroll-component";
import { fetchApi } from "../api";
import ProductCard from "./Productcard";

const PAGE_SIZE = 12;

function NewArrivalsPage() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = async (pageNum) => {
    const res = await fetchApi(`/api/products/?page=${pageNum}&limit=${PAGE_SIZE}`);
    const newItems = (res.products || []).filter((p) => p.NewArrival);
    setProducts((prev) => [...prev, ...newItems]);
    if (newItems.length < PAGE_SIZE) setHasMore(false);
  };

  useEffect(() => {
    fetchProducts(1);
    // eslint-disable-next-line
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    fetchProducts(nextPage);
    setPage(nextPage);
  };

  return (
    <Container className="mt-4">
      <h2>New Arrivals</h2>
      <InfiniteScroll
        dataLength={products.length}
        next={loadMore}
        hasMore={hasMore}
        loader={<h5>Loading...</h5>}
        style={{ overflow: "visible" }}
      >
        <Row>
          {products.map((product) => (
            <Col xs={6} md={3} key={product._id} className="mb-4">
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      </InfiniteScroll>
    </Container>
  );
}

export default NewArrivalsPage;