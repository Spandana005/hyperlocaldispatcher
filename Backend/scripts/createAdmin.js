import { connect, disconnect } from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { UserTypeModel } from "../Models/UserModel.js";
import path from "path";

// Load env from the Backend directory root
config({ path: path.resolve(".env") });

async function seedAdmin() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    console.error("DB_URL is not defined in your environment (.env file)");
    process.exit(1);
  }

  try {
    console.log("Connecting to database...");
    await connect(dbUrl);
    
    // Check if any admin exists
    const existingAdmin = await UserTypeModel.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log(`Admin account already exists: ${existingAdmin.email}`);
      await disconnect();
      return;
    }

    const email = "admin@dispatchflow.com";
    const password = "AdminPassword123";
    const name = "System Administrator";
    const phone = "9999999999";

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await UserTypeModel.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      phone,
      isActive: true,
      isBlocked: false,
    });

    console.log("----------------------------------------");
    console.log("PLATFORM ADMIN CREATED SUCCESSFULLY!");
    console.log("Name:", admin.name);
    console.log("Email:", admin.email);
    console.log("Password:", password);
    console.log("Role:", admin.role);
    console.log("----------------------------------------");

    await disconnect();
  } catch (err) {
    console.error("Error seeding admin:", err);
    process.exit(1);
  }
}

seedAdmin();
