
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
  reference?: string; 
  cost: number;
  currency: Currency;
  hasStock: boolean;
  isDefault: boolean;
  notes?: string;
}

export interface PriceHistoryItem {
  date: string;
  price: number; 
  cost?: number; 
  supplier?: string; 
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
  brand?: string; 
  note?: string;  
  cost?: number; 
  imageDataUrl?: string; // New: Product Image
  supplierName?: string; 
  supplierReference?: string; 
  suppliers?: SupplierInfo[];
  createdBy?: string;
  createdAt?: string; 
  updatedBy?: string;
  updatedAt?: string;
  priceHistory?: PriceHistoryItem[];
}

export type CustomerRegion = 'International' | 'Domestic';

export interface Customer {
  id: string;
  region: CustomerRegion; 
  
  // Shared
  name: string; 
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  
  // International Specific
  city?: string;
  country?: string;
  zipCode?: string;
  
  // Domestic Specific
  taxId?: string; 
  bankName?: string; 
  bankAccount?: string; 
  
  source: string;
  createdBy?: string;
  createdAt?: string; 
  updatedBy?: string;
}

export interface DomesticCompanyInfo {
  name: string; 
  address: string;
  contact: string;
  phone: string;
  fax: string;
  taxId: string; 
  bankName: string; 
  bankAccount: string; 
  stampDataUrl: string; 
  contractTerms: string; 
  contractPrefix: string; 
}

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface CompanySettings {
  // International Info
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
  productUnits?: string; // New: Custom Product Units
  exchangeRates: { [key: string]: number };

  // New: Domestic Info
  domestic: DomesticCompanyInfo;
  
  // New: AI Configuration
  ai?: AiConfig;
}

export interface QuoteItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  description: string;
  imageDataUrl?: string; // New: Snapshot of image for quote
  unit: string;
  quantity: number;
  price: number;
  amount: number;
  brand?: string;
  leadTime?: string; 
}

export interface Quote {
  id: string;
  number: string;
  type: QuoteType;
  date: string;
  validUntil: string;
  customerId: string;
  customerSnapshot: Customer;
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
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
}

export interface Contract {
  id: string;
  contractNumber: string; 
  date: string; 
  place: string; 
  
  supplierId?: string; 
  supplierSnapshot: DomesticCompanyInfo; 
  
  customerId: string;
  customerSnapshot: Customer; 
  
  items: QuoteItem[];
  totalAmount: number;
  currency: Currency; 
  
  terms: string; 
  
  status: 'Draft' | 'Signed';
  createdBy?: string;
  createdAt?: string;
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
