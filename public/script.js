function showOnly(sectionIdToShow) {
  const sections = [
    'formSection',
    'studentTableSection',
    'teacherTableSection',
    'teacherFormSection',
    'loginSection'
  ];

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === sectionIdToShow) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  // Reset teacher registration state
  if (sectionIdToShow === 'teacherFormSection') {
    document.getElementById('teacherFormPassword')?.classList.remove('hidden');
    document.getElementById('teacherFormPassword').value = '';
    document.getElementById('teacherForm')?.classList.add('hidden');
    document.getElementById('teacherAddMessage')?.classList.add('hidden');
    


  }

    // Reset credentials admin password if leaving that section
  if (sectionIdToShow !== 'teacherTableSection') {
    const credPass = document.getElementById('teacherAdminPassword');
    if (credPass) credPass.value = '';
  }

}



function resetNavLinks(activeId) {
  const navLinks = {
    showStudentsLink: 'See Enrolled Students',
    showTeachersLink: 'View Teacher Credentials',
    registerTeacherLink: 'Register Teacher'
  };

  for (const id in navLinks) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = (id === activeId) ? 'Back to Form' : navLinks[id];
    }
  }
}



// Populate exam session dropdown with dynamic year
const examSelect = document.getElementById("examDate");
const currentYear = new Date().getFullYear();
const today = new Date();

// Add placeholder first
const placeholder = document.createElement("option");
placeholder.textContent = "Select Exam Session";
placeholder.value = "";
placeholder.disabled = true;
placeholder.selected = true;
examSelect.appendChild(placeholder);

// Session templates with approximate months
const sessionTemplates = [
  { label: "January", month: 0 },
  { label: "May/June", month: 4 },
  { label: "Oct/Nov", month: 9 }
];

const upcomingSessions = [];

for (let y = currentYear; y <= currentYear + 1; y++) {
  for (let session of sessionTemplates) {
    const sessionDate = new Date(y, session.month, 1);
    if (sessionDate >= today) {
      upcomingSessions.push({
        label: `${session.label} ${y}`,
        value: `${session.label} ${y}`,
        time: sessionDate.getTime()
      });
    }
  }
}

// Sort by soonest
upcomingSessions.sort((a, b) => a.time - b.time);

// Add upcoming sessions
upcomingSessions.forEach(session => {
  const option = document.createElement("option");
  option.value = session.value;
  option.textContent = session.label;
  examSelect.appendChild(option);
});

// Add "Later" option last
const laterOption = document.createElement("option");
laterOption.value = "Later";
laterOption.textContent = "Later";
examSelect.appendChild(laterOption);


// Dynamically load subject options from subjects.json
fetch('/subjects')
  .then(res => res.json())
  .then(subjects => {
    const subjectSelect = document.getElementById('subject');
    subjects.forEach(subj => {
      const option = document.createElement("option");
      option.value = subj;
      option.textContent = subj;
      subjectSelect.appendChild(option);
    });
  })
  .catch(err => {
    console.error("Failed to load subjects:", err);
  });



// Handle form submission
document.getElementById('enrollForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const student = Object.fromEntries(formData.entries());

  const phoneInput = document.getElementById('phone').value;
if (!/^[0-9]{11}$/.test(phoneInput)) {
  alert("Phone number must be exactly 11 digits.");
  return;
}





  fetch('/enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student)
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById('successMessage').classList.remove('hidden');
    this.reset();
    document.getElementById('examDate').selectedIndex = 0;
    setTimeout(() => {
      document.getElementById('successMessage').classList.add('hidden');
    }, 3000);
  });
});

// Password protected student view

const studentLink = document.getElementById('showStudentsLink');

studentLink.addEventListener('click', (e) => {
  e.preventDefault();

  if (studentLink.textContent === 'Back to Form') {
    showOnly('formSection');
    resetNavLinks(null);
  } else {
    showOnly('loginSection');
    resetNavLinks('showStudentsLink');
  }

  // Reset login fields
  document.getElementById('loginError')?.classList.add('hidden');
  document.getElementById('teacherPassword').value = '';
});

document.getElementById('teacherPassword').addEventListener('input', function () {
  if (this.value === 'secret123') {
    this.value = ''; // optional: clear after success
    showOnly('studentTableSection');
    resetNavLinks('showStudentsLink');
    loadStudents();
  }
});





function checkPassword() {
  const input = document.getElementById('teacherPassword').value;
  if (input === 'secret123') {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('studentTableSection').classList.remove('hidden');
    loadStudents();
  } else {
    document.getElementById('loginError').classList.remove('hidden');
  }
}

function loadStudents() {
  fetch('/students')
    .then(res => res.json())
    .then(data => {
data.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      const tbody = document.getElementById('studentTableBody');
      tbody.innerHTML = '';
      data.forEach((s, index) => {
  const row = `<tr>
    <td>${s.name}</td>
    <td>${s.email}</td>
    <td>${s.phone}</td>
    <td>${s.examDate}</td>
    <td>${s.subject}</td>
    <td>${s.message}</td>
    <td>${s.submittedAt || 'N/A'}</td>
    <td><button onclick="deleteStudent(${index})">Delete</button></td>
  </tr>`;
  tbody.innerHTML += row;
});

    });
}

