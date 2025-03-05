const studentsTable = document.getElementById("students-table");
const notificationButton = document.getElementById("notifications-button");
const profileButton = document.getElementById("user-name");
const addStudentButton = document.getElementById("add-student-btn");
const addStudentModalWrapper = document.getElementById("add-student");
const addStudentForm = document.getElementById("add-student-form");
const cancelAddStudentButton = document.getElementById("add-student-btn-close");
const deleteWarnModal = document.getElementById("delete-warn-student");
const notificationModal = document.getElementById("modal-notifications");

const selectAllCheckbox = document.getElementById("select-all");
const deleteSelectedButton = document.getElementById("delete-selected-btn");
const deleteConfirmModal = document.getElementById("delete-confirm-modal");
const confirmDeleteButton = document.getElementById("confirm-delete-btn");
const cancelDeleteButton = document.getElementById("cancel-delete-btn");
const cancelAddStudentButtonSmall = document.getElementById("close-modal-btn");
const notificationDot = document.getElementById("notification-dot");

notificationDot.style.display = "block";

notificationButton.addEventListener("mouseenter", () => {
  notificationDot.style.display = "none";
});

notificationButton.addEventListener("mouseleave", () => {});

if (selectAllCheckbox) {
  selectAllCheckbox.addEventListener("change", () => {
    const isChecked = selectAllCheckbox.checked;
    const checkboxes = studentsTable.querySelectorAll(
      "tbody input[type='checkbox']"
    );

    checkboxes.forEach((checkbox) => {
      checkbox.checked = isChecked;
    });
  });

  studentsTable.addEventListener("change", (event) => {
    if (event.target.type === "checkbox" && event.target.id !== "select-all") {
      const checkboxes = studentsTable.querySelectorAll(
        "tbody input[type='checkbox']"
      );
      const checkedCheckboxes = studentsTable.querySelectorAll(
        "tbody input[type='checkbox']:checked"
      );

      // Якщо всі вибрані вручну, встановлюємо головний чекбокс
      selectAllCheckbox.checked =
        checkboxes.length === checkedCheckboxes.length;
    }
  });
}

if (deleteSelectedButton) {
  deleteSelectedButton.addEventListener("click", () => {
    const checkboxes = studentsTable.querySelectorAll(
      "tbody input[type='checkbox']:checked"
    );

    if (checkboxes.length === 0) {
      showNotification("No selected items of table.");
      return;
    }

    // Показуємо модальне вікно підтвердження
    show(deleteConfirmModal);
  });

  confirmDeleteButton.addEventListener("click", () => {
    const checkboxes = studentsTable.querySelectorAll(
      "tbody input[type='checkbox']:checked"
    );

    checkboxes.forEach((checkbox) => {
      checkbox.closest("tr").remove();
    });

    // Після видалення знімаємо головний чекбокс
    selectAllCheckbox.checked = false;

    // Ховаємо модальне вікно
    hide(deleteConfirmModal);
  });

  cancelDeleteButton.addEventListener("click", () => {
    // Просто закриваємо модальне вікно
    hide(deleteConfirmModal);
  });
}

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
  profileButton.addEventListener("click", (event) => {
    const modal = document.getElementById("modal-profile");
    const isProfileOpened = profileButton.dataset.isProfileOpened === "true";

    if (isProfileOpened) {
      hide(modal);
      profileButton.dataset.isProfileOpened = "false";
      document.removeEventListener("click", closeOnClickOutside);
    } else {
      show(modal);
      profileButton.dataset.isProfileOpened = "true";

      // Додаємо обробник для кліка поза модальним вікном
      setTimeout(() => {
        document.addEventListener("click", closeOnClickOutside);
      }, 0);
    }

    event.stopPropagation(); // Запобігаємо спрацюванню document.click одразу
  });

  function closeOnClickOutside(event) {
    const modal = document.getElementById("modal-profile");
    if (!modal.contains(event.target) && event.target !== profileButton) {
      hide(modal);
      profileButton.dataset.isProfileOpened = "false";
      document.removeEventListener("click", closeOnClickOutside);
    }
  }
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

  cancelAddStudentButtonSmall.addEventListener("click", () =>
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
