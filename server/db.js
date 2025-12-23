
import { createRequire } from 'module';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();

// Use absolute path to ensure database is always created in the project root
const DB_PATH = path.join(__dirname, '../database.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database at ' + DB_PATH, err.message);
  } else {
    console.log('Connected to the SQLite database at: ' + DB_PATH);
    // Optimized: Enable Write-Ahead Logging (WAL) and set busy_timeout
    db.serialize(() => {
        db.run('PRAGMA journal_mode = WAL;');
        db.run('PRAGMA busy_timeout = 5000;'); // Retry for 5s if DB is locked
    });
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      fullName TEXT,
      email TEXT,
      phone TEXT
    )`);

    // Products Table
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      data TEXT
    )`);

    // Brands Table
    db.run(`CREATE TABLE IF NOT EXISTS brands (
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

    // Contracts Table
    db.run(`CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      data TEXT
    )`);

    // Settings Table
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT
    )`);

    // Default Admin
    db.get("SELECT * FROM users WHERE username = ?", ["admin"], (err, row) => {
      if (!row) {
        const hash = bcrypt.hashSync("admin123", 10);
        db.run("INSERT INTO users (username, password, fullName, email) VALUES (?, ?, ?, ?)", ["admin", hash, "Administrator", "admin@company.com"]);
      }
    });
  });
}

export default db;
