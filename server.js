const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); // Здається, не використовується напряму, але може бути в Auth
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./app/controllers/Auth");
const Message = require("./app/models/Message");
const Room = require("./app/models/Room");
const User = require("./app/models/User"); // Переконайтесь, що цей імпорт є!
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

// Роут для отримання всіх доступних кімнат
app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await Room.find({}).sort({ createdAt: -1 }); // Сортуємо, щоб нові були зверху
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

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

app.post("/api/rooms", async (req, res) => {
  const { name, participants } = req.body; // Очікуємо також масив participants

  if (!name || !participants || !Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({ message: "Назва кімнати та учасники обов'язкові" });
  }

  try {
    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(409).json({ message: "Кімната з такою назвою вже існує" });
    }

    // Перевіряємо, чи існують всі вказані participants
    const userIds = participants.map((id) => new mongoose.Types.ObjectId(id));
    const existingUsers = await User.find({ _id: { $in: userIds } });
    if (existingUsers.length !== participants.length) {
      return res.status(400).json({ message: "Один або більше учасників не знайдено" });
    }

    const newRoom = new Room({ name, participants: userIds });
    await newRoom.save();
    io.emit("new_room_created", newRoom); // Повідомляємо всім клієнтам про нову кімнату
    res.status(201).json(newRoom);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ message: "Помилка сервера при створенні кімнати" });
  }
});

// Роут для отримання всіх користувачів (для вибору учасників чату)
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "login"); // Повертаємо лише логін
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/unread-messages/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const unreadMessages = await UnreadMessage.find({ recipient: username }).sort({ time: 1 });
    res.json(unreadMessages);
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://olhapelykh:MwMSh8uKSDFubB9w@cluster.f5g3fmj.mongodb.net/Node-API?retryWrites=true&w=majority&appName=Cluster",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("MongoDB connected");
    server.listen(3000, () => console.log("Server running on port 3000"));
  })
  .catch((err) => console.error(err));

// Обробка з'єднань Socket.io
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", async (data) => {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
        console.log(`User ${socket.id} left room: ${room}`);
      }
    });

    socket.join(data.room);
    console.log(`User ${socket.id} joined room: ${data.room}`);

    // Очистка непрочитаних повідомлень для поточного користувача, який приєднався до кімнати
    if (data.username) {
      // Використовуємо username, щоб відповідати полю recipient
      try {
        const deleteResult = await UnreadMessage.deleteMany({ room: data.room, recipient: data.username });
        console.log(`Cleared ${deleteResult.deletedCount} unread messages for ${data.username} in room ${data.room}`);
        // Можливо, повідомити клієнта про оновлення лічильника непрочитаних повідомлень
        io.to(socket.id).emit("unread_count_updated");
      } catch (error) {
        console.error("Error clearing unread messages on join_room:", error);
      }
    } else {
      console.warn("join_room: username not provided, cannot clear unread messages.");
    }
  });

  socket.on("send_message", async (data) => {
    console.log("Received send_message event with data:", data); // Лог вхідних даних
    const newMessage = new Message({
      room: data.room,
      author: data.author,
      message: data.message,
      time: data.time,
    });

    try {
      await newMessage.save();
      console.log("Regular message saved successfully:", newMessage); // Лог успішного збереження
    } catch (error) {
      console.error("Error saving regular message:", error); // Лог помилки збереження
    }

    io.to(data.room).emit("receive_message", data);

    try {
      // Знаходимо кімнату і populate'имо учасників
      const room = await Room.findOne({ name: data.room }).populate("participants");
      console.log(`Searching for room "${data.room}". Found:`, room ? "Yes" : "No");

      if (room && room.participants && room.participants.length > 0) {
        console.log(
          "Room participants found:",
          room.participants.map((p) => p.login)
        ); // Лог логінів учасників
        for (const participant of room.participants) {
          // Перевіряємо, чи учасник існує і має логін
          if (participant && participant.login && participant.login !== data.author) {
            const newUnreadMessage = new UnreadMessage({
              room: data.room,
              author: data.author,
              message: data.message,
              time: data.time,
              recipient: participant.login, // Зберігаємо логін одержувача
            });
            try {
              await newUnreadMessage.save();
              console.log(`Saved unread message for recipient: ${participant.login}`);
            } catch (saveError) {
              console.error(`Error saving unread message for ${participant.login}:`, saveError);
            }
          } else {
            console.log(
              `Skipping unread message for participant (author or no login): ${participant ? participant.login : "N/A"}`
            );
          }
        }
      } else {
        console.warn(`Room "${data.room}" not found or has no participants for unread message processing.`);
      }
    } catch (error) {
      console.error("Error processing unread messages for send_message:", error);
    }
  });

  socket.on("get_messages", async (room) => {
    try {
      const messages = await Message.find({ room }).sort({ time: 1 });
      socket.emit("messages_history", messages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});
