import mongoose from "mongoose";

const earningsSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    completedOrders: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    history: [
      {
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "order",
        },
        customerName: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          default: 50,
        },
        distance: {
          type: Number,
          default: 0,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

earningsSchema.index({ riderId: 1 });

export const EarningsModel = mongoose.model("Earnings", earningsSchema);
