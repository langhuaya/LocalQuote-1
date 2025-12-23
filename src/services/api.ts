import { Quote, Product, Customer, CompanySettings, User, Brand, Contract } from '../types';

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

  // New Contract Methods
  getContracts: async (): Promise<Contract[]> => (await fetch(`${API_URL}/contracts`, { headers: getHeaders() })).json(),
  saveContract: async (c: Contract) => fetch(`${API_URL}/contracts`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(c) }),
  deleteContract: async (id: string) => fetch(`${API_URL}/contracts/${id}`, { method: 'DELETE', headers: getHeaders() }),

  getSettings: async () => {
      const res = await fetch(`${API_URL}/settings`, { headers: getHeaders() });
      return res.ok ? res.json() : null;
  },
  saveSettings: async (s) => fetch(`${API_URL}/settings`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(s) }),
};
export const generateId = () => Math.random().toString(36).substring(2, 9);
