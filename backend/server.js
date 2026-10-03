const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Booking = require("./models/Booking");

const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const userRoutes = require("./routes/userRoutes");
const buildingRoutes = require("./routes/buildingRoutes");


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/buildings", buildingRoutes);

const PORT = 5000;

// ==========================================
// CONNECT TO MONGODB
// ==========================================

mongoose
  .connect(process.env.MONGO_URI, {
    
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`SpaceIQ server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:");
console.error(error);
    process.exit(1);
  });

app.get("/", (req, res) => {
  res.send("SpaceIQ Backend is running!");
});

app.get("/api/test", (req, res) => {
  res.json({
    message: "SpaceIQ API is working!"
  });
});

