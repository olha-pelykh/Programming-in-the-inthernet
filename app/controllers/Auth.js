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

    const isMatch = password === user.password;
    if (!isMatch) return res.status(400).json({ message: "Невірний пароль" });

    const token = jwt.sign({ id: user._id }, "secretkey", { expiresIn: "1h" });

    res.json({ token, login: user.login });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Помилка сервера" });
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
