import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import userRoutes from "./routes/userRoutes.js";
import chordRoutes from "./routes/chordRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import { startHoldExpiryJob } from "./jobs/holdExpiryJobs.js";
import contactRoutes from "./routes/contactRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";


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
app.use("/api/contact", contactRoutes);
app.use("/api/notifications", notificationRoutes);


app.listen(5000, () => console.log("Backend running on port 5000"));
