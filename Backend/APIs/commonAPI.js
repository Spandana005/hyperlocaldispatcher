import express from "express";
import { register, login } from "../Services/AuthServices.js";

const router = express.Router();

// PUBLIC
router.post("/register", async (req, res) => {

  try {

    console.log("REGISTER BODY:", req.body);

    const data = await register(req.body);

    console.log("REGISTER SUCCESS:", data);

    res.json(data);

  } catch (error) {

    console.log("REGISTER ERROR:", error);

    res.status(500).json({
      message: error.message,
    });

  }

});

router.post("/login", async (req, res) => {
  try {

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

    // SEND ONLY USER
    res.json({
      success: true,
      user: data.user,
    });

  } catch (error) {

    console.log(error);

    res.status(error.status || 500).json({
      message: error.message,
    });

  }
});
router.post("/logout", (req, res) => {

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.json({
    success: true,
  });

});
export default router;