const studentsTable = document.getElementById("students-table");
const notificationButton = document.getElementById("notifications-button");
const profileButton = document.getElementById("user-name");
const addStudentButton = document.getElementById("add-student-btn");
const addStudentModalWrapper = document.getElementById("add-student");
const addStudentForm = document.getElementById("add-student-form");
const cancelAddStudentButton = document.getElementById("add-student-btn-close");
const deleteWarnModal = document.getElementById("delete-warn-student");

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
    show(document.getElementById("modal-notifications"));
  });

  notificationButton.addEventListener("mouseleave", () => {
    hide(document.getElementById("modal-notifications"));
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
  addStudentButton.addEventListener("click", () =>
    show(addStudentModalWrapper)
  );

  addStudentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    addStudent(Object.fromEntries(formData));
    hide(addStudentModalWrapper);
  });

  cancelAddStudentButton.addEventListener("click", () =>
    hide(addStudentModalWrapper)
  );
}

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

  // Add event listeners for edit and delete after appending new row
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
    // TODO: Implement edit student functionality
  });
}

function show(modalWindow) {
  modalWindow?.classList.remove("hidden");
}

function hide(modalWindow) {
  modalWindow?.classList.add("hidden");
}
