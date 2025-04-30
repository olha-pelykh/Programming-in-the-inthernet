/* jshint esversion: 11 */

const API_BASE_URL = "http://localhost/Programming-in-the-inthernet/api/students/";
let IS_LOGGED_IN = false;

let students = [];

document.addEventListener("DOMContentLoaded", () => {
  //updateStudentsOnServer();
  const isLoggedInStored = localStorage.getItem("isLoggedIn") === "true";
  const storedUsername = localStorage.getItem("username");

  if (isLoggedInStored && storedUsername) {
    IS_LOGGED_IN = true;
    profileNameButton.textContent = storedUsername;
    updateStudentsOnServer(); // Завантажити студентів одразу
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

loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(loginForm);

  const response = await fetch("login.php", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (response.ok && result.status === "success") {
    loginModal.style.display = "none";
    profileNameButton.textContent = formData.get("login");
    errorMsg.textContent = "";
    updateStudentsOnServer();
    IS_LOGGED_IN = true;

    const username = formData.get("login");
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("username", username);
  } else {
    errorMsg.textContent = result.message || "Login failed";
  }
};

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
    const checkboxes = studentsTable.querySelectorAll("tbody input[type='checkbox']");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = isChecked;
    });
  });

  studentsTable.addEventListener("change", (event) => {
    if (event.target.type === "checkbox" && event.target.id !== "select-all") {
      const checkboxes = studentsTable.querySelectorAll("tbody input[type='checkbox']");
      const checkedCheckboxes = studentsTable.querySelectorAll("tbody input[type='checkbox']:checked");
      selectAllCheckbox.checked = checkboxes.length === checkedCheckboxes.length;
    }
  });
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

  const closeOnClickOutside = (event) => {
    const modal = document.getElementById("profile-form");
    if (!modal.contains(event.target) && event.target !== profileNameButton && event.target !== profileIconButton) {
      hide(modal);
      profileNameButton.dataset.isProfileOpened = "false";
      document.removeEventListener("click", closeOnClickOutside);
    }
  };
}
//flidutoieudgf
profileLogOutButton.addEventListener("click", () => {
  profileNameButton.textContent = "Login";
  IS_LOGGED_IN = false;
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("username");
  clearStudentsTable();
  const modal = document.getElementById("profile-form");
  hide(modal);
});

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
        if (studentId) {
          await updateStudent(studentId, studentData);
        } else {
          await addStudent(studentData);
        }
        hide(addStudentModalWrapper);
      } catch (error) {
        handleApiError(error, "Failed to save student");
      }
    } else {
      highlightInvalidFields(studentData);
    }
  });

  cancelAddStudentFormButton.addEventListener("click", () => hide(addStudentModalWrapper));
  closeAddStudentFormButton.addEventListener("click", () => hide(addStudentModalWrapper));
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
  return Array.from(studentsTable.querySelectorAll('tbody input[type="checkbox"]:checked'))
    .map((checkbox) => {
      const studentId = parseInt(checkbox.dataset.id);
      return students.find((student) => student.id === studentId);
    })
    .filter((student) => student !== undefined);
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

  students.forEach((student) => {
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
}

function clearStudentsTable() {
  const tbody = studentsTable.querySelector("tbody");
  tbody.innerHTML = "";
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
