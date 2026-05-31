import express from "express";

import { ShopModel } from "../Models/ShopModel.js";

const shoprouter = express.Router();


// SAVE SHOP LOCATION
shoprouter.post("/location", async (req, res) => {

  try {

    const {
      shopName,
      latitude,
      longitude,
    } = req.body;

    // CHECK IF SHOP EXISTS

    let shop = await ShopModel.findOne();

    // UPDATE EXISTING SHOP

    if (shop) {

      shop.shopName = shopName;

      shop.latitude = latitude;

      shop.longitude = longitude;

      await shop.save();

    }

    // CREATE NEW SHOP

    else {

      shop = await ShopModel.create({

        shopName,

        latitude,

        longitude,

      });

    }

    res.json({
      success: true,
      shop,
    });

  }

  catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

});


// GET SHOP LOCATION
shoprouter.get("/location", async (req, res) => {

  try {

    const shop = await ShopModel.findOne();

    res.json({
      success: true,
      shop,
    });

  }

  catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

});

export default shoprouter;