import express from "express";
import { verifyToken } from "../Middleware/VerifyToken.js";
import { OrderTypeModel } from "../Models/OrderModel.js";
import { UserTypeModel } from "../Models/UserModel.js";
import { EarningsModel } from "../Models/EarningsModel.js";

const adminrouter = express.Router();


// ✅ 1. CREATE ORDER (ADMIN ONLY)
adminrouter.post(

  "/create-order",

  verifyToken("admin"),

  async (req, res) => {

    try {

      const {

        customerName,
      
        phone,
      
        address,
      
        orderDetails,
      
        latitude,
      
        longitude,
      
      } = req.body; 


      // ✅ FIND NEARBY RIDERS
      const nearbyRiders =
        await UserTypeModel.find({

          role: "rider",

          isAvailable: true,

          isActive: true,
          
        });

        console.log("RIDERS:",nearbyRiders);
      const fullAddress = address 
        ? `${address.building || ""}, ${address.area || ""}, ${address.city || ""}, ${address.state || ""} - ${address.pincode || ""}`
        : "No address details";

      // ✅ CREATE ORDER
      const order = new OrderTypeModel({

        customerName,
      
        phone,
      
        address,
      
        orderDetails,
      
        status: "pending",
      
        // DELIVERY LOCATION
        deliveryLocation: {
      
          lat: latitude,
      
          lng: longitude,
      
        },
      
        deliveryAddress: {
          fullAddress: fullAddress,
          lat: latitude || 0,
          lng: longitude || 0,
        },
      
        // SEND ORDER TO NEARBY RIDERS
        requestedRiders:
      
          nearbyRiders.map(
            (rider) => rider._id
          ),
      
      });

      await order.save();

      res.json({

        order,

        nearbyRiders,

      });

    }

    catch (err) {

      res.status(500).json({

        message: err.message,

      });

    }

});

// ✅ 2. GET ALL ORDERS (ADMIN ONLY)
adminrouter.get(

  "/orders",

  verifyToken("admin"),

  async (req, res) => {

    try {

      const orders =
        await OrderTypeModel.find()

          .populate("assignedRider")

          .populate("requestedRiders");


      res.json(orders);

    }

    catch (err) {

      res.status(500).json({

        message: err.message,

      });

    }

});


// ✅ 3. GET AVAILABLE RIDERS
adminrouter.get(

  "/riders",

  verifyToken("admin"),

  async (req, res) => {

    try {

      // GET ALL RIDERS
      const riders =
        await UserTypeModel.find({

          role: "rider",

        }).lean();


      // ATTACH CURRENT ACTIVE ORDER
      const ridersWithOrders =
        await Promise.all(

          riders.map(

            async (rider) => {

              const currentOrder =
                await OrderTypeModel.findOne({

                  assignedRider:
                    rider._id,

                  status: {

                    $in: [

                      "accepted",

                      "dispatched",

                    ],

                  },

                });

              return {

                ...rider,

                currentOrder,

              };

            }

          )

        );


      res.json(ridersWithOrders);

    }

    catch (err) {

      res.status(500).json({

        message: err.message,

      });

    }

});


// ✅ 4. TRACK ORDER
adminrouter.get(

  "/track/:orderId",

  verifyToken("admin"),

  async (req, res) => {

    try {

      const order =
        await OrderTypeModel.findById(

          req.params.orderId

        )

        .populate("assignedRider");


      if (!order) {

        return res.status(404).json({

          message: "Order not found",

        });

      }


      res.json({
        riderLocation: order.riderLocation,
        deliveryLocation: order.deliveryLocation,
        status: order.status,
        assignedRider: order.assignedRider,
      });

    }

    catch (err) {

      res.status(500).json({

        message: err.message,

      });

    }

});


// ✅ 5. BLOCK RIDER
adminrouter.put(

  "/block-rider/:riderId",

  verifyToken("admin"),

  async (req, res) => {

    try {

      const blockedRider =
        await UserTypeModel.findByIdAndUpdate(

          req.params.riderId,

          {

            isActive: false,
            isBlocked: true,

          },

          {

            new: true,

          }

        );


      if (!blockedRider) {

        return res.status(404).json({

          message: "Rider not found",

        });

      }

      // Check if blocked during active delivery: auto unassign order
      const activeOrder = await OrderTypeModel.findOne({
        assignedRider: req.params.riderId,
        status: { $in: ["accepted", "dispatched", "assigned"] },
      });

      if (activeOrder) {
        activeOrder.assignedRider = null;
        activeOrder.acceptedByRider = false;
        activeOrder.status = "pending";

        // Find available alternative riders
        const availableRiders = await UserTypeModel.find({
          role: "rider",
          isAvailable: true,
          isActive: true,
          isBlocked: { $ne: true }
        });
        activeOrder.requestedRiders = availableRiders.map((r) => r._id);

        await activeOrder.save();

        // Emit socket notifications
        const io = req.app.get("io");
        if (io) {
          io.emit("order:status-changed", activeOrder);
          io.emit("admin:rider-blocked-delivery-unassigned", {
            riderId: req.params.riderId,
            orderId: activeOrder._id,
            message: `Rider ${blockedRider.name} blocked during active delivery. Order ${activeOrder._id} has been unassigned and is back in the pool.`,
          });
        }
      }


      res.status(200).json({

        message:
          "Rider blocked successfully",

        payload:
          blockedRider,

      });

    }

    catch (err) {

      res.status(500).json({

        message: err.message,

      });

    }

});


// ✅ 6. UNBLOCK RIDER
adminrouter.put(

  "/unblock-rider/:riderId",

  verifyToken("admin"),

  async (req, res) => {

    try {

      const unblockedRider =
        await UserTypeModel.findByIdAndUpdate(

          req.params.riderId,

          {

            isActive: true,
            isBlocked: false,

          },

          {

            new: true,

          }

        );


      if (!unblockedRider) {

        return res.status(404).json({

          message: "Rider not found",

        });

      }


      res.status(200).json({

        message:
          "Rider unblocked successfully",

        payload:
          unblockedRider,

      });

    }

    catch (err) {

      res.status(500).json({

        message: err.message,

      });

    }

});

// ✅ GET STATS
adminrouter.get(
  "/stats",
  verifyToken("admin"),
  async (req, res) => {
    try {
      // Total orders counts only active / non-delivered orders
      const totalOrders = await OrderTypeModel.countDocuments({ status: { $ne: "delivered" } });
      const activeRiders = await UserTypeModel.countDocuments({ role: "rider", isActive: true });
      const deliveredOrders = await OrderTypeModel.countDocuments({ status: "delivered" });

      // Recent orders must have a list of all orders which are delivered till date (sorted by delivery date desc)
      const recentOrders = await OrderTypeModel.find({ status: "delivered" })
        .populate("assignedRider", "name")
        .sort({ deliveredAt: -1, updatedAt: -1 });

      const ridersList = await UserTypeModel.find({ role: "rider" }).limit(5);

      res.json({
        totalOrders,
        activeRiders,
        deliveredOrders,
        recentOrders,
        ridersList
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

export default adminrouter;