const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    role: {
      type: String,
      enum: ["Student", "Faculty", "Admin"],
      required: true
    },

    password: {
      type: String,
      required: true
    },

    // Profile picture stored as a Base64 data URL.
    // Optional — users can keep their initials instead.
    profilePicture: {
      type: String,
      default: ""
    },

    resetPasswordToken: {
  type: String,
  default: ""
},

resetPasswordExpires: {
  type: Date,
  default: null
}
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);