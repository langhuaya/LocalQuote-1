
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
const SECRET_KEY = 'swift-quote-pro-v2-2025';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Middleware Configuration
app.use(compression());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '50mb' }));

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized access" });
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Session expired or invalid" });
    req.user = user;
    next();
  });
};

// --- Auth Routes ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) {
      console.error("Login DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
    
    res.json({ 
      token, 
      username: user.username, 
      fullName: user.fullName || user.username,
      email: user.email || '',
      phone: user.phone || ''
    });
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
      if (err) return res.status(500).json({ error: "User already exists" });
      res.json({ id: this.lastID, username, fullName, email, phone });
    }
  );
});

// --- CRUD Generic Helpers ---
const getAll = (table, res) => {
  db.all(`SELECT data FROM ${table}`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => JSON.parse(r.data)));
  });
};

const saveItem = (table, req, res) => {
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

// --- Product/Customer/Quote API ---
app.get('/api/products', authenticateToken, (req, res) => getAll('products', res));
app.post('/api/products', authenticateToken, (req, res) => saveItem('products', req, res));
app.delete('/api/products/:id', authenticateToken, (req, res) => db.run("DELETE FROM products WHERE id = ?", [req.params.id], () => res.json({ success: true })));

app.get('/api/customers', authenticateToken, (req, res) => getAll('customers', res));
app.post('/api/customers', authenticateToken, (req, res) => saveItem('customers', req, res));
app.delete('/api/customers/:id', authenticateToken, (req, res) => db.run("DELETE FROM customers WHERE id = ?", [req.params.id], () => res.json({ success: true })));

app.get('/api/quotes', authenticateToken, (req, res) => getAll('quotes', res));
app.post('/api/quotes', authenticateToken, (req, res) => saveItem('quotes', req, res));
app.delete('/api/quotes/:id', authenticateToken, (req, res) => db.run("DELETE FROM quotes WHERE id = ?", [req.params.id], () => res.json({ success: true })));

app.get('/api/settings', authenticateToken, (req, res) => {
  db.get("SELECT data FROM settings WHERE id = 1", (err, row) => res.json(row ? JSON.parse(row.data) : null));
});
app.post('/api/settings', authenticateToken, (req, res) => {
  db.run("INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)", [JSON.stringify(req.body)], () => res.json({ success: true }));
});

// AI Chat
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

app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`Backend server ready on port ${PORT}`));
