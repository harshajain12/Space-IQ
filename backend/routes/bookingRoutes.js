
const express = require("express");
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();



// ==========================================
// INDIA DATE & TIME HELPERS
// ==========================================

const getIndiaDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const getIndiaTime = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

const getIndiaDateAfterDays = (days) => {
  const [year, month, day] = getIndiaDate()
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day + days)
  );

  return date.toISOString().split("T")[0];
};
const updateRoomStatusAfterBookingChange = async (roomId) => {
  try {
    const room = await Room.findById(roomId);

    if (!room) {
      return;
    }

    // Maintenance always has priority.
    if (room.status === "Maintenance") {
      return;
    }

    const todayString = getIndiaDate();
    const currentTime = getIndiaTime();

    const activeBooking = await Booking.findOne({
      room: roomId,
      status: "Approved",
      checkedIn: true,
      date: todayString,
      startTime: {
        $lte: currentTime
      },
      endTime: {
        $gt: currentTime
      }
    });

    if (activeBooking) {
      if (room.status !== "Occupied") {
        room.status = "Occupied";
        await room.save();
      }

      return;
    }

    if (room.status === "Occupied") {
      room.status = "Available";
      await room.save();
    }
  } catch (error) {
    console.error(
      "Update room status error:",
      error
    );
  }
};
// ==========================================
// AUTO-COMPLETE FINISHED CHECKED-IN BOOKINGS
// ==========================================
const autoCompleteFinishedBookings = async () => {
  try {
    const todayString = getIndiaDate();
    const currentTime = getIndiaTime();

    const finishedBookings = await Booking.find({
      status: "Approved",
      checkedIn: true,
      $or: [
        {
          date: {
            $lt: todayString
          }
        },
        {
          date: todayString,
          endTime: {
            $lte: currentTime
          }
        }
      ]
    });

    for (const booking of finishedBookings) {
      booking.status = "Completed";
      await booking.save();

      const room = await Room.findById(booking.room);

      if (!room) continue;

      // Only make the room available if there is
      // no other currently active checked-in booking.
      const activeBooking = await Booking.findOne({
        _id: {
          $ne: booking._id
        },
        room: booking.room,
        status: "Approved",
        checkedIn: true,
        date: todayString,
        startTime: {
          $lte: currentTime
        },
        endTime: {
          $gt: currentTime
        }
      });

      if (
        !activeBooking &&
        room.status === "Occupied"
      ) {
        room.status = "Available";
        await room.save();
      }
    }

  } catch (error) {
    console.error(
      "Auto-complete bookings error:",
      error
    );
  }
};

// ==========================================
// AUTO-CANCEL APPROVED BOOKINGS NOT CHECKED IN
// WITHIN 15 MINUTES OF START TIME
// ==========================================
const autoCancelExpiredBookings = async () => {
  try {
    const todayString = getIndiaDate();
    const currentTime = getIndiaTime();

    const expiredBookings = await Booking.find({
      status: "Approved",
      checkedIn: false,
      date: todayString,
      startTime: {
        $lte: currentTime
      }
    });

    for (const booking of expiredBookings) {
      const [startHour, startMinute] =
        booking.startTime.split(":").map(Number);

      const [currentHour, currentMinute] =
        currentTime.split(":").map(Number);

      const startTotalMinutes =
        startHour * 60 + startMinute;

      const currentTotalMinutes =
        currentHour * 60 + currentMinute;

      const minutesSinceStart =
        currentTotalMinutes - startTotalMinutes;

      // Only cancel after the full 15-minute
      // check-in window has passed.
      if (minutesSinceStart > 15) {
        booking.status = "Cancelled";
        await booking.save();
      }
    }
  } catch (error) {
    console.error(
      "Auto-cancel expired bookings error:",
      error
    );
  }
};
// ==========================================
// CREATE BOOKING
// ==========================================
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
  roomId,
  date,
  startTime,
  endTime,
  purpose
} = req.body;

// IMPORTANT:
// Never trust userId sent by the frontend.
// The logged-in user's ID comes from the JWT.
const userId = req.user.userId;

    if (
      !userId ||
      !roomId ||
      !date ||
      !startTime ||
      !endTime ||
      !purpose
    ) {
      return res.status(400).json({
        message: "Please fill in all booking details."
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        message: "Room not found."
      });
    }

    if (room.status === "Maintenance") {
      return res.status(400).json({
        message: "This room is currently under maintenance."
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        message: "End time must be after start time."
      });
    }

    const todayString = getIndiaDate();

