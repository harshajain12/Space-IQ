const express = require("express");
const Building = require("../models/Building");
const Room = require("../models/Room");
const authMiddleware = require("../middleware/authMiddleware");

console.log("Building model:", Building);
console.log("Building.find:", typeof Building.find);

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    message: "Building router is working!"
  });
});

// GET all buildings
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied. Admin only."
      });
    }

    const buildings = await Building.find().sort({
      campus: 1,
      name: 1
    });

    const buildingsWithRoomCount = await Promise.all(
      buildings.map(async (building) => {
        const roomCount = await Room.countDocuments({
          building: building.name
        });

        return {
          ...building.toObject(),
          roomCount
        };
      })
    );

    res.status(200).json(buildingsWithRoomCount);

  } catch (error) {
    console.error("Error fetching buildings:", error);

    res.status(500).json({
      message: "Unable to load buildings."
    });
  }
});

// ADD building
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied. Admin only."
      });
    }

    const { campus, name, location } = req.body;

    if (!campus || !name) {
      return res.status(400).json({
        message: "Campus and building name are required."
      });
    }

    const existingBuilding = await Building.findOne({
      campus: campus.trim(),
      name: name.trim()
    });

    if (existingBuilding) {
      return res.status(400).json({
        message: "This building already exists in the selected campus."
      });
    }

    const newBuilding = new Building({
      campus: campus.trim(),
      name: name.trim(),
      location: location ? location.trim() : ""
    });

    await newBuilding.save();

    res.status(201).json({
      message: "Building added successfully!",
      building: newBuilding
    });

  } catch (error) {
    console.error("Error adding building:", error);

    res.status(500).json({
      message: "Unable to add building."
    });
  }
});


// UPDATE building
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied. Admin only."
      });
    }

    const { campus, name, location } = req.body;

    if (!campus || !name) {
      return res.status(400).json({
        message: "Campus and building name are required."
      });
    }

    const existingBuilding = await Building.findById(req.params.id);

    if (!existingBuilding) {
      return res.status(404).json({
        message: "Building not found."
      });
    }

    const duplicateBuilding = await Building.findOne({
      _id: { $ne: req.params.id },
      campus: campus.trim(),
      name: name.trim()
    });

    if (duplicateBuilding) {
      return res.status(400).json({
        message: "This building already exists in the selected campus."
      });
    }

    const oldBuildingName = existingBuilding.name;

    const updatedBuilding = await Building.findByIdAndUpdate(
      req.params.id,
      {
        campus: campus.trim(),
        name: name.trim(),
        location: location ? location.trim() : ""
      },
      {
        new: true,
        runValidators: true
      }
    );

    // Keep existing rooms connected to the renamed building
    if (oldBuildingName !== name.trim()) {
      await Room.updateMany(
        { building: oldBuildingName },
        {
          $set: {
            building: name.trim()
          }
        }
      );
    }

    res.status(200).json({
      message: "Building updated successfully!",
      building: updatedBuilding
    });

  } catch (error) {
    console.error("Error updating building:", error);

    res.status(500).json({
      message: "Unable to update building."
    });
  }
});


// DELETE building
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied. Admin only."
      });
    }

    const building = await Building.findById(req.params.id);

    if (!building) {
      return res.status(404).json({
        message: "Building not found."
      });
    }

    const roomCount = await Room.countDocuments({
      building: building.name
    });

    if (roomCount > 0) {
      return res.status(400).json({
        message:
          "This building cannot be deleted because rooms are still assigned to it."
      });
    }

    await Building.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Building deleted successfully!"
    });

  } catch (error) {
    console.error("Error deleting building:", error);

    res.status(500).json({
      message: "Unable to delete building."
    });
  }
});


module.exports = router;