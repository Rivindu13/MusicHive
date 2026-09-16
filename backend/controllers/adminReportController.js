import Report from "../models/report.js";
import User from "../models/user.js";

export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().populate("bookingId").sort({ createdAt: -1 });
    const uids = [...new Set(reports.flatMap((report) => [report.reporterUid, report.reportedUid]))];
    const users = await User.find({ uid: { $in: uids } }).select("uid name email role");
    const userMap = Object.fromEntries(users.map((user) => [user.uid, user]));
    return res.json({
      success: true,
      data: reports.map((report) => ({
        ...report.toObject(),
        reporter: userMap[report.reporterUid] || null,
        reported: userMap[report.reportedUid] || null,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load reports", error: error.message });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const allowed = ["pending", "reviewed", "resolved", "rejected"];
    if (!allowed.includes(req.body?.status)) {
      return res.status(400).json({ success: false, message: "Invalid report status" });
    }
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    return res.json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update report", error: error.message });
  }
};
