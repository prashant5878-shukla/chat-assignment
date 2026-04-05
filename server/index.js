import "dotenv/config";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/messages.js";
import roomRoutes from "./routes/rooms.js";
import { setupSocket } from "./socket.js";

import uploadRoutes from "./routes/upload.js";

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/rooms", roomRoutes);

// Database Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/chat-app";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Redis Adapter Setup
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const pubClient = new Redis(redisUrl);
const subClient = pubClient.duplicate();

pubClient.on("error", (err) => console.error("Redis PubClient Error:", err));
subClient.on("error", (err) => console.error("Redis SubClient Error:", err));

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis adapter connected for Socket.io");
  })
  .catch((err) => {
    console.error(
      "Redis connection failed, falling back to in-memory adapter (or make sure Redis is running):",
      err.message,
    );
  });

// Setup Socket logic
setupSocket(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
