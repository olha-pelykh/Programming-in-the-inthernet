/* jshint esversion: 6 */
/* jshint esversion: 11 */
let students = JSON.parse(localStorage.getItem("students")) || [];
if (!Array.isArray(students)) {
  students = [];
}
document.addEventListener("DOMContentLoaded", updateTable);

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

//const deleteWarnStudentFormText = document.getElementById("delete-warn-student-form-text");
const deleteDeleteStudentFormButton = document.getElementById("delete-delete-warn-student-form-btn");
const cancelDeleteStudentFormButton = document.getElementById("cancel-delete-warn-student-form-btn");

const deleteWarnStudentFormText = deleteWarnStudentForm.querySelector("h2");

let closeTimeout; // Variable to store the timer

//Show unsolid notification icon
notificationsButton.addEventListener("mouseenter", () => {
  notificationsButton.classList.remove("fa-solid");
  notificationsButton.classList.add("fa-regular");
});

//Hide unsolid notification icon
notificationsButton.addEventListener("mouseleave", () => {});

//Checkbox for selecting all students
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

      // If all are selected manually, set the master checkbox to checked
      selectAllCheckbox.checked = checkboxes.length === checkedCheckboxes.length;
    }
  });
}

//Delete selected students
if (deleteSelectedStudentsButton) {
  deleteSelectedStudentsButton.addEventListener("click", () => {
    const selectedStudents = getSelectedStudents();

    if (selectedStudents.length === 0) {
      showNotification("No selected items of table.");
      return;
    }

    const studentsList = selectedStudents.map((student) => `${student.name} ${student.surname}`).join(", ");

    confirmDeleteSelectedStudentsForm.querySelector("h2").innerHTML = `
      Delete ${selectedStudents.length} students?<br>
      <small>${studentsList}</small>
    `;

    show(confirmDeleteSelectedStudentsForm);
  });

  confirmDeleteSelectedStudentsButton.addEventListener("click", () => {
    const selectedStudents = getSelectedStudents();
    students = students.filter((student) => !selectedStudents.some((s) => s.id === student.id));

    updateLocalStorage();
    updateTable();
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
    hide(confirmDeleteSelectedStudentsForm);
  });

  cancelDeleteSelectedStudentsButton.addEventListener("click", () => {
    hide(confirmDeleteSelectedStudentsForm);
  });
}

// Helper function to get selected students
function getSelectedStudents() {
  return Array.from(studentsTable.querySelectorAll('tbody input[type="checkbox"]:checked'))
    .map((checkbox) => {
      const studentId = parseInt(checkbox.dataset.id);
      return students.find((student) => student.id === studentId);
    })
    .filter((student) => student !== undefined);
}

//Notitication button animation, showing notifications form and apen messages.html
if (notificationsButton) {
  notificationsButton.addEventListener("dblclick", () => {
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
      window.location.href = "messages.html";
    }, 500);
  });

  notificationsButton.addEventListener("mouseover", () => {
    show(notificationsForm);
    if (closeTimeout) {
      clearTimeout(closeTimeout);
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

if (profileNameButton || profileIconButton) {
  // Check if either the username or icon is present
  const toggleModal = (event) => {
    const modal = document.getElementById("profile-form");
    const isProfileOpened = profileNameButton.dataset.isProfileOpened === "true";

    if (isProfileOpened) {
      hide(modal);
      profileNameButton.dataset.isProfileOpened = "false";
      document.removeEventListener("click", closeOnClickOutside);
    } else {
      show(modal);
      profileNameButton.dataset.isProfileOpened = "true";

      // Add the click event listener to close the modal if clicking outside
      setTimeout(() => {
        document.addEventListener("click", closeOnClickOutside);
      }, 0);
    }

    event.stopPropagation(); // Prevent triggering the document click handler immediately
  };

  // Add event listeners to both the profile button and profile icon
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

if (addStudentButton && addStudentForm) {
  addStudentButton.addEventListener("click", () => {
    document.getElementById("student-id").value = "";
    console.log("Add student clicked");
    addStudentModalWrapper.querySelector("h2").textContent = "Add Student";
    addStudentForm.reset(); // Очищаємо поля форми при відкритті
    clearFieldErrors(); // Очищаємо помилки підсвічування
    show(addStudentModalWrapper);
  });

  addStudentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const studentData = Object.fromEntries(formData);
    const studentId = document.getElementById("student-id").value;

    if (validateStudentData(studentData)) {
      if (studentId) {
        updateStudent(studentId, studentData);
      } else {
        addStudent(studentData);
      }
      hide(addStudentModalWrapper);
    } else {
      // showNotification("Please fill in all fields correctly.");
      highlightInvalidFields(studentData);
    }
  });

  cancelAddStudentFormButton.addEventListener("click", () => hide(addStudentModalWrapper));
  closeAddStudentFormButton.addEventListener("click", () => hide(addStudentModalWrapper));
}

function updateStudent(id, newData) {
  const index = students.findIndex((student) => student.id == id);
  if (index !== -1) {
    const originalStudent = students[index];
    const updatedStudent = {
      ...originalStudent,
      ...newData,
      id: originalStudent.id, // Keep the original ID
    };

    students[index] = updatedStudent;
    updateLocalStorage();
    updateTable();

    // Output JSON to the console with indentation
    console.log(
      "Edited student:",
      JSON.stringify(
        {
          id: updatedStudent.id,
          name: updatedStudent.name,
          surname: updatedStudent.surname,
          group: updatedStudent.group,
          gender: updatedStudent.gender,
          birthday: updatedStudent.birthday,
          status: updatedStudent.status,
        },
        null,
        2
      )
    );
  }
}

function validateStudentData({ group, name, surname, gender, birthday }) {
  let isValid = true;
  const nameRegex = /^[A-Za-zА-Яа-яЁёЇїІіЄєҐґ\s'-]+$/u;

  if (!group?.trim()) {
    isValid = false;
  }
  if (!name?.trim()) {
    isValid = false;
  } else if (!nameRegex.test(name)) {
    isValid = false;
  }
  if (!surname?.trim()) {
    isValid = false;
  } else if (!nameRegex.test(surname)) {
    isValid = false;
  }
  if (!gender) {
    isValid = false;
  }
  if (!birthday) {
    isValid = false;
  } else {
    const birthDate = new Date(birthday);
    const minDate = new Date("1900-01-01");
    const currentDate = new Date();

    const maxDate = new Date(currentDate.getFullYear() - 15, currentDate.getMonth(), currentDate.getDate());

    if (isNaN(birthDate.getTime())) {
      isValid = false;
    } else if (birthDate < minDate || birthDate > maxDate) {
      isValid = false;
    }
  }
  return isValid;
}

// Підсвічуємо невалідні поля
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
      // Find the parent element for positioning
      const fieldContainer = inputField.closest(".form-field") || inputField.parentNode;

      // Add error class to the field
      inputField.classList.add("error-field");

      // Create an element for the error
      let errorElement = fieldContainer.querySelector(".error-message");
      if (!errorElement) {
        errorElement = document.createElement("div");
        errorElement.className = "error-message";
        fieldContainer.insertBefore(errorElement, inputField);
      }
      errorElement.textContent = validation.errorMessage;

      // Remove the error on focus
      inputField.addEventListener(
        "focus",
        () => {
          inputField.classList.remove("error-field");
          if (errorElement) {
            errorElement.remove();
          }
        },
        { once: true }
      );
    }
  });
}

