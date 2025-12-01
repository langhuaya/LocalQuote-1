
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import compression from 'compression'; // Optimized: Import compression
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = 'your-secret-key-change-this-in-prod';

// Optimized: Enable Gzip compression. This significantly reduces the size of large JSON responses
// containing Base64 images, speeding up the "Login -> Dashboard" load time.
app.use(compression());

app.use(cors());
app.use(express.json({ limit: '50mb' }));

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

const getLocalTime = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

// --- Auth Routes ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => { // Optimized: Async callback
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: "User not found" });
    
    // Optimized: Use async compare to prevent blocking the event loop on low-CPU servers
    try {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return res.status(401).json({ error: "Invalid password" });
      
      const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
      res.json({ token, username: user.username, fullName: user.fullName, email: user.email, phone: user.phone });
    } catch (compareError) {
      return res.status(500).json({ error: "Error verifying credentials" });
    }
  });
});

app.get('/api/users', authenticateToken, (req, res) => {
  db.all("SELECT id, username, fullName, email, phone FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', authenticateToken, async (req, res) => { // Optimized: Async
  const { username, password, fullName, email, phone } = req.body;
  try {
      // Optimized: Async hash
      const hash = await bcrypt.hash(password, 10);
      db.run("INSERT INTO users (username, password, fullName, email, phone) VALUES (?, ?, ?, ?, ?)", 
        [username, hash, fullName || '', email || '', phone || ''], 
        function(err) {
          if (err) return res.status(500).json({ error: "Username likely already exists" });
          res.json({ id: this.lastID, username, fullName, email, phone });
        }
      );
  } catch (e) {
      res.status(500).json({ error: "Error creating user" });
  }
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
  const userIdToDelete = parseInt(req.params.id);
  db.get("SELECT username FROM users WHERE id = ?", [userIdToDelete], (err, row) => {
      if (err || !row) return res.status(404).json({ error: "User not found" });
      if (row.username === 'admin') return res.status(403).json({ error: "Cannot delete admin." });
      if (req.user.id === userIdToDelete) return res.status(400).json({ error: "Cannot delete self" });
      db.run("DELETE FROM users WHERE id = ?", [userIdToDelete], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
  });
});

// --- AI Chat Proxy ---
app.post('/api/ai/chat', authenticateToken, (req, res) => {
    const { messages } = req.body;
    
    // Retrieve settings to get the API Key
    db.get("SELECT data FROM settings WHERE id = 1", async (err, row) => {
        if (err || !row) return res.status(500).json({ error: "System settings not found. Please save settings first." });
        
        try {
            const settings = JSON.parse(row.data);
            const aiConfig = settings.ai || {};
            
            if (!aiConfig.apiKey) {
                return res.status(400).json({ error: "AI API Key is missing. Please configure it in System Settings." });
            }
            
            // Construct the request to the AI Provider
            const baseUrl = (aiConfig.baseUrl || 'https://yunwu.ai/v1').replace(/\/$/, ''); // Remove trailing slash
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${aiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: aiConfig.model || 'gpt-3.5-turbo',
                    messages: messages,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                return res.status(response.status).json({ error: `AI Provider Error: ${errorText}` });
            }

            const data = await response.json();
            res.json(data);
        } catch (error) {
            console.error("AI Request Failed:", error);
            res.status(500).json({ error: "Internal Server Error during AI request." });
        }
    });
});

// --- Generic CRUD ---
const getAll = (table, res) => {
  db.all(`SELECT data FROM ${table} ORDER BY rowid DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(row => JSON.parse(row.data)));
  });
};

const deleteOne = (table, id, res) => {
  db.run(`DELETE FROM ${table} WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
};

const saveWithOwnership = (table, req, res) => {
  const id = req.body.id;
  const username = req.user.username;
  db.get(`SELECT data FROM ${table} WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    let finalData = { ...req.body };
    const now = getLocalTime();
    if (row) {
       const existing = JSON.parse(row.data);
       finalData.createdBy = existing.createdBy || username; 
       finalData.createdAt = existing.createdAt || now;
       finalData.updatedBy = username;
       finalData.updatedAt = now;
    } else {
       finalData.createdBy = username;
       finalData.createdAt = now;
       finalData.updatedBy = username;
       finalData.updatedAt = now;
    }
    db.run(`INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`, [id, JSON.stringify(finalData)], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
  });
};

app.post('/api/products', authenticateToken, (req, res) => {
  const id = req.body.id;
  const username = req.user.username;
  const newProduct = req.body;
  
  db.get(`SELECT data FROM products WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    let finalData = { ...newProduct };
    const now = getLocalTime();
    const simpleDate = now.split(' ')[0];

    if (row) {
       const existing = JSON.parse(row.data);
       finalData.createdBy = existing.createdBy || username;
       finalData.createdAt = existing.createdAt || now;
       finalData.updatedBy = username;
       finalData.updatedAt = now;
       finalData.priceHistory = existing.priceHistory || [];

       const priceChanged = parseFloat(existing.price) !== parseFloat(newProduct.price);
       const costChanged = parseFloat(existing.cost || 0) !== parseFloat(newProduct.cost || 0);
       const supplierChanged = (existing.supplierName || '') !== (newProduct.supplierName || '');

       if (priceChanged || costChanged || supplierChanged) {
          finalData.priceHistory.push({
             date: simpleDate,
             price: parseFloat(existing.price),
             cost: parseFloat(existing.cost || 0),
             supplier: existing.supplierName || '',
             updatedBy: existing.updatedBy || 'Unknown'
          });
       }
    } else {
       finalData.createdBy = username;
       finalData.createdAt = now;
       finalData.updatedBy = username;
       finalData.updatedAt = now;
       finalData.priceHistory = [];
    }
    db.run(`INSERT OR REPLACE INTO products (id, data) VALUES (?, ?)`, [id, JSON.stringify(finalData)], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
  });
});

app.get('/api/products', authenticateToken, (req, res) => getAll('products', res));
app.delete('/api/products/:id', authenticateToken, (req, res) => deleteOne('products', req.params.id, res));

app.get('/api/customers', authenticateToken, (req, res) => getAll('customers', res));
app.post('/api/customers', authenticateToken, (req, res) => saveWithOwnership('customers', req, res));
app.delete('/api/customers/:id', authenticateToken, (req, res) => deleteOne('customers', req.params.id, res));

app.get('/api/brands', authenticateToken, (req, res) => getAll('brands', res));
app.post('/api/brands', authenticateToken, (req, res) => saveWithOwnership('brands', req, res));
app.delete('/api/brands/:id', authenticateToken, (req, res) => deleteOne('brands', req.params.id, res));

app.get('/api/quotes', authenticateToken, (req, res) => getAll('quotes', res));
app.post('/api/quotes', authenticateToken, (req, res) => saveWithOwnership('quotes', req, res));
app.delete('/api/quotes/:id', authenticateToken, (req, res) => deleteOne('quotes', req.params.id, res));

// --- New Contracts Routes ---
app.get('/api/contracts', authenticateToken, (req, res) => getAll('contracts', res));
app.post('/api/contracts', authenticateToken, (req, res) => saveWithOwnership('contracts', req, res));
app.delete('/api/contracts/:id', authenticateToken, (req, res) => deleteOne('contracts', req.params.id, res));

app.get('/api/settings', authenticateToken, (req, res) => {
  db.get("SELECT data FROM settings WHERE id = 1", (err, row) => res.json(row ? JSON.parse(row.data) : null));
});
app.post('/api/settings', authenticateToken, (req, res) => {
  db.run(`INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)`, [JSON.stringify(req.body)], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`Server is running on port ${PORT}`));
