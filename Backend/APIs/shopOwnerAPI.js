import express from "express";
import { verifyToken } from "../Middleware/VerifyToken.js";
import { ShopModel, generateShopCode } from "../Models/ShopModel.js";
import { RiderModel } from "../Models/RiderModel.js";
import { OrderTypeModel } from "../Models/OrderModel.js";
import { UserTypeModel } from "../Models/UserModel.js";

const shopOwnerRouter = express.Router();

// Helper to build full address string
function buildFullAddress(address) {
  if (!address) return "No address details";
  return `${address.building || ""}, ${address.area || ""}, ${address.city || ""}, ${address.state || ""} - ${address.pincode || ""}`;
}

// =============================================
// 1. CREATE SHOP (first login / onboarding)
// =============================================
shopOwnerRouter.post("/shop", verifyToken("shop_owner"), async (req, res) => {
  try {
    const { shopName, address, phone } = req.body;

    if (!shopName) {
      return res.status(400).json({ message: "Shop name is required." });
    }

    // Check if owner already has a shop
    const existingShop = await ShopModel.findOne({ ownerId: req.user.userId });
    if (existingShop) {
      return res.status(400).json({
        message: "You already have a shop.",
        shop: existingShop,
      });
    }

    // Generate unique shop code
    let shopCode;
    let isUnique = false;
    while (!isUnique) {
      shopCode = generateShopCode();
      const exists = await ShopModel.findOne({ shopCode });
      if (!exists) isUnique = true;
    }

    const shop = await ShopModel.create({
      ownerId: req.user.userId,
      shopName,
      shopCode,
      address: address || "",
      phone: phone || "",
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Shop created successfully!",
      shop,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 2. GET OWN SHOP DETAILS
// =============================================
shopOwnerRouter.get("/shop", verifyToken("shop_owner"), async (req, res) => {
  try {
    const shop = await ShopModel.findOne({ ownerId: req.user.userId });
    if (!shop) {
      return res.status(404).json({ message: "No shop found. Please create your shop first." });
    }
    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 3. UPDATE SHOP
// =============================================
shopOwnerRouter.put("/shop", verifyToken("shop_owner"), async (req, res) => {
  try {
    const { shopName, address, phone, latitude, longitude } = req.body;
    const shop = await ShopModel.findOne({ ownerId: req.user.userId });
    if (!shop) {
      return res.status(404).json({ message: "Shop not found." });
    }

    if (shopName) shop.shopName = shopName;
    if (address !== undefined) shop.address = address;
    if (phone !== undefined) shop.phone = phone;
    if (latitude !== undefined) shop.latitude = latitude;
    if (longitude !== undefined) shop.longitude = longitude;

    await shop.save();
    res.json({ success: true, message: "Shop updated successfully.", shop });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 4. GET SHOP CODE (dedicated page)
// =============================================
shopOwnerRouter.get("/shop-code", verifyToken("shop_owner"), async (req, res) => {
  try {
    const shop = await ShopModel.findOne({ ownerId: req.user.userId }).select("shopName shopCode");
    if (!shop) {
      return res.status(404).json({ message: "Shop not found." });
    }
    res.json({ success: true, shopName: shop.shopName, shopCode: shop.shopCode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 5. GET RIDERS IN OWN SHOP
// =============================================
shopOwnerRouter.get("/riders", verifyToken("shop_owner"), async (req, res) => {
  try {
    const shop = await ShopModel.findOne({ ownerId: req.user.userId });
    if (!shop) {
      return res.status(404).json({ message: "Shop not found." });
    }

    const riders = await RiderModel.find({ shopId: shop._id, approvalStatus: "Approved" })
      .populate("userId", "name email phone isBlocked isActive")
      .sort({ createdAt: -1 });

    res.json({ success: true, riders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 6. GET PENDING RIDER REQUESTS
// =============================================
shopOwnerRouter.get("/rider-requests", verifyToken("shop_owner"), async (req, res) => {
  try {
    const shop = await ShopModel.findOne({ ownerId: req.user.userId });
    if (!shop) {
      return res.status(404).json({ message: "Shop not found." });
    }

    const { status = "Pending" } = req.query;

    const riders = await RiderModel.find({ shopId: shop._id, approvalStatus: status })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, riders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 7. APPROVE RIDER
// =============================================
shopOwnerRouter.patch("/rider/:riderId/approve", verifyToken("shop_owner"), async (req, res) => {
  try {
    const shop = await ShopModel.findOne({ ownerId: req.user.userId });
    if (!shop) return res.status(404).json({ message: "Shop not found." });

    const rider = await RiderModel.findById(req.params.riderId);
    if (!rider) return res.status(404).json({ message: "Rider not found." });

    // Security: Only approve riders belonging to own shop
    if (rider.shopId.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: "Access denied: Rider not in your shop." });
    }

    rider.approvalStatus = "Approved";
    await rider.save();

    res.json({
      success: true,
      message: "Rider approved successfully.",
      rider,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 8. REJECT RIDER
// =============================================
shopOwnerRouter.patch("/rider/:riderId/reject", verifyToken("shop_owner"), async (req, res) => {
  try {
    const shop = await ShopModel.findOne({ ownerId: req.user.userId });
    if (!shop) return res.status(404).json({ message: "Shop not found." });

    const rider = await RiderModel.findById(req.params.riderId);
    if (!rider) return res.status(404).json({ message: "Rider not found." });

    if (rider.shopId.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: "Access denied: Rider not in your shop." });
    }

    rider.approvalStatus = "Rejected";
    await rider.save();

    res.json({
      success: true,
      message: "Rider rejected.",
      rider,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 9. GET ORDERS FOR OWN SHOP
// =============================================
shopOwnerRouter.get("/orders", verifyToken("shop_owner"), async (req, res) => {
  try {
    const shop = await ShopModel.findOne({ ownerId: req.user.userId });
    if (!shop) return res.status(404).json({ message: "Shop not found." });

    const { status, search } = req.query;
    let query = { shopId: shop._id };

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { orderDetails: { $regex: search, $options: "i" } },
        { "address.area": { $regex: search, $options: "i" } },
      ];
    }

    const orders = await OrderTypeModel.find(query)
      .populate("assignedRider", "name email phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 10. CREATE ORDER (Shop Owner)
// =============================================
shopOwnerRouter.post("/orders", verifyToken("shop_owner"), async (req, res) => {
  try {
    const shop = await ShopModel.findOne({ ownerId: req.user.userId });
    if (!shop) return res.status(404).json({ message: "Shop not found. Please create your shop first." });

    const { customerName, phone, address, orderDetails, latitude, longitude } = req.body;

    if (!customerName || !phone || !orderDetails) {
      return res.status(400).json({ message: "customerName, phone, and orderDetails are required." });
    }
    if (!address || !address.area || !address.building) {
      return res.status(400).json({ message: "Address area and building are required." });
    }

    // Find available approved riders in the same shop
    const availableRiders = await RiderModel.find({
      shopId: shop._id,
      approvalStatus: "Approved",
      isAvailable: true,
    });

    const fullAddress = buildFullAddress(address);

    const order = await OrderTypeModel.create({
      shopId: shop._id,
      customerName,
      phone,
      address,
      orderDetails,
      status: "Pending",
      deliveryLocation: { lat: latitude || 0, lng: longitude || 0 },
      deliveryAddress: { fullAddress, lat: latitude || 0, lng: longitude || 0 },
      requestedRiders: availableRiders.map((r) => r.userId),
    });

    // Broadcast new order
    const io = req.app.get("io");
    if (io) {
      io.to(`shop:${shop._id}`).emit("order:new-assigned", order);
    }

    res.status(201).json({ success: true, order, availableRiders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 11. ASSIGN RIDER TO ORDER
// =============================================
shopOwnerRouter.put("/orders/assign/:orderId", verifyToken("shop_owner"), async (req, res) => {
  try {
    const shop = await ShopModel.findOne({ ownerId: req.user.userId });
    if (!shop) return res.status(404).json({ message: "Shop not found." });

    const order = await OrderTypeModel.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });

    // Shop isolation check
    if (order.shopId.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: "Access denied: Order not in your shop." });
    }

    const { riderId } = req.body;

    // Validate rider
    const riderProfile = await RiderModel.findOne({ userId: riderId, shopId: shop._id });
    if (!riderProfile) {
      return res.status(403).json({ message: "Rider does not belong to your shop." });
    }
    if (riderProfile.approvalStatus !== "Approved") {
      return res.status(403).json({ message: "Rider is not approved yet." });
    }

    order.assignedRider = riderId;
    order.status = "Assigned";
    if (!order.requestedRiders.map(id => id.toString()).includes(riderId)) {
      order.requestedRiders.push(riderId);
    }
    await order.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`shop:${shop._id}`).emit("order:new-assigned", order);
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 12. DELETE / CANCEL ORDER
// =============================================
shopOwnerRouter.delete("/orders/:orderId", verifyToken("shop_owner"), async (req, res) => {
  try {
    const shop = await ShopModel.findOne({ ownerId: req.user.userId });
    if (!shop) return res.status(404).json({ message: "Shop not found." });

    const order = await OrderTypeModel.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });

    if (order.shopId.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: "Access denied: Order not in your shop." });
    }

    // If rider is assigned, free them up
    if (order.assignedRider && ["Accepted", "OutForDelivery"].includes(order.status)) {
      await RiderModel.findOneAndUpdate(
        { userId: order.assignedRider },
        { isAvailable: true }
      );
    }

    await OrderTypeModel.findByIdAndDelete(req.params.orderId);

    const io = req.app.get("io");
    if (io) {
      io.to(`shop:${shop._id}`).emit("order:deleted", { orderId: req.params.orderId });
    }

    res.json({ success: true, message: "Order cancelled successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 13. SHOP OWNER DASHBOARD STATS
// =============================================
shopOwnerRouter.get("/stats", verifyToken("shop_owner"), async (req, res) => {
  try {
    const shop = await ShopModel.findOne({ ownerId: req.user.userId });
    if (!shop) return res.status(404).json({ message: "Shop not found." });

    const [
      totalOrders,
      deliveredOrders,
      activeOrders,
      totalRiders,
      pendingRiders,
    ] = await Promise.all([
      OrderTypeModel.countDocuments({ shopId: shop._id }),
      OrderTypeModel.countDocuments({ shopId: shop._id, status: "Delivered" }),
      OrderTypeModel.countDocuments({ shopId: shop._id, status: { $nin: ["Delivered", "Cancelled"] } }),
      RiderModel.countDocuments({ shopId: shop._id, approvalStatus: "Approved" }),
      RiderModel.countDocuments({ shopId: shop._id, approvalStatus: "Pending" }),
    ]);

    const recentOrders = await OrderTypeModel.find({ shopId: shop._id })
      .populate("assignedRider", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    const ridersList = await RiderModel.find({ shopId: shop._id, approvalStatus: "Approved" })
      .populate("userId", "name phone isBlocked")
      .limit(5);

    res.json({
      success: true,
      shop,
      totalOrders,
      deliveredOrders,
      activeOrders,
      totalRiders,
      pendingRiders,
      recentOrders,
      ridersList,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default shopOwnerRouter;
