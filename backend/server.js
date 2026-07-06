import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

dns.setServers(["1.1.1.1", "8.8.8.8"]);

import userRoutes from "./routes/userRoutes.js";
import chordRoutes from "./routes/chordRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import { startHoldExpiryJob } from "./jobs/holdExpiryJobs.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";



import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import adminArtistRoutes from "./routes/adminArtistRoutes.js";
import adminBookingRoutes from "./routes/adminBookingRoutes.js";
import adminChordRoutes from "./routes/adminChordRoutes.js";
import adminReviewRoutes from "./routes/adminReviewRoutes.js";


startHoldExpiryJob();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

app.use("/api/users", userRoutes);
app.use("/api/chords", chordRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/artists", adminArtistRoutes);
app.use("/api/admin/bookings", adminBookingRoutes);
app.use("/api/admin/chords", adminChordRoutes);
app.use("/api/admin/reviews", adminReviewRoutes);


app.listen(5000, () => console.log("Backend running on port 5000"));
