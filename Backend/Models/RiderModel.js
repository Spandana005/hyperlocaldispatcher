import mongoose from "mongoose";

const riderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: false,
    },

    vehicleType: {
      type: String,
      enum: ["Bike", "Scooter", "Bicycle", "Car", "Other"],
      default: "Bike",
    },

    earnings: {
      type: Number,
      default: 0,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        // [longitude, latitude]
        type: [Number],
        default: [0, 0],
      },
    },
  },
  {
    timestamps: true,
  }
);

riderSchema.index({ userId: 1 });
riderSchema.index({ shopId: 1 });
riderSchema.index({ currentLocation: "2dsphere" });

export const RiderModel = mongoose.model("Rider", riderSchema);
