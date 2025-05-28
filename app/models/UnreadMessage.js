// app/models/UnreadMessage.js
const mongoose = require("mongoose");

const unreadMessageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  recipient: {
    type: String, // Додайте поле для одержувача, щоб фільтрувати непрочитані повідомлення для конкретного користувача
    required: true,
  },
});

const UnreadMessage = mongoose.model("UnreadMessage", unreadMessageSchema);
module.exports = UnreadMessage;
