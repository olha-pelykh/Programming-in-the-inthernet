const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

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

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ login, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "Реєстрація успішна" });
  } catch (err) {
    res.status(500).json({ message: "Помилка сервера" });
  }
});

module.exports = router;
