import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import dns from "dns";
import Admin from "../models/admin.js";

dotenv.config();

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const createOrUpdateAccountant = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env file");
    }

    if (!process.env.ACCOUNTANT_EMAIL || !process.env.ACCOUNTANT_PASSWORD) {
      throw new Error(
        "ACCOUNTANT_EMAIL and ACCOUNTANT_PASSWORD are required in .env file"
      );
    }

    console.log("Trying to connect to MongoDB...");
    console.log("Using DNS servers:", dns.getServers());

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const email = process.env.ACCOUNTANT_EMAIL.toLowerCase();
    const hashedPassword = await bcrypt.hash(
      process.env.ACCOUNTANT_PASSWORD,
      10
    );

    const existingAccountant = await Admin.findOne({ email });

    if (existingAccountant) {
      existingAccountant.uid =
        process.env.ACCOUNTANT_UID || "accountant_001";
      existingAccountant.name =
        process.env.ACCOUNTANT_NAME || existingAccountant.name;
      existingAccountant.password = hashedPassword;
      existingAccountant.role = "accountant";
      existingAccountant.isActive = true;

      await existingAccountant.save();

      console.log(
        "Accountant already existed. Password reset successfully:",
        email
      );
      process.exit(0);
    }

    const accountant = await Admin.create({
      uid: process.env.ACCOUNTANT_UID || "accountant_001",
      name: process.env.ACCOUNTANT_NAME || "MusicHive Accountant",
      email,
      password: hashedPassword,
      role: "accountant",
      isActive: true,
    });

    console.log("Accountant created successfully:", accountant.email);
    process.exit(0);
  } catch (error) {
    console.error("Failed to create/update accountant:", error.message);
    process.exit(1);
  }
};

createOrUpdateAccountant();