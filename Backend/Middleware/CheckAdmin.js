import { UserTypeModel } from "../Models/UserModel.js";

export const checkAdmin = async (req, res, next) => {
  try {
    const user = await UserTypeModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Only admin allowed" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account not active" });
    }

    next();
  } catch (err) {
    next(err);
  }
};