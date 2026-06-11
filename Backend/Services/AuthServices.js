import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserTypeModel } from "../Models/UserModel.js";
import { ShopModel, generateShopCode } from "../Models/ShopModel.js";
import { RiderModel } from "../Models/RiderModel.js";
import dotenv from "dotenv";

dotenv.config();

// 🔐 REGISTER
export const register = async (userObj) => {
  try {
    const { name, email, password, role, phone, shopCode, vehicleType } = userObj;

    // BLOCK admin registration via public endpoint
    if (role === "admin") {
      const err = new Error("Admin accounts cannot be registered publicly.");
      err.status = 403;
      throw err;
    }

    // Only allow shop_owner and rider
    if (!["shop_owner", "rider"].includes(role)) {
      const err = new Error("Invalid role. Must be shop_owner or rider.");
      err.status = 400;
      throw err;
    }

    // RIDER: shopCode is optional during registration
    let shop = null;
    if (role === "rider" && shopCode) {
      shop = await ShopModel.findOne({ shopCode: shopCode.trim().toUpperCase() });
      if (!shop) {
        const err = new Error("Invalid shop code. Please contact your shop owner.");
        err.status = 400;
        throw err;
      }
    }

    // Check duplicate email
    const existingUser = await UserTypeModel.findOne({ email });
    if (existingUser) {
      const err = new Error("An account with this email already exists.");
      err.status = 400;
      throw err;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await UserTypeModel.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
    });

    // RIDER: Create RiderModel profile
    if (role === "rider") {
      await RiderModel.create({
        userId: user._id,
        shopId: shop ? shop._id : undefined,
        vehicleType: vehicleType || "Bike",
        approvalStatus: "Pending",
      });
    }

    // Remove password before sending
    const userData = user.toObject();
    delete userData.password;

    return userData;
  } catch (error) {
    throw error;
  }
};

// 🔐 LOGIN
export const login = async ({ email, password }) => {
  try {
    // Find user
    const user = await UserTypeModel.findOne({ email });
    if (!user) {
      const err = new Error("Invalid email or password.");
      err.status = 401;
      throw err;
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error("Invalid email or password.");
      err.status = 401;
      throw err;
    }

    // Check blocked
    if (user.isBlocked || user.isActive === false) {
      const err = new Error("Account blocked. Contact admin.");
      err.status = 403;
      throw err;
    }

    // RIDER: Check approval status
    let riderProfile = null;
    if (user.role === "rider") {
      riderProfile = await RiderModel.findOne({ userId: user._id }).populate("shopId", "shopName shopCode");

      if (!riderProfile) {
        // Auto-migrate legacy rider without profile – create with Approved status
        const anyShop = await ShopModel.findOne();
        if (anyShop) {
          riderProfile = await RiderModel.create({
            userId: user._id,
            shopId: anyShop._id,
            vehicleType: "Bike",
            approvalStatus: "Approved",
            isAvailable: true,
          });
          riderProfile = await RiderModel.findById(riderProfile._id).populate("shopId", "shopName shopCode");
        } else {
          const err = new Error("No shop found for this rider. Contact admin.");
          err.status = 403;
          throw err;
        }
      }

      // Do not block login for Pending or Rejected riders; let the frontend handle redirection
      // to the pending approval or onboarding page.
    }

    // SHOP OWNER: Load shop info
    let shopProfile = null;
    if (user.role === "shop_owner") {
      shopProfile = await ShopModel.findOne({ ownerId: user._id });
    }

    // Generate ACCESS TOKEN
    const accessToken = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
        // Attach shopId for shop_owner and rider for fast middleware access
        shopId: riderProfile?.shopId?._id || shopProfile?._id || null,
      },
      process.env.SECRET_KEY,
      { expiresIn: "15m" }
    );

    // Generate REFRESH TOKEN
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    );

    // Clean password
    const userData = user.toObject();
    delete userData.password;

    return {
      accessToken,
      refreshToken,
      user: {
        ...userData,
        // Attach profile data for frontend
        riderProfile: riderProfile
          ? {
              _id: riderProfile._id,
              shopId: riderProfile.shopId,
              vehicleType: riderProfile.vehicleType,
              approvalStatus: riderProfile.approvalStatus,
              isAvailable: riderProfile.isAvailable,
            }
          : undefined,
        shopProfile: shopProfile
          ? {
              _id: shopProfile._id,
              shopName: shopProfile.shopName,
              shopCode: shopProfile.shopCode,
              address: shopProfile.address,
              phone: shopProfile.phone,
            }
          : undefined,
      },
    };
  } catch (error) {
    throw error;
  }
};

// 🔐 CHANGE PASSWORD
export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await UserTypeModel.findById(userId);
    if (!user) {
      throw new Error("User does not exist");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error("Wrong current password");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return { message: "Password changed successfully" };
  } catch (error) {
    throw error;
  }
};