/* jshint esversion: 11 */

const API_BASE_URL = "http://localhost/Programming-in-the-inthernet/api/students";
const API_BASE_URL_NODE = "http://localhost:3000/api";
let IS_LOGGED_IN = false;

let currentPage = 1;
const rowsPerPage = 5;

let students = [];
let selectedStudentIds = new Set();

document.addEventListener("DOMContentLoaded", () => {
  const isLoggedInStored = localStorage.getItem("isLoggedIn") === "true";
  const storedUsername = localStorage.getItem("username");

  if (isLoggedInStored && storedUsername) {
    IS_LOGGED_IN = true;
    profileNameButton.textContent = storedUsername;
    updateStudentsOnServer(); // Load students immediately
  }

  const selectedRoomFromDashboard = localStorage.getItem("selectedChatRoom");
  if (selectedRoomFromDashboard) {
    currentRoom = selectedRoomFromDashboard; // Встановлюємо цю кімнату як поточну
    localStorage.removeItem("selectedChatRoom"); // Очищаємо, щоб не переходити щоразу
    console.log(`chat.js: Initializing with selected room from dashboard: ${currentRoom}`);
  } else {
    console.log(`chat.js: No specific room selected, defaulting to: ${currentRoom}`);
  }
});

// DOM Elements
const studentsTable = document.getElementById("students-table");
const notificationsButton = document.getElementById("notifications-button");
const notificationsForm = document.getElementById("notifications-form");
const profileNameButton = document.getElementById("user-name");
const profileIconButton = document.getElementById("user-logo");

const selectAllCheckbox = document.getElementById("select-all");
const deleteSelectedStudentsButton = document.getElementById("delete-selected-students-btn");
const addStudentButton = document.getElementById("add-student-btn");

const addStudentModalWrapper = document.getElementById("add-student");
const addStudentForm = document.getElementById("add-student-form-body");
const closeAddStudentFormButton = document.getElementById("close-add-student-form-btn");
const cancelAddStudentFormButton = document.getElementById("cancel-add-student-form-btn");
const deleteWarnStudentForm = document.getElementById("delete-warn-student-form");

const confirmDeleteSelectedStudentsForm = document.getElementById("confirm-delete-selected-students-form");
const confirmDeleteSelectedStudentsButton = document.getElementById("confirm-delete-selected-students-btn");
const cancelDeleteSelectedStudentsButton = document.getElementById("cancel-delete-selected-students-btn");

const deleteWarnStudentFormText = deleteWarnStudentForm ? deleteWarnStudentForm.querySelector("h2") : null;
const deleteDeleteStudentFormButton = document.getElementById("delete-delete-warn-student-form-btn");
const cancelDeleteStudentFormButton = document.getElementById("cancel-delete-warn-student-form-btn");

const paginationContainer = document.getElementById("pagination-container");

const loginBtn = document.getElementById("loginBtn");
const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

const profileLogOutButton = document.getElementById("profile-log-out-btn");

profileNameButton.onclick = () => {
  if (profileNameButton.textContent == "Login") {
    loginModal.style.display = "flex";
  }
};

const closeOnClickOutside = (event) => {
  const modal = document.getElementById("profile-form");
  if (!modal.contains(event.target) && event.target !== profileNameButton && event.target !== profileIconButton) {
    hide(modal);
    profileNameButton.dataset.isProfileOpened = "false";
    document.removeEventListener("click", closeOnClickOutside);
  }
};

