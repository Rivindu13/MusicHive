import { useEffect, useState } from "react";
import {
  getBookings,
  updateBookingStatus,
  deleteBooking,
} from "../services/adminApi";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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

  const getValue = (booking, keys, fallback = "N/A") => {
    for (const key of keys) {
      if (booking[key]) return booking[key];
    }
    return fallback;
  };

  const handleStatusChange = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status);
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
    const text = JSON.stringify(booking).toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesStatus = statusFilter
      ? booking.status === statusFilter
      : true;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">Booking Management</h1>
        <p className="admin-page-subtitle">
          View, update, and manage MusicHive bookings.
        </p>
      </div>

      <div className="admin-card">
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>

          <button onClick={loadBookings}>Refresh</button>
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
                  <th>Event Date</th>
                  <th>Location</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-table">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => {
                    const customer = getValue(booking, [
                      "customerName",
                      "organizerName",
                      "userName",
                      "clientName",
                    ]);

                    const artist = getValue(booking, [
                      "artistName",
                      "bandName",
                      "performerName",
                    ]);

                    const eventDate = getValue(booking, [
                      "eventDate",
                      "bookingDate",
                      "date",
                    ]);

                    const location = getValue(booking, [
                      "location",
                      "eventLocation",
                      "venue",
                    ]);

                    const amount = getValue(booking, [
                      "amount",
                      "totalAmount",
                      "price",
                      "paymentAmount",
                    ]);

                    return (
                      <tr key={booking._id}>
                        <td>{customer}</td>
                        <td>{artist}</td>
                        <td>
                          {eventDate !== "N/A"
                            ? new Date(eventDate).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td>{location}</td>
                        <td>{amount !== "N/A" ? `Rs. ${amount}` : "N/A"}</td>
                        <td>
                          <span className={`status-badge ${booking.status || "pending"}`}>
                            {booking.status || "pending"}
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
                              value={booking.status || "pending"}
                              onChange={(e) =>
                                handleStatusChange(booking._id, e.target.value)
                              }
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="rejected">Rejected</option>
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
                    );
                  })
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