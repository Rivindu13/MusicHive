import { useEffect, useState } from "react";
import {
  getArtists,
  blockArtist,
  unblockArtist,
  deleteArtist,
} from "../services/adminApi";

const Artists = () => {
  const [artists, setArtists] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const loadArtists = async () => {
    try {
      setLoading(true);
      const data = await getArtists();
      setArtists(data);
    } catch (error) {
      console.error("Artists error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtists();
  }, []);

  const handleBlockToggle = async (artist) => {
    const confirmAction = window.confirm(
      artist.isBlocked
        ? "Are you sure you want to unblock this artist/band?"
        : "Are you sure you want to block this artist/band?"
    );

    if (!confirmAction) return;

    try {
      if (artist.isBlocked) {
        await unblockArtist(artist._id);
      } else {
        await blockArtist(artist._id);
      }

      await loadArtists();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (artistId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this artist/band? This action cannot be undone."
    );

    if (!confirmDelete) return;

    try {
      await deleteArtist(artistId);
      await loadArtists();
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredArtists = artists.filter((artist) => {
    const name = artist.name || "";
    const email = artist.email || "";
    const role = artist.role || "";
    const location = artist.artistProfile?.location || "";
    const genres = artist.artistProfile?.genres?.join(" ") || "";

    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      role.toLowerCase().includes(search.toLowerCase()) ||
      location.toLowerCase().includes(search.toLowerCase()) ||
      genres.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter ? role === roleFilter : true;

    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="admin-page-title">Artist & Band Management</h1>
          <p className="admin-page-subtitle">
            View, search, block, unblock, and remove artists and bands.
          </p>
        </div>
      </div>

      <div className="admin-card">
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Search by name, email, genre, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All types</option>
            <option value="artist">Artist</option>
            <option value="band">Band</option>
          </select>

          <button className="refresh-btn" onClick={loadArtists}>
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading artists and bands...</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Artist/Band</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Genres</th>
                  <th>Location</th>
                  <th>Price/Hour</th>
                  <th>Profile</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredArtists.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-table">
                      No artists or bands found.
                    </td>
                  </tr>
                ) : (
                  filteredArtists.map((artist) => {
                    const profile = artist.artistProfile || {};
                    const genres =
                      profile.genres && profile.genres.length > 0
                        ? profile.genres.join(", ")
                        : "N/A";

                    return (
                      <tr key={artist._id}>
                        <td>
                          <div className="user-cell">
                            {artist.photoURL ? (
                              <img src={artist.photoURL} alt={artist.name} />
                            ) : (
                              <div className="user-avatar">
                                {(artist.name || "A").charAt(0).toUpperCase()}
                              </div>
                            )}

                            <span>{artist.name || "N/A"}</span>
                          </div>
                        </td>

                        <td>{artist.email || "N/A"}</td>
                        <td>{artist.role || "N/A"}</td>
                        <td>{genres}</td>
                        <td>{profile.location || "N/A"}</td>
                        <td>
                          {profile.pricePerHour
                            ? `Rs. ${profile.pricePerHour}`
                            : "N/A"}
                        </td>
                        <td>
                          <span
                            className={
                              profile.isProfileComplete
                                ? "status-badge active"
                                : "status-badge pending"
                            }
                          >
                            {profile.isProfileComplete
                              ? "Complete"
                              : "Incomplete"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              artist.isBlocked
                                ? "status-badge blocked"
                                : "status-badge active"
                            }
                          >
                            {artist.isBlocked ? "Blocked" : "Active"}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="small-btn"
                              onClick={() => handleBlockToggle(artist)}
                            >
                              {artist.isBlocked ? "Unblock" : "Block"}
                            </button>

                            <button
                              className="small-btn danger"
                              onClick={() => handleDelete(artist._id)}
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

export default Artists;