import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Message from "./models/Message.js";
import Room from "./models/Room.js";

export const setupSocket = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.headers.token;
      if (!token) return next(new Error("Authentication error: No token"));

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your_jwt_secret",
      );
      const user = await User.findById(decoded.userId);
      if (!user) return next(new Error("Authentication error: Invalid user"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected: ${userId} (${socket.user.username})`);

    // Update user status
    await User.findByIdAndUpdate(userId, { isOnline: true });
    socket.broadcast.emit("user_status_change", { userId, status: "online" });

    // Join all user's rooms
    const rooms = await Room.find({ members: userId });
    rooms.forEach((room) => {
      socket.join(room._id.toString());
    });

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.user.username} joined room ${roomId}`);
    });

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
    });

    socket.on("send_message", async (data) => {
      try {
        const { roomId, type, content, fileUrl, fileName, tempId } = data;

        // Save to DB
        const message = new Message({
          roomId,
          senderId: userId,
          type: type || "text",
          content,
          fileUrl,
          fileName,
        });
        await message.save();

        // Populate sender info before emitting
        const populatedMessage = await Message.findById(message._id).populate(
          "senderId",
          "username",
        );

        const emitData = populatedMessage.toJSON();
        if (tempId) {
          emitData.tempId = tempId;
        }

        // Emit to room
        io.to(roomId).emit("receive_message", emitData);

        // Update room's updatedAt timestamp for sorting
        await Room.findByIdAndUpdate(roomId, { updatedAt: Date.now() });
      } catch (err) {
        console.error("Error sending message:", err);
      }
    });

    socket.on("typing", (roomId) => {
      socket.to(roomId).emit("user_typing", {
        userId,
        username: socket.user.username,
        roomId,
      });
    });

    socket.on("stop_typing", (roomId) => {
      socket.to(roomId).emit("user_stopped_typing", { userId, roomId });
    });

    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${userId}`);
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: Date.now(),
      });
      socket.broadcast.emit("user_status_change", {
        userId,
        status: "offline",
      });
    });
  });
};
