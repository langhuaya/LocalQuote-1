
import React, { useState, useEffect, useMemo } from 'react';
import { Quote, QuoteType, Currency, Customer, Product, QuoteItem, CompanySettings } from '../types';
import { Plus, Trash2, Save, ArrowLeft, Eye, X, Search, Image as ImageIcon } from 'lucide-react';
import { generateId } from '../services/storageService';
import { InvoiceTemplate } from './InvoiceTemplate';

interface QuoteEditorProps {
  initialQuote?: Quote | null;
  customers: Customer[];
  products: Product[];
  settings: CompanySettings;
  onSave: (quote: Quote) => void;
  onCancel: () => void;
  onExport: (quote: Quote, format: 'pdf' | 'image') => void;
  t: (key: string) => string;
}

export const QuoteEditor: React.FC<QuoteEditorProps> = ({
  initialQuote,
  customers,
  products,
  settings,
  onSave,
  onCancel,
  onExport,
  t
}) => {
  // --- State ---
  const [quoteNumber, setQuoteNumber] = useState('');
  const [type, setType] = useState<QuoteType>(QuoteType.PROFORMA);
  const [status, setStatus] = useState<Quote['status']>('Draft');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [currency, setCurrency] = useState<Currency>(Currency.USD);
  const [incoterms, setIncoterms] = useState('EXW');
  const [leadTime, setLeadTime] = useState('2-3 Weeks');
  const [paymentTerms, setPaymentTerms] = useState('100% T/T in advance');
  const [notes, setNotes] = useState('');
  const [discountRate, setDiscountRate] = useState(0);
  const [shipping, setShipping] = useState(0);
  
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // --- Init ---
  useEffect(() => {
    if (initialQuote) {
      setQuoteNumber(initialQuote.number);
      setType(initialQuote.type);
      setStatus(initialQuote.status);
      setDate(initialQuote.date);
      setValidUntil(initialQuote.validUntil);
      setCustomerId(initialQuote.customerId);
      setCurrency(initialQuote.currency);
      setIncoterms(initialQuote.incoterms);
      setLeadTime(initialQuote.leadTime);
      setPaymentTerms(initialQuote.paymentTerms);
      setNotes(initialQuote.notes);
      setDiscountRate(initialQuote.discountRate);
      setShipping(initialQuote.shipping || 0);
      setItems(initialQuote.items);
    } else {
      // New Quote Defaults
      setQuoteNumber(`${settings.quotePrefix}${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`);
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      setValidUntil(nextMonth.toISOString().split('T')[0]);
      
      // Add one empty item to start
      setItems([{
        id: generateId(),
        productId: '',
        sku: '',
        name: '',
        description: '',
        unit: 'pcs',
        quantity: 1,
        price: 0,
        amount: 0,
      }]);
    }
  }, [initialQuote, settings.quotePrefix]);

  // --- Calculations ---
  const { subtotal, discountAmount, total } = useMemo(() => {
    const sub = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const disc = sub * (discountRate / 100);
    // Total = Subtotal - Discount + Shipping
    return {
      subtotal: sub,
      discountAmount: disc,
      total: sub - disc + shipping,
    };
  }, [items, discountRate, shipping]);

  // --- Handlers ---
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: generateId(),
        productId: '',
        sku: '',
        name: '',
        description: '',
        unit: 'pcs',
        quantity: 1,
        price: 0,
        amount: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof QuoteItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          
          // Auto-fill from product if productId changes
          if (field === 'productId') {
             const prod = products.find(p => p.id === value);
             if (prod) {
                updated.sku = prod.sku;
                updated.name = prod.name;
                updated.description = prod.description;
                updated.price = prod.price; // Copies price blindly, user must verify currency
                updated.unit = prod.unit || 'pcs';
             }
          }
          
          updated.amount = updated.price * updated.quantity;
          return updated;
        }
        return item;
      })
    );
  };

  const getPreviewData = (): Quote => {
      const selectedCustomer = customers.find(c => c.id === customerId);
      // Fallback customer data for preview if none selected
      const fallbackCustomer: Customer = { 
          id: '0', 
          name: 'Client Company Name (Preview)', 
          contactPerson: 'Contact Person', 
          email: 'client@example.com', 
          phone: '+1 234 567 890', 
          address: '123 Client Street', 
          city: 'New York', 
          country: 'USA', 
          zipCode: '10001', 
          taxId: 'TAX-12345', 
          source: 'Web' 
      };

      return {
          id: initialQuote?.id || 'preview',
          number: quoteNumber || 'DRAFT-001',
          type,
          status,
          date,
          validUntil,
          customerId,
          customerSnapshot: selectedCustomer || fallbackCustomer, 
          items,
          currency,
          subtotal,
          discountRate,
          discountAmount,
          shipping,
          total,
          incoterms,
          leadTime,
          paymentTerms,
          notes,
      };
  };

  const handleSave = () => {
    if (!customerId) {
      alert('Please select a customer');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one product');
      return;
    }

    const selectedCustomer = customers.find(c => c.id === customerId);
    if (!selectedCustomer) return;

    const quote: Quote = getPreviewData();
    quote.id = initialQuote?.id || generateId();
    quote.customerSnapshot = selectedCustomer;

    onSave(quote);
  };

  return (
    <div className="bg-white shadow rounded-lg flex flex-col h-full relative">
      {/* Header Actions */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 rounded-t-lg z-20 relative space-y-3 md:space-y-0">
        <div className="flex items-center w-full md:w-auto justify-between">
            <button onClick={onCancel} className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft size={18} className="mr-2" /> {t('cancel')}
            </button>
            <h2 className="text-xl font-bold text-gray-800 md:hidden">{initialQuote ? t('edit') : t('newQuote')}</h2>
        </div>
        <h2 className="text-xl font-bold text-gray-800 hidden md:block">{initialQuote ? t('edit') : t('newQuote')}</h2>
        <div className="flex space-x-2 w-full md:w-auto overflow-x-auto">
             <button
              onClick={() => onExport(getPreviewData(), 'image')}
              className="flex-1 md:flex-none flex items-center justify-center bg-orange-100 text-orange-700 px-4 py-2 rounded hover:bg-orange-200 transition-colors whitespace-nowrap"
            >
              <ImageIcon size={18} className="mr-2" /> {t('exportImage')}
            </button>
             <button
              onClick={() => setShowPreview(true)}
              className="flex-1 md:flex-none flex items-center justify-center bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 transition-colors whitespace-nowrap"
            >
              <Eye size={18} className="mr-2" /> {t('preview')}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 md:flex-none flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow-sm transition-colors whitespace-nowrap"
            >
              <Save size={18} className="mr-2" /> {t('save')}
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8">
        {/* Main Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
          {/* Left: Basic Info */}
          <div className="space-y-4 lg:col-span-1">
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                 {t('quoteDetails')}
              </h3>
              <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">{t('number')}</label>
                    <input
                    type="text"
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                    className="w-full mt-1 p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">{t('type')}</label>
                    <select
                    value={type}
                    onChange={(e) => setType(e.target.value as QuoteType)}
                    className="w-full mt-1 p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                    >
                        {Object.values(QuoteType).map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">{t('status')}</label>
                     <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full mt-1 p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Accepted">Accepted</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">{t('date')}</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">{t('validUntil')}</label>
                        <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full mt-1 p-2 border rounded" />
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Customer & Terms */}
          <div className="space-y-4 lg:col-span-2">
            <div className="p-4 border rounded-lg bg-white">
               <h3 className="font-semibold text-gray-700 mb-4">{t('billTo')}</h3>
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{t('selectCustomer')}</label>
                    <select
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">{t('selectCustomer')}</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.country})</option>
                        ))}
                    </select>
                </div>
                {customerId && (
                    <div className="mt-4 p-3 bg-blue-50 text-sm text-blue-800 rounded">
                        {(() => {
                            const c = customers.find(cust => cust.id === customerId);
                            return c ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="font-bold">{c.contactPerson}</p>
                                        <p>{c.email}</p>
                                        <p>{c.phone}</p>
                                    </div>
                                    <div className="sm:text-right">
                                        <p>{c.name}</p>
                                        <p>{c.address}</p>
                                        <p>{c.city}, {c.country} {c.zipCode}</p>
                                    </div>
                                </div>
                            ) : null;
                        })()}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                     <label className="block text-xs font-medium text-gray-500 uppercase">{t('currency')}</label>
                     <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="w-full mt-1 p-2 border rounded">
                         {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                </div>
                 <div>
                     <label className="block text-xs font-medium text-gray-500 uppercase">{t('incoterms')}</label>
                     <input value={incoterms} onChange={e => setIncoterms(e.target.value)} className="w-full mt-1 p-2 border rounded" placeholder="e.g. FOB Shanghai" />
                </div>
                 <div>
                     <label className="block text-xs font-medium text-gray-500 uppercase">{t('leadTime')}</label>
                     <input value={leadTime} onChange={e => setLeadTime(e.target.value)} className="w-full mt-1 p-2 border rounded" placeholder="e.g. 4 weeks" />
                </div>
            </div>
             <div>
                 <label className="block text-xs font-medium text-gray-500 uppercase">{t('paymentTerms')}</label>
                 <input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="w-full mt-1 p-2 border rounded" placeholder="e.g. 30% Deposit, Balance before shipment" />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h3 className="font-bold text-lg text-gray-800 mb-4">{t('lineItems')}</h3>
          <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b">
                    <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/5">Select Product / SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/4">{t('name')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/4">{t('desc')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-20">{t('qty')}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">{t('unit')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-24">{t('price')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-24">{t('amount')}</th>
                    <th className="px-4 py-3 w-12"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 group">
                        <td className="px-4 py-2 align-top">
                        {/* Improved Product Selector */}
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
                            <select
                                className="w-full pl-8 p-2 border rounded text-sm mb-2 font-medium text-blue-700 bg-blue-50 focus:ring-2 focus:ring-blue-500"
                                value={item.productId}
                                onChange={(e) => handleItemChange(item.id, 'productId', e.target.value)}
                            >
                                <option value="">-- Select from Inventory --</option>
                                {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.sku} - {p.name}
                                </option>
                                ))}
                            </select>
                        </div>
                        <input 
                            className="w-full p-1.5 border rounded text-sm text-gray-600 placeholder-gray-400"
                            placeholder="SKU Override"
                            value={item.sku}
                            onChange={(e) => handleItemChange(item.id, 'sku', e.target.value)}
                        />
                        </td>
                        <td className="px-4 py-2 align-top">
                        <input 
                            className="w-full p-2 border rounded text-sm text-gray-800 font-medium"
                            placeholder="Item Name"
                            value={item.name}
                            onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        />
                        </td>
                        <td className="px-4 py-2 align-top">
                            <textarea 
                                className="w-full p-2 border rounded text-sm" 
                                rows={3} 
                                value={item.description} 
                                onChange={e => handleItemChange(item.id, 'description', e.target.value)} 
                            />
                        </td>
                        <td className="px-4 py-2 align-top">
                            <input type="number" min="1" className="w-full p-2 border rounded text-sm text-right font-mono" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))} />
                        </td>
                        <td className="px-4 py-2 align-top">
                            <input className="w-full p-2 border rounded text-sm text-center" value={item.unit || 'pcs'} onChange={e => handleItemChange(item.id, 'unit', e.target.value)} />
                        </td>
                        <td className="px-4 py-2 align-top">
                            <input type="number" min="0" step="0.01" className="w-full p-2 border rounded text-sm text-right font-mono" value={item.price} onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value))} />
                        </td>
                        <td className="px-4 py-2 align-top text-right font-bold text-gray-800 pt-3">
                            {currency} {item.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 align-top text-center">
                        <button onClick={() => handleRemoveItem(item.id)} className="text-gray-300 hover:text-red-600 mt-2 transition-colors">
                            <Trash2 size={18} />
                        </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
             <button onClick={handleAddItem} className="w-full py-4 text-blue-600 font-bold text-sm hover:bg-blue-50 flex justify-center items-center border-t border-gray-200 transition-colors uppercase tracking-wider">
                <Plus size={16} className="mr-2" /> {t('addItem')}
             </button>
          </div>
        </div>

        {/* Footer / Totals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{t('notes')}</label>
                <textarea
                    className="w-full p-3 border rounded-lg h-32 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter any notes to display on the quote..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                ></textarea>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg space-y-3">
                 <div className="flex justify-between text-gray-600">
                    <span>{t('subtotal')}</span>
                    <span>{currency} {subtotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-gray-600">
                    <span className="flex items-center">{t('discountRate')} (%)</span>
                    <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={discountRate}
                        onChange={(e) => setDiscountRate(parseFloat(e.target.value))}
                        className="w-20 p-1 border rounded text-right text-sm"
                    />
                 </div>
                 {discountAmount > 0 && (
                     <div className="flex justify-between text-red-500 text-sm">
                        <span>{t('discountAmount')}</span>
                        <span>- {currency} {discountAmount.toFixed(2)}</span>
                     </div>
                 )}
                 
                 {/* Shipping Input */}
                 <div className="flex justify-between items-center text-gray-600">
                    <span className="flex items-center">{t('shipping')}</span>
                    <div className="flex items-center">
                        <span className="mr-2 text-sm">{currency}</span>
                        <input 
                            type="number" 
                            min="0" 
                            step="0.01"
                            value={shipping}
                            onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                            className="w-24 p-1 border rounded text-right text-sm"
                        />
                    </div>
                 </div>

                 <div className="border-t border-gray-300 pt-4 mt-2 flex justify-between text-xl font-bold text-gray-800">
                    <span>{t('grandTotal')}</span>
                    <span>{currency} {total.toFixed(2)}</span>
                 </div>
            </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 flex-shrink-0">
                    <h3 className="font-bold text-lg text-gray-800">Preview PDF</h3>
                    <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-red-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                {/* Updated Modal Body for better scrolling */}
                <div className="flex-1 bg-gray-200 overflow-y-auto p-8">
                     <InvoiceTemplate 
                        quote={getPreviewData()} 
                        settings={settings} 
                        mode="preview" 
                     />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
