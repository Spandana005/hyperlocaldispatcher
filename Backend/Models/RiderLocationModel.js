import mongoose from "mongoose";

const riderLocationSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize query path
riderLocationSchema.index({ riderId: 1 });

export const RiderLocationModel = mongoose.model("RiderLocation", riderLocationSchema);
