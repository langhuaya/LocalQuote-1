export enum QuoteType {
  PROFORMA = 'Proforma Invoice',
  COMMERCIAL = 'Commercial Invoice',
  QUOTATION = 'Quotation'
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  CNY = 'CNY',
  GBP = 'GBP'
}

export interface PriceHistoryItem {
  date: string;
  price: number;
  updatedBy: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: Currency;
  unit: string;
  cost?: number; // Internal cost
  
  // Ownership & History
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: string;
  priceHistory?: PriceHistoryItem[];
}

export interface Customer {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  zipCode: string;
  taxId: string;
  source: string;

  // Ownership
  createdBy?: string;
  updatedBy?: string;
}

export interface CompanySettings {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  logoDataUrl: string;
  stampDataUrl: string;
  bankInfo: string;
  quotePrefix: string;
}

export interface QuoteItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  price: number;
  amount: number;
}

export interface Quote {
  id: string;
  number: string;
  type: QuoteType;
  date: string;
  validUntil: string;
  customerId: string;
  customerSnapshot: Customer;
  items: QuoteItem[];
  currency: Currency;
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  shipping: number;
  total: number;
  incoterms: string;
  leadTime: string;
  paymentTerms: string;
  notes: string;
  status: 'Draft' | 'Sent' | 'Accepted';

  // Ownership
  createdBy?: string;
  updatedBy?: string;
}

export interface User {
  id: number;
  username: string;
  role?: 'admin' | 'user';
}