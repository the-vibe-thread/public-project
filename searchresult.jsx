import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { api } from "../api";
import {
  Container,
  Card,
  Spinner,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import "./SearchResults.css";
import FilterSortBar from "./Filter-SortBar";
import ProductCard from "./Productcard";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function SearchResults() {
  const query = useQuery().get("query");
  const [products, setProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loader = useRef(null);

  // Infinite scroll state
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Filter/sort state
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [fabricOptions, setFabricOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    Color: [],
    Size: [],
    Fabric: [],
  });
  const [selectedSort, setSelectedSort] = useState("relevance");

  // Track next page for infinite loading
  const nextPage = useRef(1);

  // Fetch filter options on mount (ideally from backend)
  useEffect(() => {
    api
      .get("/api/products/filters")
      .then((res) => {
        setCategoryOptions(res.data.categories || []);
        setColorOptions(res.data.colors || []);
        setSizeOptions(res.data.sizes || []);
        setFabricOptions(res.data.fabrics || []);
      })
      .catch(() => {
        // fallback: empty options
        setCategoryOptions([]);
        setColorOptions([]);
        setSizeOptions([]);
        setFabricOptions([]);
      });
  }, []);

  // Fetch products (reset on query/filter/sort change)
  useEffect(() => {
    let ignore = false;
    const fetchSearchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        setShowError(false);
        setNoResults(false);
        setProducts([]);
        setHasMore(true);
        nextPage.current = 1;

        // Build params for API
        const params = {
          query,
          page: 1,
          sort: selectedSort,
          category: selectedCategory,
          color: selectedFilters.Color.join(","),
          size: selectedFilters.Size.join(","),
          fabric: selectedFilters.Fabric.join(","),
        };

        const { data } = await api.get("/api/products", { params });
        if (!ignore) {
          setProducts(data.products);
          setHasMore(
            data.products.length > 0 &&
              (data.totalPages ? 1 < data.totalPages : true)
          );
          nextPage.current = 2;
          if (data.products.length === 0) {
            setNoResults(true);
            const topProductsResponse = await api.get("/api/products/top");
            setTopProducts(topProductsResponse.data.products || []);
          }
        }
      } catch (error) {
        if (!ignore) {
          setError("Something went wrong. Please try again.");
          setShowError(true);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    if (query) fetchSearchResults();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line
  }, [query, selectedSort, selectedCategory, selectedFilters]);

  // Infinite load more (when loader intersection detected)
  const loadMore = useCallback(async () => {
    if (loading || isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    try {
      // Build params for API
      const params = {
        query,
        page: nextPage.current,
        sort: selectedSort,
        category: selectedCategory,
        color: selectedFilters.Color.join(","),
        size: selectedFilters.Size.join(","),
        fabric: selectedFilters.Fabric.join(","),
      };
      const { data } = await api.get("/api/products", { params });
      setProducts((prev) => [...prev, ...data.products]);
      setHasMore(
        data.products.length > 0 &&
          (data.totalPages ? nextPage.current < data.totalPages : true)
      );
      if (data.products.length > 0) {
        nextPage.current += 1;
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
      setShowError(true);
    } finally {
      setIsFetchingMore(false);
    }
    // eslint-disable-next-line
  }, [
    query,
    selectedSort,
    selectedCategory,
    selectedFilters,
    loading,
    isFetchingMore,
    hasMore,
  ]);

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loading && !isFetchingMore) {
        loadMore();
      }
    },
    [hasMore, loading, isFetchingMore, loadMore]
  );

  useEffect(() => {
    const option = { root: null, rootMargin: "20px", threshold: 1.0 };
    const observer = new IntersectionObserver(handleObserver, option);
    const currentLoader = loader.current;
    if (currentLoader) observer.observe(currentLoader);
    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [handleObserver]);

  // Handlers for filter/sort bar
  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
  };
  const handleFilterChange = (type, values) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [type]: values === "ALL" ? [] : values,
    }));
  };
  const handleSortChange = (sort) => {
    setSelectedSort(sort);
  };

  const filterOptions = [
    ...(colorOptions.length ? ["Color"] : []),
    ...(sizeOptions.length ? ["Size"] : []),
    ...(fabricOptions.length ? ["Fabric"] : []),
  ];
  const filterData = {
    Color: colorOptions,
    Size: sizeOptions,
    Fabric: fabricOptions,
  };

  return (
    <Container className="mt-5 search-results-container">
      <FilterSortBar
        categoryOptions={categoryOptions}
        filterOptions={filterOptions}
        filterData={filterData}
        selectedCategory={selectedCategory}
        selectedFilters={selectedFilters}
        sortOptions={[
          { value: "relevance", label: "Relevance" },
          { value: "newest", label: "Newest" },
          { value: "priceLowHigh", label: "Price: Low to High" },
          { value: "priceHighLow", label: "Price: High to Low" },
        ]}
        selectedSort={selectedSort}
        onCategoryChange={handleCategoryChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
      />
      {/* Toast for error messages */}
      <ToastContainer
        position="top-center"
        className="p-3"
        style={{ zIndex: 2000 }}
      >
        <Toast
          onClose={() => setShowError(false)}
          show={showError}
          bg="danger"
          delay={4000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto text-danger">Error</strong>
          </Toast.Header>
          <Toast.Body className="text-light">{error}</Toast.Body>
        </Toast>
      </ToastContainer>
      {loading ? (
        <div className="d-flex justify-content-center">
          <Spinner animation="border" />
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="product-list">
            {(Array.isArray(products) ? products : []).map((product, idx) => (
              <ProductCard
                product={product}
                key={product.id || product._id || idx}
                idx={idx}
              />
            ))}
          </div>
          <div ref={loader} />
          {isFetchingMore && (
            <div className="d-flex justify-content-center mt-3">
              <Spinner animation="border" />
            </div>
          )}
        </>
      ) : (
        <div>
          <h4 className="text-danger text-center">No results found</h4>
          {noResults && topProducts.length > 0 && (
            <>
              <h5 className="mt-3 text-center">Top Products</h5>
              <div className="product-list">
                {(Array.isArray(products) ? products : []).map(
                  (product, idx) => (
                    <ProductCard
                      product={product}
                      key={product.id || product._id || idx}
                      idx={idx}
                    />
                  )
                )}
              </div>
            </>
          )}
        </div>
      )}
    </Container>
  );
}

export default SearchResults;
