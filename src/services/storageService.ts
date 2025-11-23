import { Quote, Product, Customer, CompanySettings } from '../types';

const KEYS = {
  QUOTES: 'sq_quotes',
  PRODUCTS: 'sq_products',
  CUSTOMERS: 'sq_customers',
  SETTINGS: 'sq_settings',
};

// Generated LH WAVE Logo (Blue Gradient Text SVG)
const DEFAULT_LOGO = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 100' width='300' height='100'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' style='stop-color:%2300c6ff;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%230072ff;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Ctext x='10' y='70' font-family='Arial, sans-serif' font-weight='bold' font-size='60' fill='url(%23grad1)'%3ELH WAVE%3C/text%3E%3C/svg%3E";

export const storageService = {
  // --- Products ---
  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  },
  saveProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  // --- Customers ---
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  },
  saveCustomers: (customers: Customer[]) => {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  // --- Quotes ---
  getQuotes: (): Quote[] => {
    const data = localStorage.getItem(KEYS.QUOTES);
    return data ? JSON.parse(data) : [];
  },
  saveQuotes: (quotes: Quote[]) => {
    localStorage.setItem(KEYS.QUOTES, JSON.stringify(quotes));
  },
  saveQuote: (quote: Quote) => {
    const quotes = storageService.getQuotes();
    const index = quotes.findIndex(q => q.id === quote.id);
    if (index >= 0) {
      quotes[index] = quote;
    } else {
      quotes.push(quote);
    }
    storageService.saveQuotes(quotes);
  },

  // --- Settings ---
  getSettings: (): CompanySettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    if (data) return JSON.parse(data);
    
    return {
      name: 'LH WAVE TRADING CO., LTD.',
      address: '123 Ocean Business Park, Coastal Road',
      city: 'Shenzhen',
      country: 'China',
      phone: '+86 755 1234 5678',
      email: 'sales@lhwave.com',
      logoDataUrl: DEFAULT_LOGO,
      stampDataUrl: '',
      bankInfo: 'BENEFICIARY: LH WAVE TRADING CO., LTD.\nBANK: BANK OF CHINA\nSWIFT: BKCHCNBJ300\nA/C NO: 1234567890123456',
      quotePrefix: 'LH-'
    };
  },
  saveSettings: (settings: CompanySettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },
};

export const generateId = () => Math.random().toString(36).substring(2, 9);