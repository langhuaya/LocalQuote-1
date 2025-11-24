

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

export interface SupplierInfo {
  id: string;
  name: string;
  reference?: string; // Supplier SKU or Link
  cost: number;
  currency: Currency;
  hasStock: boolean;
  isDefault: boolean;
  notes?: string;
}

export interface PriceHistoryItem {
  date: string;
  price: number; // Sales Price at that time
  cost?: number; // Supplier Cost at that time
  supplier?: string; // Supplier at that time
  updatedBy: string;
}

export interface Brand {
  id: string;
  name: string;
  logoDataUrl?: string;
  description?: string;
  suppliers?: SupplierInfo[];
  
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: Currency;
  unit: string;
  brand?: string; // Brand Name
  note?: string;  // Internal Note
  
  // Sourcing Info (Computed from Default Supplier or Legacy)
  cost?: number; // Internal cost (Primary Supplier Price)
  supplierName?: string; // Primary Supplier Name
  supplierReference?: string; // Primary Supplier Ref
  
  // New Multi-Supplier Support
  suppliers?: SupplierInfo[];

  // Ownership & History
  createdBy?: string;
  createdAt?: string; // YYYY-MM-DD HH:mm
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
  createdAt?: string; // YYYY-MM-DD HH:mm
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
  // Exchange Rates (Base: USD)
  exchangeRates: { [key: string]: number };
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
  brand?: string; // Brand Name copied from product
}

export interface Quote {
  id: string;
  number: string;
  type: QuoteType;
  date: string;
  validUntil: string;
  customerId: string;
  customerSnapshot: Customer;
  
  // Salesperson / Creator Info
  salesperson?: {
    name: string;
    email: string;
    phone: string;
  };

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
  createdAt?: string; // YYYY-MM-DD HH:mm
  updatedBy?: string;
}

export interface User {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'user';
}