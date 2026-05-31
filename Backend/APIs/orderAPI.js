import express from "express";
import { verifyToken } from "../Middleware/VerifyToken.js";
import { OrderTypeModel } from "../Models/OrderModel.js";
import { UserTypeModel } from "../Models/UserModel.js";
import { EarningsModel } from "../Models/EarningsModel.js";
import { ShopModel } from "../Models/ShopModel.js";
import { RiderLocationModel } from "../Models/RiderLocationModel.js";

const router = express.Router();

// Helper to calculate Haversine distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

// 1. CREATE ORDER (ADMIN ONLY)
router.post("/", verifyToken("admin"), async (req, res) => {
  try {
    const {
      customerName,
      phone,
      address,
      orderDetails,
      latitude,
      longitude,
    } = req.body;

    // Find nearby active and available riders
    const nearbyRiders = await UserTypeModel.find({
      role: "rider",
      isAvailable: true,
      isActive: true,
    });

    const fullAddress = address 
      ? `${address.building || ""}, ${address.area || ""}, ${address.city || ""}, ${address.state || ""} - ${address.pincode || ""}`
      : "No address details";

    const order = new OrderTypeModel({
      customerName,
      phone,
      address,
      orderDetails,
      status: "pending",
      deliveryLocation: {
        lat: latitude || 0,
        lng: longitude || 0,
      },
      deliveryAddress: {
        fullAddress: fullAddress,
        lat: latitude || 0,
        lng: longitude || 0,
      },
      requestedRiders: nearbyRiders.map((rider) => rider._id),
    });

    await order.save();

    // Broadcast new order socket event if socket.io is configured
    const io = req.app.get("io");
    if (io) {
      io.emit("order:new-assigned", order);
    }

    res.status(201).json({
      success: true,
      order,
      nearbyRiders,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. GET ALL ORDERS (ADMIN & RIDER)
router.get("/", verifyToken("admin", "rider"), async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    // Filter by status if specified
    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by rider if rider role
    if (req.user.role === "rider") {
      query.$or = [
        { assignedRider: req.user.userId },
        { requestedRiders: req.user.userId }
      ];
    }

    // Search by customer name, order details or area
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { orderDetails: { $regex: search, $options: "i" } },
        { "address.area": { $regex: search, $options: "i" } },
      ];
    }

    const orders = await OrderTypeModel.find(query)
      .populate("assignedRider", "name email phone")
      .populate("requestedRiders", "name email phone")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. EDIT ORDER (ADMIN ONLY)
router.put("/:id", verifyToken("admin"), async (req, res) => {
  try {
    const { customerName, phone, address, orderDetails, latitude, longitude } = req.body;
    
    const order = await OrderTypeModel.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (customerName) order.customerName = customerName;
    if (phone) order.phone = phone;
    if (address) order.address = address;
    if (orderDetails) order.orderDetails = orderDetails;
    if (latitude !== undefined) {
      order.deliveryLocation.lat = latitude;
      if (order.deliveryAddress) order.deliveryAddress.lat = latitude;
    }
    if (longitude !== undefined) {
      order.deliveryLocation.lng = longitude;
      if (order.deliveryAddress) order.deliveryAddress.lng = longitude;
    }
    if (address) {
      const fullAddress = `${address.building || ""}, ${address.area || ""}, ${address.city || ""}, ${address.state || ""} - ${address.pincode || ""}`;
      if (order.deliveryAddress) order.deliveryAddress.fullAddress = fullAddress;
    }

    await order.save();

    // Broadcast update
    const io = req.app.get("io");
    if (io) {
      io.emit("order:status-changed", order);
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. DELETE ORDER (ADMIN ONLY)
router.delete("/:id", verifyToken("admin"), async (req, res) => {
  try {
    const order = await OrderTypeModel.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If order has an assigned rider who is busy, set them back to available
    if (order.assignedRider && (order.status === "accepted" || order.status === "dispatched")) {
      await UserTypeModel.findByIdAndUpdate(order.assignedRider, { isAvailable: true });
    }

    await OrderTypeModel.findByIdAndDelete(req.params.id);

    // Broadcast deletion
    const io = req.app.get("io");
    if (io) {
      io.emit("order:deleted", { orderId: req.params.id });
    }

    res.json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. ASSIGN RIDER (ADMIN ONLY)
router.put("/assign/:id", verifyToken("admin"), async (req, res) => {
  try {
    const { riderId } = req.body;
    const order = await OrderTypeModel.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const rider = await UserTypeModel.findById(riderId);
    if (!rider || rider.role !== "rider") {
      return res.status(400).json({ message: "Invalid rider ID" });
    }

    if (!rider.isActive) {
      return res.status(400).json({ message: "Rider is blocked" });
    }

    // Set order status to assigned
    order.assignedRider = riderId;
    order.status = "assigned";
    // Place this rider in requested if we need to let them accept, or auto-accept
    // For local dispatch stores, we can auto-accept or put it in requested.
    // Let's add them to requestedRiders so the rider sees it under Nearby Order Requests
    if (!order.requestedRiders.includes(riderId)) {
      order.requestedRiders.push(riderId);
    }
    
    await order.save();

    // Broadcast socket event
    const io = req.app.get("io");
    if (io) {
      io.emit("order:new-assigned", order);
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. UPDATE ORDER STATUS (ADMIN & RIDER)
router.put("/status/:id", verifyToken("admin", "rider"), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await OrderTypeModel.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Security check: Riders can only update their own assigned orders
    if (req.user.role === "rider" && order.assignedRider?.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Access denied. Order not assigned to you." });
    }

    const prevStatus = order.status;
    order.status = status;

    // BUSINESS LOGIC: When status becomes delivered
    if (status === "delivered" && prevStatus !== "delivered") {
      const riderId = order.assignedRider || req.user.userId;

      // Mark rider available
      await UserTypeModel.findByIdAndUpdate(riderId, { isAvailable: true });

      // Clean up location tracking session for this rider
      console.log(`[ORDER API] Status transitioned to delivered. Clearing RiderLocation record and order riderLocation coordinates for rider: ${riderId}`);
      await RiderLocationModel.deleteOne({ riderId });
      order.riderLocation = { lat: 0, lng: 0 };

      // Set delivery timestamp
      order.deliveredAt = new Date();

      // Calculate dynamic distance-based earnings
      const shop = await ShopModel.findOne();
      let distance = 0;
      let calculatedAmount = 50; // fallback

      if (shop && order.deliveryLocation && typeof order.deliveryLocation.lat === "number" && typeof order.deliveryLocation.lng === "number" && order.deliveryLocation.lat !== 0) {
        const rawDistance = calculateDistance(
          shop.latitude,
          shop.longitude,
          order.deliveryLocation.lat,
          order.deliveryLocation.lng
        );
        distance = Math.round(rawDistance * 100) / 100; // round to 2 decimals
        calculatedAmount = Math.max(30, Math.round(distance * 15)); // ₹15 per km, minimum ₹30
      }

      // Update earnings
      let earnings = await EarningsModel.findOne({ riderId });
      if (!earnings) {
        earnings = new EarningsModel({
          riderId,
          completedOrders: 1,
          totalEarnings: calculatedAmount,
          history: [
            {
              orderId: order._id,
              customerName: order.customerName,
              amount: calculatedAmount,
              distance: distance,
              date: new Date(),
            },
          ],
        });
      } else {
        // Prevent duplicate earnings logs
        const alreadyLogged = earnings.history.some(
          (item) => item.orderId?.toString() === order._id.toString()
        );
        if (!alreadyLogged) {
          earnings.completedOrders += 1;
          earnings.totalEarnings += calculatedAmount;
          earnings.history.push({
            orderId: order._id,
            customerName: order.customerName,
            amount: calculatedAmount,
            distance: distance,
            date: new Date(),
          });
        }
      }
      await earnings.save();
    } else if (status === "dispatched" && order.assignedRider) {
      // Mark rider unavailable when dispatched/delivery starts
      await UserTypeModel.findByIdAndUpdate(order.assignedRider, { isAvailable: false });
    }

    await order.save();

    // Broadcast change
    const io = req.app.get("io");
    if (io) {
      io.emit("order:status-changed", order);
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
