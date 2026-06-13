import express from "express";
import { verifyToken } from "../Middleware/VerifyToken.js";
import { OrderTypeModel } from "../Models/OrderModel.js";
import { UserTypeModel } from "../Models/UserModel.js";
import { ShopModel } from "../Models/ShopModel.js";
import { RiderModel } from "../Models/RiderModel.js";
import { EarningsModel } from "../Models/EarningsModel.js";

const adminrouter = express.Router();

// =============================================
// 1. GET ALL USERS
// =============================================
adminrouter.get("/users", verifyToken("admin"), async (req, res) => {
  try {
    const users = await UserTypeModel.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 2. GET ALL SHOPS
// =============================================
adminrouter.get("/shops", verifyToken("admin"), async (req, res) => {
  try {
    const shops = await ShopModel.find()
      .populate("ownerId", "name email phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, shops });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 3. GET ALL RIDERS (with approval status)
// =============================================
adminrouter.get("/riders", verifyToken("admin"), async (req, res) => {
  try {
    const riders = await RiderModel.find()
      .populate("userId", "name email phone isBlocked isActive")
      .populate("shopId", "shopName shopCode")
      .sort({ createdAt: -1 });

    res.json({ success: true, riders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 4. GET ALL ORDERS
// =============================================
adminrouter.get("/orders", verifyToken("admin"), async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const orders = await OrderTypeModel.find(query)
      .populate("shopId", "shopName shopCode")
      .populate("assignedRider", "name email phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 5. BLOCK USER
// =============================================
adminrouter.patch("/users/:id/block", verifyToken("admin"), async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(403).json({ message: "Admins cannot block themselves." });
    }

    const user = await UserTypeModel.findByIdAndUpdate(
      req.params.id,
      { isActive: false, isBlocked: true },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If rider was in active delivery, unassign
    if (user.role === "rider") {
      const activeOrder = await OrderTypeModel.findOne({
        assignedRider: req.params.id,
        status: { $in: ["Assigned", "Accepted", "OutForDelivery"] },//"ASSIGNED", "PICKED_UP"
      });

      if (activeOrder) {
        activeOrder.assignedRider = null;
        activeOrder.acceptedByRider = false;
        activeOrder.status = "OPEN";

        const availableRiders = await RiderModel.find({
          shopId: activeOrder.shopId,
          approvalStatus: "Approved",
          isAvailable: true,
        });
        activeOrder.requestedRiders = availableRiders.map((r) => r.userId);
        await activeOrder.save();

        const io = req.app.get("io");
        if (io) {
          io.emit("order:status-changed", activeOrder);
          io.emit("admin:rider-blocked-delivery-unassigned", {
            riderId: req.params.id,
            orderId: activeOrder._id,
          });
        }
      }
    }

    res.status(200).json({ success: true, message: "User blocked successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 6. UNBLOCK USER
// =============================================
adminrouter.patch("/users/:id/unblock", verifyToken("admin"), async (req, res) => {
  try {
    const user = await UserTypeModel.findByIdAndUpdate(
      req.params.id,
      { isActive: true, isBlocked: false },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User unblocked successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 7. PLATFORM ANALYTICS / STATS
// =============================================
adminrouter.get("/stats", verifyToken("admin"), async (req, res) => {
  try {
    const [
      totalUsers,
      totalShops,
      totalRiders,
      approvedRiders,
      pendingRiders,
      totalOrders,
      deliveredOrders,
      activeOrders,
    ] = await Promise.all([
      UserTypeModel.countDocuments(),
      ShopModel.countDocuments(),
      RiderModel.countDocuments(),
      RiderModel.countDocuments({ approvalStatus: "Approved" }),
      RiderModel.countDocuments({ approvalStatus: "Pending" }),
      OrderTypeModel.countDocuments(),
      OrderTypeModel.countDocuments({ status: "DELIVERED" }),
      OrderTypeModel.countDocuments({ status: { $nin: ["DELIVERED", "CANCELLED"] } }),
    ]);

    const recentOrders = await OrderTypeModel.find({ status: "DELIVERED" })
      .populate("assignedRider", "name")
      .populate("shopId", "shopName")
      .sort({ deliveredAt: -1, updatedAt: -1 })
      .limit(10);

    const ridersList = await RiderModel.find({ approvalStatus: "Approved" })
      .populate("userId", "name phone isBlocked isActive")
      .populate("shopId", "shopName")
      .limit(10);

    const shopsList = await ShopModel.find()
      .populate("ownerId", "name email")
      .limit(5);

    res.json({
      success: true,
      totalUsers,
      totalShops,
      totalRiders,
      approvedRiders,
      pendingRiders,
      totalOrders,
      deliveredOrders,
      activeOrders,
      recentOrders,
      ridersList,
      shopsList,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 8. TRACK ORDER (ADMIN)
// =============================================
adminrouter.get("/track/:orderId", verifyToken("admin"), async (req, res) => {
  try {
    const order = await OrderTypeModel.findById(req.params.orderId)
      .populate("assignedRider", "name phone")
      .populate("shopId", "shopName");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      riderLocation: order.riderLocation,
      deliveryLocation: order.deliveryLocation,
      status: order.status,
      assignedRider: order.assignedRider,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// LEGACY: block-rider / unblock-rider (kept for compatibility)
// =============================================
adminrouter.put("/block-rider/:riderId", verifyToken("admin"), async (req, res) => {
  try {
    const user = await UserTypeModel.findByIdAndUpdate(
      req.params.riderId,
      { isActive: false, isBlocked: true },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "Rider not found" });

    res.status(200).json({ message: "Rider blocked successfully", payload: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

adminrouter.put("/unblock-rider/:riderId", verifyToken("admin"), async (req, res) => {
  try {
    const user = await UserTypeModel.findByIdAndUpdate(
      req.params.riderId,
      { isActive: true, isBlocked: false },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "Rider not found" });

    res.status(200).json({ message: "Rider unblocked successfully", payload: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default adminrouter;