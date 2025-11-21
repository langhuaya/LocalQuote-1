
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

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: Currency;
  unit: string;
  cost?: number; // Internal cost, not shown on invoice
}

export interface Customer {
  id: string;
  name: string; // Company Name (English)
  contactPerson: string;
  email: string;
  phone: string;
  address: string; // Street Address
  city: string;
  country: string;
  zipCode: string;
  taxId: string;
  source: string;
}

export interface CompanySettings {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  logoDataUrl: string; // Base64 image data
  stampDataUrl: string; // Base64 image data for signature area
  bankInfo: string;
  quotePrefix: string;
}

export interface QuoteItem {
  id: string;
  productId: string; // Link to inventory if available
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
  customerSnapshot: Customer; // Snapshot in case customer details change later
  items: QuoteItem[];
  currency: Currency;
  subtotal: number;
  discountRate: number; // percentage
  discountAmount: number;
  total: number;
  incoterms: string;
  leadTime: string;
  paymentTerms: string;
  notes: string;
  status: 'Draft' | 'Sent' | 'Accepted';
}
