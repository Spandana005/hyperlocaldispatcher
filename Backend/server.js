import exp from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connect } from 'mongoose';
import { config } from 'dotenv';
import router from './APIs/commonAPI.js';
import adminrouter from './APIs/adminAPI.js';
import riderrouter from './APIs/riderAPI.js';
import shoprouter from './APIs/shopAPI.js';
import authAPI from './APIs/authAPI.js';
import orderAPI from './APIs/orderAPI.js';
import locationAPI from './APIs/locationAPI.js';
import earningsAPI from './APIs/earningsAPI.js';
import shopOwnerAPI from './APIs/shopOwnerAPI.js';
import cookieParser from "cookie-parser";
import cors from 'cors';

config();

const app = exp();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true
  }
});

// ✅ Attach Socket.io instance to app context
app.set("io", io);

// ✅ CORS middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://hyperlocaldispatcher.vercel.app"
  ],
  credentials: true
}));

// ✅ body parser
app.use(exp.json());

// ✅ cookie parser
app.use(cookieParser());

// ✅ Socket.io event handling
io.on("connection", (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // Client joins a specific room
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);
  });

  // Admin joins admin room to receive all rider location updates
  socket.on("join-admin", () => {
    socket.join("admin-room");
    console.log(`Admin client ${socket.id} joined admin-room`);
  });

  // Shop owner joins their shop room
  socket.on("join-shop", (shopId) => {
    socket.join(`shop:${shopId}`);
    console.log(`Shop owner ${socket.id} joined shop:${shopId}`);
  });

  // Rider joins their shop room for order updates
  socket.on("rider-join-shop", (shopId) => {
    socket.join(`shop:${shopId}`);
    console.log(`Rider ${socket.id} joined shop:${shopId}`);
  });

  socket.on("disconnect", () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// ✅ Legacy/Standard Common APIs
app.use("/api/common", router);
app.use("/api/admin", adminrouter);
app.use("/api/rider", riderrouter);
app.use("/api/shop", shoprouter);

// ✅ New REST API routes
app.use("/api/auth", authAPI);
app.use("/api/orders", orderAPI);
app.use("/api/location", locationAPI);
app.use("/api/earnings", earningsAPI);
app.use("/api/shop-owner", shopOwnerAPI);

console.log("[ROUTES] Auth API mounted at /api/auth");
console.log("[ROUTES] Shop Owner API mounted at /api/shop-owner");

// ✅ Connect to database
const connectDB = async () => {
  try {
    await connect(process.env.DB_URL);
    console.log("DB connection success");

    httpServer.listen(process.env.PORT, () => {
      console.log(`Server started on port ${process.env.PORT}`);
    });

  } catch (err) {
    console.log("Error in DB connection", err);
  }
};

connectDB();

// ✅ invalid path handler
app.use((req, res) => {
  res.status(404).json({ message: `${req.url} invalid path` });
});

// ✅ global error handler
app.use((err, req, res, next) => {
  console.log("error:", err);
  res.status(500).json({ message: "Internal server error", reason: err.message });
});