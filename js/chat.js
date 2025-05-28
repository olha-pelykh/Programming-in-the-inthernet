const socket = io("http://localhost:3000");

const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const chatWindow = document.getElementById("chat-window");
const userNameElement = document.getElementById("user-name"); // Цей елемент!
const chatList = document.getElementById("chat-list");
const createRoomButton = document.getElementById("create-room-button");

// Модальне вікно для створення чату
const createChatModal = document.getElementById("createChatModal");
const closeCreateChatModalButton = document.getElementById("closeCreateChatModal");
const newChatNameInput = document.getElementById("new-chat-name");
const usersListForChat = document.getElementById("users-list-for-chat");
const submitCreateChatButton = document.getElementById("submit-create-chat");

let currentRoom = "general_chat";
let currentUserId = null; // Зберігатимемо ID поточного користувача

let allUsers = []; // Для зберігання всіх користувачів для вибору

// Функція для отримання поточного імені користувача з DOM
function getCurrentUserNameFromDOM() {
  return userNameElement ? userNameElement.textContent.trim() : "Guest";
}

// Функція для відображення повідомлення в чаті
function displayMessage(author, message, time, isCurrentUser = false) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("chat-message");
  if (isCurrentUser) {
    messageElement.classList.add("my-message");
  }

  const authorElement = document.createElement("span");
  authorElement.classList.add("message-author");
  authorElement.textContent = author;

  const contentElement = document.createElement("p");
  contentElement.classList.add("message-content-text");
  contentElement.textContent = message;

  const timeElement = document.createElement("span");
  timeElement.classList.add("message-time");
  timeElement.textContent = time;

  messageElement.appendChild(authorElement);
  messageElement.appendChild(contentElement);
  messageElement.appendChild(timeElement);
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function show(modalWindow) {
  modalWindow?.classList.remove("hidden");
}

function hide(modalWindow) {
  modalWindow?.classList.add("hidden");
}

// Функція для завантаження повідомлень для поточної кімнати
function loadMessagesForRoom(roomName) {
  chatWindow.innerHTML = "";
  socket.emit("get_messages", roomName);
  console.log(`Loading messages for room: ${roomName}`);
}

// Функція для переключення кімнат
function switchRoom(newRoomName) {
  if (newRoomName === currentRoom) return;

  console.log(`Switching from ${currentRoom} to ${newRoomName}`);

  const currentActive = chatList.querySelector(`.chat-list-item.active`);
  if (currentActive) {
    currentActive.classList.remove("active");
  }
  const newActive = chatList.querySelector(`[data-room="${newRoomName}"]`);
  if (newActive) {
    newActive.classList.add("active");
  }

  currentRoom = newRoomName;
  socket.emit("join_room", { room: currentRoom });
  loadMessagesForRoom(currentRoom);
}

// Функція для відображення списку чатів
async function displayChatList() {
  try {
    const response = await fetch("http://localhost:3000/api/rooms");
    const allRooms = await response.json();

    chatList.innerHTML = ""; // Очищаємо існуючий список

    // Фільтруємо кімнати, щоб показувати тільки ті, в яких поточний користувач є учасником
    // Якщо currentUserId не встановлено (наприклад, не увійшов), показуємо тільки "general_chat"
    const roomsForCurrentUser = allRooms.filter((room) => {
      if (room.name === "general_chat") return true; // Завжди показуємо загальний чат

      // Якщо ми знаємо ID користувача, фільтруємо по ньому
      if (currentUserId && room.participants && room.participants.includes(currentUserId)) {
        return true;
      }
      // Якщо user._id не зберігається в localStorage, або користувач не логінився,
      // цей фільтр не буде працювати коректно для приватних чатів.
      // Тому важливо, щоб currentUserId був встановлений з localStorage при завантаженні.
      return false;
    });

    // Сортуємо, щоб General Chat був завжди зверху
    roomsForCurrentUser.sort((a, b) => {
      if (a.name === "general_chat") return -1;
      if (b.name === "general_chat") return 1;
      return 0; // Для інших кімнат порядок не важливий або можна сортувати за іншими критеріями
    });

    roomsForCurrentUser.forEach((room) => {
      const listItem = document.createElement("li");
      listItem.textContent = room.name;
      listItem.classList.add("chat-list-item");
      listItem.dataset.room = room.name;
      listItem.dataset.roomId = room._id;
      chatList.appendChild(listItem);
    });

    chatList.querySelectorAll(".chat-list-item").forEach((item) => {
      item.addEventListener("click", () => {
        switchRoom(item.dataset.room);
      });
    });

    // Встановлюємо активний клас для поточної кімнати
    // Якщо currentRoom не є в roomsForCurrentUser, він автоматично переключиться на "general_chat"
    const activeRoomElement = chatList.querySelector(`[data-room="${currentRoom}"]`);
    if (activeRoomElement) {
      activeRoomElement.classList.add("active");
    } else {
      // Якщо поточна кімната не доступна для цього користувача, переключаємося на загальний чат
      switchRoom("general_chat");
    }

    loadMessagesForRoom(currentRoom);
  } catch (error) {
    console.error("Error fetching chat list:", error);
  }
}

