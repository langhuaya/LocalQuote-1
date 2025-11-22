import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your-secret-key-change-this-in-prod';

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Auth Routes ---

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: "User not found" });

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  });
});

// --- Generic CRUD Helpers ---

const getAll = (table, res) => {
  db.all(`SELECT data FROM ${table}`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const items = rows.map(row => JSON.parse(row.data));
    res.json(items);
  });
};

const saveOne = (table, id, data, res) => {
  const dataStr = JSON.stringify(data);
  db.run(`INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`, [id, dataStr], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
};

const deleteOne = (table, id, res) => {
  db.run(`DELETE FROM ${table} WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
};

// --- Protected Data Routes ---

// Products
app.get('/api/products', authenticateToken, (req, res) => getAll('products', res));
app.post('/api/products', authenticateToken, (req, res) => saveOne('products', req.body.id, req.body, res));
app.delete('/api/products/:id', authenticateToken, (req, res) => deleteOne('products', req.params.id, res));

// Customers
app.get('/api/customers', authenticateToken, (req, res) => getAll('customers', res));
app.post('/api/customers', authenticateToken, (req, res) => saveOne('customers', req.body.id, req.body, res));
app.delete('/api/customers/:id', authenticateToken, (req, res) => deleteOne('customers', req.params.id, res));

// Quotes
app.get('/api/quotes', authenticateToken, (req, res) => getAll('quotes', res));
app.post('/api/quotes', authenticateToken, (req, res) => saveOne('quotes', req.body.id, req.body, res));
app.delete('/api/quotes/:id', authenticateToken, (req, res) => deleteOne('quotes', req.params.id, res));

// Settings
app.get('/api/settings', authenticateToken, (req, res) => {
  db.get("SELECT data FROM settings WHERE id = 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      res.json(JSON.parse(row.data));
    } else {
      res.json(null); // Frontend will handle default
    }
  });
});
app.post('/api/settings', authenticateToken, (req, res) => {
  const dataStr = JSON.stringify(req.body);
  db.run(`INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)`, [dataStr], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- Serve Frontend (Production) ---
// Any request that doesn't match /api/* will be served the React app
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
