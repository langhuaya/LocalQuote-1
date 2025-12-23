
import { Quote, Product, Customer, CompanySettings, User, Brand, Contract } from '../types';
// Import GoogleGenAI from @google/genai as per guidelines
import { GoogleGenAI } from "@google/genai";

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

  // Fix: Added chatWithAi method to handle requests from AiAssistant using Google Gemini API.
  chatWithAi: async (messages: any[]) => {
    try {
      // Use named parameter for apiKey as required by the latest SDK.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Separate system instruction from the chat history.
      const systemMessage = messages.find(m => m.role === 'system');
      const chatMessages = messages.filter(m => m.role !== 'system');
      
      // Map standard roles (user/assistant) to Gemini roles (user/model).
      const contents = chatMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      // Query Gemini 3 Pro for advanced reasoning and data extraction tasks.
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents,
        config: {
          systemInstruction: systemMessage?.content,
        },
      });

      // Extract generated text using the .text property (not a method).
      return {
        choices: [
          {
            message: {
              content: response.text
            }
          }
        ]
      };
    } catch (error: any) {
      console.error('Gemini AI API Error:', error);
      return { error: error.message || 'Failed to generate AI response' };
    }
  }
};
export const generateId = () => Math.random().toString(36).substring(2, 9);