loginForm.onsubmit = async (e) => {
  e.preventDefault();

  const formData = {
    login: loginForm.querySelector('[name="login"]').value,
    password: loginForm.querySelector('[name="password"]').value,
  };

  try {
    const response = await fetch(`${API_BASE_URL_NODE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      loginModal.style.display = "none";
      const modal = document.getElementById("profile-form");
      hide(modal);
      profileNameButton.textContent = formData.login;
      errorMsg.textContent = "";
      updateStudentsOnServer();
      IS_LOGGED_IN = true;

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", formData.login); // Додайте цей рядок для збереження userId
      if (result.userId) {
        // Перевірка, чи userId присутній у відповіді
        localStorage.setItem("userId", result.userId);
      }

      loginForm.reset();
    } else {
      errorMsg.textContent = result.message || "Невірний логін або пароль";
    }
  } catch (error) {
    console.error("Login error:", error);
    errorMsg.textContent = "Сталася помилка під час входу";
  }
};

// // Profile button click handler
// profileNameButton.onclick = (event) => {
//   if (!IS_LOGGED_IN) {
//     loginModal.style.display = "flex";
//   } else {
//     const modal = document.getElementById("profile-form");
//     const isProfileOpened = profileNameButton.dataset.isProfileOpened === "true";
//     if (isProfileOpened) {
//       hide(modal);
//       profileNameButton.dataset.isProfileOpened = "false";
//       document.removeEventListener("click", closeOnClickOutside);
//     } else {
//       show(modal);
//       profileNameButton.dataset.isProfileOpened = "true";
//       setTimeout(() => {
//         document.addEventListener("click", closeOnClickOutside);
//       }, 0);
//     }
//     event.stopPropagation(); // Додано для запобігання закриттю модального вікна одразу після відкриття (якщо closeOnClickOutside прив'язаний до document)
//   }
// };

let closeTimeout;

// Notification button interactions
notificationsButton.addEventListener("mouseenter", () => {
  if (IS_LOGGED_IN) {
    notificationsButton.classList.remove("fa-solid");
    notificationsButton.classList.add("fa-regular");
  }
});

// Checkbox for selecting all students
if (selectAllCheckbox) {
  selectAllCheckbox.addEventListener("change", () => {
    const isChecked = selectAllCheckbox.checked;

    if (isChecked) {
      // Add all student IDs to the selected set
      students.forEach((student) => selectedStudentIds.add(student.id));
    } else {
      // Clear all selections
      selectedStudentIds.clear();
    }

    // Update checkboxes on current page
    updateCheckboxStates();
  });

  studentsTable.addEventListener("change", (event) => {
    if (event.target.type === "checkbox" && event.target.id !== "select-all") {
      const studentId = parseInt(event.target.dataset.id);
      if (event.target.checked) {
        selectedStudentIds.add(studentId);
      } else {
        selectedStudentIds.delete(studentId);
      }

      // Update select-all checkbox state
      selectAllCheckbox.checked = selectedStudentIds.size === students.length;
    }
  });
}

function updateCheckboxStates() {
  const checkboxes = studentsTable.querySelectorAll("tbody input[type='checkbox']");
  checkboxes.forEach((checkbox) => {
    const studentId = parseInt(checkbox.dataset.id);
    checkbox.checked = selectedStudentIds.has(studentId);
  });

  // Update select-all checkbox state
  selectAllCheckbox.checked = selectedStudentIds.size === students.length && students.length > 0;
}

// Delete selected students functionality
if (deleteSelectedStudentsButton) {
  deleteSelectedStudentsButton.addEventListener("click", () => {
    if (IS_LOGGED_IN) {
      const selectedStudents = getSelectedStudents();
      if (selectedStudents.length === 0) {
        showNotification("No selected items in table.");
        return;
      }

      const studentsList = selectedStudents.map((student) => `${student.name} ${student.surname}`).join(", ");
      confirmDeleteSelectedStudentsForm.querySelector("h2").innerHTML = `
      Delete ${selectedStudents.length} students?<br>
      <small>${studentsList}</small>
    `;
      show(confirmDeleteSelectedStudentsForm);
    }
  });

  confirmDeleteSelectedStudentsButton.addEventListener("click", async () => {
    const selectedStudents = getSelectedStudents();
    try {
      const deletePromises = selectedStudents.map((student) =>
        fetch(`${API_BASE_URL}/${student.id}`, { method: "DELETE" })
      );

      await Promise.all(deletePromises);

      students = students.filter((student) => !selectedStudents.some((s) => s.id === student.id));
      selectedStudents.forEach((student) => selectedStudentIds.delete(student.id));
      updateTable();
      selectAllCheckbox.checked = false;
      hide(confirmDeleteSelectedStudentsForm);
      showNotification(`${selectedStudents.length} students deleted successfully`);
    } catch (error) {
      handleApiError(error, "Failed to delete students");
    }
  });

  cancelDeleteSelectedStudentsButton.addEventListener("click", () => {
    hide(confirmDeleteSelectedStudentsForm);
  });
}

if (notificationsButton) {
  notificationsButton.addEventListener("dblclick", () => {
    if (IS_LOGGED_IN) {
      notificationsButton.animate(
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
      setTimeout(() => {
        window.location.href = "./messages.html";
      }, 500);
    }
  });
  notificationsButton.addEventListener("mouseover", () => {
    if (IS_LOGGED_IN) {
      show(notificationsForm);
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
    }
  });

  notificationsButton.addEventListener("mouseleave", () => {
    closeTimeout = setTimeout(() => {
      if (!notificationsForm.matches(":hover")) {
        hide(notificationsForm);
      }
    }, 300);
  });

  notificationsForm.addEventListener("mouseenter", () => {
    show(notificationsForm);
    if (closeTimeout) {
      clearTimeout(closeTimeout);
    }
  });

  notificationsForm.addEventListener("mouseleave", () => {
    closeTimeout = setTimeout(() => {
      hide(notificationsForm);
    }, 300);
  });
}

// Profile button interactions
if (profileNameButton || profileIconButton) {
  const toggleModal = (event) => {
    if (!IS_LOGGED_IN) return;
    const modal = document.getElementById("profile-form");
    const isProfileOpened = profileNameButton.dataset.isProfileOpened === "true";

    if (isProfileOpened) {
      hide(modal);
      profileNameButton.dataset.isProfileOpened = "false";
      document.removeEventListener("click", closeOnClickOutside);
    } else {
      show(modal);
      profileNameButton.dataset.isProfileOpened = "true";
      setTimeout(() => {
        document.addEventListener("click", closeOnClickOutside);
      }, 0);
    }
    event.stopPropagation();
  };

  profileNameButton.addEventListener("click", toggleModal);
  profileIconButton.addEventListener("click", toggleModal);
}
//flidutoieudgf
profileLogOutButton.addEventListener("click", () => {
  profileNameButton.textContent = "Login";
  IS_LOGGED_IN = false;
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("username");
  clearStudentsTable();
  const modal = document.getElementById("profile-form");
  selectedStudentIds.clear();
  hide(modal);
});

// // Helper functions
// function show(element) {
//   element.classList.remove("hidden");
// }

// function hide(element) {
//   element.classList.add("hidden");
// }

// function clearStudentsTable() {
//   const tbody = document.querySelector("#students-table tbody");
//   tbody.innerHTML = "";
// }

// Student form handling
if (addStudentButton && addStudentForm) {
  addStudentButton.addEventListener("click", () => {
    if (IS_LOGGED_IN) {
      document.getElementById("student-id").value = "";
      addStudentModalWrapper.querySelector("h2").textContent = "Add Student";
      addStudentForm.reset();
      clearFieldErrors();
      show(addStudentModalWrapper);
    }
  });

  addStudentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const studentData = Object.fromEntries(formData);
    const studentId = document.getElementById("student-id").value;

    if (validateStudentData(studentData)) {
      try {
        const url = studentId ? `${API_BASE_URL}/${studentId}` : API_BASE_URL;
        const method = studentId ? "PUT" : "POST";

        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...studentData,
            status: "inactive",
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          // Обробка помилок від сервера
          throw new Error(result.error || "Failed to save student");
        }

        // Якщо успішно - оновлюємо таблицю та закриваємо модальне вікно
        hide(addStudentModalWrapper);
        updateStudentsOnServer();
        showNotification("Student saved successfully");
      } catch (error) {
        // Виводимо помилку з сервера на фронтенд
        showNotification(error.message);

        // Якщо це помилка про дублікат, можна підсвітити відповідні поля
        if (error.message.includes("Студент з таким ім'ям та датою народження вже існує")) {
          highlightDuplicateFields();
        }
      }
    } else {
      highlightInvalidFields(studentData);
    }
  });

  cancelAddStudentFormButton.addEventListener("click", () => hide(addStudentModalWrapper));
  closeAddStudentFormButton.addEventListener("click", () => hide(addStudentModalWrapper));
}

function highlightDuplicateFields() {
  const nameField = addStudentForm.querySelector('[name="name"]');
  const birthdayField = addStudentForm.querySelector('[name="birthday"]');

  nameField.classList.add("error-field");
  birthdayField.classList.add("error-field");

  const errorElement = document.createElement("div");
  errorElement.className = "error-message";
  errorElement.textContent = "Студент з такими даними вже існує";
  addStudentForm.appendChild(errorElement);

  setTimeout(() => {
    nameField.classList.remove("error-field");
    birthdayField.classList.remove("error-field");
    errorElement.remove();
  }, 3000);
}

// Server communication functions
async function updateStudentsOnServer() {
  setLoading(true);
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error("Failed to fetch students");
    students = await response.json();
    updateTable();
  } catch (error) {
    handleApiError(error, "Failed to load students");
  } finally {
    setLoading(false);
  }
}

async function addStudent(studentData) {
  setLoading(true);
  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...studentData,
        status: "inactive",
      }),
    });

    if (!response.ok) throw new Error("Failed to add student");

    const newStudent = await response.json();
    students.push(newStudent);
    updateTable();
    showNotification("Student added successfully");
    return newStudent;
  } catch (error) {
    handleApiError(error, "Failed to add student");
    throw error;
  } finally {
    setLoading(false);
  }
}

async function updateStudent(id, newData) {
  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...newData, status: "active" }),
    });

    if (!response.ok) throw new Error("Failed to update student");

    const updatedStudent = await response.json();
    const index = students.findIndex((student) => student.id == id);
    if (index !== -1) {
      students[index] = updatedStudent;
      updateTable();
      showNotification("Student updated successfully");
    }
    return updatedStudent;
  } catch (error) {
    handleApiError(error, "Failed to update student");
    throw error;
  } finally {
    setLoading(false);
  }
}

// Helper functions
function getSelectedStudents() {
  return students.filter((student) => selectedStudentIds.has(student.id));
}

function validateStudentData({ group, name, surname, gender, birthday }) {
  let isValid = true;
  const nameRegex = /^[A-Za-zА-Яа-яЁёЇїІіЄєҐґ\s'-]+$/u;

  if (!group?.trim()) isValid = false;
  if (!name?.trim() || !nameRegex.test(name)) isValid = false;
  if (!surname?.trim() || !nameRegex.test(surname)) isValid = false;
  if (!gender) isValid = false;

  if (birthday) {
    const birthDate = new Date(birthday);
    const minDate = new Date("1900-01-01");
    const currentDate = new Date();
    const maxDate = new Date(currentDate.getFullYear() - 15, currentDate.getMonth(), currentDate.getDate());

    if (isNaN(birthDate.getTime()) || birthDate < minDate || birthDate > maxDate) {
      isValid = false;
    }
  } else {
    isValid = false;
  }

  return isValid;
}

function highlightInvalidFields(studentData) {
  const nameRegex = /^[A-Za-zА-Яа-яЁёЇїІіЄєҐґ\s'-]+$/u;
  clearFieldErrors();

  const fieldValidations = {
    group: {
      isValid: !!studentData.group?.trim(),
      errorMessage: "Group is required",
    },
    name: {
      isValid: studentData.name?.trim() && nameRegex.test(studentData.name),
      errorMessage: studentData.name?.trim() ? "Name contains unacceptable characters" : "Name is required",
    },
    surname: {
      isValid: studentData.surname?.trim() && nameRegex.test(studentData.surname),
      errorMessage: studentData.surname?.trim() ? "Surname contains unacceptable characters" : "Surname is required",
    },
    gender: {
      isValid: !!studentData.gender,
      errorMessage: "Select gender",
    },
    birthday: {
      isValid: (() => {
        if (!studentData.birthday) return false;
        const birthDate = new Date(studentData.birthday);
        if (isNaN(birthDate.getTime())) return false;
        const minDate = new Date("1900-01-01");
        const currentDate = new Date();
        const maxDate = new Date(currentDate.getFullYear() - 15, currentDate.getMonth(), currentDate.getDate());
        return birthDate >= minDate && birthDate <= maxDate;
      })(),
      errorMessage: (() => {
        if (!studentData.birthday) return "Date of birth is required";
        const birthDate = new Date(studentData.birthday);
        if (isNaN(birthDate.getTime())) return "Invalid date format";
        const currentDate = new Date();
        const maxDate = new Date(currentDate.getFullYear() - 15, currentDate.getMonth(), currentDate.getDate());
        return `Date must be between 01.01.1900 and ${maxDate.toLocaleDateString()}`;
      })(),
    },
  };

  Object.entries(fieldValidations).forEach(([fieldName, validation]) => {
    const inputField = addStudentForm.querySelector(`[name="${fieldName}"]`);
    if (inputField && !validation.isValid) {
      const fieldContainer = inputField.closest(".form-field") || inputField.parentNode;
      inputField.classList.add("error-field");

      let errorElement = fieldContainer.querySelector(".error-message");
      if (!errorElement) {
        errorElement = document.createElement("div");
        errorElement.className = "error-message";
        fieldContainer.insertBefore(errorElement, inputField);
      }
      errorElement.textContent = validation.errorMessage;

      inputField.addEventListener(
        "focus",
        () => {
          inputField.classList.remove("error-field");
          if (errorElement) errorElement.remove();
        },
        { once: true }
      );
    }
  });
}

function clearFieldErrors() {
  const errorMessages = addStudentForm.querySelectorAll(".error-message");
  errorMessages.forEach((msg) => msg.remove());
  const fields = addStudentForm.querySelectorAll("input, select");
  fields.forEach((field) => field.classList.remove("error-field"));
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function updateTable() {
  const tbody = studentsTable.querySelector("tbody");
  tbody.innerHTML = "";

  // Розрахунок пагінації
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedStudents = students.slice(startIndex, endIndex);
  const totalPages = Math.ceil(students.length / rowsPerPage);

  // Заповнення таблиці даними для поточної сторінки
  paginatedStudents.forEach((student) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" data-id="${student.id}"></td>
      <td class="hidden-id hidden">${student.id}</td>
      <td>${student.group}</td>
      <td>${student.name} ${student.surname}</td>
      <td>${student.gender}</td>
      <td>${student.birthday}</td>
      <td>
        <i class="fa fa-circle" style="color: ${student.status === "active" ? "#6b9a67" : "#d8d8d8"}"></i>
      </td>
      <td class="table_buttons">
          <button class="table-student-btn edit-btn" data-id="${student.id}">
              <i class="fa fa-pencil btn__icon"></i>
          </button>
          <button class="table-student-btn delete-btn" data-id="${student.id}">
              <i class="fa-solid fa-trash"></i>
          </button>
      </td>
    `;

    // Додаємо обробники подій (як у вашому оригінальному коді)
    tr.querySelector(".delete-btn").addEventListener("click", (event) => {
      const studentId = parseInt(event.target.closest(".delete-btn").dataset.id);
      const student = students.find((s) => s.id === studentId);
      if (!student) return;

      deleteWarnStudentFormText.innerHTML = `Delete student:<br><b>${student.name} ${student.surname}</b>?`;
      show(deleteWarnStudentForm);

      deleteDeleteStudentFormButton.onclick = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/${studentId}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error("Failed to delete student");

          students = students.filter((s) => s.id !== studentId);
          // Після видалення перевіряємо, чи не порожня сторінка
          if (paginatedStudents.length === 1 && currentPage > 1) {
            currentPage--;
          }
          updateTable();
          hide(deleteWarnStudentForm);
          showNotification("Student deleted successfully");
        } catch (error) {
          handleApiError(error, "Failed to delete student");
        }
      };
    });

    tr.querySelector(".edit-btn").addEventListener("click", () => {
      addStudentForm.reset();
      clearFieldErrors();
      document.getElementById("student-id").value = student.id;
      document.getElementById("group").value = student.group;
      document.getElementById("name").value = student.name;
      document.getElementById("surname").value = student.surname;
      document.getElementById("gender").value = student.gender;
      document.getElementById("birthday").value = student.birthday;
      addStudentModalWrapper.querySelector("h2").textContent = "Edit Student";
      show(addStudentModalWrapper);
    });

    tbody.appendChild(tr);
  });
  createPaginationControls(totalPages);
  updateCheckboxStates();
}

