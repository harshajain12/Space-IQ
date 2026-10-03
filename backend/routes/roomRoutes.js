const express = require("express"); 
const crypto = require("crypto"); 
const Room = require("../models/Room"); 
const Booking = require("../models/Booking"); 
const authMiddleware = require("../middleware/authMiddleware"); 
 
const router = express.Router(); 
 
 
// ========================================== 
// GET ALL ROOMS 
// ========================================== 
// Any logged-in user can view rooms 
// ==========================================
// GET ALL ROOMS
// ==========================================
// Any logged-in user can view rooms
router.get("/", authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find();

    // Current date and time in India
    const currentDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const currentTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());

    // Give older rooms a QR ID if they do not already have one
    for (const room of rooms) {
      if (!room.qrCodeId) {
        room.qrCodeId = crypto.randomUUID();
        await room.save();
      }
    }

    // Update room status based on the currently active checked-in booking
    for (const room of rooms) {
      // Maintenance should always remain Maintenance
      if (room.status === "Maintenance") {
        continue;
      }

      const activeBooking = await Booking.findOne({
        room: room._id,
        date: currentDate,
        status: "Approved",
        checkedIn: true,
        startTime: { $lte: currentTime },
        endTime: { $gt: currentTime },
      });

      if (activeBooking) {
        if (room.status !== "Occupied") {
          room.status = "Occupied";
          await room.save();
        }
      } else {
        if (room.status === "Occupied") {
          room.status = "Available";
          await room.save();
        }
      }
    }

    const updatedRooms = await Room.find();

    res.status(200).json(updatedRooms);

  } catch (error) {
    console.error("Error fetching rooms:", error);

    res.status(500).json({
      message: "Something went wrong while fetching rooms."
    });
  }
});
 
 
// ========================================== 
// ADD A ROOM 
// ========================================== 
// Admin only 
router.post("/", authMiddleware, async (req, res) => { 
  try { 
    if (req.user.role !== "Admin") { 
      return res.status(403).json({ 
        message: "Access denied. Admin only." 
      }); 
    } 
 
    const {
  roomNumber,
  building,
  capacity,
  facilities,
  status,
  maintenanceNote
} = req.body;
 
    if (!roomNumber || !building || !capacity) { 
      return res.status(400).json({ 
        message: "Room number, building and capacity are required." 
      }); 
    } 
 
    const existingRoom = await Room.findOne({ roomNumber }); 
 
    if (existingRoom) { 
      return res.status(409).json({ 
        message: "This room already exists." 
      }); 
    } 
 
    const newRoom = new Room({
  roomNumber,
  building,
  capacity,
  facilities: facilities || [],
  status: status || "Available",
  maintenanceNote: maintenanceNote || "",
  maintenanceReportedAt:
    status === "Maintenance" ? new Date() : null,
  qrCodeId: crypto.randomUUID()
});
 
    await newRoom.save(); 
 
    res.status(201).json({ 
      message: "Room added successfully!", 
      room: newRoom 
    }); 
 
  } catch (error) { 
    console.error("Error adding room:", error); 
 
    res.status(500).json({ 
      message: "Something went wrong while adding the room." 
    }); 
  } 
}); 
 
 
// ========================================== 
// DELETE A ROOM 
// ========================================== 
// Admin only 
router.delete("/:id", authMiddleware, async (req, res) => { 
  try { 
    if (req.user.role !== "Admin") { 
      return res.status(403).json({ 
        message: "Access denied. Admin only." 
      }); 
    } 
 
    // Find the room first 
    const room = await Room.findById(req.params.id); 
 
    if (!room) { 
      return res.status(404).json({ 
        message: "Room not found." 
      }); 
    } 
 
    // ------------------------------------------ 
    // CANCEL EXISTING BOOKINGS 
    // ------------------------------------------ 
    await Booking.updateMany( 
      { 
        room: room._id, 
        status: { 
          $in: ["Pending", "Approved"] 
        } 
      }, 
      { 
        $set: { 
          status: "Cancelled" 
        } 
      } 
    ); 
 
    // ------------------------------------------ 
    // DELETE THE ROOM 
    // ------------------------------------------ 
    await Room.findByIdAndDelete(req.params.id); 
 
    res.status(200).json({ 
      message: 
        "Room deleted successfully and related bookings were cancelled." 
    }); 
 
  } catch (error) { 
    console.error("Error deleting room:", error); 
 
    res.status(500).json({ 
      message: "Something went wrong while deleting the room." 
    }); 
  } 
}); 
 
 
// ========================================== 
// UPDATE A ROOM 
// ========================================== 
// Admin only 
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied. Admin only."
      });
    }

    const {
      roomNumber,
      building,
      capacity,
      facilities,
      status,
      maintenanceNote
    } = req.body;

    if (!roomNumber || !building || !capacity) {
      return res.status(400).json({
        message: "Room number, building and capacity are required."
      });
    }

    const existingRoom = await Room.findById(req.params.id);

    if (!existingRoom) {
      return res.status(404).json({
        message: "Room not found."
      });
    }

    let maintenanceReportedAt =
      existingRoom.maintenanceReportedAt;

    // Room is being put into maintenance
    if (
      status === "Maintenance" &&
      existingRoom.status !== "Maintenance"
    ) {
      maintenanceReportedAt = new Date();
    }

    // Room is no longer under maintenance
    if (status !== "Maintenance") {
      maintenanceReportedAt = null;
    }

        // Cancel active bookings when room is put into maintenance
    if (
      status === "Maintenance" &&
      existingRoom.status !== "Maintenance"
    ) {
      await Booking.updateMany(
        {
          room: existingRoom._id,
          status: {
            $in: ["Pending", "Approved"]
          }
        },
        {
          $set: {
            status: "Cancelled"
          }
        }
      );
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      {
        roomNumber,
        building,
        capacity,
        facilities: facilities || [],
        status: status || "Available",
        maintenanceNote:
          status === "Maintenance"
            ? maintenanceNote || ""
            : "",
        maintenanceReportedAt
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      message: "Room updated successfully!",
      room: updatedRoom
    });

  } catch (error) {
    console.error("Error updating room:", error);

    res.status(500).json({
      message: "Something went wrong while updating the room."
    });
  }
});
module.exports = router;