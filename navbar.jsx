import { useState, useEffect, useMemo, useCallback } from "react";
import { ReactComponent as Menu } from "../icons/menu.svg";
import { ReactComponent as Search } from "../icons/search.svg";
import { ReactComponent as Cart } from "../icons/shopping-bag.svg";
import { ReactComponent as User } from "../icons/user.svg";
import { Dropdown } from "react-bootstrap";
import { api } from "../api";

import { Container, Navbar } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "./cartContext";
import debounce from "lodash.debounce";
import style from "./navbar.module.css";
import SearchOverlay from "./SearchOverlay";
import NavbarOffcanvas from "./NavbarOffcanvas";
import "./NavbarOffcanvas.css";
import "./SearchOverlay.css"

function SimpleNavbar() {
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const { cart } = useCart();
  const [cartCount, setCartCount] = useState(cart.length);
  const navigate = useNavigate();

  useEffect(() => {
    setCartCount(cart.length);
  }, [cart]);

  const debouncedFetchSuggestions = useMemo(
    () =>
      debounce(async (query) => {
        if (!query.trim()) {
          setProductSuggestions([]);
          setTagSuggestions([]);
          return;
        }
        setLoading(true);

        try {
          const [productResponse, tagResponse] = await Promise.all([
            api.get(`/api/products/suggestions?query=${query}`),
            api.get(`/api/products/tags/suggestions?query=${query}`),
          ]);

          setProductSuggestions(productResponse.data.products || []);
          setTagSuggestions(tagResponse.data || []);
        } catch (error) {
          console.error("Error fetching search suggestions:", error);
          setProductSuggestions([]);
          setTagSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, 300),
    [setProductSuggestions, setTagSuggestions]
  );

  const fetchSuggestions = useCallback(
    (query) => {
      if (query.length > 2) {
        debouncedFetchSuggestions(query);
      } else {
        setProductSuggestions([]);
        setTagSuggestions([]);
      }
    },
    [debouncedFetchSuggestions]
  );

  useEffect(() => {
    fetchSuggestions(searchTerm);
  }, [searchTerm, fetchSuggestions]);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await api.get("/api/auth/me", {
          withCredentials: true,
        });
        if (!response.data?.user) {
          // Session expired → clear everything
          setUser(null);
          localStorage.removeItem("user");
        } else {
          // Sync user info with local storage
          setUser(response.data.user);
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }
      } catch {
        setUser(null);
        localStorage.removeItem("user");
      }
    };

    // Run check immediately
    verifyAuth();

    // Also run check when user switches back to tab
    window.addEventListener("focus", verifyAuth);
    return () => {
      window.removeEventListener("focus", verifyAuth);
    };
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?query=${searchTerm}`);
    }
  };

  const handleLogout = async () => {
    await api.post("/api/auth/logout");
    setUser(null);
    localStorage.removeItem("user");
    navigate("/");
  };

  const closeOffcanvas = () => setShowOffcanvas(false);

  return (
    <>
      <Navbar
        expand={false}
        variant="light"
        sticky="top"
        className={`${style["tvt-navbar"]} mb-3 px-3`}
      >
        {/* Desktop */}
        <Container fluid className={style["tvt-navbar-inner"]}>
          <div className="row w-100 align-items-center">
            <div
              className={`col-4 d-flex align-items-center ${style["tvt-navbar-left"]}`}
            >
              <button
                aria-label="Menu"
                className={style["tvt-icon-btn"]}
                onClick={() => setShowOffcanvas(true)}
              >
                <Menu />
              </button>
            </div>
            <div
              className={`col-4 d-flex justify-content-center ${style[" tvt-navbar-center"]}`}
            >
              <Navbar.Brand
                as={Link}
                to="/"
                className={style["tvt-logo"]}
                style={{
                  fontFamily: "playfair display",
                  fontWeight: "100",
                  fontSize: "x-large",
                  letterSpacing: "0.08em",
                }}
              >
                THE VIBE THREAD
              </Navbar.Brand>
            </div>
            <div className={`col-4 d-flex justify-content-end align-items-center ${style[`tvt-navbar-icons`]}`}>
              <button
                aria-label="Cart"
                className={`${style["tvt-icon-btn"]} position-relative`}
                onClick={() => {
                  window.location.href = "/cart";
                }}
              >
                <Cart />
                {cartCount > 0 && (
                  <span className={style["tvt-cart-badge"]}>{cartCount}</span>
                )}
              </button>
              <button
                aria-label="Search"
                className={style["tvt-icon-btn"]}
                onClick={() => setShowSearchOverlay(true)}
              >
                <Search />
              </button>
              {!user ? (
                <Link
                  to="/auth"
                  className="ms-3 fw-bold"
                  style={{ textDecoration: "none", color: "#e04a7e" }}
                >
                  <User />
                </Link>
              ) : (
                <Dropdown className="ms-3">
                  <Dropdown.Toggle
                    variant="link"
                    className="fw-bold"
                    style={{ textDecoration: "none", color: "#e04a7e" }}
                    id="userDropdown"
                  >
                    {user.name || user.username || user.email}
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end">
                    <Dropdown.Item as={Link} to="/track-order">
                      Track Order
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/order-history">
                      Order History
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/account-settings">
                      Account Settings
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item
                      className="text-danger"
                      onClick={handleLogout}
                    >
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </div>
          </div>
        </Container>
        {/* Mobile */}
        <Container fluid className={style["tvt-navbar-mobile"]}>
          <div className={style["tvt-navbar-mobile-row"]}>
            <button
              className={style["tvt-icon-btn"]}
              aria-label="Menu"
              onClick={() => setShowOffcanvas(true)}
            >
              <Menu />
            </button>
            <span></span>
            <Navbar.Brand
              as={Link}
              to="/"
              className={style["tvt-logo tvt-logo-mobile"]}
              style={{
                fontFamily: "playfair display",
                fontWeight: "100",
                fontSize: "1.2rem",
                letterSpacing: "0.08em",
              }}
            >
              THE VIBE THREAD
            </Navbar.Brand>
            <div className={style["tvt-navbar-icons"]}>
              <button
                aria-label="Cart"
                className={`${style["tvt-icon-btn"]} position-relative`}
                onClick={() => {
                  window.location.href = "/cart";
                }}
              >
                <Cart />
                {cartCount > 0 && (
                  <span className={style["tvt-cart-badge"]}>{cartCount}</span>
                )}
              </button>
              <button
                aria-label="Search"
                className={style["tvt-icon-btn"]}
                onClick={() => setShowSearchOverlay(true)}
              >
                <Search />
              </button>
              {!user ? (
                <Link
                  to="/auth"
                  className="ms-2 fw-bold"
                  style={{ textDecoration: "none", color: "#e04a7e" }}
                >
                  <User />
                </Link>
              ) : (
                <Dropdown className="ms-3">
                  <Dropdown.Toggle
                    variant="link"
                    className={`fw-bold ${style["no-caret"]}`}
                    style={{
                      textDecoration: "none",
                      color: "#e04a7e",
                      maxWidth: 120,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      padding: "0px",
                    }}
                    id="userDropdown"
                  >
                    {user.name
                      ? user.name.split(" ")[0].length > 5
                        ? user.name.split(" ")[0].slice(0, 5)
                        : user.name.split(" ")[0]
                      : user.username || user.email}
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end">
                    <Dropdown.Item as={Link} to="/track-order">
                      Track Order
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/order-history">
                      Order History
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/account-settings">
                      Account Settings
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item
                      className="text-danger"
                      onClick={handleLogout}
                    >
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </div>
          </div>
        </Container>
      </Navbar>
      {showOffcanvas && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0, // Show from left
            right: "auto",
            height: "100vh",
            width: "300px",
            zIndex: 1300,
            background: "white",
            boxShadow: "2px 0 10px rgba(0,0,0,0.1)", // Shadow on right edge
            transition: "transform 0.3s ease",
          }}
        >
          <NavbarOffcanvas closeOffcanvas={closeOffcanvas} />
        </div>
      )}
      {showSearchOverlay && (
        <SearchOverlay
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleSearch={handleSearch}
          productSuggestions={productSuggestions}
          tagSuggestions={tagSuggestions}
          loading={loading}
          setShowSearchOverlay={setShowSearchOverlay}
        />
      )}
    </>
  );
}

export default SimpleNavbar;
