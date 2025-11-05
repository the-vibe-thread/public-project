import React from "react";
import { Form, ListGroup, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./SearchOverlay.css"; // Assuming you have a CSS file for styles
import { ReactComponent as Search } from "../icons/search.svg";
import { ReactComponent as Close } from "../icons/x.svg";


export function SearchBar({
  searchTerm,
  setSearchTerm,
  handleSearch,
  productSuggestions,
  tagSuggestions,
  loading,
  closeOffcanvas,
}) {
  const [inputFocused, setInputFocused] = React.useState(false);

  return (
    <Form className="homepage-search-bar position-relative">
      <div
        className="input-underline-wrap"
        style={{ width: "100%", position: "relative" }}
      >
        <Form.Control
          type="search"
          placeholder="What are you looking for?"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          className={inputFocused || searchTerm ? "focused" : ""}
          autoComplete="off"
          style={{
            border: "none",
            borderBottom: "2px solid #ccc",
          }}
        />
        {searchTerm && (
          <Button
            variant="link"
            className="clear-x-btn"
            style={{
              position: "absolute",
              right: "0rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#336699",
              background: "white",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              zIndex: 2,
              padding: 0,
              border: "none",
              transition: "background 0.2s, color 0.2s",
            }}
            onClick={() => setSearchTerm("")}
            tabIndex={-1}
            aria-label="Clear search"
          >
            <Close/>
          </Button>
        )}
        <span
          className={`underline ${inputFocused || searchTerm ? "active" : ""}`}
        ></span>
      </div>
      <Button
        variant="outline-success"
        onClick={() => {
          handleSearch();
          closeOffcanvas();
        }}
        disabled={!searchTerm.trim()}
        style={{
          border: "none",
          borderRadius: "15%",
          color: "black",
          cursor: "pointer",
        }}
      >
        <Search />
      </Button>

      {(productSuggestions.length > 0 || tagSuggestions.length > 0) && (
        <ListGroup
          className="position-absolute w-100 shadow bg-white suggestion-dropdown"
          style={{ top: "100%", zIndex: 10 }}
        >
          {productSuggestions.length > 0 && (
            <>
              <ListGroup.Item className="fw-bold text-muted">
                Products
              </ListGroup.Item>
              {productSuggestions.map((item) => (
                <ListGroup.Item
                  key={item.id}
                  action
                  as={Link}
                  to={`/product/${item.slug}`}
                  onClick={closeOffcanvas}
                  className="suggestion-item"
                >
                  {item.name}
                </ListGroup.Item>
              ))}
            </>
          )}
          {tagSuggestions.length > 0 && (
            <>
              <ListGroup.Item className="fw-bold text-muted">
                Tags
              </ListGroup.Item>
              {tagSuggestions.map((tag) => (
                <ListGroup.Item
                  key={tag}
                  action
                  as={Link}
                  to={`/search?query=${encodeURIComponent(tag)}`}
                  onClick={closeOffcanvas}
                  className="suggestion-item"
                >
                  #{tag}
                </ListGroup.Item>
              ))}
            </>
          )}
        </ListGroup>
      )}
    </Form>
  );
}

export default function SearchOverlay({
  searchTerm,
  setSearchTerm,
  handleSearch,
  productSuggestions,
  tagSuggestions,
  loading,
  setShowSearchOverlay,
}) {
  return (
    <div
      className="search-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        backgroundColor: "white",
        zIndex: 1301,
        display: "flex",
        flexDirection: "column",
        padding: "1rem",
        overflowY: "auto",
      }}
    >
      <div className="d-flex justify-content-end mb-3">
        <Button
          variant="link"
          className="text-dark text-decoration-none"
          onClick={() => setShowSearchOverlay(false)}
        >
          Cancel
        </Button>
      </div>
      <div className="flex-grow-1 d-flex flex-column align-items-center">
        <div style={{ width: "100%", maxWidth: "500px" }}>
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleSearch={() => {
              handleSearch();
              setShowSearchOverlay(false);
            }}
            productSuggestions={productSuggestions}
            tagSuggestions={tagSuggestions}
            loading={loading}
            closeOffcanvas={() => setShowSearchOverlay(false)}
          />
        </div>
      </div>
    </div>
  );
}