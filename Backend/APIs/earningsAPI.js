import express from "express";
import { verifyToken } from "../Middleware/VerifyToken.js";
import { EarningsModel } from "../Models/EarningsModel.js";
import { RiderModel } from "../Models/RiderModel.js";
import { ShopModel } from "../Models/ShopModel.js";

const router = express.Router();

// =============================================
// 1. GET RIDER EARNINGS (Admin, ShopOwner, Rider)
// =============================================
router.get("/:riderId", verifyToken("admin", "shop_owner", "rider"), async (req, res) => {
  try {
    const { riderId } = req.params;

    // Rider: can only view own earnings
    if (req.user.role === "rider" && req.user.userId !== riderId) {
      return res.status(403).json({ message: "Access denied. Can only view your own earnings." });
    }

    // Shop Owner: rider must belong to own shop
    if (req.user.role === "shop_owner") {
      const shop = await ShopModel.findOne({ ownerId: req.user.userId });
      if (!shop) return res.status(404).json({ message: "Shop not found." });
      const riderProfile = await RiderModel.findOne({ userId: riderId, shopId: shop._id });
      if (!riderProfile) {
        return res.status(403).json({ message: "Access denied: Rider not in your shop." });
      }
    }

    const earnings = await EarningsModel.findOne({ riderId })
      .populate("riderId", "name email phone")
      .populate({ path: "history.orderId", select: "customerName orderDetails status address createdAt" });

    if (!earnings) {
      return res.json({ riderId, completedOrders: 0, totalEarnings: 0, todayEarnings: 0, history: [] });
    }

    // Calculate today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEarnings = earnings.history
      .filter(record => new Date(record.date) >= today)
      .reduce((sum, record) => sum + record.amount, 0);

    res.json({
      _id: earnings._id,
      riderId: earnings.riderId,
      completedOrders: earnings.completedOrders,
      totalEarnings: earnings.totalEarnings,
      todayEarnings,
      history: [...earnings.history].reverse(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
