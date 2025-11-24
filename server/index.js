
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
const PORT = process.env.PORT || 3001;
const SECRET_KEY = 'your-secret-key-change-this-in-prod';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

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

// --- Auth & User Management Routes ---

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: "User not found" });

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
    
    // Return full user info (excluding password)
    res.json({ 
      token, 
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone
    });
  });
});

// Get all users (for management)
app.get('/api/users', authenticateToken, (req, res) => {
  db.all("SELECT id, username, fullName, email, phone FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create new user
app.post('/api/users', authenticateToken, (req, res) => {
  const { username, password, fullName, email, phone } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  
  const hash = bcrypt.hashSync(password, 10);
  db.run("INSERT INTO users (username, password, fullName, email, phone) VALUES (?, ?, ?, ?, ?)", 
    [username, hash, fullName || '', email || '', phone || ''], 
    function(err) {
      if (err) return res.status(500).json({ error: "Username likely already exists" });
      res.json({ id: this.lastID, username, fullName, email, phone });
    }
  );
});

// Delete user
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  // Prevent deleting self (simple check, assuming ID matches token)
  if (req.user.id === parseInt(req.params.id)) {
     return res.status(400).json({ error: "Cannot delete your own account" });
  }

  db.run("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});


// --- Generic CRUD Helpers ---

const getAll = (table, res) => {
  db.all(`SELECT data FROM ${table}`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const items = rows.map(row => JSON.parse(row.data));
      res.json(items);
    } catch (parseError) {
      console.error(`Error parsing data from ${table}:`, parseError);
      res.status(500).json({ error: "Data corruption detected" });
    }
  });
};

const deleteOne = (table, id, res) => {
  db.run(`DELETE FROM ${table} WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
};

// --- Specialized Save Logic ---

// Save Generic (Quotes, Customers) with Ownership
const saveWithOwnership = (table, req, res) => {
  const id = req.body.id;
  const username = req.user.username;
  
  // Fetch existing to preserve 'createdBy'
  db.get(`SELECT data FROM ${table} WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    let finalData = { ...req.body };
    const now = new Date().toISOString().split('T')[0]; // Simple date YYYY-MM-DD

    if (row) {
       // Update existing
       const existing = JSON.parse(row.data);
       finalData.createdBy = existing.createdBy || username; // Preserve creator
       finalData.updatedBy = username;
    } else {
       // Create new
       finalData.createdBy = username;
       finalData.updatedBy = username;
    }

    const dataStr = JSON.stringify(finalData);
    db.run(`INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`, [id, dataStr], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
  });
};

// Save Product (With Price History Logic)
app.post('/api/products', authenticateToken, (req, res) => {
  const id = req.body.id;
  const username = req.user.username;
  const newProduct = req.body;
  
  db.get(`SELECT data FROM products WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    let finalData = { ...newProduct };
    const now = new Date().toISOString().split('T')[0];

    if (row) {
       const existing = JSON.parse(row.data);
       finalData.createdBy = existing.createdBy || username;
       finalData.updatedBy = username;
       finalData.updatedAt = now;
       finalData.priceHistory = existing.priceHistory || [];

       // Logic: If price, cost, or supplier changed, add to history
       const priceChanged = parseFloat(existing.price) !== parseFloat(newProduct.price);
       const costChanged = parseFloat(existing.cost || 0) !== parseFloat(newProduct.cost || 0);
       const supplierChanged = (existing.supplierName || '') !== (newProduct.supplierName || '');

       if (priceChanged || costChanged || supplierChanged) {
          finalData.priceHistory.push({
             date: now,
             price: parseFloat(existing.price), // Store the OLD price/cost
             cost: parseFloat(existing.cost || 0),
             supplier: existing.supplierName || '',
             updatedBy: existing.updatedBy || 'Unknown'
          });
       }
    } else {
       finalData.createdBy = username;
       finalData.updatedBy = username;
       finalData.updatedAt = now;
       finalData.priceHistory = [];
    }

    const dataStr = JSON.stringify(finalData);
    db.run(`INSERT OR REPLACE INTO products (id, data) VALUES (?, ?)`, [id, dataStr], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
  });
});


// --- Protected Data Routes ---

// Products
app.get('/api/products', authenticateToken, (req, res) => getAll('products', res));
// POST uses specific handler above
app.delete('/api/products/:id', authenticateToken, (req, res) => deleteOne('products', req.params.id, res));

// Customers
app.get('/api/customers', authenticateToken, (req, res) => getAll('customers', res));
app.post('/api/customers', authenticateToken, (req, res) => saveWithOwnership('customers', req, res));
app.delete('/api/customers/:id', authenticateToken, (req, res) => deleteOne('customers', req.params.id, res));

// Quotes
app.get('/api/quotes', authenticateToken, (req, res) => getAll('quotes', res));
app.post('/api/quotes', authenticateToken, (req, res) => saveWithOwnership('quotes', req, res));
app.delete('/api/quotes/:id', authenticateToken, (req, res) => deleteOne('quotes', req.params.id, res));

// Settings
app.get('/api/settings', authenticateToken, (req, res) => {
  db.get("SELECT data FROM settings WHERE id = 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      res.json(JSON.parse(row.data));
    } else {
      res.json(null); 
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
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
