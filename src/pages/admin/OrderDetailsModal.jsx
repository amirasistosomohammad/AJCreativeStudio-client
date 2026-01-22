import React, { useEffect, useState } from "react";
import Portal from "../../components/Portal";
import {
  FaFileInvoice,
  FaUser,
  FaMoneyCheckAlt,
  FaClock,
  FaBox,
} from "react-icons/fa";

const formatCurrency = (value = 0) =>
  `₱${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const OrderDetailsModal = ({ order, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleBackdropClick = async (e) => {
    if (e.target === e.currentTarget) {
      await closeModal();
    }
  };

  const handleEscapeKey = async (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      await closeModal();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleEscapeKey);
    document.body.classList.add("modal-open");

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.classList.remove("modal-open");
    };
  }, []);

  const closeModal = async () => {
    setIsClosing(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    onClose();
  };

  if (!order) return null;

  const customerName =
    order.customer?.name || order.guest_name || "Guest Customer";
  const customerEmail =
    order.customer?.email || order.guest_email || "No email on file";

  const itemCount = Array.isArray(order.items)
    ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
    : 0;

  return (
    <Portal>
      <div
        className={`modal fade show d-block modal-backdrop-animation ${
          isClosing ? "exit" : ""
        }`}
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        onClick={handleBackdropClick}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg mx-3 mx-sm-auto">
          <div
            className={`modal-content border-0 modal-content-animation ${
              isClosing ? "exit" : ""
            }`}
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
          >
            <div
              className="modal-header border-0 text-white modal-smooth"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%)",
              }}
            >
              <h5 className="modal-title fw-bold">
                <FaFileInvoice className="me-2" />
                Order Details
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white btn-smooth"
                onClick={closeModal}
                aria-label="Close"
              ></button>
            </div>

            <div
              className="modal-body bg-light modal-smooth"
              style={{ maxHeight: "70vh", overflowY: "auto" }}
            >
              {/* Header Summary */}
              <div className="card border-0 bg-white mb-4">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white"
                        style={{
                          width: "80px",
                          height: "80px",
                          background:
                            "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
                          fontSize: "2rem",
                        }}
                      >
                        <FaFileInvoice />
                      </div>
                    </div>
                    <div className="col">
                      <h4 className="mb-1 text-dark">
                        {order.order_number || `Order #${order.id}`}
                      </h4>
                      <p className="text-muted mb-2 small">
                        Placed on {formatDateTime(order.created_at)}
                      </p>
                      <div className="d-flex flex-wrap gap-2">
                        <span className="badge bg-primary">
                          Status: {order.status || "N/A"}
                        </span>
                        <span
                          className={`badge ${
                            order.payment_status === "paid"
                              ? "bg-success"
                              : order.payment_status === "failed"
                              ? "bg-danger"
                              : "bg-secondary"
                          }`}
                        >
                          Payment: {order.payment_status || "N/A"}
                        </span>
                        <span className="badge bg-info">
                          Items: {itemCount}
                        </span>
                        <span className="badge bg-dark">
                          Total: {formatCurrency(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer & Payment Info */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="card border-0 bg-white h-100">
                    <div className="card-header bg-transparent border-bottom">
                      <h6 className="mb-0 fw-semibold text-dark">
                        <FaUser className="me-2 text-primary" />
                        Customer
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-2">
                        <div className="text-muted small">Name</div>
                        <div className="fw-semibold text-dark">
                          {customerName}
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="text-muted small">Email</div>
                        <div className="text-dark small">{customerEmail}</div>
                      </div>
                      {order.customer && (
                        <div className="mb-2">
                          <div className="text-muted small">Customer ID</div>
                          <div className="text-dark small">
                            {order.customer.id}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card border-0 bg-white h-100">
                    <div className="card-header bg-transparent border-bottom">
                      <h6 className="mb-0 fw-semibold text-dark">
                        <FaMoneyCheckAlt className="me-2 text-primary" />
                        Payment & Totals
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-2 d-flex justify-content-between">
                        <span className="text-muted small">Subtotal</span>
                        <span className="fw-semibold text-dark">
                          {formatCurrency(order.subtotal)}
                        </span>
                      </div>
                      <div className="mb-2 d-flex justify-content-between">
                        <span className="text-muted small">Tax</span>
                        <span className="text-dark small">
                          {formatCurrency(order.tax_amount)}
                        </span>
                      </div>
                      <div className="mb-2 d-flex justify-content-between">
                        <span className="text-muted small">Discount</span>
                        <span className="text-dark small">
                          {formatCurrency(order.discount_amount)}
                        </span>
                      </div>
                      <div className="mb-2 d-flex justify-content-between border-top pt-2">
                        <span className="text-muted small">Total</span>
                        <span className="fw-bold text-success">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="text-muted small mb-1">
                          <FaClock className="me-1" />
                          Last Updated
                        </div>
                        <div className="text-dark small">
                          {formatDateTime(order.updated_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="card border-0 bg-white">
                <div className="card-header bg-transparent border-bottom">
                  <h6 className="mb-0 fw-semibold text-dark">
                    <FaBox className="me-2 text-primary" />
                    Order Items ({Array.isArray(order.items) ? order.items.length : 0})
                  </h6>
                </div>
                <div className="card-body p-0">
                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-striped table-hover mb-0">
                        <thead
                          style={{ backgroundColor: "var(--background-light)" }}
                        >
                          <tr>
                            <th className="text-center small fw-semibold">#</th>
                            <th className="small fw-semibold">Product</th>
                            <th className="text-center small fw-semibold">
                              Qty
                            </th>
                            <th className="text-end small fw-semibold">
                              Price
                            </th>
                            <th className="text-end small fw-semibold">
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, idx) => (
                            <tr key={item.id || idx} className="align-middle">
                              <td className="text-center small">
                                {idx + 1}
                              </td>
                              <td>
                                <div
                                  className="fw-medium"
                                  style={{
                                    color: "var(--text-primary)",
                                    maxWidth: "260px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                  title={
                                    item.product?.title ||
                                    item.product_name ||
                                    "Product"
                                  }
                                >
                                  {item.product?.title ||
                                    item.product_name ||
                                    "Product"}
                                </div>
                                {item.product && (
                                  <div
                                    className="small text-muted"
                                    style={{ maxWidth: "260px" }}
                                  >
                                    ID: {item.product.id}
                                  </div>
                                )}
                              </td>
                              <td className="text-center small">
                                {item.quantity}
                              </td>
                              <td className="text-end small">
                                {formatCurrency(item.product_price)}
                              </td>
                              <td className="text-end small fw-semibold">
                                {formatCurrency(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FaBox className="text-muted mb-2" size={32} />
                      <p className="text-muted mb-0 small">
                        No items found for this order.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer border-top bg-white modal-smooth">
              <button
                type="button"
                className="btn btn-outline-secondary btn-smooth"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default OrderDetailsModal;


