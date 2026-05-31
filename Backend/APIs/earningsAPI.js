import express from "express";
import { verifyToken } from "../Middleware/VerifyToken.js";
import { EarningsModel } from "../Models/EarningsModel.js";

const router = express.Router();

// 1. GET RIDER EARNINGS (ADMIN & RIDER)
router.get("/:riderId", verifyToken("admin", "rider"), async (req, res) => {
  try {
    const { riderId } = req.params;

    // Security Check: Riders can only check their own earnings
    if (req.user.role === "rider" && req.user.userId !== riderId) {
      return res.status(403).json({ message: "Access denied. Can only view your own earnings." });
    }

    const earnings = await EarningsModel.findOne({ riderId })
      .populate("riderId", "name email phone")
      .populate({
        path: "history.orderId",
        select: "customerName orderDetails status address createdAt",
      });

    if (!earnings) {
      // Return fresh empty details if no deliveries completed yet
      return res.json({
        riderId,
        completedOrders: 0,
        totalEarnings: 0,
        todayEarnings: 0,
        history: [],
      });
    }

    // Calculate Today's Earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEarnings = earnings.history
      .filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= today;
      })
      .reduce((sum, record) => sum + record.amount, 0);

    res.json({
      _id: earnings._id,
      riderId: earnings.riderId,
      completedOrders: earnings.completedOrders,
      totalEarnings: earnings.totalEarnings,
      todayEarnings,
      history: earnings.history.reverse(), // latest earnings first
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
