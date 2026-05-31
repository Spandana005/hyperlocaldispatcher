import jwt from "jsonwebtoken";
import { UserTypeModel } from "../Models/UserModel.js";

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

      console.log(`[AUTH VERIFICATION] Token source: ${tokenSource || "NONE"}, Token retrieved: ${token ? "PRESENT" : "MISSING"}`);

      // NO TOKEN
      if (!token) {
        console.warn("[AUTH VERIFICATION] Rejecting request: No token provided");
        return res.status(401).json({
          message: "No token provided",
        });
      }

      // VERIFY TOKEN
      const decoded = jwt.verify(
        token,
        process.env.SECRET_KEY
      );

      console.log("[AUTH VERIFICATION] Token validation success. Decoded user payload:", decoded);

      // ROLE CHECK
      if (
        !allowedRoles.includes(
          decoded.role
        )
      ) {
        console.warn(`[AUTH VERIFICATION] Access Denied: User role ${decoded.role} not in allowed roles [${allowedRoles.join(", ")}]`);
        return res.status(403).json({
          message: "Access denied",
        });
      }

      // CHECK IF USER IS BLOCKED
      const dbUser = await UserTypeModel.findById(decoded.userId);
      if (dbUser && dbUser.isBlocked) {
        console.warn(`[AUTH VERIFICATION] Access Denied: User ${decoded.userId} is currently blocked in database`);
        return res.status(403).json({
          message: "Account blocked by admin. Contact support.",
          isBlocked: true,
        });
      }

      // SAVE USER
      req.user = decoded;
      next();

    } catch (err) {
      console.error("[AUTH VERIFICATION] Failed validation error:", err.message);

      return res.status(401).json({
        message: "Invalid or expired token",
        error: err.message,
      });
    }

  };