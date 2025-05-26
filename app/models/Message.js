const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
    },
    author: {
      // Це поле зберігає логін автора
      type: String,
      required: true,
    },
    authorId: {
      // Додамо поле для ID автора, щоб легше відстежувати, хто не прочитав
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    readBy: [
      // Нове поле: масив ID користувачів, які прочитали повідомлення
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
  },
  {
    timestamps: true, // Додаємо timestamps, щоб мати createdAt для сортування
  }
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
