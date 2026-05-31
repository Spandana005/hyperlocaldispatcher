import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(

  {

    // =========================
    // CUSTOMER DETAILS
    // =========================
    customerName: {

      type: String,

      required: true,

    },


    phone: {

      type: String,

      required: true,

    },


    address: {

      pincode: {
    
        type: String,
    
        required: true,
    
      },
    
      city: {
    
        type: String,
    
        required: true,
    
      },
    
      state: {
    
        type: String,
    
        required: true,
    
      },
    
      area: {
    
        type: String,
    
        required: true,
    
      },
    
      building: {
    
        type: String,
    
        required: true,
    
      },
    
      landmark: {
    
        type: String,
    
        default: "",
    
      },
    
      addressType: {
    
        type: String,
    
        default: "Home",
    
      },
    
    },


    orderDetails: {

      type: String,

      required: true,

    },


    // =========================
    // ORDER STATUS
    // =========================
    status: {

      type: String,

      enum: [

        "pending",

        "assigned",

        "accepted",

        "rejected",

        "dispatched",

        "delivered",

      ],

      default: "pending",

    },


    // =========================
    // ASSIGNED RIDER
    // =========================
    assignedRider: {

      type:
        mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,

    },


    // =========================
    // REQUESTED RIDERS
    // =========================
    requestedRiders: [

      {

        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

      },

    ],


    // =========================
    // ACCEPTED BY RIDER
    // =========================
    acceptedByRider: {

      type: Boolean,

      default: false,

    },


    // =========================
    // RIDER LIVE LOCATION
    // =========================
    riderLocation: {

      lat: {

        type: Number,

        default: 0,

      },

      lng: {

        type: Number,

        default: 0,

      },

    },


    // =========================
    // DELIVERY LOCATION
    // =========================
    deliveryLocation: {

      lat: {

        type: Number,

        default: 0,

      },

      lng: {

        type: Number,

        default: 0,

      },

    },


    deliveryAddress: {

      fullAddress: {

        type: String,

        default: "",

      },

      lat: {

        type: Number,

        default: 0,

      },

      lng: {

        type: Number,

        default: 0,

      },

    },


    deliveredAt: {

      type: Date,

      default: null,

    },

  },

  {

    timestamps: true,

  }

);


export const OrderTypeModel = mongoose.model(

  "order",

  orderSchema

);