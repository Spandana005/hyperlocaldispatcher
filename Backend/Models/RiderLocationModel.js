import mongoose from "mongoose";

const riderLocationSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      default: null,
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

riderLocationSchema.index({ riderId: 1 });
riderLocationSchema.index({ shopId: 1 });

export const RiderLocationModel = mongoose.model("RiderLocation", riderLocationSchema);
