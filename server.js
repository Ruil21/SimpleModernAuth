const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const os = require('os');

const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Connect to SQLite database
const db = new sqlite3.Database('users.db');

// Create users table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
`);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/signup', (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  // Insert user into the database
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err) => {
    if (err) {
      console.error(err);
      return res.status(400).send('Error during signup.');
    }

    console.log(`User ${username} signed up successfully.`);
    res.redirect('/');
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  // Check if the user exists in the database
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error during login.');
    }

    if (row) {
      console.log(`User ${username} logged in successfully.`);
      const serverIp = getServerIp();
      res.redirect(`http://${serverIp}:${PORT}/`);
    } else {
      res.redirect('/invalid-credentials.html');
    }
  });
});

function getServerIp() {
  const networkInterfaces = os.networkInterfaces();
  let serverIp = 'localhost'; // Default to localhost if IP cannot be determined

  for (const interfaceKey in networkInterfaces) {
    const interface = networkInterfaces[interfaceKey];
    for (const details of interface) {
      if (details.family === 'IPv4' && !details.internal) {
        serverIp = details.address;
        break;
      }
    }
  }

  return serverIp;
}

app.listen(PORT, () => {
  const serverIp = getServerIp();
  console.log(`Server is running on http://${serverIp}:${PORT}`);
});
