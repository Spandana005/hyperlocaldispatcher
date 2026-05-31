import express from "express";
import { verifyToken } from "../Middleware/VerifyToken.js";
import { RiderLocationModel } from "../Models/RiderLocationModel.js";
import { UserTypeModel } from "../Models/UserModel.js";
import { OrderTypeModel } from "../Models/OrderModel.js";

const router = express.Router();

// 1. UPDATE LOCATION (RIDER ONLY)
router.post("/update", verifyToken("rider"), async (req, res) => {
  try {
    const { latitude, longitude, orderId } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const riderId = req.user.userId;
    console.log(`[LOCATION API] Update request from rider ${riderId} (Order: ${orderId || "NONE"}): Lat=${latitude}, Lng=${longitude}`);

    // 1. Update in RiderLocation collection
    const locationUpdate = await RiderLocationModel.findOneAndUpdate(
      { riderId },
      { latitude, longitude, orderId: orderId || null, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    // 2. Update coordinates on the User model
    await UserTypeModel.findByIdAndUpdate(riderId, {
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    });

    // 3. If orderId is provided, update the order document's riderLocation
    if (orderId) {
      await OrderTypeModel.findByIdAndUpdate(orderId, {
        $set: {
          riderLocation: {
            lat: latitude,
            lng: longitude
          }
        }
      });
    }

    // 4. Broadcast real-time location update to connected Admin clients
    const io = req.app.get("io");
    if (io) {
      io.emit("rider:location-update", {
        riderId,
        latitude,
        longitude,
        orderId: orderId || null,
        updatedAt: locationUpdate.updatedAt,
      });
    }

    res.json({
      success: true,
      message: "Location updated successfully",
      location: locationUpdate,
    });
  } catch (err) {
    console.error("[LOCATION API] Location update error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// 2. DEACTIVATE LOCATION SHARING (RIDER ONLY)
router.post("/deactivate", verifyToken("rider"), async (req, res) => {
  try {
    const riderId = req.user.userId;
    console.log(`[LOCATION API] Deactivating location tracking for rider ${riderId}`);

    // Delete active location tracking session document
    await RiderLocationModel.deleteOne({ riderId });

    // Reset riderLocation coordinates for any non-delivered orders assigned to this rider
    await OrderTypeModel.updateMany(
      { assignedRider: riderId, status: { $ne: "delivered" } },
      { $set: { riderLocation: { lat: 0, lng: 0 } } }
    );

    // Broadcast deactivation so maps remove the marker instantly
    const io = req.app.get("io");
    if (io) {
      io.emit("rider:location-update", {
        riderId,
        latitude: 0,
        longitude: 0,
        orderId: null,
        updatedAt: new Date(),
      });
    }

    res.json({
      success: true,
      message: "Location tracking deactivated successfully",
    });
  } catch (err) {
    console.error("[LOCATION API] Location deactivation error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// 3. GET RIDER LOCATION
router.get("/:riderId", verifyToken("admin", "rider"), async (req, res) => {
  try {
    const { riderId } = req.params;
    const location = await RiderLocationModel.findOne({ riderId });

    if (!location) {
      return res.status(404).json({ message: "Location not found for this rider" });
    }

    res.json(location);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
