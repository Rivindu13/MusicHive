import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

// Force Node.js to use public DNS servers
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const testConnection = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    console.log("Trying to connect to MongoDB...");
    console.log("Using forced DNS servers:", dns.getServers());

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");
    console.log("Connected host:", mongoose.connection.host);
    console.log("Connected database:", mongoose.connection.name);

    const collections = await mongoose.connection.db.listCollections().toArray();

    console.log("Collections:");
    collections.forEach((collection) => {
      console.log("-", collection.name);
    });

    process.exit(0);
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);
    process.exit(1);
  }
};

testConnection();