function deleteStudent(index) {
  if (confirm("Are you sure you want to delete this student?")) {
    fetch(`/students/${index}`, {
      method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadStudents(); // refresh the table
    });
  }
}

const teacherLink = document.getElementById('showTeachersLink');

teacherLink.addEventListener('click', (e) => {
  e.preventDefault();

  if (teacherLink.textContent === 'Back to Form') {
    showOnly('formSection');
    resetNavLinks(null);
  } else {
    showOnly('teacherTableSection');
    resetNavLinks('showTeachersLink');

    // Load teacher data
    fetch('/teachers')
      .then(res => res.json())
      .then(data => {
        const tbody = document.getElementById('teacherTableBody');
        tbody.innerHTML = '';
        data.forEach((t, index) => {
          const historyId = `history-${index}`;
          const academicList = (t.academicHistory || []).map(line => `<li>${line}</li>`).join('');
          const details = `<ul style="margin-top: 4px; padding-left: 18px;">${academicList}</ul>`;
          const row = `<tr>
            <td>${t.name}</td>
            <td>
              <button onclick="toggleHistory('${historyId}')">View Details</button>
              <div id="${historyId}" class="hidden" style="margin-top: 8px;">${details}</div>
            </td>
            <td>${t.email}</td>
            <td>${t.subject}</td>
            <td>
              <button class="editTeacherBtn hidden" onclick="editTeacher(${index})">Edit</button><br>
              <button class="deleteTeacherBtn hidden" onclick="deleteTeacher(${index})">Delete</button>
            </td>
          </tr>`;
          tbody.innerHTML += row;
        });
      });
  }
});




function toggleHistory(id) {
  const el = document.getElementById(id);
  el.classList.toggle('hidden');
}

const registerLink = document.getElementById('registerTeacherLink');

registerLink.addEventListener('click', (e) => {
  e.preventDefault();

  if (registerLink.textContent === 'Back to Form') {
    showOnly('formSection');
    resetNavLinks(null);
  } else {
    showOnly('teacherFormSection');
    resetNavLinks('registerTeacherLink');
  }
});



document.getElementById('teacherFormPassword').addEventListener('input', function () {
  if (this.value === 'admin123') {
    this.classList.add('hidden');
    document.getElementById('teacherForm').classList.remove('hidden');
  }
});

document.getElementById('teacherForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const teacher = Object.fromEntries(formData.entries());

  // Clean up academic history into array
  teacher.academicHistory = teacher.academicHistory
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const editingTeacher = localStorage.getItem('editingTeacher');

  if (editingTeacher) {
    // ✅ Editing an existing teacher
    const updated = JSON.parse(editingTeacher);
    const index = updated.editingIndex;

    fetch(`/edit-teacher/${index}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacher)
    })
      .then(res => res.json())
      .then(data => {
        document.getElementById('teacherAddMessage').textContent = data.message;
        document.getElementById('teacherAddMessage').classList.remove('hidden');
        localStorage.removeItem('editingTeacher');
        this.reset();
        document.getElementById('teacherFormPassword').value = '';
      });
  } else {
    // ➕ Adding a new teacher
    fetch('/add-teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacher)
    })
      .then(res => res.json())
      .then(data => {
        document.getElementById('teacherAddMessage').textContent = data.message;
        document.getElementById('teacherAddMessage').classList.remove('hidden');
        this.reset();
        document.getElementById('teacherFormPassword').value = '';
      });
  }
});



function deleteTeacher(index) {
  if (confirm("Are you sure you want to delete this teacher?")) {
    fetch(`/delete-teacher/${index}`, {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        document.getElementById('teacherTableBody').innerHTML = '';
        document.getElementById('showTeachersLink').click(); // Reload table
      });
  }
}

function editTeacher(index) {
  fetch('/teachers')
    .then(res => res.json())
    .then(data => {
      const teacher = data[index];

      // Store the index for editing
      teacher.editingIndex = index;
      localStorage.setItem('editingTeacher', JSON.stringify(teacher));

      // Show the form and pre-fill it
      showOnly('teacherFormSection');
      document.getElementById('teacherFormPassword').classList.add('hidden');
      document.getElementById('teacherForm').classList.remove('hidden');

      const form = document.getElementById('teacherForm');
      form.name.value = teacher.name;
      form.email.value = teacher.email;
      form.phone.value = teacher.phone;
      form.subject.value = teacher.subject;
      form.experience.value = teacher.experience || '';
      form.availability.value = teacher.availability || '';
      form.academicHistory.value = (teacher.academicHistory || []).join('\n');
    });
}




document.getElementById('teacherAdminPassword').addEventListener('input', function () {
  if (this.value === 'admin123') {
    document.querySelectorAll('.deleteTeacherBtn').forEach(btn => btn.classList.remove('hidden'));
    document.querySelectorAll('.editTeacherBtn').forEach(btn => btn.classList.remove('hidden'));
  }
});


