import express from "express";
import { verifyToken } from "../Middleware/VerifyToken.js";
import { RiderLocationModel } from "../Models/RiderLocationModel.js";
import { RiderModel } from "../Models/RiderModel.js";
import { OrderTypeModel } from "../Models/OrderModel.js";
import { ShopModel } from "../Models/ShopModel.js";

const router = express.Router();

// =============================================
// 1. UPDATE LOCATION (RIDER ONLY)
// =============================================
router.post("/update", verifyToken("rider"), async (req, res) => {
  try {
    const { latitude, longitude, orderId } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const riderId = req.user.userId;

    // Get rider's shopId
    const riderProfile = await RiderModel.findOne({ userId: riderId });
    const shopId = riderProfile?.shopId || null;

    // 1. Update RiderLocation collection
    const locationUpdate = await RiderLocationModel.findOneAndUpdate(
      { riderId },
      { latitude, longitude, orderId: orderId || null, shopId, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    // 2. Update coordinates on RiderModel
    await RiderModel.findOneAndUpdate({ userId: riderId }, {
      currentLocation: { type: "Point", coordinates: [longitude, latitude] },
    });

    // 3. If orderId is provided, update order's riderLocation
    if (orderId) {
      await OrderTypeModel.findByIdAndUpdate(orderId, {
        $set: { riderLocation: { lat: latitude, lng: longitude } },
      });
    }

    // 4. Broadcast to shop room (shop-scoped tracking)
    const io = req.app.get("io");
    if (io) {
      // Emit to shop room for shop owner tracking
      if (shopId) {
        io.to(`shop:${shopId}`).emit("rider:location-update", {
          riderId,
          latitude,
          longitude,
          orderId: orderId || null,
          shopId,
          updatedAt: locationUpdate.updatedAt,
        });
      }
      // Admin receives all updates
      io.to("admin-room").emit("rider:location-update", {
        riderId,
        latitude,
        longitude,
        orderId: orderId || null,
        shopId,
        updatedAt: locationUpdate.updatedAt,
      });
    }

    res.json({ success: true, message: "Location updated successfully", location: locationUpdate });
  } catch (err) {
    console.error("[LOCATION API] Location update error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 2. DEACTIVATE LOCATION SHARING (RIDER ONLY)
// =============================================
router.post("/deactivate", verifyToken("rider"), async (req, res) => {
  try {
    const riderId = req.user.userId;
    const riderProfile = await RiderModel.findOne({ userId: riderId });
    const shopId = riderProfile?.shopId || null;

    await RiderLocationModel.deleteOne({ riderId });

    await OrderTypeModel.updateMany(
      { assignedRider: riderId, status: { $ne: "Delivered" } },
      { $set: { riderLocation: { lat: 0, lng: 0 } } }
    );

    const io = req.app.get("io");
    if (io) {
      const payload = { riderId, latitude: 0, longitude: 0, orderId: null, updatedAt: new Date() };
      if (shopId) io.to(`shop:${shopId}`).emit("rider:location-update", payload);
      io.to("admin-room").emit("rider:location-update", payload);
    }

    res.json({ success: true, message: "Location tracking deactivated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 3. GET RIDER LOCATION
// Admin: any rider | ShopOwner: own shop riders | Rider: own location
// =============================================
router.get("/:riderId", verifyToken("admin", "shop_owner", "rider"), async (req, res) => {
  try {
    const { riderId } = req.params;

    // Shop Owner: verify rider belongs to own shop
    if (req.user.role === "shop_owner") {
      const shop = await ShopModel.findOne({ ownerId: req.user.userId });
      if (!shop) return res.status(404).json({ message: "Shop not found." });
      const riderProfile = await RiderModel.findOne({ userId: riderId, shopId: shop._id });
      if (!riderProfile) {
        return res.status(403).json({ message: "Access denied: Rider not in your shop." });
      }
    }

    // Rider: can only view own location
    if (req.user.role === "rider" && req.user.userId !== riderId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const location = await RiderLocationModel.findOne({ riderId });
    if (!location) {
      return res.status(404).json({ message: "Location not found for this rider" });
    }

    res.json(location);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 4. GET ALL RIDER LOCATIONS FOR A SHOP
// =============================================
router.get("/shop/all", verifyToken("admin", "shop_owner"), async (req, res) => {
  try {
    let shopId = null;

    if (req.user.role === "shop_owner") {
      const shop = await ShopModel.findOne({ ownerId: req.user.userId });
      if (!shop) return res.status(404).json({ message: "Shop not found." });
      shopId = shop._id;
    } else if (req.query.shopId) {
      shopId = req.query.shopId;
    }

    const query = shopId ? { shopId } : {};
    const locations = await RiderLocationModel.find(query);

    res.json({ success: true, locations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
