import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import dns from "dns";
import Admin from "../models/admin.js";

dotenv.config();

// Force Node.js to use public DNS servers for MongoDB Atlas SRV lookup
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const createOrUpdateAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env file");
    }

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required in .env file");
    }

    console.log("Trying to connect to MongoDB...");
    console.log("Using DNS servers:", dns.getServers());

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const email = process.env.ADMIN_EMAIL.toLowerCase();
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      existingAdmin.name = process.env.ADMIN_NAME || existingAdmin.name;
      existingAdmin.password = hashedPassword;
      existingAdmin.isActive = true;
      existingAdmin.role = "admin";

      await existingAdmin.save();

      console.log("Admin already existed. Password reset successfully:", email);
      process.exit(0);
    }

    const admin = await Admin.create({
      name: process.env.ADMIN_NAME || "MusicHive Admin",
      email,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    console.log("Admin created successfully:", admin.email);
    process.exit(0);
  } catch (error) {
    console.error("Failed to create/update admin:", error.message);
    process.exit(1);
  }
};

createOrUpdateAdmin();