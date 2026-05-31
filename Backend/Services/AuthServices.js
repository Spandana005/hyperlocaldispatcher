import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserTypeModel } from "../Models/UserModel.js";
import dotenv from "dotenv";

dotenv.config();

// 🔐 REGISTER
export const register = async (userObj) => {
  try {
    // create user instance
    const user = new UserTypeModel(userObj);

    // validate schema
    await user.validate();

    // hash password
    user.password = await bcrypt.hash(user.password, 10);

    // save user
    const createdUser = await user.save();

    // remove password before sending
    const userData = createdUser.toObject();
    delete userData.password;

    return userData;
  } catch (error) {
    throw new Error(error.message);
  }
};

// 🔐 LOGIN
export const login = async ({ email, password }) => {
  try {
    // 🔍 find user
    const user = await UserTypeModel.findOne({ email });

    if (!user) {
      const err = new Error("Invalid email");
      err.status = 401;
      throw err;
    }

    // 🔐 compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const err = new Error("Invalid password");
      err.status = 401;
      throw err;
    }

    // 🚫 check if blocked
    if (user.isActive === false) {
      const err = new Error("Account blocked. Contact admin.");
      err.status = 403;
      throw err;
    }

    // 🔐 ACCESS TOKEN (short life)
    const accessToken = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.SECRET_KEY,
      { expiresIn: "15m" } // short expiry
    );

    // 🔄 REFRESH TOKEN (long life)
    const refreshToken = jwt.sign(
      {
        userId: user._id,
      },
      process.env.SECRET_KEY,
      { expiresIn: "7d" } // long expiry
    );

    // 🧹 remove password
    const userData = user.toObject();
    delete userData.password;

    // ✅ return both tokens
    return {
      accessToken,
      refreshToken,
      user: userData,
    };

  } catch (error) {
    throw error;
  }
};

// 🔐 CHANGE PASSWORD
export const changePassword = async (
  userId,
  currentPassword,
  newPassword
) => {
  try {
    const user = await UserTypeModel.findById(userId);

    if (!user) {
      throw new Error("User does not exist");
    }

    // check current password
    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      throw new Error("Wrong current password");
    }

    // hash new password
    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    return { message: "Password changed successfully" };
  } catch (error) {
    throw error;
  }
};