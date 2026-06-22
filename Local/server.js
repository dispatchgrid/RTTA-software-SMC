const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors');


const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'))
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));



// DB for SQL queries and timetable
const db1 = new sqlite3.Database('your-database-file.db');

// DB for storing a single string
const db2 = new sqlite3.Database('string-storage.db');

db2.run(`CREATE TABLE IF NOT EXISTS StoredString (id INTEGER PRIMARY KEY, content TEXT)`);

app.get('/ping', (req, res) => {
  res.status(200).send('Ping successful');
});

app.all('/api/sql', (req, res) => {
  const { queries } = req.method === 'GET' ? req.query : req.body;

  if (!queries) {
    return res.status(400).json({ error: 'Missing SQL queries parameter' });
  }

  const sqlQueries = queries.split(';');
  const results = [];

  sqlQueries.forEach((query) => {
    db1.all(query, (err, rows) => {
      if (err) {
        results.push({ error: err.message });
      } else {
        results.push({ result: rows });
      }

      if (results.length === sqlQueries.length) {
        res.json({ results });
      }
    });
  });
});

app.get('/api/timetable', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const sql = `SELECT Period, Classroom, Subject FROM RTTA_main WHERE Date = ? ORDER BY Period`;

  db1.all(sql, [today], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      date: today,
      teacher: "John Doe",
      periods: rows.map(row => ({
        period: row.Period,
        classroom: row.Classroom,
        subject: row.Subject
      }))
    });
  });
});

app.get('/timetable', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Today's Timetable</title>
      <style>
        body {
          background-color: #121212 !important;
          color: white !important;
          font-family: 'Poppins', sans-serif !important;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: auto;
        }
        h1, h4, h5 {
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          background: #333;
          color: white;
        }
        th, td {
          padding: 10px;
          border: 1px solid #444;
          text-align: center;
        }
        th {
          background: #222;
        }
        button {
          width: 100%;
          padding: 15px;
          font-size: 18px;
          background: #6200ea !important;
          border: none !important;
          color: white;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 20px;
        }
        button:hover {
          background: #4b00c2 !important;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Today's Timetable</h1>
        <h4 id="Dat">Loading...</h4>
        <h5 id="nam">Loading...</h5>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Classroom</th>
              <th>Subject</th>
            </tr>
          </thead>
          <tbody id="timetable-body">
            <tr><th>1</th><td id="P1">...</td><td id="S1">...</td></tr>
            <tr><th>2</th><td id="P2">...</td><td id="S2">...</td></tr>
            <tr><th>3</th><td id="P3">...</td><td id="S3">...</td></tr>
            <tr><th>4</th><td id="P4">...</td><td id="S4">...</td></tr>
            <tr><th>5</th><td id="P5">...</td><td id="S5">...</td></tr>
            <tr><th>6</th><td id="P6">...</td><td id="S6">...</td></tr>
            <tr><th>7</th><td id="P7">...</td><td id="S7">...</td></tr>
            <tr><th>8</th><td id="P8">...</td><td id="S8">...</td></tr>
          </tbody>
        </table>
        <button onclick="logout();">Logout</button>
      </div>

      <script>
        function logout() {
          AppInventor.setWebViewString("LOGOUT");
        }

        function fetchTimetable() {
          fetch('/api/timetable')
            .then(response => response.json())
            .then(data => {
              document.getElementById("Dat").textContent = data.date;
              document.getElementById("nam").textContent = data.teacher;

              const timetableBody = document.getElementById("timetable-body");
              timetableBody.innerHTML = "";

              data.periods.forEach(period => {
                let row = \`
                  <tr>
                    <th>\${period.period}</th>
                    <td>\${period.classroom || "-"}</td>
                    <td>\${period.subject || "-"}</td>
                  </tr>
                \`;
                timetableBody.innerHTML += row;
              });
            })
            .catch(error => console.error("Error fetching timetable:", error));
        }

        fetchTimetable();
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

app.all('/api/setstring', (req, res) => {
  const s = req.method === 'GET' ? req.query.s : req.body.s;

  if (typeof s !== 'string') {
    return res.status(400).json({ error: 'Missing string parameter "s"' });
  }

  db2.run(`DELETE FROM StoredString`);
  db2.run(`INSERT INTO StoredString (content) VALUES (?)`, [s], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

app.all('/api/getstring', (req, res) => {
  db2.get(`SELECT content FROM StoredString ORDER BY id DESC LIMIT 1`, (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ content: row ? row.content : null });
  });
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);

});
