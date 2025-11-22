import { Quote, Product, Customer, CompanySettings } from '../types';

// In development (Vite), we use the proxy or full URL. 
// In production (served by Express), relative path works.
const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const api = {
  // Auth
  login: async (username: string, password: string): Promise<{token: string, username: string}> => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    const res = await fetch(`${API_URL}/products`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },
  saveProduct: async (product: Product) => {
    await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(product)
    });
  },
  deleteProduct: async (id: string) => {
    await fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: getHeaders() });
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    const res = await fetch(`${API_URL}/customers`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },
  saveCustomer: async (customer: Customer) => {
    await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(customer)
    });
  },
  deleteCustomer: async (id: string) => {
    await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE', headers: getHeaders() });
  },

  // Quotes
  getQuotes: async (): Promise<Quote[]> => {
    const res = await fetch(`${API_URL}/quotes`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },
  saveQuote: async (quote: Quote) => {
    await fetch(`${API_URL}/quotes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(quote)
    });
  },
  deleteQuote: async (id: string) => {
    await fetch(`${API_URL}/quotes/${id}`, { method: 'DELETE', headers: getHeaders() });
  },

  // Settings
  getSettings: async (): Promise<CompanySettings | null> => {
    const res = await fetch(`${API_URL}/settings`, { headers: getHeaders() });
    if (!res.ok) return null;
    return res.json();
  },
  saveSettings: async (settings: CompanySettings) => {
    await fetch(`${API_URL}/settings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(settings)
    });
  }
};

export const generateId = () => Math.random().toString(36).substring(2, 9);
