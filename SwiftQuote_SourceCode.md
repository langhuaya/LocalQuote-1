# SwiftQuote Pro - Full Source Code Documentation

**Version:** 2.5 (Pro)
**Stack:** React 18, Vite, TypeScript, Node.js (Express), SQLite, Tailwind CSS
**Date:** 2023-10-27

---

## 1. Project Configuration (Root)

### package.json
```json
{
  "name": "swiftquote-pro",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "server": "node server/index.js",
    "start": "node server/index.js",
    "dev:all": "concurrently \"npm run server\" \"npm run dev\""
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "date-fns": "^3.3.1",
    "dotenv": "^16.4.5",
    "express": "^4.18.3",
    "html2canvas": "^1.4.1",
    "jsonwebtoken": "^9.0.2",
    "jspdf": "^2.5.1",
    "lucide-react": "^0.344.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "sqlite3": "^5.1.7"
  },
  "devDependencies": {
    "@types/node": "^20.11.24",
    "@types/react": "^18.2.64",
    "@types/react-dom": "^18.2.21",
    "@vitejs/plugin-react": "^4.2.1",
    "concurrently": "^8.2.2",
    "typescript": "^5.2.2",
    "vite": "^5.1.6"
  }
}
```

### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all local IPs
    port: 5173,
  },
  resolve: {
    alias: {},
  },
  build: {
    outDir: 'dist',
  },
});
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": "."
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "index.tsx"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SwiftQuote Pro - LH WAVE</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Inter', sans-serif; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      @media print {
        body * { visibility: hidden; }
        #printable-area, #printable-area * { visibility: visible; }
        #printable-area { position: absolute; left: 0; top: 0; width: 100%; }
      }
    </style>
  </head>
  <body class="bg-gray-50 text-gray-900">
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>
```

---

## 2. Backend (Server & Database)

### server/db.js
```javascript
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
    console.error('Error opening database at ' + DB_PATH, err.message);
  } else {
    console.log('Connected to the SQLite database at: ' + DB_PATH);
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      fullName TEXT,
      email TEXT,
      phone TEXT
    )`);

    ['fullName', 'email', 'phone'].forEach(col => {
      db.run(`ALTER TABLE users ADD COLUMN ${col} TEXT`, () => {});
    });

    db.run(`CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, data TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS brands (id TEXT PRIMARY KEY, data TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, data TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS quotes (id TEXT PRIMARY KEY, data TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT)`);

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
```

### server/index.js
```javascript
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

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: "User not found" });
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Invalid password" });
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, username: user.username, fullName: user.fullName, email: user.email, phone: user.phone });
  });
});

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
      if (err) return res.status(500).json({ error: "Username likely already exists" });
      res.json({ id: this.lastID, username, fullName, email, phone });
    }
  );
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
```

---

## 3. Core Logic & Types

### src/types.ts
```typescript
export enum QuoteType { PROFORMA = 'Proforma Invoice', COMMERCIAL = 'Commercial Invoice', QUOTATION = 'Quotation' }
export enum Currency { USD = 'USD', EUR = 'EUR', CNY = 'CNY', GBP = 'GBP' }

export interface SupplierInfo {
  id: string; name: string; reference?: string; cost: number;
  currency: Currency; hasStock: boolean; isDefault: boolean; notes?: string;
}

export interface PriceHistoryItem {
  date: string; price: number; cost?: number; supplier?: string; updatedBy: string;
}

export interface Brand {
  id: string; name: string; logoDataUrl?: string; description?: string;
  suppliers?: SupplierInfo[]; createdBy?: string; createdAt?: string; updatedBy?: string;
}

export interface Product {
  id: string; sku: string; name: string; description: string;
  price: number; currency: Currency; unit: string; brand?: string; note?: string;
  cost?: number; supplierName?: string; supplierReference?: string;
  suppliers?: SupplierInfo[];
  createdBy?: string; createdAt?: string; updatedBy?: string; updatedAt?: string;
  priceHistory?: PriceHistoryItem[];
}

export interface Customer {
  id: string; name: string; contactPerson: string; email: string; phone: string;
  address: string; city: string; country: string; zipCode: string; taxId: string; source: string;
  createdBy?: string; createdAt?: string; updatedBy?: string;
}

export interface CompanySettings {
  name: string; address: string; city: string; country: string; phone: string; email: string;
  logoDataUrl: string; stampDataUrl: string; bankInfo: string; quotePrefix: string;
  exchangeRates: { [key: string]: number };
}

export interface QuoteItem {
  id: string; productId: string; sku: string; name: string; description: string;
  unit: string; quantity: number; price: number; amount: number; brand?: string;
}

export interface Quote {
  id: string; number: string; type: QuoteType; date: string; validUntil: string;
  customerId: string; customerSnapshot: Customer;
  salesperson?: { name: string; email: string; phone: string; };
  items: QuoteItem[]; currency: Currency;
  subtotal: number; discountRate: number; discountAmount: number; shipping: number; total: number;
  incoterms: string; leadTime: string; paymentTerms: string; notes: string;
  status: 'Draft' | 'Sent' | 'Accepted';
  createdBy?: string; createdAt?: string; updatedBy?: string;
}

export interface User {
  id: number; username: string; fullName?: string; email?: string; phone?: string; role?: 'admin' | 'user';
}
```

### src/services/api.ts
```typescript
import { Quote, Product, Customer, CompanySettings, User, Brand } from '../types';

const API_URL = import.meta.env.PROD 
  ? '/api' 
  : `http://${window.location.hostname}:3001/api`;

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
};

