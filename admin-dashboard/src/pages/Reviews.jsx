import { useEffect, useState } from "react";
import { getReviews, deleteReview } from "../services/adminApi";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await getReviews();
      setReviews(data);
    } catch (error) {
      console.error("Reviews error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleDelete = async (reviewId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmDelete) return;

    try {
      await deleteReview(reviewId);
      await loadReviews();
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const searchableText = [
      review.reviewerName,
      review.reviewerRole,
      review.revieweeRole,
      review.reviewer?.email,
      review.reviewee?.name,
      review.reviewee?.email,
      review.eventType,
      review.comment,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">Review Management</h1>
        <p className="admin-page-subtitle">
          View and moderate reviews submitted after paid bookings.
        </p>
      </div>

      <div className="admin-card">
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Search by reviewer, reviewee, comment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="refresh-btn" onClick={loadReviews}>
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading reviews...</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reviewer</th>
                  <th>Review For</th>
                  <th>Event</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-table">
                      No reviews found.
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review) => (
                    <tr key={review._id}>
                      <td>
                        <strong>{review.reviewerName}</strong>
                        <br />
                        <span className="muted-small">
                          {review.reviewerRole} ·{" "}
                          {review.reviewer?.email || review.reviewerUid}
                        </span>
                      </td>

                      <td>
                        <strong>{review.reviewee?.name || "Unknown"}</strong>
                        <br />
                        <span className="muted-small">
                          {review.revieweeRole} ·{" "}
                          {review.reviewee?.email || review.revieweeUid}
                        </span>
                      </td>

                      <td>{review.eventType || "Event"}</td>

                      <td>
                        <span className="rating-badge">
                          ⭐ {review.rating} / 5
                        </span>
                      </td>

                      <td className="comment-cell">
                        {review.comment || "No comment"}
                      </td>

                      <td>
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>

                      <td>
                        <button
                          className="small-btn danger"
                          onClick={() => handleDelete(review._id)}
                        >
                          Delete
                        </button>
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

export default Reviews;