// Функція для завантаження та відображення користувачів у модальному вікні
async function loadUsersForChatCreation() {
  try {
    const response = await fetch("http://localhost:3000/api/users");
    allUsers = await response.json();
    usersListForChat.innerHTML = "";

    allUsers.forEach((user) => {
      if (user.login === getCurrentUserNameFromDOM()) return; // Не додаємо себе до списку вибору

      const userDiv = document.createElement("div");
      userDiv.classList.add("user-checkbox-item");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `user-${user._id}`;
      checkbox.value = user._id;
      const label = document.createElement("label");
      label.htmlFor = `user-${user._id}`;
      label.textContent = user.login;

      userDiv.appendChild(checkbox);
      userDiv.appendChild(label);
      usersListForChat.appendChild(userDiv);
    });
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

// Обробники подій для модального вікна
createRoomButton.addEventListener("click", () => {
  newChatNameInput.value = "";
  usersListForChat.innerHTML = "";
  loadUsersForChatCreation();
  show(createChatModal); // Використовуємо show() для відображення модального вікна
  //createChatModal.style.display = "block";
});

closeCreateChatModalButton.addEventListener("click", () => {
  hide(createChatModal); // Використовуємо hide() для приховування модального вікна
  //createChatModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === createChatModal) {
    hide(createChatModal); // Використовуємо hide() для приховування модального вікна
    //createChatModal.style.display = "none";
  }
});

// Обробник для кнопки "Створити чат" у модальному вікні
submitCreateChatButton.addEventListener("click", async () => {
  const chatName = newChatNameInput.value.trim();
  if (!chatName) {
    alert("Будь ласка, введіть назву чату.");
    return;
  }

  const selectedUsers = [];
  // Додаємо поточного користувача до списку учасників АВТОМАТИЧНО
  if (currentUserId) {
    // Перевіряємо, чи є ID поточного користувача
    selectedUsers.push(currentUserId);
  } else {
    alert("Не вдалося визначити ID поточного користувача. Спробуйте увійти в систему.");
    return;
  }

  // Збираємо ID обраних користувачів
  usersListForChat.querySelectorAll('input[type="checkbox"]:checked').forEach((checkbox) => {
    if (!selectedUsers.includes(checkbox.value)) {
      // Уникаємо дублювання, якщо поточний користувач був випадково обраний
      selectedUsers.push(checkbox.value);
    }
  });

  if (selectedUsers.length === 0) {
    alert("Будь ласка, виберіть хоча б одного учасника (ви автоматично додаєтесь).");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: chatName, participants: selectedUsers }),
    });
    const data = await response.json();
    if (response.ok) {
      alert(`Чат "${data.name}" успішно створено!`);
      hide(createChatModal); // Використовуємо hide() для приховування модального вікна
      //createChatModal.style.display = "none";
      displayChatList(); // Оновлюємо список чатів
      switchRoom(data.name); // Переключаємося на щойно створений чат
    } else {
      alert(`Помилка створення чату: ${data.message}`);
    }
  } catch (error) {
    console.error("Error creating room:", error);
    alert("Помилка при створенні чату. Перевірте консоль.");
  }
});

// Обробник відправки повідомлення
sendButton.addEventListener("click", () => {
  const message = messageInput.value.trim();
  if (message !== "") {
    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;
    const messageData = {
      room: currentRoom,
      author: getCurrentUserNameFromDOM(), // Беремо автора з DOM
      message: message,
      time: time,
    };
    socket.emit("send_message", messageData);
    displayMessage(messageData.author, messageData.message, messageData.time, true);
    messageInput.value = "";
  }
});

// Обробка отримання повідомлення
socket.on("receive_message", (data) => {
  if (data.room === currentRoom) {
    if (data.author !== getCurrentUserNameFromDOM()) {
      // Порівнюємо з поточним ім'ям з DOM
      displayMessage(data.author, data.message, data.time);
    }
  }
});

// Обробка отримання попередніх повідомлень (без змін)
socket.on("previous_messages", (messages) => {
  chatWindow.innerHTML = "";
  messages.forEach((msg) => {
    const isCurrentUserMessage = msg.author === getCurrentUserNameFromDOM(); // Порівнюємо з поточним ім'ям з DOM
    displayMessage(msg.author, msg.message, msg.time, isCurrentUserMessage);
  });
});