const maximumDateString =
  getIndiaDateAfterDays(2);

    if (
      date < todayString ||
      date > maximumDateString
    ) {
      return res.status(400).json({
        message:
          "Bookings are allowed only for today and the next 2 days."
      });
    }

    if (date === todayString) {
  const currentTime = getIndiaTime();

  if (startTime <= currentTime) {
    return res.status(400).json({
      message:
        "The booking start time must be in the future."
    });
  }
}

    const overlappingBooking = await Booking.findOne({
      room: roomId,

      date: date,

      status: {
        $in: [
          "Pending",
          "Approved"
        ]
      },

      startTime: {
        $lt: endTime
      },

      endTime: {
        $gt: startTime
      }
    });

    if (overlappingBooking) {
      return res.status(409).json({
        message:
          `This room is already booked from ${overlappingBooking.startTime} to ${overlappingBooking.endTime} on this date.`
      });
    }

    const bookingStatus =
      user.role === "Student"
        ? "Pending"
        : "Approved";

    const newBooking = new Booking({
      user: userId,
      room: roomId,
      date,
      startTime,
      endTime,
      purpose,
      status: bookingStatus
    });

    await newBooking.save();

    res.status(201).json({
      message:
        bookingStatus === "Pending"
          ? "Booking request submitted successfully!"
          : "Room booked successfully!",

      booking: newBooking
    });

  } catch (error) {
    console.error(
      "Create booking error:",
      error
    );

    res.status(500).json({
      message:
        "Something went wrong while creating the booking."
    });
  }
});


// ==========================================
// GET BOOKINGS FOR A PARTICULAR ROOM + DATE
// ==========================================
router.get(
  "/room/:roomId/:date",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        roomId,
        date
      } = req.params;

      const room = await Room.findById(roomId);

      if (!room) {
        return res.status(404).json({
          message: "Room not found."
        });
      }

      const bookings = await Booking.find({
        room: roomId,

        date: date,

        status: {
          $in: [
            "Pending",
            "Approved"
          ]
        }
      })
        .populate(
          "user",
          "fullName role userId"
        )
        .sort({
          startTime: 1
        });

      res.status(200).json(bookings);

    } catch (error) {
      console.error(
        "Fetch room bookings error:",
        error
      );

      res.status(500).json({
        message:
          "Something went wrong while fetching room availability."
      });
    }
  }
);


// ==========================================
// GET BOOKINGS FOR A USER
// ==========================================
router.get(
  "/user/:userId",
  authMiddleware,
  async (req, res) => {
    try {
            await autoCompleteFinishedBookings();
            await autoCancelExpiredBookings();
      const userId = req.user.userId;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found."
        });
      }

      const bookings =
        await Booking.find({
          user: userId
        })
          .populate(
            "room",
            "roomNumber building capacity facilities"
          )
          .sort({
            date: -1,
            startTime: -1
          });

      res.status(200).json(bookings);

    } catch (error) {
      console.error(
        "Fetch user bookings error:",
        error
      );

      res.status(500).json({
        message:
          "Something went wrong while fetching your bookings."
      });
    }
  }
);


// ==========================================
// GET ALL BOOKINGS - ADMIN
// ==========================================
router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "Admin") {
        return res.status(403).json({
          message: "Access denied. Admin only."
        });
      }
 await autoCompleteFinishedBookings();
 await autoCancelExpiredBookings();

      
      const bookings =
        await Booking.find()
          .populate(
            "user",
            "fullName email userId role"
          )
          .populate(
            "room",
            "roomNumber building capacity facilities"
          )
          .sort({
            date: -1,
            startTime: -1
          });

      res.status(200).json(bookings);

    } catch (error) {
      console.error(
        "Fetch all bookings error:",
        error
      );

      res.status(500).json({
        message:
          "Something went wrong while fetching bookings."
      });
    }
  }
);