function createPaginationControls(totalPages) {
  paginationContainer.innerHTML = "";

  if (totalPages <= 1) return; // Не показувати пагінацію, якщо всього одна сторінка

  // Кнопка "Попередня"
  const prevButton = document.createElement("button");
  prevButton.innerHTML = "&laquo;";
  prevButton.className = "pagination-btn";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      updateTable();
    }
  });
  paginationContainer.appendChild(prevButton);

  // Нумерація сторінок
  const maxVisiblePages = 5; // Максимальна кількість видимих кнопок сторінок
  let startPage, endPage;

  if (totalPages <= maxVisiblePages) {
    startPage = 1;
    endPage = totalPages;
  } else {
    const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
    const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;

    if (currentPage <= maxPagesBeforeCurrent) {
      startPage = 1;
      endPage = maxVisiblePages;
    } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
      startPage = totalPages - maxVisiblePages + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - maxPagesBeforeCurrent;
      endPage = currentPage + maxPagesAfterCurrent;
    }
  }

  // Додавання кнопок сторінок
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.className = "pagination-btn";
    if (i === currentPage) {
      pageButton.classList.add("active");
    }
    pageButton.addEventListener("click", () => {
      currentPage = i;
      updateTable();
    });
    paginationContainer.appendChild(pageButton);
  }

  // Кнопка "Наступна"
  const nextButton = document.createElement("button");
  nextButton.innerHTML = "&raquo;";
  nextButton.className = "pagination-btn";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      updateTable();
    }
  });
  paginationContainer.appendChild(nextButton);
}

function clearStudentsTable() {
  const tbody = studentsTable.querySelector("tbody");
  tbody.innerHTML = "";
  if (paginationContainer) {
    paginationContainer.innerHTML = "";
  }

  // Скинути поточну сторінку
  currentPage = 1;
}

function handleApiError(error, defaultMessage = "An error occurred") {
  console.error("API Error:", error);
  const message = error.message || defaultMessage;
  //showNotification(message);
  return null;
}

function setLoading(isLoading) {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.display = isLoading ? "block" : "none";
  }
  document.body.style.cursor = isLoading ? "wait" : "default";
}

function show(modalWindow) {
  modalWindow?.classList.remove("hidden");
}

function hide(modalWindow) {
  modalWindow?.classList.add("hidden");
}

// Initialize delete warning cancel button
document.getElementById("cancel-delete-warn-student-form-btn").addEventListener("click", () => {
  hide(deleteWarnStudentForm);
});
