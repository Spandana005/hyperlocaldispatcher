import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  shopName: String,

  latitude: Number,

  longitude: Number,

  address: {
    type: String,
    default: "",
  },

});

export const ShopModel =
  mongoose.model("Shop", shopSchema);