const mongoose = require("mongoose");
const crypto = require("crypto");

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    building: {
      type: String,
      required: true,
      trim: true
    },

    capacity: {
      type: Number,
      required: true
    },

    facilities: {
      type: [String],
      default: []
    },

    status: {
      type: String,
      enum: ["Available", "Occupied", "Maintenance"],
      default: "Available"
    },

    maintenanceNote: {
  type: String,
  default: "",
  trim: true
},

maintenanceReportedAt: {
  type: Date,
  default: null
},

    qrCodeId: {
      type: String,
      unique: true,
      default: () => crypto.randomUUID()
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Room", roomSchema);