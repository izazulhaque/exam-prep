const nodemailer = require('nodemailer');
const commencementDate = getCommencementDate();

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;


const DATA_FILE = path.join(__dirname, 'students.json');

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]');
}

app.use(express.json());
app.use(express.static('public'));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sinkedinyou@gmail.com',
    pass: 'mvbs zawu vxlq tpyt'
  }
});


function getCommencementDate(date = new Date()) {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  if (day <= 15) {
    return new Date(year, month, 15).toLocaleDateString('en-GB');
  } else {
    const nextMonth = (month + 1) % 12;
    const nextYear = month === 11 ? year + 1 : year;
    return new Date(nextYear, nextMonth, 1).toLocaleDateString('en-GB');
  }
}




app.post('/enroll', (req, res) => {
  const student = req.body;
student.submittedAt = new Date().toISOString();



  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    let students = err || !data ? [] : JSON.parse(data);
    students.push(student);

    fs.writeFile(DATA_FILE, JSON.stringify(students, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to save enrollment' });
      }

      // ✅ Send confirmation email using Nodemailer
      const mailOptions = {
        from: 'sinkedinyou@gmail.com',          // 🔁 your sending email
        to: student.email,
        subject: 'Enrollment Confirmation - Exam Preparation',
        html: `
          <h2>Enrollment Confirmation</h2>
          <p><strong>Name:</strong> ${student.name}</p>
          <p><strong>Email:</strong> ${student.email}</p>
          <p><strong>Phone:</strong> ${student.phone}</p>
          <p><strong>Exam Session:</strong> ${student.examDate}</p>
          <p><strong>Subject:</strong> ${student.subject}</p>
          <p><strong>Date of Commencement:</strong><span style="color: green;">${commencementDate}</span></p>
          <p><em>Please keep this email and show it at the premises.</em></p>
        `
      };


      console.log(`📧 Sending confirmation email to: ${student.email}`);

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('❌ Email failed:', error);
        } else {
          console.log('✅ Email sent:', info.response);
        }
      });

      res.json({ message: 'Enrollment successful!' });
    });
  });
});

app.get('/teachers', (req, res) => {
  const file = path.join(__dirname, 'teachers.json');
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to load teacher data' });
    res.json(JSON.parse(data));
  });
});

app.get('/students', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.json([]);
    res.json(JSON.parse(data));
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.get('/subjects', (req, res) => {
  const file = path.join(__dirname, 'subjects.json');
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to load subjects' });
    res.json(JSON.parse(data));
  });
});


app.delete('/students/:index', (req, res) => {
  const index = parseInt(req.params.index);

  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ message: 'Could not load students.' });

    let students = JSON.parse(data);
    if (index < 0 || index >= students.length) {
      return res.status(400).json({ message: 'Invalid student index.' });
    }

    const removed = students.splice(index, 1);

    fs.writeFile(DATA_FILE, JSON.stringify(students, null, 2), err => {
      if (err) return res.status(500).json({ message: 'Failed to delete student.' });
      res.json({ message: `Deleted: ${removed[0].name}` });
    });
  });
});

app.post('/add-teacher', (req, res) => {
  const newTeacher = req.body;

  const file = path.join(__dirname, 'teachers.json');
  fs.readFile(file, 'utf8', (err, data) => {
    let teachers = [];
    if (!err && data) {
      try {
        teachers = JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse teachers.json:", e);
      }
    }

    teachers.push(newTeacher);

    fs.writeFile(file, JSON.stringify(teachers, null, 2), err => {
      if (err) return res.status(500).json({ message: 'Error saving teacher.' });
      res.json({ message: 'Teacher added successfully!' });
    });
  });
});

app.delete('/delete-teacher/:index', (req, res) => {
  const index = parseInt(req.params.index);
  const file = path.join(__dirname, 'teachers.json');

  fs.readFile(file, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ message: 'Failed to load teachers' });

    let teachers = JSON.parse(data);
    if (index < 0 || index >= teachers.length) {
      return res.status(400).json({ message: 'Invalid teacher index' });
    }

    const removed = teachers.splice(index, 1);

    fs.writeFile(file, JSON.stringify(teachers, null, 2), err => {
      if (err) return res.status(500).json({ message: 'Failed to delete teacher' });
      res.json({ message: `Deleted teacher: ${removed[0].name}` });
    });
  });
});


app.put('/edit-teacher/:index', (req, res) => {
  const index = parseInt(req.params.index);
  const updatedTeacher = req.body;

  const file = path.join(__dirname, 'teachers.json');
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ message: 'Failed to load teachers' });

    let teachers = JSON.parse(data);
    if (index < 0 || index >= teachers.length) {
      return res.status(400).json({ message: 'Invalid teacher index' });
    }

    teachers[index] = updatedTeacher;

    fs.writeFile(file, JSON.stringify(teachers, null, 2), err => {
      if (err) return res.status(500).json({ message: 'Failed to save teacher' });
      res.json({ message: `Updated teacher: ${updatedTeacher.name}` });
    });
  });
});
