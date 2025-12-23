
import { createRequire } from 'module';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '../database.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to database at:', DB_PATH);
    db.serialize(() => {
        db.run('PRAGMA journal_mode = WAL;');
        db.run('PRAGMA busy_timeout = 5000;');
        initDb();
    });
  }
});

function initDb() {
  // Users Table with profile fields
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    fullName TEXT,
    email TEXT,
    phone TEXT
  )`, (err) => {
      if (err) console.error("Error creating users table:", err);
      else {
          // Check for missing columns for older databases
          db.all("PRAGMA table_info(users)", (err, columns) => {
            const names = columns.map(c => c.name);
            if (!names.includes('fullName')) db.run("ALTER TABLE users ADD COLUMN fullName TEXT");
            if (!names.includes('email')) db.run("ALTER TABLE users ADD COLUMN email TEXT");
            if (!names.includes('phone')) db.run("ALTER TABLE users ADD COLUMN phone TEXT");
          });

          // Ensure default admin exists
          db.get("SELECT * FROM users WHERE username = ?", ["admin"], (err, row) => {
            if (!row) {
              const hash = bcrypt.hashSync("admin123", 10);
              db.run("INSERT INTO users (username, password, fullName, email) VALUES (?, ?, ?, ?)", 
                ["admin", hash, "Administrator", "admin@company.com"], (err) => {
                    if (err) console.error("Error creating admin user:", err);
                    else console.log("Default admin created: admin / admin123");
                });
            } else {
                console.log("Admin user exists.");
            }
          });
      }
  });

  db.run(`CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, data TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS brands (id TEXT PRIMARY KEY, data TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, data TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS quotes (id TEXT PRIMARY KEY, data TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS contracts (id TEXT PRIMARY KEY, data TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT)`);
}

export default db;
