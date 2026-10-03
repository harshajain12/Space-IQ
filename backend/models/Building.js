const mongoose = require("mongoose");

const buildingSchema = new mongoose.Schema(
  {
    campus: {
      type: String,
      required: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Building", buildingSchema);