import { useEffect, useState } from "react";
import {
  getPaymentSummary,
  getPayments,
  updatePaymentStatus,
} from "../services/adminApi";

const Payments = () => {
  const [summary, setSummary] = useState({
    totalBookings: 0,
    paidPayments: 0,
    unpaidPayments: 0,
    refundedPayments: 0,
    totalRevenue: 0,
  });

  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    try {
      setLoading(true);

      const summaryData = await getPaymentSummary();
      const paymentData = await getPayments();

      setSummary(summaryData);
      setPayments(paymentData);
    } catch (error) {
      console.error("Payments error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handlePaymentStatusChange = async (bookingId, paymentStatus) => {
    try {
      await updatePaymentStatus(bookingId, paymentStatus);
      await loadPayments();
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const searchableText = [
      payment.customer?.name,
      payment.customer?.email,
      payment.artist?.name,
      payment.artist?.email,
      payment.paymentStatus,
      payment.paymentRef,
      payment.payhereOrderId,
      payment.paymentMessage,
      payment.date,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(search.toLowerCase());

    const matchesPayment = paymentFilter
      ? payment.paymentStatus === paymentFilter
      : true;

    return matchesSearch && matchesPayment;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">Payment Management</h1>
        <p className="admin-page-subtitle">
          View and manage MusicHive booking payments, paid amounts, payment
          references, and refund statuses.
        </p>
      </div>

      <div className="stat-grid payments-stat-grid">
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p>{summary.totalBookings}</p>
        </div>

        <div className="stat-card">
          <h3>Paid Payments</h3>
          <p>{summary.paidPayments}</p>
        </div>

        <div className="stat-card">
          <h3>Unpaid Payments</h3>
          <p>{summary.unpaidPayments}</p>
        </div>

        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p>Rs. {summary.totalRevenue}</p>
        </div>
      </div>

      <div className="admin-card payments-card">
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Search by customer, artist, payment reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="">All payment statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <button className="refresh-btn" onClick={loadPayments}>
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading payments...</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Artist/Band</th>
                  <th>Event Date</th>
                  <th>Booking Status</th>
                  <th>Payment Status</th>
                  <th>Price</th>
                  <th>Amount Paid</th>
                  <th>Payment Ref</th>
                  <th>PayHere Order</th>
                  <th>Paid At</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="empty-table">
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment._id}>
                      <td>
                        <strong>{payment.customer?.name || "Unknown"}</strong>
                        <br />
                        <span className="muted-small">
                          {payment.customer?.email || payment.customerUid}
                        </span>
                      </td>

                      <td>
                        <strong>{payment.artist?.name || "Unknown"}</strong>
                        <br />
                        <span className="muted-small">
                          {payment.artist?.email || payment.artistUid}
                        </span>
                      </td>

                      <td>{payment.date || "N/A"}</td>

                      <td>
                        <span className={`status-badge ${payment.status}`}>
                          {payment.status}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${payment.paymentStatus}`}
                        >
                          {payment.paymentStatus}
                        </span>
                      </td>

                      <td>
                        {payment.price ? `Rs. ${payment.price}` : "N/A"}
                      </td>

                      <td>
                        {payment.amountPaid
                          ? `Rs. ${payment.amountPaid}`
                          : "N/A"}
                      </td>

                      <td>{payment.paymentRef || "N/A"}</td>

                      <td>{payment.payhereOrderId || "N/A"}</td>

                      <td>
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleString()
                          : "N/A"}
                      </td>

                      <td>
                        <select
                          className="small-select"
                          value={payment.paymentStatus}
                          onChange={(e) =>
                            handlePaymentStatusChange(
                              payment._id,
                              e.target.value
                            )
                          }
                        >
                          <option value="UNPAID">Unpaid</option>
                          <option value="PAID">Paid</option>
                          <option value="REFUNDED">Refunded</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;