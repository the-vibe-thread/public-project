import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Accordion } from "react-bootstrap";
import "./Filter-SortBar.css";
import { fetchApi } from "../api";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 900px)").matches
  );
  useEffect(() => {
    const handler = () =>
      setIsMobile(window.matchMedia("(max-width: 900px)").matches);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

const CategoryDropdown = ({ options, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (open && isMobile) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, isMobile]);

  return (
    <div className="position-relative" ref={ref}>
      <div
        className="filter-select"
        style={{ fontWeight: 200, cursor: "pointer" }}
        onClick={() => setOpen((o) => !o)}
      >
        {selected || "CATEGORY"}
      </div>
      {open && (
        <div className="custom-dropdown-menu">
          {isMobile && (
            <div className="dropdown-header">
              <span>Category</span>
              <button
                className="dropdown-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          )}
          <div
            className={`custom-dropdown-item${!selected ? " selected" : ""}`}
            onClick={(e) => {
              e.preventDefault && e.preventDefault();
              onChange("");
              setOpen(false);
            }}
            tabIndex={0}
            role="button"
            aria-pressed={!selected}
          >
            All
          </div>
          {options.map((opt) => (
            <div
              key={opt}
              className={`custom-dropdown-item${
                selected === opt ? " selected" : ""
              }`}
              onClick={(e) => {
                e.preventDefault && e.preventDefault();
                onChange(opt);
                setOpen(false);
              }}
              tabIndex={0}
              role="button"
              aria-pressed={selected === opt}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FilterSortBar = ({ children }) => {
  // Product state
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter/sort state
  const [filterCategory, setFilterCategory] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    Color: [],
    Size: [],
    Fabric: [],
  });
  const [sortOption, setSortOption] = useState("newest");

  // UI state
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(selectedFilters);
  const isMobile = useIsMobile();
  const filterRef = useRef();

  // Fetch products on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetchApi("/api/products/");
        const products = Array.isArray(res.products)
          ? res.products
          : res.product
          ? [res.product]
          : [];
        if (!cancelled) {
          setAllProducts(products);
          setFilteredProducts(products);
        }
      } catch (e) {
        if (!cancelled) {
          setAllProducts([]);
          setFilteredProducts([]);
        }
      }
      if (!cancelled) setLoading(false);
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Option calculation (always recalc on allProducts change)
  const categoryOptions = [
    ...new Set(allProducts.map((p) => p.category).filter(Boolean)),
  ];

  // UNWRAP mongoose-wrapped color objects
  const colorOptions = Array.from(
    new Set(
      allProducts
        .flatMap((p) => {
          const colors = p.colors || (p._doc && p._doc.colors) || [];
          return Array.isArray(colors)
            ? colors.map((c) => c._doc?.name || c.name)
            : [];
        })
        .filter(Boolean)
    )
  );

  // UNWRAP sizes from mongoose-wrapped color objects
  const sizeOptions = Array.from(
    new Set(
      [
        ...allProducts.flatMap((p) =>
          (p.colors || []).flatMap((c) => {
            const sizes = c._doc?.sizes || c.sizes;
            return sizes ? Object.keys(sizes) : [];
          })
        ),
        ...allProducts.flatMap((p) =>
          (p.outOfStockSizes || []).map((s) => s.size)
        ),
      ].filter(Boolean)
    )
  );

  const fabricOptions = Array.from(
    new Set(allProducts.map((p) => p.fabric).filter(Boolean))
  );

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

  // Filtering & sorting logic
  useEffect(() => {
    let updated = [...allProducts];
    // Category
    if (filterCategory)
      updated = updated.filter((p) => p.category === filterCategory);
    // Color
    if (selectedFilters.Color.length)
      updated = updated.filter((p) =>
        (p.colors || []).some((c) =>
          selectedFilters.Color.includes(c._doc?.name || c.name)
        )
      );
    // Size (in stock only)
    if (selectedFilters.Size.length)
      updated = updated.filter((p) =>
        (p.colors || []).some((color) => {
          const sizes = color._doc?.sizes || color.sizes;
          return (
            sizes &&
            selectedFilters.Size.some(
              (size) => size in sizes && sizes[size].quantity > 0
            )
          );
        })
      );
    // Fabric
    if (selectedFilters.Fabric.length)
      updated = updated.filter((p) =>
        selectedFilters.Fabric.includes(p.fabric)
      );

    // Sort
    // Sort - unwrap _doc fields if present
    if (sortOption === "priceLowHigh") {
      updated.sort(
        (a, b) =>
          ((a.discount?.price ||
            a._doc?.discount?.price ||
            a.price ||
            a._doc?.price) ??
            0) -
          ((b.discount?.price ||
            b._doc?.discount?.price ||
            b.price ||
            b._doc?.price) ??
            0)
      );
    } else if (sortOption === "priceHighLow") {
      updated.sort(
        (a, b) =>
          ((b.discount?.price ||
            b._doc?.discount?.price ||
            b.price ||
            b._doc?.price) ??
            0) -
          ((a.discount?.price ||
            a._doc?.discount?.price ||
            a.price ||
            a._doc?.price) ??
            0)
      );
    } else if (sortOption === "nameAZ") {
      updated.sort((a, b) =>
        (a.name || a._doc?.name || "").localeCompare(
          b.name || b._doc?.name || ""
        )
      );
    } else if (sortOption === "nameZA") {
      updated.sort((a, b) =>
        (b.name || b._doc?.name || "").localeCompare(
          a.name || a._doc?.name || ""
        )
      );
    } else if (
      sortOption === "newest" &&
      (updated[0]?.createdAt || updated[0]?._doc?.createdAt)
    ) {
      updated.sort(
        (a, b) =>
          new Date(b.createdAt || b._doc?.createdAt) -
          new Date(a.createdAt || a._doc?.createdAt)
      );
    }
    setFilteredProducts(updated);
  }, [allProducts, filterCategory, selectedFilters, sortOption]);

  // FilterSort UI handlers
  useEffect(() => {
    if (filterOpen) setPendingFilters(selectedFilters);
  }, [filterOpen, selectedFilters]);

  useEffect(() => {
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    if (filterOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [filterOpen]);

  useEffect(() => {
    if (filterOpen && isMobile) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [filterOpen, isMobile]);

  // Handle checkbox change (pending)
  const handleCheckbox = (type, option) => {
    setPendingFilters((prev) => {
      const next = { ...prev };
      if (option === "All") {
        next[type] = [];
      } else {
        const arr = new Set(next[type] || []);
        arr.has(option) ? arr.delete(option) : arr.add(option);
        next[type] = Array.from(arr);
      }
      return next;
    });
  };

  // Handle Apply
  const handleApply = () => {
    setSelectedFilters({ ...pendingFilters });
    setFilterOpen(false);
  };

  // Handle Clear All (fix: always clear all filter types)
  const handleClearAll = () => {
    const cleared = { Color: [], Size: [], Fabric: [] };
    setSelectedFilters(cleared);
    setPendingFilters(cleared);
    setFilterOpen(false);
  };

  // Handle sort change
  const handleSortChange = (val) => {
    setSortOption(val);
    setSortOpen(false);
  };

  // Handle category change
  const handleCategoryChange = (val) => {
    setFilterCategory(val);
  };

  // ---- RENDER ----
  return (
    <>
      <div className="filter-sort-bar">
        <Container fluid className="p-0">
          <Row className="gx-2 gy-2 align-items-center flex-nowrap">
            <Col xs="auto" className="flex-shrink-1">
              <CategoryDropdown
                options={categoryOptions}
                selected={filterCategory}
                onChange={handleCategoryChange}
              />
            </Col>
            <Col xs="auto" className="flex-shrink-1">
              <div className="position-relative" ref={filterRef}>
                <div
                  className="filter-select"
                  style={{ fontWeight: 200, cursor: "pointer" }}
                  onClick={() => setFilterOpen((o) => !o)}
                >
                  FILTERS{" "}
                  <span style={{ fontSize: "0.8em", marginLeft: 6 }}></span>
                </div>
                {filterOpen && (
                  <div className="custom-dropdown-menu filter-dropdown-multicol">
                    <div className="dropdown-header">
                      <span>Filters</span>
                      <button
                        className="dropdown-clear"
                        onClick={handleClearAll}
                      >
                        Clear All
                      </button>
                      <button
                        className="dropdown-close"
                        onClick={() => setFilterOpen(false)}
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>
                    <Container fluid>
                      <Accordion alwaysOpen>
                        {filterOptions.map((type, idx) => (
                          <Accordion.Item eventKey={String(idx)} key={type}>
                            <Accordion.Header>{type}</Accordion.Header>
                            <Accordion.Body>
                              <label
                                className="custom-dropdown-item"
                                style={{ cursor: "pointer", width: "100%" }}
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    (pendingFilters[type]?.length ?? 0) === 0
                                  }
                                  onChange={() => handleCheckbox(type, "All")}
                                  style={{ marginRight: 8 }}
                                />
                                All
                              </label>
                              {(filterData[type] || []).map((option) => (
                                <label
                                  key={option}
                                  className="custom-dropdown-item"
                                  style={{ cursor: "pointer", width: "100%" }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={pendingFilters[type]?.includes(
                                      option
                                    )}
                                    onChange={() =>
                                      handleCheckbox(type, option)
                                    }
                                    style={{ marginRight: 8 }}
                                  />
                                  {option}
                                </label>
                              ))}
                            </Accordion.Body>
                          </Accordion.Item>
                        ))}
                      </Accordion>
                    </Container>
                    <div className="filter-dropdown-footer">
                      <span className="mb-2 mb-md-0">
                        You can select several options at once.
                      </span>
                      <hr className="filter-footer-divider d-block d-md-none" />
                      <div className="filter-btn-group">
                        <button
                          className="filter-apply-btn me-2"
                          onClick={handleApply}
                          type="button"
                        >
                          APPLY
                        </button>
                        <button
                          className="filter-close-btn"
                          onClick={() => setFilterOpen(false)}
                          type="button"
                        >
                          CLOSE
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {filterOpen && isMobile && (
                  <div
                    className="filter-mobile-backdrop"
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: "100vw",
                      height: "100vh",
                      background: "rgba(0,0,0,0.2)",
                      zIndex: 2999,
                    }}
                    onClick={() => setFilterOpen(false)}
                  />
                )}
              </div>
            </Col>
            <Col xs="auto" className="flex-shrink-1 ms-auto">
              <div
                className="sort-group d-flex align-items-center"
                style={{ position: "relative" }}
              >
                <span className="sort-label">Sort by:</span>
                <div
                  className="sort-custom-select"
                  tabIndex={0}
                  onClick={() => setSortOpen((o) => !o)}
                  onBlur={() => setSortOpen(false)}
                  style={{
                    cursor: "pointer",
                    minWidth: 120,
                    position: "relative",
                  }}
                >
                  <span className="sort-selected">
                    {
                      [
                        { value: "newest", label: "NEWEST" },
                        { value: "priceLowHigh", label: "PRICE: LOW TO HIGH" },
                        { value: "priceHighLow", label: "PRICE: HIGH TO LOW" },
                        { value: "nameAZ", label: "NAME: A-Z" },
                        { value: "nameZA", label: "NAME: Z-A" },
                      ].find((opt) => opt.value === sortOption)?.label
                    }
                  </span>
                  <span className="sort-arrow" style={{ marginLeft: 6 }}></span>
                  {sortOpen && (
                    <div className="sort-dropdown-menu">
                      {[
                        { value: "newest", label: "NEWEST" },
                        { value: "priceLowHigh", label: "PRICE: LOW TO HIGH" },
                        { value: "priceHighLow", label: "PRICE: HIGH TO LOW" },
                        { value: "nameAZ", label: "NAME: A-Z" },
                        { value: "nameZA", label: "NAME: Z-A" },
                      ].map((opt) => (
                        <div
                          key={opt.value}
                          className={`sort-dropdown-item${
                            sortOption === opt.value ? " selected" : ""
                          }`}
                          onMouseDown={() => handleSortChange(opt.value)}
                          tabIndex={0}
                          role="button"
                          aria-pressed={sortOption === opt.value}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      {/* Render children as render prop */}
      {typeof children === "function"
        ? children({ products: filteredProducts, loading })
        : null}
    </>
  );
};

export default FilterSortBar;
