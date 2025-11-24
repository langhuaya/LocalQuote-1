import { createRequire } from 'module';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();

// Use absolute path to ensure database is always created in the project root
// regardless of where the script is executed from.
const DB_PATH = path.join(__dirname, '../database.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database at ' + DB_PATH, err.message);
  } else {
    console.log('Connected to the SQLite database at: ' + DB_PATH);
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Users Table - Expanded
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      fullName TEXT,
      email TEXT,
      phone TEXT
    )`);

    // Migration: Attempt to add columns if they don't exist (Simple migration)
    const columns = ['fullName', 'email', 'phone'];
    columns.forEach(col => {
      db.run(`ALTER TABLE users ADD COLUMN ${col} TEXT`, (err) => {
        // Ignore error if column already exists
      });
    });

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
        db.run("INSERT INTO users (username, password, fullName, email) VALUES (?, ?, ?, ?)", ["admin", hash, "Administrator", "admin@company.com"]);
        console.log("Default user created: admin / admin123");
      }
    });
  });
}

export default db;