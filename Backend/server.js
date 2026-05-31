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
import cookieParser from "cookie-parser";
import cors from 'cors';

config();

const app = exp();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,   // allow any frontend port during development
    credentials: true
  }
});

// ✅ Attach Socket.io instance to app context so routers can access it
app.set("io", io);

// ✅ CORS middleware
app.use(cors({
  origin: true,
  credentials: true
}));

// ✅ body parser
app.use(exp.json());

// ✅ cookie parser
app.use(cookieParser());

// ✅ Socket.io event handling
io.on("connection", (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);
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

// ✅ connect to database
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
  res.status(404).json({
    message: `${req.url} invalid path`
  });
});

// ✅ global error handler
app.use((err, req, res, next) => {
  console.log("error:", err);

  res.status(500).json({
    message: "Internal server error",
    reason: err.message
  });
});