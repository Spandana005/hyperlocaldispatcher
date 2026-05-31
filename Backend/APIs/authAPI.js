import express from "express";
import jwt from "jsonwebtoken";
import { register, login } from "../Services/AuthServices.js";
import { verifyToken } from "../Middleware/VerifyToken.js";
import { UserTypeModel } from "../Models/UserModel.js";

const router = express.Router();

// Register Route
router.post("/register", async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);
    const data = await register(req.body);
    console.log("REGISTER SUCCESS:", data);
    res.json(data);
  } catch (error) {
    console.log("REGISTER ERROR:", error);
    res.status(400).json({
      message: error.message,
    });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    console.log(`[AUTH API] Login attempt received for email: ${req.body.email}`);
    const data = await login(req.body);

    console.log(`[AUTH API] Login successful for user: ${data.user._id} (${data.user.role}). Generating tokens.`);
    console.log(`[AUTH API] Created Access Token: ${data.accessToken.substring(0, 15)}... (Expires: 15m)`);
    console.log(`[AUTH API] Created Refresh Token: ${data.refreshToken.substring(0, 15)}... (Expires: 7d)`);

    // ACCESS TOKEN COOKIE
    res.cookie("accessToken", data.accessToken, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    // REFRESH TOKEN COOKIE
    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: data.user,
      token: data.accessToken, // send token explicitly for header support
    });
  } catch (error) {
    console.error(`[AUTH API] Login failed for email ${req.body.email}:`, error.message);
    res.status(error.status || 500).json({
      message: error.message,
    });
  }
});

// Logout Route
router.post("/logout", (req, res) => {
  console.log("[AUTH API] Logout request received. Clearing authentication cookies.");
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({
    success: true,
  });
});

// Get profile details of current logged-in user
router.get("/me", verifyToken("admin", "rider"), async (req, res) => {
  try {
    const user = await UserTypeModel.findById(req.user.userId)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});   // ← YOU WERE MISSING THIS


// Refresh Token Route
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    console.log("[AUTH API] Refresh token route triggered. Refresh token present:", refreshToken ? "YES" : "NO");

    if (!refreshToken) {
      console.warn("[AUTH API] Refresh failed: No refresh token provided in cookies");
      return res.status(401).json({ message: "No refresh token provided" });
    }

    // Verify token
    const decoded = jwt.verify(refreshToken, process.env.SECRET_KEY);
    console.log("[AUTH API] Refresh token verified successfully for userId:", decoded.userId);
    
    // Find user
    const user = await UserTypeModel.findById(decoded.userId);
    if (!user) {
      console.warn(`[AUTH API] Refresh failed: User ${decoded.userId} not found in DB`);
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isActive === false || user.isBlocked) {
      console.warn(`[AUTH API] Refresh failed: User ${decoded.userId} is inactive or blocked`);
      return res.status(403).json({ message: "Account is inactive/blocked" });
    }

    // Issue new accessToken
    const accessToken = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.SECRET_KEY,
      { expiresIn: "15m" }
    );

    // Also optionally re-issue refresh token to roll it
    const newRefreshToken = jwt.sign(
      {
        userId: user._id,
      },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    );

    console.log(`[AUTH API] Re-issued access token and refresh token for user ${user._id}. Setting cookies.`);

    // Save cookies
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
        isAvailable: user.isAvailable,
        isActive: user.isActive,
        isBlocked: user.isBlocked,
      }
    });

  } catch (error) {
    console.error("[AUTH API] REFRESH TOKEN ERROR:", error.message);
    res.status(401).json({
      message: "Invalid or expired refresh token",
      error: error.message
    });
  }
});

export default router;
