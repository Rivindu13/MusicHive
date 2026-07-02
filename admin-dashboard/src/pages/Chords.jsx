import { useEffect, useState } from "react";
import { getChords, deleteChord } from "../services/adminApi";

const Chords = () => {
  const [chords, setChords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadChords = async () => {
    try {
      setLoading(true);
      const data = await getChords();
      setChords(data);
    } catch (error) {
      console.error("Chords error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChords();
  }, []);

  const handleDelete = async (chordId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this chord?"
    );

    if (!confirmDelete) return;

    try {
      await deleteChord(chordId);
      await loadChords();
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredChords = chords.filter((chord) => {
    const searchableText = [
      chord.title,
      chord.genre,
      chord.uid,
      chord.role,
      chord.owner?.name,
      chord.owner?.email,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">Chord Management</h1>
        <p className="admin-page-subtitle">
          View and manage chord posts uploaded by artists and customers.
        </p>
      </div>

      <div className="admin-card">
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Search by title, genre, owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button onClick={loadChords}>Refresh</button>
        </div>

        {loading ? (
          <p>Loading chords...</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Genre</th>
                  <th>Owner</th>
                  <th>Role</th>
                  <th>Reviews</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredChords.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-table">
                      No chords found.
                    </td>
                  </tr>
                ) : (
                  filteredChords.map((chord) => (
                    <tr key={chord._id}>
                      <td>
                        {chord.imageUrl ? (
                          <img
                            src={chord.imageUrl}
                            alt={chord.title}
                            className="table-image"
                          />
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td>{chord.title || "Untitled"}</td>
                      <td>{chord.genre || "N/A"}</td>
                      <td>
                        <strong>{chord.owner?.name || "Unknown"}</strong>
                        <br />
                        <span className="muted-small">
                          {chord.owner?.email || chord.uid}
                        </span>
                      </td>
                      <td>{chord.role}</td>
                      <td>{chord.reviewCount}</td>
                      <td>
                        {chord.createdAt
                          ? new Date(chord.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>
                        <button
                          className="small-btn danger"
                          onClick={() => handleDelete(chord._id)}
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

export default Chords;