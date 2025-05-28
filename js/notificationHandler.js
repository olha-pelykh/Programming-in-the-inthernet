/* jshint esversion: 11 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("notificationHandler.js: DOMContentLoaded fired. Initializing...");

  const socket = io("http://localhost:3000"); // Підключення до Socket.IO сервера
  const notificationsButton = document.getElementById("notifications-button");
  const notificationsForm = document.getElementById("notifications-form");
  const notificationList = document.getElementById("notification-list");
  const notificationCount = document.getElementById("notification-count");
  const userNameElement = document.getElementById("user-name");
  const bellIcon = notificationsButton ? notificationsButton.querySelector(".fa-bell") : null; // Отримуємо іконку дзвіночка

  if (!notificationsButton) console.error("notificationHandler.js: Element #notifications-button not found!");
  if (!notificationsForm) console.error("notificationHandler.js: Element #notifications-form not found!");
  if (!notificationList)
    console.error("notificationHandler.js: ERROR: Element #notification-list not found! Messages cannot be displayed.");
  if (!notificationCount) console.error("notificationHandler.js: Element #notification-count not found!");
  if (!userNameElement) console.error("notificationHandler.js: Element #user-name not found!");
  if (!bellIcon) console.error("notificationHandler.js: Bell icon (.fa-bell) inside #notifications-button not found!");

  function displayNotification(messageData) {
    if (!notificationList) {
      console.error("notificationHandler.js: notificationList is null, cannot display notification.");
      return;
    }
    const notificationItem = document.createElement("div");
    notificationItem.classList.add("notification-item");
    // Можете додати більше інформації з messageData, якщо потрібно
    notificationItem.innerHTML = `
            <strong>${messageData.author}</strong>
            <p>${messageData.message}</p>
            <small>${messageData.time} in ${messageData.room}</small>
        `;
    notificationList.prepend(notificationItem); // Додаємо на початок списку
  }

  if (!notificationList) {
    console.error("notificationHandler.js: Aborting notification handling due to missing #notification-list.");
    return; // Важливо: зупиняємо подальше виконання скрипта для сповіщень
  }
  // --- КІНЕЦЬ ПЕРЕВІРКИ ---

  let unreadNotifications = 0;

  // Функція для оновлення вигляду дзвіночка
  function updateBellIcon() {
    if (bellIcon) {
      if (unreadNotifications > 0) {
        bellIcon.classList.add("fa-solid");
        bellIcon.classList.remove("fa-regular");
      } else {
        bellIcon.classList.add("fa-regular");
        bellIcon.classList.remove("fa-solid");
      }
    }
  }

  // Socket connection events for debugging
  socket.on("connect", () => {
    console.log("notificationHandler.js: Socket.IO connected from dashboard:", socket.id);
    // Після підключення, якщо userId відомий, просимо сервер приєднати нас до всіх кімнат
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      socket.emit("initial_rooms_join", storedUserId);
      console.log(`notificationHandler.js: Emitting initial_rooms_join for userId: ${storedUserId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("notificationHandler.js: Socket.IO disconnected from dashboard.");
  });

  socket.on("connect_error", (error) => {
    console.error("notificationHandler.js: Socket.IO connection error from dashboard:", error);
  });

  // Функція для отримання поточного імені користувача з DOM
  function getCurrentUserNameFromDOM() {
    const username = userNameElement ? userNameElement.textContent.trim() : "Guest";
    console.log("notificationHandler.js: Current user name from DOM:", username);
    return username;
  }

  // Обробник для кнопки сповіщень
  if (notificationsButton) {
    notificationsButton.addEventListener("click", () => {
      if (notificationsForm) {
        notificationsForm.classList.toggle("hidden");
        if (!notificationsForm.classList.contains("hidden")) {
          unreadNotifications = 0;
          updateNotificationCount();
          updateBellIcon();
          notificationList.innerHTML = ""; // Очищаємо список повідомлень
        }
      }
    });
  }

  // Закриття форми сповіщень при кліку поза нею
  document.addEventListener("click", (event) => {
    if (
      notificationsForm &&
      notificationsButton &&
      !notificationsForm.contains(event.target) &&
      !notificationsButton.contains(event.target) &&
      !notificationsForm.classList.contains("hidden")
    ) {
      notificationsForm.classList.add("hidden");
    }
  });

  // НОВИЙ ОБРОБНИК ПОДІЇ НАВЕДЕННЯ КУРСОРУ НА ФОРМУ СПОВІЩЕНЬ
  if (notificationsForm) {
    notificationsForm.addEventListener("mouseleave", () => {
      // При наведенні курсору на форму сповіщень
      if (unreadNotifications > 0) {
        // Обнуляємо, тільки якщо є непрочитані
        console.log("notificationHandler.js: Mouse entered notifications form. Clearing unread count and messages.");
        unreadNotifications = 0;
        updateNotificationCount(); // Оновлює лічильник та дзвіночок
        notificationList.innerHTML = ""; // <--- Це очищає при НАВЕДЕННІ
      }
    });
  }

  // Функція для оновлення лічильника сповіщень
  function updateNotificationCount(count) {
    if (notificationCount) {
      notificationCount.textContent = count > 0 ? count : "";
      notificationCount.style.display = count > 0 ? "block" : "none";
    }
    if (bellIcon) {
      if (count > 0) {
        bellIcon.classList.add("has-notifications"); // Додайте клас для стилізації
      } else {
        bellIcon.classList.remove("has-notifications");
      }
    }
  }

  async function loadUnreadMessages() {
    const username = localStorage.getItem("username");
    console.log("notificationHandler.js: Loading unread messages for user:", username);

    if (!username || username === "Guest") {
      console.log("notificationHandler.js: User not logged in or is Guest, skipping unread messages load.");
      updateNotificationCount(0);
      notificationList.innerHTML = "<li>You are not logged in.</li>";
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/unread-messages/${username}`);
      if (!response.ok) {
        // Логуємо деталі помилки HTTP
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const unreadMessages = await response.json();
      console.log("notificationHandler.js: Fetched unread messages:", unreadMessages);

      notificationList.innerHTML = ""; // Очищаємо список перед відображенням
      if (unreadMessages.length === 0) {
        notificationList.innerHTML = "<li>No unread messages.</li>";
      } else {
        unreadMessages.forEach((msg) => {
          displayNotification(msg);
        });
      }
      updateNotificationCount(unreadMessages.length);
    } catch (error) {
      console.error("notificationHandler.js: Error loading unread messages:", error);
      notificationList.innerHTML = "<li>Error loading unread messages. Please try again.</li>";
      updateNotificationCount(0);
    }
  }

  // При завантаженні сторінки завантажуємо непрочитані повідомлення
  loadUnreadMessages();

  // Слухач подій для кнопки сповіщень
  if (notificationsButton) {
    notificationsButton.addEventListener("click", () => {
      if (notificationsForm) {
        notificationsForm.classList.toggle("show");
        if (notificationsForm.classList.contains("show")) {
          // Якщо форма відкривається, оновити повідомлення (можливо, прочитати їх)
          loadUnreadMessages(); // Завантажуємо їх знову при відкритті, щоб показати актуальні
        }
      }
    });
  }

  // Слухаємо подію "receive_message" від сервера
  socket.on("receive_message", (data) => {
    console.log("notificationHandler.js: Received message on dashboard:", data);
    loadUnreadMessages();
  });

  socket.on("unread_count_updated", () => {
    console.log("notificationHandler.js: Unread count updated by server, reloading unread messages.");
    loadUnreadMessages();
  });

  // Функція для додавання нового сповіщення до форми
  // Додаємо новий параметр 'room'
  function addNotification(author, message, room) {
    if (!notificationList) {
      console.error("notificationHandler.js: Cannot add notification, #notification-list is missing!");
      return;
    }

    const notificationElement = document.createElement("div");
    notificationElement.classList.add("message");
    notificationElement.dataset.room = room; // <--- Зберігаємо назву кімнати як data-атрибут

    notificationElement.innerHTML = `
      <i class="fa-solid fa-circle-user user-icon"></i>
      <div class="message-content">
        <p class="user-name">${author}</p>
        <p class="user-message">${message}</p>
      </div>
    `;

    // Додаємо обробник кліку до кожного повідомлення
    notificationElement.addEventListener("click", () => {
      console.log(`notificationHandler.js: Notification clicked for room: ${room}`);
      localStorage.setItem("selectedChatRoom", room); // Зберігаємо назву кімнати в localStorage
      window.location.href = "./messages.html"; // Перенаправляємо на сторінку чату
    });

    notificationList.prepend(notificationElement);
  }

  // Отримуємо ім'я користувача та userId при завантаженні сторінки
  const storedUsername = localStorage.getItem("username");
  const storedUserId = localStorage.getItem("userId");

  if (storedUsername) {
    if (userNameElement) {
      userNameElement.textContent = storedUsername;
    }
    const roomToJoin = "general_chat";
    // Передаємо username, оскільки recipient в UnreadMessage - це login
    socket.emit("join_room", { room: roomToJoin, username: storedUsername }); // <<<< ВИПРАВЛЕНО ТУТ
    console.log(`notificationHandler.js: Attempting to join room: ${roomToJoin} with username: ${storedUsername}`);
  } else {
    console.log("notificationHandler.js: User not logged in, not attempting to join room.");
  }

  // Логіка для виходу з системи
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("username");
      localStorage.removeItem("userId");
      // Також очищаємо вибраний чат при виході
      localStorage.removeItem("selectedChatRoom");
      socket.disconnect();
      window.location.href = "./index.html";
    });
  }

  // Ініціалізуємо стан дзвіночка при завантаженні сторінки
  updateBellIcon();
});