export const api = {
  login: async (username, password) => (await fetch(`${API_URL}/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username, password}) })).json(),
  getUsers: async () => (await fetch(`${API_URL}/users`, { headers: getHeaders() })).json(),
  createUser: async (user) => (await fetch(`${API_URL}/users`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(user) })).json(),
  deleteUser: async (id) => fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: getHeaders() }),
  
  getProducts: async () => (await fetch(`${API_URL}/products`, { headers: getHeaders() })).json(),
  saveProduct: async (p) => fetch(`${API_URL}/products`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(p) }),
  deleteProduct: async (id) => fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: getHeaders() }),

  getCustomers: async () => (await fetch(`${API_URL}/customers`, { headers: getHeaders() })).json(),
  saveCustomer: async (c) => fetch(`${API_URL}/customers`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(c) }),
  deleteCustomer: async (id) => fetch(`${API_URL}/customers/${id}`, { method: 'DELETE', headers: getHeaders() }),

  getBrands: async () => (await fetch(`${API_URL}/brands`, { headers: getHeaders() })).json(),
  saveBrand: async (b) => fetch(`${API_URL}/brands`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(b) }),
  deleteBrand: async (id) => fetch(`${API_URL}/brands/${id}`, { method: 'DELETE', headers: getHeaders() }),

  getQuotes: async () => (await fetch(`${API_URL}/quotes`, { headers: getHeaders() })).json(),
  saveQuote: async (q) => fetch(`${API_URL}/quotes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(q) }),
  deleteQuote: async (id) => fetch(`${API_URL}/quotes/${id}`, { method: 'DELETE', headers: getHeaders() }),

  getSettings: async () => {
      const res = await fetch(`${API_URL}/settings`, { headers: getHeaders() });
      return res.ok ? res.json() : null;
  },
  saveSettings: async (s) => fetch(`${API_URL}/settings`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(s) })
};
export const generateId = () => Math.random().toString(36).substring(2, 9);
```

---

## 4. Frontend Application

### src/index.tsx
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
```

### src/App.tsx
*(See file content in project for full layout, routing, and Customer/Settings manager implementations)*

### src/components/Login.tsx
*(See file content in project)*

### src/components/ProductsManager.tsx
*(See file content in project - Contains Multi-supplier logic)*

### src/components/BrandsManager.tsx
*(See file content in project - Contains Brand & Supplier logic)*

### src/components/UsersManager.tsx
*(See file content in project - Contains Account & Salesperson logic)*

### src/components/QuoteEditor.tsx
*(See file content in project - Contains Quote logic, Search, and PDF Preview integration)*

### src/components/InvoiceTemplate.tsx
*(See file content in project - Contains A4 Fixed Width Layout and PDF generation styles)*
