
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Quote, QuoteType, Currency, Customer, Product, QuoteItem, CompanySettings } from '../types';
import { Plus, Trash2, Save, ArrowLeft, Eye, X, Image as ImageIcon, ChevronDown, Download } from 'lucide-react';
import { generateId } from '../services/api';
import { InvoiceTemplate } from './InvoiceTemplate';

interface QuoteEditorProps {
  initialQuote?: Quote | null;
  customers: Customer[];
  products: Product[];
  settings: CompanySettings;
  onSave: (quote: Quote) => void;
  onCancel: () => void;
  onExport: (quote: Quote, format: 'pdf' | 'image', options?: { showImages: boolean }) => void;
  t: (key: string) => string;
}

// Helper to format currency numbers consistently with InvoiceTemplate
const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Sub-components: Search implementations remain robust
const ProductSearch = ({ products, value, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedProduct = products.find((p: any) => p.id === value);

  const toggleOpen = () => {
    if (!isOpen && wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setDropdownStyle({ position: 'fixed', top: rect.bottom + window.scrollY, left: rect.left, width: Math.max(rect.width, 350), zIndex: 9999 });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClick = (e: any) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false); };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className={`w-full p-2 border rounded text-xs cursor-pointer flex justify-between items-center ${selectedProduct ? 'bg-blue-50 border-blue-200' : 'bg-white'}`} onClick={toggleOpen}>
        <span className="truncate">{selectedProduct ? selectedProduct.sku : "Select SKU..."}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </div>
      {isOpen && createPortal(
        <div style={dropdownStyle as any} className="bg-white border rounded-lg shadow-2xl max-h-60 overflow-y-auto fixed">
          <div className="p-2 border-b sticky top-0 bg-white"><input autoFocus className="w-full p-2 bg-gray-50 border rounded text-sm" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()}/></div>
          {products.filter((p: any) => p.sku.toLowerCase().includes(searchTerm.toLowerCase())).map((p: any) => (
            <div key={p.id} className="p-2 hover:bg-blue-50 cursor-pointer border-b flex items-center" onClick={() => { onChange(p.id); setIsOpen(false); }}>
               {p.imageDataUrl && <img src={p.imageDataUrl} className="w-8 h-8 object-contain mr-2 border" />}
               <div className="text-xs font-bold">{p.sku} <div className="text-gray-500 font-normal">{p.name}</div></div>
            </div>
          ))}
        </div>, document.body
      )}
    </div>
  );
};