// Очищаємо всі помилки підсвічування
function clearFieldErrors() {
  const errorMessages = addStudentForm.querySelectorAll(".error-message");
  errorMessages.forEach((msg) => msg.remove());

  const fields = addStudentForm.querySelectorAll("input, select");
  fields.forEach((field) => field.classList.remove("error-field"));
}

// Show notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Add student to the table
function addStudent({ group, name, surname, gender, birthday }) {
  const newStudent = {
    id: generateUniqueId(),
    group,
    name,
    surname,
    gender,
    birthday,
    status: "inactive",
  };
  students.push(newStudent);
  updateLocalStorage();
  updateTable();
}

function generateUniqueId() {
  let newId;
  do {
    newId = Date.now();
  } while (Array.isArray(students) && students.some((student) => student.id === newId));
  return newId;
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
      <td><i class="fa fa-circle" style="color: ${
        student.name === "Olha" && student.surname === "Pelykh" ? "#6b9a67" : "#d8d8d8"
      }"></i></td>
      <td class="table_buttons">
          <button class="table-student-btn edit-btn" data-id="${student.id}">
              <i class="fa fa-pencil btn__icon"></i>
          </button>
          <button class="table-student-btn delete-btn" data-id="${student.id}">
              <i class="fa-solid fa-trash"></i>
          </button>
      </td>
    `;

    // Add delete handler for each new button
    tr.querySelector(".delete-btn").addEventListener("click", (event) => {
      const studentId = parseInt(event.target.closest(".delete-btn").dataset.id);
      const student = students.find((s) => s.id === studentId);

      if (!student) return;

      deleteWarnStudentFormText.innerHTML = `Delete student:<br><b>${student.name} ${student.surname}</b>?`;
      show(deleteWarnStudentForm);

      // Confirm deletion
      deleteDeleteStudentFormButton.onclick = () => {
        students = students.filter((s) => s.id !== studentId);
        updateLocalStorage();
        updateTable();
        hide(deleteWarnStudentForm);
      };
    });

    // Add event listener for editing
    tr.querySelector(".edit-btn").addEventListener("click", () => {
      addStudentForm.reset(); // Clear form fields when opening
      clearFieldErrors(); // Clear highlighting errors

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
document.addEventListener("DOMContentLoaded", updateTable);

document.getElementById("cancel-delete-warn-student-form-btn").addEventListener("click", () => {
  hide(deleteWarnStudentForm);
});

function updateLocalStorage() {
  if (!Array.isArray(students)) {
    console.error("students is not an array! Resetting to empty array.");
    students = [];
  }
  localStorage.setItem("students", JSON.stringify(students));
}

function show(modalWindow) {
  modalWindow?.classList.remove("hidden");
}

function hide(modalWindow) {
  modalWindow?.classList.add("hidden");
}

// // Function to show delete confirmation for a specific student
// function confirmDeleteStudent(studentRow) {
//   const studentName = studentRow.querySelector("td:nth-child(3)").textContent;
//   deleteWarnText.innerHTML = `Delete student named<br>${studentName}?`;

//   show(deleteWarnModal);

//   // Remove previous event listeners to prevent multiple bindings
//   const newConfirmDeleteWarnButton = confirmDeleteWarnButton.cloneNode(true);
//   confirmDeleteWarnButton.replaceWith(newConfirmDeleteWarnButton);
//   newConfirmDeleteWarnButton.addEventListener("click", () => {
//     studentRow.remove();
//     hide(deleteWarnModal);
//   });

//   confirmDeleteWarnButton.addEventListener("click", () => {
//     studentRow.remove();
//     hide(deleteWarnModal);
//   });
// }

// // Adding event listeners to delete buttons
// studentsTable.addEventListener("click", (event) => {
//   if (event.target.closest(".delete-btn")) {
//     const studentRow = event.target.closest("tr");
//     confirmDeleteStudent(studentRow);
//   }
// });