// ==========================================
// QR CHECK-IN
// ==========================================
router.post(
  "/check-in",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        qrCodeId
      } = req.body;

      if (!qrCodeId) {
        return res.status(400).json({
          message: "QR code ID is required."
        });
      }


      // ------------------------------------------
      // FIND ROOM USING QR CODE
      // ------------------------------------------
      const room = await Room.findOne({
        qrCodeId: qrCodeId
      });

      if (!room) {
        return res.status(404).json({
          message:
            "Invalid QR code. Room not found."
        });
      }


      // ------------------------------------------
      // GET TODAY'S DATE
      // ------------------------------------------
     const todayString = getIndiaDate();


      // ------------------------------------------
      // GET CURRENT TIME
      // ------------------------------------------
      const currentTime = getIndiaTime();


      // ------------------------------------------
      // FIND APPROVED BOOKING
      // ------------------------------------------
      const booking = await Booking.findOne({

        user: req.user.userId,

        room: room._id,

        date: todayString,

        status: "Approved",

        startTime: {
          $lte: currentTime
        },

        endTime: {
          $gte: currentTime
        },

        checkedIn: false

      });


      if (!booking) {
        return res.status(403).json({
          message:
            "No active approved booking found for this room at the current time."
        });
      }


      // ------------------------------------------
      // CHECK IN BOOKING
      // ------------------------------------------
      booking.checkedIn = true;
      booking.checkedInAt = new Date();

      await booking.save();


      // ------------------------------------------
      // MARK ROOM AS OCCUPIED
      // ------------------------------------------
      if (room.status !== "Maintenance") {
        room.status = "Occupied";
        await room.save();
      }


      // ------------------------------------------
      // RESPONSE
      // ------------------------------------------
      res.status(200).json({

        message:
          `Check-in successful for Room ${room.roomNumber}!`,

        room: {
          id: room._id,
          roomNumber: room.roomNumber,
          building: room.building,
          status: room.status
        },

        booking: {
          id: booking._id,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          purpose: booking.purpose,
          checkedIn: booking.checkedIn,
          checkedInAt: booking.checkedInAt
        }

      });

    } catch (error) {
      console.error(
        "QR check-in error:",
        error
      );

      res.status(500).json({
        message:
          "Something went wrong while checking in."
      });
    }
  }
);

// ==========================================
// CANCEL OWN BOOKING
// ==========================================
router.put(
  "/:id/cancel",
  authMiddleware,
  async (req, res) => {
    try {
      const booking =
        await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({
          message: "Booking not found."
        });
      }
// ------------------------------------------
// PREVENT INVALID STATUS CHANGES
// ------------------------------------------
if (
  booking.status === "Completed" ||
  booking.status === "Cancelled" ||
  booking.status === "Rejected"
) {
  return res.status(400).json({
    message:
      `A ${booking.status.toLowerCase()} booking cannot be changed.`
  });
}
      // ------------------------------------------
      // USER CAN ONLY CANCEL THEIR OWN BOOKING
      // ------------------------------------------
      if (
        booking.user.toString() !==
        req.user.userId.toString()
      ) {
        return res.status(403).json({
          message:
            "You are not allowed to cancel this booking."
        });
      }

      // ------------------------------------------
      // ONLY PENDING / APPROVED CAN BE CANCELLED
      // ------------------------------------------
      if (
        booking.status !== "Pending" &&
        booking.status !== "Approved"
      ) {
        return res.status(400).json({
          message:
            `This booking cannot be cancelled because its status is ${booking.status}.`
        });
      }

      // ------------------------------------------
      // PREVENT CANCELLATION AFTER START TIME
      // ------------------------------------------
      const todayString = getIndiaDate();
      const currentTime = getIndiaTime();

      if (
        booking.date < todayString ||
        (
          booking.date === todayString &&
          currentTime >= booking.startTime
        )
      ) {
        return res.status(400).json({
          message:
            "A booking cannot be cancelled after its start time."
        });
      }

      // ------------------------------------------
      // CANCEL BOOKING
      // ------------------------------------------
      booking.status = "Cancelled";

      await booking.save();

      // ------------------------------------------
      // IF ROOM WAS OCCUPIED, MAKE IT AVAILABLE
      // ------------------------------------------
     await updateRoomStatusAfterBookingChange(booking.room);
      // ------------------------------------------
      // RESPONSE
      // ------------------------------------------
      const updatedBooking =
        await Booking.findById(
          booking._id
        )
          .populate(
            "room",
            "roomNumber building capacity facilities"
          );

      res.status(200).json({
        message:
          "Booking cancelled successfully!",

        booking: updatedBooking
      });

    } catch (error) {
      console.error(
        "Cancel booking error:",
        error
      );

      res.status(500).json({
        message:
          "Something went wrong while cancelling the booking."
      });
    }
  }
);

