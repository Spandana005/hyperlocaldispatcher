import express from "express";
import { ShopModel } from "../Models/ShopModel.js";
import { verifyToken } from "../Middleware/VerifyToken.js";

const shoprouter = express.Router();

// SAVE SHOP LOCATION (Admin or ShopOwner)
shoprouter.post("/location", verifyToken("admin", "shop_owner"), async (req, res) => {
  try {
    const { shopName, latitude, longitude, address } = req.body;

    let shop;
    if (req.user.role === "shop_owner") {
      // ShopOwner: update their own shop
      shop = await ShopModel.findOne({ ownerId: req.user.userId });
      if (shop) {
        if (shopName) shop.shopName = shopName;
        if (latitude !== undefined) shop.latitude = latitude;
        if (longitude !== undefined) shop.longitude = longitude;
        if (address) shop.address = address;
        await shop.save();
      }
    } else {
      // Admin: legacy single-shop upsert
      shop = await ShopModel.findOne();
      if (shop) {
        shop.shopName = shopName;
        shop.latitude = latitude;
        shop.longitude = longitude;
        if (address) shop.address = address;
        await shop.save();
      } else {
        shop = await ShopModel.create({ shopName, latitude, longitude, address: address || "" });
      }
    }

    res.json({ success: true, shop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET SHOP LOCATION (ShopOwner: own shop | Admin: any)
shoprouter.get("/location", verifyToken("admin", "shop_owner"), async (req, res) => {
  try {
    let shop;
    if (req.user.role === "shop_owner") {
      shop = await ShopModel.findOne({ ownerId: req.user.userId });
    } else {
      shop = await ShopModel.findOne();
    }

    res.json({ success: true, shop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default shoprouter;