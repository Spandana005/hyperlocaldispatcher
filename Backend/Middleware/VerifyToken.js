import jwt from "jsonwebtoken";
import { UserTypeModel } from "../Models/UserModel.js";
import { RiderModel } from "../Models/RiderModel.js";

/**
 * verifyToken middleware factory
 * Usage: verifyToken("admin", "shop_owner", "rider")
 */
export const verifyToken =
  (...allowedRoles) =>
  async (req, res, next) => {
    try {
      let token = null;
      let tokenSource = null;

      // 1. Prioritize Authorization header
      if (req.headers.authorization) {
        const parts = req.headers.authorization.split(" ");
        if (parts.length === 2 && parts[0] === "Bearer") {
          token = parts[1];
          tokenSource = "Authorization Header (Bearer)";
        }
      }

      // 2. Fallback to cookie
      if (!token && req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
        tokenSource = "accessToken Cookie";
      }

      // NO TOKEN
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      // VERIFY TOKEN
      const decoded = jwt.verify(token, process.env.SECRET_KEY);

      // ROLE CHECK
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: "Access denied: insufficient role" });
      }

      // CHECK IF USER IS BLOCKED
      const dbUser = await UserTypeModel.findById(decoded.userId);
      if (!dbUser) {
        return res.status(401).json({ message: "User not found" });
      }
      if (dbUser.isBlocked || dbUser.isActive === false) {
        return res.status(403).json({
          message: "Account blocked by admin. Contact support.",
          isBlocked: true,
        });
      }

      // RIDER: Check approval status
      if (decoded.role === "rider") {
        const riderProfile = await RiderModel.findOne({ userId: decoded.userId });
        
        // Skip approval checks for onboarding & profile endpoints
        const isOnboarding = req.originalUrl.includes("/me") || req.originalUrl.includes("/join-shop");
        if (riderProfile && riderProfile.approvalStatus !== "Approved" && !isOnboarding) {
          return res.status(403).json({
            message: `Rider account is ${riderProfile.approvalStatus}. Contact your shop owner.`,
            approvalStatus: riderProfile.approvalStatus,
          });
        }
        // Attach shopId from rider profile if not in token
        if (riderProfile && riderProfile.shopId && !decoded.shopId) {
          decoded.shopId = riderProfile.shopId.toString();
        }
      }

      // Save decoded user info for route handlers
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({
        message: "Invalid or expired token",
        error: err.message,
      });
    }
  };

/**
 * requireAdmin – shorthand middleware
 */
export const requireAdmin = verifyToken("admin");

/**
 * requireShopOwner – shorthand middleware
 */
export const requireShopOwner = verifyToken("shop_owner");

/**
 * requireRider – shorthand middleware (also checks approval)
 */
export const requireRider = verifyToken("rider");