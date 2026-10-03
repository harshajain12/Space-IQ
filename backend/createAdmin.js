require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    const existingAdmin = await User.findOne({ role: "Admin" });

    if (existingAdmin) {
      console.log("An Admin account already exists.");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = new User({
      fullName: "Space IQ Administrator",
      email: "admin@spaceiq.com",
      userId: "ADMIN001",
      role: "Admin",
      password: hashedPassword
    });

    await admin.save();

    console.log("Admin account created successfully!");
    console.log("Email: admin@spaceiq.com");
    console.log("Password: Admin@123");

    process.exit();

  } catch (error) {
    console.error("Error creating Admin:", error);
    process.exit(1);
  }
}

createAdmin();