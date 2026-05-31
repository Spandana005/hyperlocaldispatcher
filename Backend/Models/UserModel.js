import mongoose from "mongoose";

const userSchema = new mongoose.Schema(

  {

    name: {

      type: String,

      required: true,

    },


    email: {

      type: String,

      required: true,

      unique: true,

    },


    password: {

      type: String,

      required: true,

    },


    role: {

      type: String,

      enum: ["admin", "rider"],

      default: "rider",

    },


    phone: {

      type: String,

    },


    // RIDER AVAILABLE OR NOT
    isAvailable: {

      type: Boolean,

      default: true,

    },


    // ACCOUNT ACTIVE OR BLOCKED
    isActive: {

      type: Boolean,

      default: true,

    },


    isBlocked: {

      type: Boolean,

      default: false,

    },


    // LIVE GPS LOCATION
    location: {

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


// GEO INDEX
userSchema.index({

  location: "2dsphere",

});


export const UserTypeModel = mongoose.model(

  "User",

  userSchema

);