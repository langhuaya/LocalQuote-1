import { createRequire } from 'module';
import bcrypt from 'bcryptjs';

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);

    // Products Table
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      data TEXT
    )`);

    // Customers Table
    db.run(`CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      data TEXT
    )`);

    // Quotes Table
    db.run(`CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      data TEXT
    )`);

    // Settings Table (Single row)
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT
    )`);

    // Create default admin user if not exists
    db.get("SELECT * FROM users WHERE username = ?", ["admin"], (err, row) => {
      if (!row) {
        const hash = bcrypt.hashSync("admin123", 10);
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", ["admin", hash]);
        console.log("Default user created: admin / admin123");
      }
    });
  });
}

export default db;