// ==========================================
// UPDATE BOOKING STATUS - ADMIN
// ==========================================
router.put(
  "/:id/status",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "Admin") {
        return res.status(403).json({
          message: "Access denied. Admin only."
        });
      }

      const {
        status
      } = req.body;

      const allowedStatuses = [
        "Pending",
        "Approved",
        "Rejected",
        "Cancelled",
        "Completed"
      ];

      if (
        !status ||
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          message:
            "Invalid booking status."
        });
      }

      const booking =
        await Booking.findById(
          req.params.id
        );

      if (!booking) {
        return res.status(404).json({
          message:
            "Booking not found."
        });
      }


      // ------------------------------------------
      // APPROVAL CONFLICT CHECK
      // ------------------------------------------
      if (status === "Approved") {

        if (booking.status === "Approved") {
  return res.status(400).json({
    message: "This booking is already approved."
  });
}

if (booking.status !== "Pending") {
  return res.status(400).json({
    message:
      `Only pending bookings can be approved. Current status: ${booking.status}.`
  });
}

        const room =
          await Room.findById(
            booking.room
          );

        if (!room) {
          return res.status(404).json({
            message:
              "Room associated with this booking was not found."
          });
        }

        if (
          room.status === "Maintenance"
        ) {
          return res.status(400).json({
            message:
              "This room is currently under maintenance."
          });
        }

        // ------------------------------------------
// PREVENT APPROVING AN EXPIRED BOOKING
// ------------------------------------------
const todayString = getIndiaDate();
const currentTime = getIndiaTime();

if (
  booking.date < todayString ||
  (
    booking.date === todayString &&
    currentTime >= booking.startTime
  )
) {
  return res.status(400).json({
    message:
      "This booking can no longer be approved because its start time has passed."
  });
}

        const conflictingBooking =
          await Booking.findOne({

            _id: {
              $ne: booking._id
            },

            room: booking.room,

            date: booking.date,

            status: {
              $in: [
                "Pending",
                "Approved"
              ]
            },

            startTime: {
              $lt: booking.endTime
            },

            endTime: {
              $gt: booking.startTime
            }

          });

        if (conflictingBooking) {
          return res.status(409).json({
            message:
              "This room has another booking during the selected time. This request cannot be approved."
          });
        }
      }


      // ------------------------------------------
      // UPDATE BOOKING STATUS
      // ------------------------------------------

      // ------------------------------------------
      // IF BOOKING IS CANCELLED/REJECTED,
      // MAKE SURE ROOM IS NOT LEFT OCCUPIED
      // ------------------------------------------
     if (status === "Rejected") {
  if (booking.status !== "Pending") {
    return res.status(400).json({
      message:
        `Only pending bookings can be rejected. Current status: ${booking.status}.`
    });
  }

  await updateRoomStatusAfterBookingChange(booking.room);
}

if (status === "Cancelled") {
  if (
    booking.status !== "Pending" &&
    booking.status !== "Approved"
  ) {
    return res.status(400).json({
      message:
        `This booking cannot be cancelled because its status is ${booking.status}.`
    });
  }

  await updateRoomStatusAfterBookingChange(booking.room);
}

      // ------------------------------------------
      // COMPLETED BOOKING
      // ------------------------------------------
     if (status === "Completed") {
  if (booking.status !== "Approved") {
    return res.status(400).json({
      message:
        `Only approved bookings can be completed. Current status: ${booking.status}.`
    });
  }

  if (!booking.checkedIn) {
    return res.status(400).json({
      message:
        "A booking must be checked in before it can be completed."
    });
  }

  await updateRoomStatusAfterBookingChange(booking.room);
}

booking.status = status;
await booking.save();
      const updatedBooking =
        await Booking.findById(
          booking._id
        )
          .populate(
            "user",
            "fullName email userId role"
          )
          .populate(
            "room",
            "roomNumber building capacity facilities"
          );


      res.status(200).json({

        message:
          `Booking ${status.toLowerCase()} successfully!`,

        booking: updatedBooking

      });

    } catch (error) {
      console.error(
        "Update booking status error:",
        error
      );

      res.status(500).json({
        message:
          "Something went wrong while updating the booking."
      });
    }
  }
);


module.exports = router;