// Обробка створення нової кімнати (Socket.io)
socket.on("new_room_created", (newRoom) => {
  console.log("New room created via Socket.io:", newRoom);
  // Додаємо кімнату до списку, лише якщо поточний користувач є її учасником
  if (currentUserId && newRoom.participants && newRoom.participants.includes(currentUserId)) {
    const existingRoom = chatList.querySelector(`[data-room="${newRoom.name}"]`);
    if (!existingRoom) {
      const listItem = document.createElement("li");
      listItem.textContent = newRoom.name;
      listItem.classList.add("chat-list-item");
      listItem.dataset.room = newRoom.name;
      listItem.dataset.roomId = newRoom._id;
      chatList.appendChild(listItem);
      listItem.addEventListener("click", () => {
        switchRoom(listItem.dataset.room);
      });
    }
  }
});

// Отримання імені користувача та його ID після логіну (DOMContentLoaded)
document.addEventListener("DOMContentLoaded", async () => {
  const storedLogin = localStorage.getItem("userLogin");
  const storedUserId = localStorage.getItem("userId");
  const storedUsername = localStorage.getItem("username");

  if (storedLogin) {
    // Оновлюємо currentUser в `userNameElement` на випадок, якщо `script.js` ще не спрацював.
    // Забезпечуємо, що user-name відображає актуальний логін
    if (userNameElement) {
      userNameElement.textContent = storedLogin;
    }
  }

  if (currentRoom) {
    socket.emit("join_room", { room: currentRoom, userId: storedUserId || "guest" });
    console.log(`Attempting to join room: ${currentRoom} as guest.`);
    socket.emit("get_messages", currentRoom); // <-- Цей виклик є критичним
  }

  // Тепер, коли userNameElement, можливо, оновлено, отримуємо актуальне ім'я
  // `currentUser` тепер не глобальна, а її значення буде братися з `getCurrentUserNameFromDOM()`
  // для відправки повідомлень. Це єдина місце, де `currentUser` залишається глобальною для ініціалізації
  // currentRoom. В інших місцях використовується `getCurrentUserNameFromDOM()`.

  if (currentUserId) {
    socket.emit("join_room", { room: currentRoom, userId: currentUserId });
    console.log(`Attempting to join room: ${currentRoom} with user ID: ${currentUserId}`);
    // Завантажуємо історію повідомлень для цієї кімнати
    socket.emit("get_messages", currentRoom);
  } else {
    // Якщо currentUserId не встановлено (наприклад, для гостя), приєднуємося без нього.
    // Це може бути не ідеально для персистентності, але для базової функціональності підійде.
    socket.emit("join_room", { room: currentRoom, userId: "guest" }); // або не передавати userId
    console.log(`Attempting to join room: ${currentRoom} as guest.`);
    socket.emit("get_messages", currentRoom);
  }

  if (storedUserId) {
    currentUserId = storedUserId;
  } else {
    // Якщо userId не збережено, спробуйте отримати його з сервера
    // Це має відбуватися ЛИШЕ ПІСЛЯ УСПІШНОГО ЛОГІНУ та збереження в localStorage
    // Якщо user-name відображає реальний логін, а ID немає
    if (getCurrentUserNameFromDOM() !== "Guest") {
      try {
        const response = await fetch("http://localhost:3000/api/users");
        const users = await response.json();
        const foundUser = users.find((user) => user.login === getCurrentUserNameFromDOM());
        if (foundUser) {
          currentUserId = foundUser._id;
          localStorage.setItem("userId", foundUser._id);
          console.log("Current user ID fetched and stored:", currentUserId);
        }
      } catch (error) {
        console.error("Error fetching current user ID during DOMContentLoaded:", error);
      }
    }
  }

  // Завантажуємо список чатів при завантаженні сторінки
  await displayChatList(); // Очікуємо, щоб список чатів був готовий

  // Приєднуємося до поточної кімнати (за замовчуванням "general_chat")
  socket.emit("join_room", { room: currentRoom });
  // loadMessagesForRoom(currentRoom); // Вже викликається в displayChatList
});

hide(createChatModal); // Приховуємо модальне вікно при завантаженні сторінки

socket.on("messages_history", (messages) => {
  chatWindow.innerHTML = ""; // Очищаємо вікно чату перед відображенням
  messages.forEach((msg) => {
    displayMessage(msg.author, msg.message, msg.time, msg.author === getCurrentUserNameFromDOM());
  });
  chatWindow.scrollTop = chatWindow.scrollHeight;
  console.log("Messages history received and displayed:", messages.length, "messages.");
});
