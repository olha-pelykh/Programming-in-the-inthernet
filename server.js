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
// server.js
app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await Room.find({}).sort({ createdAt: -1 });
    res.json(rooms); // Переконайтеся, що ви надсилаєте JSON відповідь
  } catch (error) {
    console.error("Error fetching rooms:", error); // Логування помилки на сервері
    res.status(500).json({ message: "Помилка сервера при отриманні кімнат", error: error.message });
  }
});

// Роут для створення нової кімнати
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
    const users = await User.find({}, "_id login"); // Отримуємо _id та login
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Помилка сервера при отриманні користувачів" });
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
    server.listen(3001, () => console.log("Server running on port 3000"));
  })
  .catch((err) => console.error(err));

// Обробка з'єднань Socket.io
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    // Перед приєднанням, залишаємо всі попередні кімнати, щоб уникнути дублювання повідомлень
    // та переконатися, що сокет отримує повідомлення лише для однієї активної кімнати.
    // Це важливо для коректної роботи.
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        // Не залишаємо кімнату за замовчуванням (власний ID сокета)
        socket.leave(room);
        console.log(`User ${socket.id} left room: ${room}`);
      }
    });

    socket.join(data.room);
    console.log(`User ${socket.id} joined room: ${data.room}`);
  });

  socket.on("send_message", async (data) => {
    const newMessage = new Message({
      room: data.room,
      author: data.author,
      message: data.message,
      time: data.time,
    });
    await newMessage.save();

    io.to(data.room).emit("receive_message", data);
  });

  socket.on("get_messages", async (room) => {
    try {
      const messages = await Message.find({ room }).sort({ time: 1 });
      socket.emit("previous_messages", messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});