export const QuoteEditor: React.FC<QuoteEditorProps> = ({
  initialQuote, customers, products, settings, onSave, onCancel, onExport, t
}) => {
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
  const [salesperson, setSalesperson] = useState({ name: '', email: '', phone: '' });
  const [showPreview, setShowPreview] = useState(false);
  const [showImages, setShowImages] = useState(true);

  const DRAFT_KEY = initialQuote ? `quote_draft_${initialQuote.id}` : 'quote_draft_new';

  useEffect(() => {
    // 1. First set from data
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
      setSalesperson(initialQuote.salesperson || { name: localStorage.getItem('user_fullName') || '', email: localStorage.getItem('user_email') || '', phone: localStorage.getItem('user_phone') || '' });
    } else {
      const now = new Date();
      const ds = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      setQuoteNumber(`${settings.quotePrefix}${ds}${Math.floor(Math.random()*1000).toString().padStart(3, '0')}`);
      setValidUntil(new Date(now.setMonth(now.getMonth()+1)).toISOString().split('T')[0]);
      setSalesperson({ name: localStorage.getItem('user_fullName') || '', email: localStorage.getItem('user_email') || '', phone: localStorage.getItem('user_phone') || '' });
      setItems([{ id: generateId(), productId: '', sku: '', name: '', description: '', unit: 'pcs', quantity: 1, price: 0, amount: 0, brand: '', leadTime: 'in stock' }]);
    }

    // 2. Check for emergency draft recovery
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved && !initialQuote) {
        if (confirm("Found unsaved data from last session. Recover?")) {
            const d = JSON.parse(saved);
            setCustomerId(d.customerId);
            setItems(d.items);
            setNotes(d.notes);
        } else {
            localStorage.removeItem(DRAFT_KEY);
        }
    }
  }, [initialQuote]);

  // Persistent Saving
  useEffect(() => {
    if (items.length > 0) {
        const draft = { customerId, items, notes, discountRate, shipping };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [customerId, items, notes, discountRate, shipping]);

  const totals = useMemo(() => {
    const sub = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const disc = sub * (discountRate / 100);
    return { subtotal: sub, discountAmount: disc, total: sub - disc + shipping };
  }, [items, discountRate, shipping]);

  const handleItemChange = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'productId') {
          const p = products.find(prod => prod.id === value);
          if (p) { Object.assign(updated, { sku: p.sku, name: p.name, price: p.price, brand: p.brand, imageDataUrl: p.imageDataUrl }); }
        }
        updated.amount = updated.price * updated.quantity;
        return updated;
      }
      return item;
    }));
  };

  const getDocData = (): Quote => ({
      id: initialQuote?.id || generateId(),
      number: quoteNumber, type, status, date, validUntil, customerId,
      customerSnapshot: customers.find(c => c.id === customerId) || { name: 'New Client', address: '', contactPerson: '', phone: '', email: '', region: 'International', id: '', source: '' },
      salesperson, items, currency, ...totals, incoterms, leadTime, paymentTerms, notes
  });

  const handleSave = () => {
    if (!customerId) return alert('Select Customer');
    onSave(getDocData());
    localStorage.removeItem(DRAFT_KEY);
  };

  return (
    <div className="bg-white shadow rounded-lg flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center space-x-4">
            <button onClick={onCancel} className="text-gray-600 hover:text-black flex items-center"><ArrowLeft size={18} className="mr-1"/>{t('cancel')}</button>
            <h2 className="text-xl font-bold">{initialQuote ? t('edit') : t('newQuote')}</h2>
        </div>
        <div className="flex space-x-2">
            <button onClick={() => setShowPreview(true)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded font-bold shadow-sm"><Eye size={18} className="mr-2 inline"/>{t('preview')}</button>
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded font-bold shadow-lg hover:bg-blue-700"><Save size={18} className="mr-2 inline"/>{t('save')}</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-3 gap-8">
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                  <div><label className="text-[10px] font-black text-gray-400 uppercase">Ref No.</label><input className="w-full p-2 border rounded font-bold" value={quoteNumber} onChange={e => setQuoteNumber(e.target.value)}/></div>
                  <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] font-black text-gray-400 uppercase">Date</label><input type="date" className="w-full p-2 border rounded text-xs" value={date} onChange={e => setDate(e.target.value)}/></div>
                      <div><label className="text-[10px] font-black text-gray-400 uppercase">Expiry</label><input type="date" className="w-full p-2 border rounded text-xs" value={validUntil} onChange={e => setValidUntil(e.target.value)}/></div>
                  </div>
              </div>
              <div className="col-span-2 space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Select Customer</label>
                    <select className="w-full p-2 border rounded mt-1 font-bold" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                        <option value="">-- Search Customer --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                      <div><label className="text-[10px] font-black text-gray-400 uppercase">Currency</label><select className="w-full p-2 border rounded" value={currency} onChange={e => setCurrency(e.target.value as Currency)}>{Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                      <div><label className="text-[10px] font-black text-gray-400 uppercase">Incoterms</label><input className="w-full p-2 border rounded" value={incoterms} onChange={e => setIncoterms(e.target.value)}/></div>
                      <div><label className="text-[10px] font-black text-gray-400 uppercase">Lead Time</label><input className="w-full p-2 border rounded" value={leadTime} onChange={e => setLeadTime(e.target.value)}/></div>
                      <div><label className="text-[10px] font-black text-gray-400 uppercase">Payment</label><input className="w-full p-2 border rounded" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}/></div>
                  </div>
              </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                  <thead className="bg-slate-900 text-white">
                      <tr>
                          <th className="p-3 text-left w-48 uppercase text-[10px]">Product / SKU</th>
                          <th className="p-3 text-left uppercase text-[10px]">Description</th>
                          <th className="p-3 text-center w-24 uppercase text-[10px]">Qty</th>
                          <th className="p-3 text-right w-32 uppercase text-[10px]">Price</th>
                          <th className="p-3 text-right w-32 uppercase text-[10px]">Total</th>
                          <th className="p-3 w-12"></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y">
                      {items.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50">
                              <td className="p-3 align-top">
                                  <ProductSearch products={products} value={item.productId} onChange={(pid: string) => handleItemChange(item.id, 'productId', pid)}/>
                                  <input className="w-full mt-1 p-1 border rounded text-[10px]" value={item.sku} onChange={e => handleItemChange(item.id, 'sku', e.target.value)} placeholder="SKU Override"/>
                              </td>
                              <td className="p-3 align-top">
                                  <textarea className="w-full p-2 border rounded text-xs" rows={2} value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)}/>
                                  <div className="flex space-x-2 mt-1">
                                      <input className="p-1 border rounded text-[10px] flex-1" value={item.brand || ''} onChange={e => handleItemChange(item.id, 'brand', e.target.value)} placeholder="Brand"/>
                                      <input className="p-1 border rounded text-[10px] w-20 text-center" value={item.unit} onChange={e => handleItemChange(item.id, 'unit', e.target.value)} placeholder="Unit"/>
                                  </div>
                              </td>
                              <td className="p-3 align-top"><input type="number" className="w-full p-2 border rounded text-center font-bold" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))}/></td>
                              <td className="p-3 align-top"><input type="number" className="w-full p-2 border rounded text-right font-bold text-blue-600" value={item.price} onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value))}/></td>
                              <td className="p-3 align-top text-right font-bold pt-5">{currency} {item.amount.toLocaleString()}</td>
                              <td className="p-3 align-top"><button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="p-2 text-gray-300 hover:text-red-600"><Trash2 size={16}/></button></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              <button onClick={() => setItems([...items, { id: generateId(), productId: '', sku: '', name: '', description: '', unit: 'pcs', quantity: 1, price: 0, amount: 0, brand: '', leadTime: 'in stock' }])} className="w-full py-4 text-blue-600 font-bold hover:bg-blue-50 border-t flex justify-center items-center uppercase text-xs"><Plus size={18} className="mr-2"/> Add Line Item</button>
          </div>

          <div className="grid grid-cols-2 gap-12">
              <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Internal Notes</label>
                  <textarea className="w-full p-4 border rounded-xl h-32 text-sm bg-yellow-50/20" value={notes} onChange={e => setNotes(e.target.value)}/>
              </div>
              <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3">
                  <div className="flex justify-between opacity-50 text-xs"><span>Subtotal</span><span>{currency} {totals.subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center">Discount (%) <input type="number" className="ml-2 w-16 bg-slate-800 rounded p-1 text-right" value={discountRate} onChange={e => setDiscountRate(parseFloat(e.target.value) || 0)}/></div>
                      <span className="text-red-400">- {fmt(totals.discountAmount)}</span>
                  </div>
                  <div className="h-px bg-white/10 my-2"></div>
                  <div className="flex justify-between items-center pt-2">
                      <span className="text-xl font-light">GRAND TOTAL</span>
                      <span className="text-3xl font-bold text-blue-400">{currency} {totals.total.toLocaleString()}</span>
                  </div>
              </div>
          </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold">Document Preview</h3>
                    <div className="flex space-x-3">
                         <button onClick={() => onExport(getDocData(), 'pdf', { showImages })} className="bg-green-600 text-white px-4 py-2 rounded font-bold flex items-center shadow"><Download size={18} className="mr-2"/>Export PDF</button>
                         <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-black"><X size={28} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto bg-gray-200 p-8 flex justify-center">
                    <InvoiceTemplate quote={getDocData()} settings={settings} mode="preview" showImages={showImages} />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
