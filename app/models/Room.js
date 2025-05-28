const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Додайте це поле
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Room", roomSchema);
