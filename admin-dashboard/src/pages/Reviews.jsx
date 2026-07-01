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

  const getValue = (review, keys, fallback = "N/A") => {
    for (const key of keys) {
      if (review[key]) return review[key];
    }
    return fallback;
  };

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

  const filteredReviews = reviews.filter((review) =>
    JSON.stringify(review).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">Review Management</h1>
        <p className="admin-page-subtitle">
          View and moderate reviews submitted by MusicHive users.
        </p>
      </div>

      <div className="admin-card">
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button onClick={loadReviews}>Refresh</button>
        </div>

        {loading ? (
          <p>Loading reviews...</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reviewer</th>
                  <th>Artist/Band</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-table">
                      No reviews found.
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review) => (
                    <tr key={review._id}>
                      <td>{getValue(review, ["reviewerName", "userName", "customerName"])}</td>
                      <td>{getValue(review, ["artistName", "bandName", "performerName"])}</td>
                      <td>{getValue(review, ["rating", "stars"], "0")} / 5</td>
                      <td className="comment-cell">
                        {getValue(review, ["comment", "review", "message"])}
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