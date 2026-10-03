const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// UPDATE PROFILE PICTURE
// ==========================================
router.put("/profile-picture", authMiddleware, async (req, res) => {
  try {
    const { profilePicture } = req.body;

    // Allow empty value so the user can remove their picture
    if (
      profilePicture !== "" &&
      (!profilePicture ||
        typeof profilePicture !== "string" ||
        !profilePicture.startsWith("data:image/"))
    ) {
      return res.status(400).json({
        message: "Please provide a valid image."
      });
    }

    // Limit Base64 image size to approximately 2 MB
    if (profilePicture && profilePicture.length > 3_000_000) {
      return res.status(400).json({
        message: "Profile picture is too large. Please choose an image under 2 MB."
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    user.profilePicture = profilePicture || "";

    await user.save();

    res.status(200).json({
      message: profilePicture
        ? "Profile picture updated successfully."
        : "Profile picture removed successfully.",
      profilePicture: user.profilePicture
    });

  } catch (error) {
    console.error("Error updating profile picture:", error);

    res.status(500).json({
      message: "Unable to update profile picture."
    });
  }
});


// ==========================================
// GET ALL STUDENTS
// ==========================================
router.get("/students", authMiddleware, async (req, res) => {
  try {
    // Only Admin can access
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied. Admin only."
      });
    }

    const students = await User.find(
      { role: "Student" },
      "-password"
    ).sort({ fullName: 1 });

    res.status(200).json(students);

  } catch (error) {
    console.error("Error fetching students:", error);

    res.status(500).json({
      message: "Unable to fetch students."
    });
  }
});


// ==========================================
// GET ALL FACULTY
// ==========================================
router.get("/faculty", authMiddleware, async (req, res) => {
  try {
    // Only Admin can access
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied. Admin only."
      });
    }

    const faculty = await User.find(
      { role: "Faculty" },
      "-password"
    ).sort({ fullName: 1 });

    res.status(200).json(faculty);

  } catch (error) {
    console.error("Error fetching faculty:", error);

    res.status(500).json({
      message: "Unable to fetch faculty."
    });
  }
});


module.exports = router;