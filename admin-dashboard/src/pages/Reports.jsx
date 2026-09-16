import { useEffect, useMemo, useState } from "react";
import { getReports, updateReportStatus } from "../services/adminApi";

const statuses = ["pending", "reviewed", "resolved", "rejected"];

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      setLoading(true);
      setReports(await getReports());
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, []);

  const filteredReports = useMemo(() => reports.filter((report) => {
    const content = [
      report.reason, report.description, report.reporterName, report.reportedName,
      report.bookingId?.eventLocation, report.bookingId?.eventType,
    ].join(" ").toLowerCase();
    return content.includes(search.toLowerCase()) && (!filter || report.status === filter);
  }), [reports, filter, search]);

  const changeStatus = async (reportId, status) => {
    try {
      await updateReportStatus(reportId, status);
      setReports((current) => current.map((report) =>
        report._id === reportId ? { ...report, status } : report
      ));
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to update report");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">Reports &amp; Disputes</h1>
        <p className="admin-page-subtitle">Review submitted reports and update their status.</p>
      </div>
      <div className="admin-card">
        <div className="table-toolbar">
          <input placeholder="Search reports..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="">All statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button className="refresh-btn" onClick={loadReports}>Refresh</button>
        </div>
        {loading ? <p>Loading reports...</p> : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead><tr><th>Report</th><th>Parties</th><th>Booking</th><th>Description</th><th>Status</th></tr></thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr><td colSpan="5" className="empty-table">No reports found.</td></tr>
                ) : filteredReports.map((report) => (
                  <tr key={report._id}>
                    <td><strong>{report.reason}</strong><br />{new Date(report.createdAt).toLocaleDateString()}</td>
                    <td>{report.reporterName || report.reporterUid}<br />vs. {report.reportedName || report.reportedUid}</td>
                    <td>{report.bookingId?.eventType || "Event"}<br />{report.bookingId?.eventLocation || "Location not provided"}</td>
                    <td>{report.description}</td>
                    <td>
                      <select value={report.status} onChange={(event) => changeStatus(report._id, event.target.value)}>
                        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
