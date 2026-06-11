import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { register, login } from "../Services/AuthServices.js";
import { verifyToken } from "../Middleware/VerifyToken.js";
import { UserTypeModel } from "../Models/UserModel.js";
import { RiderModel } from "../Models/RiderModel.js";
import { ShopModel } from "../Models/ShopModel.js";

const router = express.Router();

// =============================================
// POST /api/auth/register
// Public – allows shop_owner and rider only
// =============================================
router.post("/register", async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body.email, req.body.role);
    const data = await register(req.body);
    console.log("REGISTER SUCCESS:", data.email, data.role);
    res.status(201).json({
      success: true,
      message:
        data.role === "rider"
          ? "Account created. Awaiting shop owner approval."
          : "Account created successfully.",
      user: data,
    });
  } catch (error) {
    console.log("REGISTER ERROR:", error.message);
    res.status(error.status || 400).json({ message: error.message });
  }
});

// =============================================
// POST /api/auth/login
// =============================================
router.post("/login", async (req, res) => {
  try {
    console.log(`[AUTH API] Login attempt for: ${req.body.email}`);
    const data = await login(req.body);

    // ACCESS TOKEN COOKIE
    res.cookie("accessToken", data.accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    // REFRESH TOKEN COOKIE
    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: data.user,
      token: data.accessToken,
    });
  } catch (error) {
    console.error(`[AUTH API] Login failed:`, error.message);
    res.status(error.status || 500).json({ message: error.message });
  }
});

// =============================================
// POST /api/auth/logout
// =============================================
router.post("/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ success: true });
});

// =============================================
// GET /api/auth/me
// Returns current user profile + rider/shop profile
// =============================================
router.get("/me", verifyToken("admin", "shop_owner", "rider"), async (req, res) => {
  try {
    const user = await UserTypeModel.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = user.toObject();

    // Attach rider profile if rider
    if (user.role === "rider") {
      const riderProfile = await RiderModel.findOne({ userId: user._id })
        .populate("shopId", "shopName shopCode address phone");
      if (riderProfile) {
        userData.riderProfile = riderProfile;
      }
    }

    // Attach shop profile if shop_owner
    if (user.role === "shop_owner") {
      const shopProfile = await ShopModel.findOne({ ownerId: user._id });
      if (shopProfile) {
        userData.shopProfile = shopProfile;
      }
    }

    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// POST /api/auth/refresh
// =============================================
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, process.env.SECRET_KEY);
    const user = await UserTypeModel.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isBlocked || user.isActive === false) {
      return res.status(403).json({ message: "Account is inactive/blocked" });
    }

    // Get shopId for token
    let shopId = null;
    if (user.role === "rider") {
      const riderProfile = await RiderModel.findOne({ userId: user._id });
      shopId = riderProfile?.shopId?.toString() || null;
    } else if (user.role === "shop_owner") {
      const shop = await ShopModel.findOne({ ownerId: user._id });
      shopId = shop?._id?.toString() || null;
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role, email: user.email, shopId },
      process.env.SECRET_KEY,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { userId: user._id },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token: accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    console.error("[AUTH API] REFRESH TOKEN ERROR:", error.message);
    res.status(401).json({
      message: "Invalid or expired refresh token",
      error: error.message,
    });
  }
});

// =============================================
// POST /api/auth/seed-admin (DEV ONLY)
// Creates the first admin account
// =============================================
router.post("/seed-admin", async (req, res) => {
  try {
    const { name, email, password, phone, secretKey } = req.body;

    // Require a secret key to prevent abuse
    if (secretKey !== process.env.SECRET_KEY) {
      return res.status(403).json({ message: "Invalid secret key" });
    }

    const existing = await UserTypeModel.findOne({ role: "admin" });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const admin = await UserTypeModel.create({
      name,
      email,
      password: hashed,
      role: "admin",
      phone,
    });

    const userData = admin.toObject();
    delete userData.password;

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      user: userData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
