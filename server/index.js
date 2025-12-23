
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import compression from 'compression';
import db from './db.js';
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = 'swift-quote-pro-secret-key-2025';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Middleware
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
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) {
      console.error("Login DB Error:", err);
      return res.status(500).json({ error: "Database error during login" });
    }
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    try {
      const isValid = bcrypt.compareSync(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid password" });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
      return res.json({ 
        token, 
        username: user.username, 
        fullName: user.fullName || user.username, 
        email: user.email || '', 
        phone: user.phone || '' 
      });
    } catch (bcryptErr) {
      console.error("Bcrypt Error:", bcryptErr);
      return res.status(500).json({ error: "Authentication engine error" });
    }
  });
});

// User Management
app.get('/api/users', authenticateToken, (req, res) => {
  db.all("SELECT id, username, fullName, email, phone FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', authenticateToken, (req, res) => {
  const { username, password, fullName, email, phone } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  db.run("INSERT INTO users (username, password, fullName, email, phone) VALUES (?, ?, ?, ?, ?)", 
    [username, hash, fullName || '', email || '', phone || ''], 
    function(err) {
      if (err) return res.status(500).json({ error: "User already exists or DB error" });
      res.json({ id: this.lastID, username, fullName, email, phone });
    }
  );
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  db.get("SELECT username FROM users WHERE id = ?", [id], (err, row) => {
    if (row?.username === 'admin') return res.status(403).json({ error: "Cannot delete admin" });
    db.run("DELETE FROM users WHERE id = ?", [id], (err) => res.json({ success: true }));
  });
});

// --- AI Proxy ---
app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  try {
    const { messages } = req.body;
    const systemInstruction = messages.find(m => m.role === 'system')?.content;
    const chatHistory = messages.filter(m => m.role !== 'system').map(m => `${m.role}: ${m.content}`).join('\n');

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: chatHistory,
      config: { systemInstruction }
    });

    res.json({ choices: [{ message: { role: 'assistant', content: result.text } }] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CRUD ---
const getAll = (table, res) => {
  db.all(`SELECT data FROM ${table}`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => JSON.parse(r.data)));
  });
};

const save = (table, req, res) => {
  const data = req.body;
  const now = new Date().toISOString();
  if (!data.createdAt) data.createdAt = now;
  data.updatedAt = now;
  data.updatedBy = req.user.username;
  if (!data.createdBy) data.createdBy = req.user.username;

  db.run(`INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`, 
    [data.id, JSON.stringify(data)], 
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
};

app.get('/api/products', authenticateToken, (req, res) => getAll('products', res));
app.post('/api/products', authenticateToken, (req, res) => save('products', req, res));
app.delete('/api/products/:id', authenticateToken, (req, res) => db.run("DELETE FROM products WHERE id = ?", [req.params.id], () => res.json({ success: true })));

app.get('/api/customers', authenticateToken, (req, res) => getAll('customers', res));
app.post('/api/customers', authenticateToken, (req, res) => save('customers', req, res));
app.delete('/api/customers/:id', authenticateToken, (req, res) => db.run("DELETE FROM customers WHERE id = ?", [req.params.id], () => res.json({ success: true })));

app.get('/api/quotes', authenticateToken, (req, res) => getAll('quotes', res));
app.post('/api/quotes', authenticateToken, (req, res) => save('quotes', req, res));
app.delete('/api/quotes/:id', authenticateToken, (req, res) => db.run("DELETE FROM quotes WHERE id = ?", [req.params.id], () => res.json({ success: true })));

app.get('/api/contracts', authenticateToken, (req, res) => getAll('contracts', res));
app.post('/api/contracts', authenticateToken, (req, res) => save('contracts', req, res));
app.delete('/api/contracts/:id', authenticateToken, (req, res) => db.run("DELETE FROM contracts WHERE id = ?", [req.params.id], () => res.json({ success: true })));

app.get('/api/settings', authenticateToken, (req, res) => {
  db.get("SELECT data FROM settings WHERE id = 1", (err, row) => res.json(row ? JSON.parse(row.data) : null));
});
app.post('/api/settings', authenticateToken, (req, res) => {
  db.run("INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)", [JSON.stringify(req.body)], () => res.json({ success: true }));
});

app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
