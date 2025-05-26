const express = require("express");
const bcrypt = require("bcryptjs"); // <--- Переконайтеся, що це bcryptjs
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Middleware для перевірки токену (додамо для захисту маршрутів)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Очікуємо "Bearer TOKEN"

  if (token == null) return res.sendStatus(401); // Якщо токену немає

  jwt.verify(token, "secretkey", (err, user) => {
    // Використовуйте той самий секретний ключ
    if (err) return res.sendStatus(403); // Якщо токен недійсний
    req.user = user; // Додаємо дані користувача до запиту
    next();
  });
};

// Логін
router.post("/login", async (req, res) => {
  const { login, password } = req.body;

  try {
    const user = await User.findOne({ login });
    if (!user) return res.status(400).json({ message: "Користувача не знайдено" });

    // !!! ВАЖЛИВО: Використовуйте bcrypt.compare для порівняння хешованих паролів !!!
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Невірний пароль" });

    const token = jwt.sign({ id: user._id, login: user.login }, "secretkey", { expiresIn: "1h" }); // Додаємо login до токену

    // !!! ВАЖЛИВО: Повертаємо userId !!!
    res.json({ token, login: user.login, userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Помилка сервера при логіні" });
  }
});

// Реєстрація
router.post("/register", async (req, res) => {
  const { login, password } = req.body;

  try {
    const candidate = await User.findOne({ login });
    if (candidate) return res.status(400).json({ message: "Користувач вже існує" });

    const hashedPassword = await bcrypt.hash(password, 10); // Ви вже використовуєте bcrypt.hash

    const newUser = new User({
      login,
      password: hashedPassword, // Зберігаємо хешований пароль
    });

    await newUser.save();
    res.status(201).json({ message: "Користувача зареєстровано успішно!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Помилка сервера при реєстрації" });
  }
});

// Маршрут для отримання всіх користувачів (тепер захищений)
router.get("/users", authenticateToken, async (req, res) => {
  // <--- Захищений маршрут
  try {
    const users = await User.find({}, "login"); // Отримати тільки поле 'login'
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Помилка сервера при отриманні користувачів" });
  }
});

module.exports = router;
