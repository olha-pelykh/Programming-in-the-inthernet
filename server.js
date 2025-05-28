// server.js

const express = require("express");
const mongoose = require("mongoose");
// const bcrypt = require("bcrypt"); // Not directly used here, but might be in Auth
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./app/controllers/Auth");
const Message = require("./app/models/Message");
const Room = require("./app/models/Room");
const User = require("./app/models/User");
const UnreadMessage = require("./app/models/UnreadMessage");

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use("/api", authRoutes);

// Route to get all available rooms
app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await Room.find({}).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to get messages for a specific room
app.get("/api/messages/:roomName", async (req, res) => {
  try {
    const roomName = req.params.roomName;
    const messages = await Message.find({ room: roomName }).sort({ time: 1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to create a new room
app.post("/api/rooms", async (req, res) => {
  const { name, participants } = req.body;

  if (!name || !participants || !Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({ message: "Назва кімнати та учасники обов'язкові" });
  }
  try {
    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(409).json({ message: "Кімната з такою назвою вже існує" });
    }
    const userIds = participants.map((id) => new mongoose.Types.ObjectId(id));
    const existingUsers = await User.find({ _id: { $in: userIds } });
    if (existingUsers.length !== participants.length) {
      return res.status(400).json({ message: "Один або більше учасників не знайдено" });
    }
    const newRoom = new Room({ name, participants: userIds });
    await newRoom.save();
    io.emit("new_room_created", newRoom);
    res.status(201).json(newRoom);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ message: "Помилка сервера при створенні кімнати" });
  }
});

// Route to get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "login _id"); // Ensure _id is also returned
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to get unread messages for a user
app.get("/api/unread-messages/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const unreadMessages = await UnreadMessage.find({ recipient: username }).sort({ time: -1 }); // Sort newest first for display
    res.json(unreadMessages);
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// *** NEW: API Route to mark all notifications as read for a user (called by fetch POST) ***
app.post("/api/mark-read/:username", async (req, res) => {
  try {
    const username = req.params.username;
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }
    const deleteResult = await UnreadMessage.deleteMany({ recipient: username });
    console.log(`API: Cleared ${deleteResult.deletedCount} unread messages for ${username} via POST /api/mark-read.`);
    // Optionally, you could emit an event to other socket connections of this user if needed
    // For example: io.to(username).emit("notifications_cleared_from_db_by_other_session");
    res.status(200).json({ message: "Notifications marked as read and cleared from DB." });
  } catch (error) {
    console.error("API: Error marking notifications as read via POST /api/mark-read:", error);
    res.status(500).json({ message: "Internal server error while marking notifications read" });
  }
});

mongoose
  .connect(
    "mongodb+srv://olhapelykh:MwMSh8uKSDFubB9w@cluster.f5g3fmj.mongodb.net/Node-API?retryWrites=true&w=majority&appName=Cluster",
    {
      // useNewUrlParser: true, // Deprecated
      // useUnifiedTopology: true, // Deprecated
    }
  )
  .then(() => {
    console.log("MongoDB connected");
    server.listen(3000, () => console.log("Server running on port 3000"));
  })
  .catch((err) => console.error("MongoDB connection error:", err));

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Store username on socket for easier access if needed, after they join a personal room
  // socket.username = null;

  socket.on("join_room", async (data) => {
    // Leave previous rooms
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        // Don't leave the default room associated with the socket ID
        socket.leave(room);
        console.log(`User ${socket.id} left room: ${room}`);
      }
    });

    // Join the new chat room
    if (data.room) {
      socket.join(data.room);
      console.log(`User ${socket.id} joined chat room: ${data.room}`);
    }

    // Join personal notification room if username is provided
    if (data.username) {
      // socket.username = data.username; // Store username
      socket.join(data.username); // Join a room named after the username
      console.log(`User ${socket.id} (username: ${data.username}) joined personal notification room: ${data.username}`);

      // Clear unread messages for the current user in the specific chat room they just joined
      // This should happen when they enter a chat room, not just their personal notification room.
      // The original logic was to clear unread for data.room and data.username.
      // This seems correct if data.room is the chat they are viewing.
      if (data.room) {
        try {
          const deleteResult = await UnreadMessage.deleteMany({ room: data.room, recipient: data.username });
          console.log(
            `Cleared ${deleteResult.deletedCount} unread messages for ${data.username} in room ${data.room} upon joining.`
          );
          // Emit an event to this specific client to update their total unread count display
          socket.emit("unread_count_updated"); // Client should re-fetch or recalculate total unread
        } catch (error) {
          console.error(
            `Error clearing unread messages for ${data.username} in room ${data.room} on join_room:`,
            error
          );
        }
      }
    } else {
      console.warn(
        `join_room: username not provided for socket ${socket.id}, cannot join personal notification room or clear specific unread messages.`
      );
    }
  });

  socket.on("send_message", async (data) => {
    console.log("Received send_message event with data:", data);
    const newMessage = new Message({
      room: data.room,
      author: data.author,
      message: data.message,
      time: data.time,
    });

    try {
      await newMessage.save();
      console.log("Regular message saved successfully:", newMessage);
    } catch (error) {
      console.error("Error saving regular message:", error);
    }

    // Broadcast message to the chat room
    io.to(data.room).emit("receive_message", data);

    // Create and send unread message notifications
    try {
      const roomDetails = await Room.findOne({ name: data.room }).populate("participants", "login"); // Populate only login
      if (roomDetails && roomDetails.participants) {
        for (const participant of roomDetails.participants) {
          if (participant && participant.login && participant.login !== data.author) {
            const newUnreadMessage = new UnreadMessage({
              room: data.room,
              author: data.author,
              message: data.message,
              time: data.time,
              recipient: participant.login, // Use login as recipient identifier
            });
            try {
              await newUnreadMessage.save();
              console.log(`Saved unread message for recipient: ${participant.login} in room ${newUnreadMessage.room}`);
              // Emit to the participant's personal room (named after their login/username)
              io.to(participant.login).emit("new_unread_message_notification", newUnreadMessage);
              console.log(`Emitted 'new_unread_message_notification' to personal room: ${participant.login}`);
            } catch (saveError) {
              console.error(`Error saving unread message for ${participant.login}:`, saveError);
            }
          }
        }
      } else {
        console.warn(`Room "${data.room}" not found or has no participants for unread message processing.`);
      }
    } catch (error) {
      console.error("Error processing unread messages for send_message:", error);
    }
  });

  socket.on("get_messages", async (roomName) => {
    try {
      const messages = await Message.find({ room: roomName }).sort({ time: 1 });
      socket.emit("messages_history", messages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  });

  // *** NEW: Handler for when user views notifications (e.g., hovers/opens notification popup) ***
  socket.on("mark_all_notifications_as_read", async (data) => {
    if (data && data.recipient) {
      try {
        const deleteResult = await UnreadMessage.deleteMany({ recipient: data.recipient });
        console.log(
          `Socket: Cleared ${deleteResult.deletedCount} unread messages for ${data.recipient} upon viewing notifications.`
        );
        // Confirm back to the client that initiated this, so they can clear their UI
        socket.emit("notifications_cleared_from_db");
      } catch (error) {
        console.error(
          `Socket: Error clearing unread messages for ${data.recipient} on mark_all_notifications_as_read:`,
          error
        );
      }
    } else {
      console.warn("Socket: mark_all_notifications_as_read - recipient not provided.");
    }
  });

  // *** NEW: Handler for "Clear all" button in notifications popup ***
  socket.on("clear_all_unread_messages", async (data) => {
    if (data && data.recipient) {
      try {
        const deleteResult = await UnreadMessage.deleteMany({ recipient: data.recipient });
        console.log(
          `Socket: Cleared ${deleteResult.deletedCount} unread messages for ${data.recipient} via clear all button.`
        );
        // Confirm back to the client that initiated this
        socket.emit("notifications_cleared_from_db");
      } catch (error) {
        console.error(`Socket: Error clearing all unread messages for ${data.recipient}:`, error);
      }
    } else {
      console.warn("Socket: clear_all_unread_messages - recipient not provided.");
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});
