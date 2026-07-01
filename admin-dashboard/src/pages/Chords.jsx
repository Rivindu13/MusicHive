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

  const getValue = (chord, keys, fallback = "N/A") => {
    for (const key of keys) {
      if (chord[key]) return chord[key];
    }
    return fallback;
  };

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

  const filteredChords = chords.filter((chord) =>
    JSON.stringify(chord).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">Chord Management</h1>
        <p className="admin-page-subtitle">
          View and manage chords uploaded by artists and bands.
        </p>
      </div>

      <div className="admin-card">
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Search chords..."
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
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Genre</th>
                  <th>Key</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredChords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-table">
                      No chords found.
                    </td>
                  </tr>
                ) : (
                  filteredChords.map((chord) => (
                    <tr key={chord._id}>
                      <td>{getValue(chord, ["title", "songTitle", "name"])}</td>
                      <td>{getValue(chord, ["artistName", "uploadedBy", "artist"])}</td>
                      <td>{getValue(chord, ["genre", "category"])}</td>
                      <td>{getValue(chord, ["key", "songKey", "scale"])}</td>
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