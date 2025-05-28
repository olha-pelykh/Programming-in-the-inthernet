const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
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
    type: String, // Або Date, якщо ви хочете зберігати як об'єкт Date
    required: true,
  },
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
