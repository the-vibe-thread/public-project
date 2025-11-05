import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import imageUrl from "./sizechart.jpg"; // Adjust the path as necessary


export default function SizeChartModal({ buttonClassName = "sizebutton" }) {
  const [show, setShow] = useState(false);

  return (
    <>
      <Button
        variant="outline-secondary"
        size="sm"
        className={buttonClassName}
        onClick={() => setShow(true)}
        style={{ marginLeft: 8, fontWeight: 500, border:"none" , }}

      >
        Size Chart
      </Button>

      <Modal show={show} onHide={() => setShow(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Size Chart</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img
            src={imageUrl}
            alt="Size Chart"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </Modal.Body>
      </Modal>
    </>
  );
}