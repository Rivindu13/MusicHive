import { useEffect, useState } from "react";
import {
  getBookings,
  updateBookingStatus,
  updateBookingPaymentStatus,
  deleteBooking,
} from "../services/adminApi";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getBookings();
      setBookings(data);
    } catch (error) {
      console.error("Bookings error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleStatusChange = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status);
      await loadBookings();
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePaymentStatusChange = async (bookingId, paymentStatus) => {
    try {
      await updateBookingPaymentStatus(bookingId, paymentStatus);
      await loadBookings();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (bookingId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this booking?"
    );

    if (!confirmDelete) return;

    try {
      await deleteBooking(bookingId);
      await loadBookings();
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const searchableText = [
      booking.artistUid,
      booking.customerUid,
      booking.artist?.name,
      booking.customer?.name,
      booking.artist?.email,
      booking.customer?.email,
      booking.date,
      booking.slotType,
      booking.status,
      booking.paymentStatus,
      booking.note,
      booking.paymentRef,
      booking.payhereOrderId,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(search.toLowerCase());
    const matchesStatus = statusFilter ? booking.status === statusFilter : true;
    const matchesPayment = paymentFilter
      ? booking.paymentStatus === paymentFilter
      : true;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">Booking Management</h1>
        <p className="admin-page-subtitle">
          View and manage artist booking requests, payments, and statuses.
        </p>
      </div>

      <div className="admin-card">
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Search by artist, customer, date, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All booking statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="">All payments</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <button className="refresh-btn" onClick={loadBookings}>
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading bookings...</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Artist/Band</th>
                  <th>Date</th>
                  <th>Slot</th>
                  <th>Price</th>
                  <th>Booking Status</th>
                  <th>Payment</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-table">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>
                        <strong>{booking.customer?.name || "Unknown"}</strong>
                        <br />
                        <span className="muted-small">
                          {booking.customer?.email || booking.customerUid}
                        </span>
                      </td>

                      <td>
                        <strong>{booking.artist?.name || "Unknown"}</strong>
                        <br />
                        <span className="muted-small">
                          {booking.artist?.email || booking.artistUid}
                        </span>
                      </td>

                      <td>{booking.date || "N/A"}</td>
                      <td>{booking.slotType || "N/A"}</td>

                      <td>
                        {booking.amountPaid || booking.price
                          ? `Rs. ${booking.amountPaid || booking.price}`
                          : "N/A"}
                      </td>

                      <td>
                        <span className={`status-badge ${booking.status}`}>
                          {booking.status}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${booking.paymentStatus}`}
                        >
                          {booking.paymentStatus}
                        </span>
                      </td>

                      <td>
                        {booking.createdAt
                          ? new Date(booking.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>

                      <td>
                        <div className="action-buttons">
                          <select
                            className="small-select"
                            value={booking.status}
                            onChange={(e) =>
                              handleStatusChange(booking._id, e.target.value)
                            }
                          >
                            <option value="PENDING">Pending</option>
                            <option value="ACCEPTED">Accepted</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="EXPIRED">Expired</option>
                          </select>

                          <select
                            className="small-select"
                            value={booking.paymentStatus}
                            onChange={(e) =>
                              handlePaymentStatusChange(
                                booking._id,
                                e.target.value
                              )
                            }
                          >
                            <option value="UNPAID">Unpaid</option>
                            <option value="PAID">Paid</option>
                            <option value="REFUNDED">Refunded</option>
                          </select>

                          <button
                            className="small-btn danger"
                            onClick={() => handleDelete(booking._id)}
                          >
                            Delete
                          </button>
                        </div>
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

export default Bookings;