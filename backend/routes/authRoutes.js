const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

console.log(
  "EMAIL_USER loaded:",
  !!process.env.EMAIL_USER
);

console.log(
  "EMAIL_PASSWORD loaded:",
  !!process.env.EMAIL_PASSWORD
);

const router = express.Router();

// =========================
// REGISTER
// =========================

router.post("/register", async (req, res) => {
try {
const { fullName, email, userId, role, password } = req.body;


// Check if all required fields are provided
if (!fullName || !email || !userId || !role || !password) {
  return res.status(400).json({
    message: "Please fill in all required fields."
  });
}

// Admin cannot register through normal registration
if (role === "Admin") {
  return res.status(403).json({
    message: "Admin accounts cannot be created through normal registration."
  });
}

// Check if email already exists
const existingEmail = await User.findOne({ email });

if (existingEmail) {
  return res.status(409).json({
    message: "An account with this email already exists."
  });
}

// Check if Student/Faculty ID already exists
const existingUserId = await User.findOne({ userId });

if (existingUserId) {
  return res.status(409).json({
    message: "This ID is already registered."
  });
}

// Hash password
const hashedPassword = await bcrypt.hash(password, 10);

// Create new user
const newUser = new User({
  fullName,
  email,
  userId,
  role,
  password: hashedPassword
});

// Save user in MongoDB
await newUser.save();

res.status(201).json({
  message: "Registration successful!"
});


} catch (error) {
console.error("Registration error:", error);


res.status(500).json({
  message: "Something went wrong during registration."
});


}
});

// =========================
// LOGIN
// =========================

router.post("/login", async (req, res) => {
try {
const { email, password } = req.body;


// Check if email and password are provided
if (!email || !password) {
  return res.status(400).json({
    message: "Please enter email and password."
  });
}

// Find user by email
const user = await User.findOne({ email });

if (!user) {
  return res.status(401).json({
    message: "Invalid email or password."
  });
}

// Compare entered password with hashed password
const isPasswordCorrect = await bcrypt.compare(
  password,
  user.password
);

if (!isPasswordCorrect) {
  return res.status(401).json({
    message: "Invalid email or password."
  });
}

// Create JWT token
const token = jwt.sign(
  {
    userId: user._id,
    role: user.role
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "1d"
  }
);

// Login successful
res.status(200).json({
  message: "Login successful!",
  token,
  user: {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    userId: user.userId,
    role: user.role
  }
});


} catch (error) {
console.error("Login error:", error);


res.status(500).json({
  message: "Something went wrong during login."
});


}
});

// =========================
// FORGOT PASSWORD
// =========================

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Please enter your email address."
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(404).json({
        message: "No account was found with this email address."
      });
    }

    const resetToken = require("crypto").randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;

    user.resetPasswordExpires =
      new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    console.log(
  "RESET TOKEN SAVED:",
  user.resetPasswordToken
);

console.log(
  "RESET TOKEN EXPIRES:",
  user.resetPasswordExpires
);
console.log(
  "SCHEMA HAS RESET TOKEN:",
  !!User.schema.path("resetPasswordToken")
);

console.log(
  "SCHEMA HAS RESET EXPIRY:",
  !!User.schema.path("resetPasswordExpires")
);
const savedUser = await User.findById(user._id);



console.log(
  "TOKEN IN DATABASE:",
  savedUser?.resetPasswordToken
);

   await user.save();

console.log(
  "RESET TOKEN SAVED:",
  user.resetPasswordToken
);

console.log(
  "RESET TOKEN EXPIRES:",
  user.resetPasswordExpires
);


res.status(200).json({
  message: "Password reset request created.",
  resetToken
});

  } catch (error) {
    console.error("Forgot password error:", error);

    res.status(500).json({
      message: "Something went wrong while processing your request."
    });
  }
});

// =========================
// RESET PASSWORD
// =========================

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Reset token and new password are required."
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long."
      });
    }

    console.log("RESET TOKEN RECEIVED:", token);

const tokenUser = await User.findOne({
  resetPasswordToken: token
});

console.log(
  "USER FOUND BY TOKEN:",
  !!tokenUser
);

if (tokenUser) {
  console.log(
    "TOKEN EXPIRY:",
    tokenUser.resetPasswordExpires
  );

  console.log(
    "CURRENT TIME:",
    new Date()
  );
}

const user = await User.findOne({
  resetPasswordToken: token,
  resetPasswordExpires: {
    $gt: new Date()
  }
});

    if (!user) {
      return res.status(400).json({
        message: "This password reset link is invalid or has expired."
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    user.resetPasswordToken = "";
    user.resetPasswordExpires = null;

    await user.save();

    res.status(200).json({
      message: "Password reset successful. You can now log in."
    });

  } catch (error) {
    console.error("Reset password error:", error);

    res.status(500).json({
      message: "Something went wrong while resetting your password."
    });
  }
});

// =========================
// EXPORT ROUTER
// =========================

module.exports = router;
