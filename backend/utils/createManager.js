import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import dns from "dns";
import Admin from "../models/admin.js";

dotenv.config();

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const createOrUpdateManager = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env file");
    }

    if (!process.env.MANAGER_EMAIL || !process.env.MANAGER_PASSWORD) {
      throw new Error(
        "MANAGER_EMAIL and MANAGER_PASSWORD are required in .env file"
      );
    }

    console.log("Trying to connect to MongoDB...");
    console.log("Using DNS servers:", dns.getServers());

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const email = process.env.MANAGER_EMAIL.toLowerCase();
    const hashedPassword = await bcrypt.hash(process.env.MANAGER_PASSWORD, 10);

    const existingManager = await Admin.findOne({ email });

    if (existingManager) {
      existingManager.uid = process.env.MANAGER_UID || "manager_001";
      existingManager.name = process.env.MANAGER_NAME || existingManager.name;
      existingManager.password = hashedPassword;
      existingManager.role = "manager";
      existingManager.isActive = true;

      await existingManager.save();

      console.log("Manager already existed. Password reset successfully:", email);
      process.exit(0);
    }

    const manager = await Admin.create({
      uid: process.env.MANAGER_UID || "manager_001",
      name: process.env.MANAGER_NAME || "MusicHive Manager",
      email,
      password: hashedPassword,
      role: "manager",
      isActive: true,
    });

    console.log("Manager created successfully:", manager.email);
    process.exit(0);
  } catch (error) {
    console.error("Failed to create/update manager:", error.message);
    process.exit(1);
  }
};

createOrUpdateManager();