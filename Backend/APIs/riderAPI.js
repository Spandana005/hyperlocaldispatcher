import express from "express";
import { verifyToken } from "../Middleware/VerifyToken.js";
import { OrderTypeModel } from "../Models/OrderModel.js";
import { UserTypeModel } from "../Models/UserModel.js";
import { EarningsModel } from "../Models/EarningsModel.js";
import { ShopModel } from "../Models/ShopModel.js";
import { RiderLocationModel } from "../Models/RiderLocationModel.js";

const riderrouter = express.Router();

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


// ✅ 1. GET AVAILABLE ORDERS
riderrouter.get(

  "/available-orders",

  verifyToken("rider"),

  async (req, res) => {

    try {

      const rider =
        await UserTypeModel.findById(
          req.user.userId
        );

      if (
        !rider ||
        rider.isActive === false
      ) {

        return res.status(403).json({

          message:
            "Account blocked by admin",

        });

      }


      const orders =
  await OrderTypeModel.find({

    requestedRiders: {

      $elemMatch: {

        $eq: req.user.userId,

      },

    },

    acceptedByRider:
      false,

    status: "pending",

  });


      res.json(orders);

    }

    catch (err) {

      res.status(500).json({

        message: err.message,

      });

    }

});


// ✅ 2. GET ASSIGNED ORDERS
riderrouter.get(

  "/my-orders",

  verifyToken("rider"),

  async (req, res) => {

    try {

      const rider =
        await UserTypeModel.findById(
          req.user.userId
        );

      if (
        !rider ||
        rider.isActive === false
      ) {

        return res.status(403).json({

          message:
            "Account blocked by admin",

        });

      }


      const orders =
        await OrderTypeModel.find({

          assignedRider:
            req.user.userId,

          status: {

            $in: [

              "accepted",

              "dispatched",

            ],

          },

        });


      res.json(orders);

    }

    catch (err) {

      res.status(500).json({

        message: err.message,

      });

    }

});


// ✅ 3. ACCEPT ORDER
riderrouter.put(

  "/respond-order/:orderId",

  verifyToken("rider"),

  async (req, res) => {

    try {

      const rider =
        await UserTypeModel.findById(
          req.user.userId
        );

      if (
        !rider ||
        rider.isActive === false
      ) {

        return res.status(403).json({

          message:
            "Account blocked by admin",

        });

      }


      const { action } =
        req.body;


      const order =
        await OrderTypeModel.findById(
          req.params.orderId
        );

      if (!order) {

        return res.status(404).json({

          message:
            "Order not found",

        });

      }


      // ORDER ALREADY ACCEPTED
      if (
        order.acceptedByRider
      ) {

        return res.status(400).json({

          message:
            "Order already accepted",

        });

      }


      // CHECK RIDER REQUEST
      if (

        !order.requestedRiders.some(
      
          (id) =>
      
            id.toString()
            === req.user.userId
      
        )
      
      ) {

        return res.status(403).json({

          message:
            "Order not assigned to you",

        });

      }


      // ACCEPT
      if (
        action === "accept"
      ) {

        order.assignedRider =
          req.user.userId;

        order.acceptedByRider =
          true;

        order.status =
          "accepted";


        // REMOVE OTHER RIDERS
        order.requestedRiders = [];


        // MAKE RIDER BUSY
        rider.isAvailable = false;

        await rider.save();

      }


      // REJECT
      else if (
        action === "reject"
      ) {

        order.requestedRiders =
          order.requestedRiders.filter(

            (id) =>

              id.toString()
              !== req.user.userId

          );

      }


      else {

        return res.status(400).json({

          message:
            "Invalid action",

        });

      }


      await order.save();

      res.json(order);

    }

    catch (err) {

      res.status(500).json({

        message: err.message,

      });

    }

});


// ✅ 4. UPDATE STATUS
riderrouter.put(
  "/update-status/:orderId",
  verifyToken("rider"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const order = await OrderTypeModel.findById(req.params.orderId);
      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      if (order.assignedRider?.toString() !== req.user.userId) {
        return res.status(403).json({
          message: "Not your order",
        });
      }

      const prevStatus = order.status;
      order.status = status;

      // DELIVERY COMPLETE
      if (status === "delivered" && prevStatus !== "delivered") {
        const riderId = req.user.userId;

        // Mark rider as available
        const rider = await UserTypeModel.findById(riderId);
        if (rider) {
          rider.isAvailable = true;
          await rider.save();
        }

        // Clean up location tracking session for this rider
        console.log(`[RIDER API] Status transitioned to delivered. Clearing RiderLocation record and order riderLocation coordinates for rider: ${riderId}`);
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

        // Update earnings record
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

      // Broadcast change via Socket.io
      const io = req.app.get("io");
      if (io) {
        io.emit("order:status-changed", order);
      }

      res.json(order);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// ✅ 5. UPDATE LIVE LOCATION
// ✅ 5. UPDATE LIVE LOCATION
riderrouter.put(

  "/update-location/:orderId",

  verifyToken("rider"),

  async (req, res) => {

    try {

      // =========================
      // CHECK RIDER
      // =========================
      const rider =
        await UserTypeModel.findById(
          req.user.userId
        );

      if (
        !rider ||
        rider.isActive === false
      ) {

        return res.status(403).json({

          message:
            "Account blocked by admin",

        });

      }


      // =========================
      // GET LOCATION
      // =========================
      const {

        lat,

        lng,

      } = req.body;


      // =========================
      // FIND ORDER
      // =========================
      const order =
        await OrderTypeModel.findById(
          req.params.orderId
        );

      if (!order) {

        return res.status(404).json({

          message:
            "Order not found",

        });

      }


      // =========================
      // SECURITY CHECK
      // =========================
      if (

        order.assignedRider?.toString()

        !== req.user.userId

      ) {

        return res.status(403).json({

          message:
            "Not your order",

        });

      }


      // =========================
      // DELIVERY FINISHED
      // =========================
      if (
        order.status === "delivered"
      ) {

        return res.status(400).json({

          message:
            "Order already delivered",

        });

      }


      // =========================
      // UPDATE ORDER LOCATION
      // =========================
      order.riderLocation = {

        lat,

        lng,

      };


      // =========================
      // UPDATE RIDER LOCATION
      // =========================
      await UserTypeModel.findByIdAndUpdate(

        req.user.userId,

        {

          location: {

            type: "Point",

            coordinates: [

              lng,

              lat,

            ],

          },

        }

      );


      // =========================
      // SAVE ORDER
      // =========================
      await order.save();


      // =========================
      // RESPONSE
      // =========================
      res.json({

        message:
          "Live location updated",

        order,

      });

    }

    catch (err) {

      res.status(500).json({

        message: err.message,

      });

    }

});

export default riderrouter;