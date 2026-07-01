import { useEffect, useState } from "react";
import {
  getUsers,
  blockUser,
  unblockUser,
  deleteUser,
} from "../services/adminApi";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Users error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleBlockToggle = async (user) => {
    const confirmAction = window.confirm(
      user.isBlocked
        ? "Are you sure you want to unblock this user?"
        : "Are you sure you want to block this user?"
    );

    if (!confirmAction) return;

    try {
      if (user.isBlocked) {
        await unblockUser(user._id);
      } else {
        await blockUser(user._id);
      }

      await loadUsers();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (userId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    );

    if (!confirmDelete) return;

    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredUsers = users.filter((user) => {
    const name = user.name || "";
    const email = user.email || "";
    const role = user.role || "";

    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      role.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter ? role === roleFilter : true;

    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-subtitle">
            View, search, block, unblock, and remove MusicHive users.
          </p>
        </div>
      </div>

      <div className="admin-card">
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All roles</option>
            <option value="artist">Artist</option>
            <option value="band">Band</option>
            <option value="organizer">Organizer</option>
          </select>

          <button onClick={loadUsers}>Refresh</button>
        </div>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-table">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-cell">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.name} />
                          ) : (
                            <div className="user-avatar">
                              {(user.name || "U").charAt(0).toUpperCase()}
                            </div>
                          )}

                          <span>{user.name || "N/A"}</span>
                        </div>
                      </td>

                      <td>{user.email || "N/A"}</td>
                      <td>{user.role || "N/A"}</td>

                      <td>
                        <span
                          className={
                            user.isBlocked
                              ? "status-badge blocked"
                              : "status-badge active"
                          }
                        >
                          {user.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>

                      <td>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="small-btn"
                            onClick={() => handleBlockToggle(user)}
                          >
                            {user.isBlocked ? "Unblock" : "Block"}
                          </button>

                          <button
                            className="small-btn danger"
                            onClick={() => handleDelete(user._id)}
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

export default Users;