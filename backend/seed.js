import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    console.log("[Seed] Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);

    console.log("[Seed] Checking for existing admin...");
    const existingAdmin = await User.findOne({ role: "Admin" });

    if (existingAdmin) {
      console.log("[Seed] Admin already exists. Skipping seed.");
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log("[Seed] Creating admin account...");
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await User.create({
      firstName: "System",
      lastName: "Admin",
      email: "admin@prepease.com",
      password: hashedPassword,
      role: "Admin",
    });

    console.log("[Seed] ✅ Admin account created successfully!");
    console.log("[Seed] Admin Email: admin@prepease.com");
    console.log("[Seed] Admin Password: admin123");
    console.log("[Seed] ⚠️  IMPORTANT: Change the password after first login!");
    console.log("[Seed] Admin ID:", admin._id);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("[Seed] Error:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
