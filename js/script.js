const studentsTable = document.getElementById("students-table");
const notificationButton = document.getElementById("notifications-button");
const profileButton = document.getElementById("user-name");
const addStudentButton = document.getElementById("add-student-btn");
const addStudentModalWrapper = document.getElementById("add-student");
const addStudentForm = document.getElementById("add-student-form");
const cancelAddStudentButton = document.getElementById("add-student-btn-close");
const deleteWarnModal = document.getElementById("delete-warn-student");
const notificationModal = document.getElementById("modal-notifications");

if (notificationButton) {
  notificationButton.addEventListener("dblclick", () => {
    notificationButton.animate(
      [
        { transform: "rotate(0)" },
        { transform: "rotate(-30deg)" },
        { transform: "rotate(30deg)" },
        { transform: "rotate(0)" },
      ],
      {
        duration: 500,
        iterations: 1,
      }
    );
  });

  notificationButton.addEventListener("mouseover", () => {
    show(notificationModal);
  });

  notificationButton.addEventListener("mouseleave", () => {
    hide(notificationModal);
  });
}

if (profileButton) {
  profileButton.addEventListener("click", () => {
    const isProfileOpened = profileButton.dataset.isProfileOpened === "true";
    profileButton.dataset.isProfileOpened = !isProfileOpened;
    isProfileOpened
      ? hide(document.getElementById("modal-profile"))
      : show(document.getElementById("modal-profile"));
  });
}

if (addStudentButton && addStudentForm) {
  addStudentButton.addEventListener("click", () => {
    addStudentForm.reset(); // Очищаємо поля форми при відкритті
    clearFieldErrors(); // Очищаємо помилки підсвічування
    show(addStudentModalWrapper);
  });

  addStudentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const studentData = Object.fromEntries(formData);

    if (validateStudentData(studentData)) {
      addStudent(studentData);
      hide(addStudentModalWrapper);
    } else {
      showNotification("Please fill in all fields correctly.");
      highlightInvalidFields(studentData); // Підсвічуємо невалідні поля
    }
  });

  cancelAddStudentButton.addEventListener("click", () =>
    hide(addStudentModalWrapper)
  );
}

// Валідація даних
function validateStudentData({ group, name, surname, gender, birthday }) {
  let isValid = true;

  if (!group?.trim()) isValid = false;
  if (!name?.trim()) isValid = false;
  if (!surname?.trim()) isValid = false;
  if (!gender) isValid = false;
  if (!birthday) isValid = false;

  return isValid;
}

// Підсвічуємо невалідні поля
function highlightInvalidFields(studentData) {
  const fields = ["group", "name", "surname", "gender", "birthday"];

  fields.forEach((field) => {
    if (!studentData[field]?.trim()) {
      const inputField = addStudentForm.querySelector(`[name="${field}"]`);
      if (inputField) {
        inputField.classList.add("error-field");
        inputField.addEventListener(
          "focus",
          () => {
            inputField.classList.remove("error-field");
          },
          { once: true }
        );
      }
    }
  });
}

// Очищаємо всі помилки підсвічування
function clearFieldErrors() {
  const fields = addStudentForm.querySelectorAll("input, select");
  fields.forEach((field) => field.classList.remove("error-field"));
}

// Показуємо повідомлення
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Додаємо студента до таблиці
function addStudent({ group, name, surname, gender, birthday }) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td><input type="checkbox"></td>
    <td>${group}</td>
    <td>${name} ${surname}</td>
    <td>${gender}</td>
    <td>${birthday}</td>
    <td><i class="fa fa-circle" style="color: #d8d8d8;"></i></td>
    <td class="table_buttons">
      <button class="student__btn edit-btn">
        <i class="fa fa-pencil btn__icon" aria-hidden="true"></i>
      </button>
      <button class="student__btn delete-btn">
        <i class="fa-solid fa-trash" aria-hidden="true"></i>
      </button>
    </td>
  `;

  studentsTable.querySelector("tbody").appendChild(tr);

  tr.querySelector(".delete-btn").addEventListener("click", () => {
    show(deleteWarnModal);
    const currentStudent = tr;

    document
      .getElementById("cancel-modal-btn")
      .addEventListener("click", () => hide(deleteWarnModal));
    document
      .getElementById("delete-modal-btn")
      .addEventListener("click", () => {
        currentStudent.remove();
        hide(deleteWarnModal);
      });
  });

  tr.querySelector(".edit-btn").addEventListener("click", () => {
    console.log("Edit button clicked");
  });
}

// Показуємо модальне вікно
function show(modalWindow) {
  modalWindow?.classList.remove("hidden");
}

// Ховаємо модальне вікно
function hide(modalWindow) {
  modalWindow?.classList.add("hidden");
}
