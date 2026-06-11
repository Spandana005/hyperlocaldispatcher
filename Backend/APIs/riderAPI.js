import express from "express";
import { verifyToken } from "../Middleware/VerifyToken.js";
import { OrderTypeModel } from "../Models/OrderModel.js";
import { RiderModel } from "../Models/RiderModel.js";
import { EarningsModel } from "../Models/EarningsModel.js";
import { ShopModel } from "../Models/ShopModel.js";
import { RiderLocationModel } from "../Models/RiderLocationModel.js";

const riderrouter = express.Router();

// Helper: Haversine distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// =============================================
// 1. GET AVAILABLE ORDERS (for rider to accept)
// =============================================
riderrouter.get("/available-orders", verifyToken("rider"), async (req, res) => {
  try {
    const riderProfile = await RiderModel.findOne({ userId: req.user.userId });
    if (!riderProfile || riderProfile.approvalStatus !== "Approved") {
      return res.status(403).json({ message: "Rider not approved." });
    }

    const orders = await OrderTypeModel.find({
      shopId: riderProfile.shopId,  // Only orders from rider's shop
      requestedRiders: { $elemMatch: { $eq: req.user.userId } },
      acceptedByRider: false,
      status: "Pending",
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 2. GET MY ORDERS (assigned to this rider)
// =============================================
riderrouter.get("/my-orders", verifyToken("rider"), async (req, res) => {
  try {
    const orders = await OrderTypeModel.find({
      assignedRider: req.user.userId,
      status: { $in: ["Accepted", "OutForDelivery"] },
    }).populate("shopId", "shopName address");

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 3. RESPOND TO ORDER (accept or reject)
// =============================================
riderrouter.put("/respond-order/:orderId", verifyToken("rider"), async (req, res) => {
  try {
    const riderProfile = await RiderModel.findOne({ userId: req.user.userId });
    if (!riderProfile || riderProfile.approvalStatus !== "Approved") {
      return res.status(403).json({ message: "Rider not approved." });
    }

    const { action } = req.body;
    const order = await OrderTypeModel.findById(req.params.orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.acceptedByRider) return res.status(400).json({ message: "Order already accepted" });

    // Security: rider must be in the order's shop
    if (order.shopId.toString() !== riderProfile.shopId.toString()) {
      return res.status(403).json({ message: "Order not from your shop." });
    }

    if (!order.requestedRiders.some(id => id.toString() === req.user.userId)) {
      return res.status(403).json({ message: "Order not assigned to you" });
    }

    if (action === "accept") {
      order.assignedRider = req.user.userId;
      order.acceptedByRider = true;
      order.status = "Accepted";
      order.requestedRiders = [];

      // Mark rider busy
      await RiderModel.findOneAndUpdate({ userId: req.user.userId }, { isAvailable: false });
    } else if (action === "reject") {
      order.requestedRiders = order.requestedRiders.filter(
        id => id.toString() !== req.user.userId
      );
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 4. UPDATE ORDER STATUS (rider only)
// =============================================
riderrouter.put("/update-status/:orderId", verifyToken("rider"), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await OrderTypeModel.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.assignedRider?.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not your order" });
    }

    const prevStatus = order.status;
    order.status = status;

    if (status === "Delivered" && prevStatus !== "Delivered") {
      const riderId = req.user.userId;
      await RiderModel.findOneAndUpdate({ userId: riderId }, { isAvailable: true });

      await RiderLocationModel.deleteOne({ riderId });
      order.riderLocation = { lat: 0, lng: 0 };
      order.deliveredAt = new Date();

      // Earnings calculation
      const shop = await ShopModel.findById(order.shopId);
      let distance = 0;
      let calculatedAmount = 50;
      if (shop && order.deliveryLocation?.lat && order.deliveryLocation.lat !== 0) {
        const rawDist = calculateDistance(shop.latitude, shop.longitude, order.deliveryLocation.lat, order.deliveryLocation.lng);
        distance = Math.round(rawDist * 100) / 100;
        calculatedAmount = Math.max(30, Math.round(distance * 15));
      }

      let earnings = await EarningsModel.findOne({ riderId });
      if (!earnings) {
        earnings = new EarningsModel({ riderId, completedOrders: 1, totalEarnings: calculatedAmount, history: [{ orderId: order._id, customerName: order.customerName, amount: calculatedAmount, distance, date: new Date() }] });
      } else {
        const alreadyLogged = earnings.history.some(item => item.orderId?.toString() === order._id.toString());
        if (!alreadyLogged) {
          earnings.completedOrders += 1;
          earnings.totalEarnings += calculatedAmount;
          earnings.history.push({ orderId: order._id, customerName: order.customerName, amount: calculatedAmount, distance, date: new Date() });
        }
      }
      await earnings.save();
      await RiderModel.findOneAndUpdate({ userId: riderId }, { $inc: { earnings: calculatedAmount } });
    }

    if (status === "OutForDelivery" && order.assignedRider) {
      await RiderModel.findOneAndUpdate({ userId: order.assignedRider }, { isAvailable: false });
    }

    await order.save();

    const io = req.app.get("io");
    if (io) io.to(`shop:${order.shopId}`).emit("order:status-changed", order);

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 5. UPDATE LIVE LOCATION
// =============================================
riderrouter.put("/update-location/:orderId", verifyToken("rider"), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const order = await OrderTypeModel.findById(req.params.orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.assignedRider?.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not your order" });
    }
    if (order.status === "Delivered") {
      return res.status(400).json({ message: "Order already delivered" });
    }

    order.riderLocation = { lat, lng };
    await order.save();

    // Update RiderLocationModel
    await RiderLocationModel.findOneAndUpdate(
      { riderId: req.user.userId },
      { latitude: lat, longitude: lng, orderId: order._id, shopId: order.shopId, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    const io = req.app.get("io");
    if (io) {
      io.to(`shop:${order.shopId}`).emit("rider:location-update", {
        riderId: req.user.userId,
        latitude: lat,
        longitude: lng,
        orderId: order._id,
        shopId: order.shopId,
      });
    }

    res.json({ message: "Live location updated", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 6. JOIN SHOP (by shop code)
// =============================================
riderrouter.post("/join-shop", verifyToken("rider"), async (req, res) => {
  try {
    const { shopCode } = req.body;
    if (!shopCode) {
      return res.status(400).json({ message: "Shop code is required." });
    }

    const shop = await ShopModel.findOne({ shopCode: shopCode.trim().toUpperCase() });
    if (!shop) {
      return res.status(404).json({ message: "Invalid shop code. Please contact your shop owner." });
    }

    // Update or create Rider profile
    const rider = await RiderModel.findOneAndUpdate(
      { userId: req.user.userId },
      { 
        shopId: shop._id, 
        approvalStatus: "Pending",
        isAvailable: true 
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Join request submitted. Awaiting shop owner approval.",
      rider,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default riderrouter;