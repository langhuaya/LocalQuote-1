
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Quote, QuoteType, Currency, Customer, Product, QuoteItem, CompanySettings } from '../types';
import { Plus, Trash2, Save, ArrowLeft, Eye, X, Search, Image as ImageIcon, ChevronDown, Check, Download, RotateCcw } from 'lucide-react';
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

// ... ProductSearch and CustomerSearch Sub-components remain same as previous version but with stabilized IDs ...
const ProductSearch = ({ products, value, onChange, currency }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedProduct = products.find((p: any) => p.id === value);

  const toggleOpen = () => {
    if (!isOpen && wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setDropdownStyle({
            position: 'fixed',
            top: rect.bottom + window.scrollY,
            left: rect.left,
            width: Math.max(rect.width, 350),
            zIndex: 9999
        });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClick = (e: any) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const filtered = products.filter((p: any) => 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className={`w-full p-2 border rounded text-xs cursor-pointer flex justify-between items-center ${selectedProduct ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-300'}`} onClick={toggleOpen}>
        <span className="truncate">{selectedProduct ? `${selectedProduct.sku}` : "Search SKU..."}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </div>
      {isOpen && createPortal(
        <div style={dropdownStyle as any} className="bg-white border rounded-lg shadow-2xl max-h-60 overflow-y-auto fixed">
          <div className="p-2 sticky top-0 bg-white border-b"><input autoFocus className="w-full p-2 bg-gray-50 border rounded text-sm" placeholder="SKU/Name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()}/></div>
          {filtered.map((p: any) => (
            <div key={p.id} className="p-2 hover:bg-blue-50 cursor-pointer border-b flex items-center" onClick={() => { onChange(p.id); setIsOpen(false); }}>
               {p.imageDataUrl && <img src={p.imageDataUrl} className="w-8 h-8 object-contain mr-2 border rounded" />}
               <div className="text-xs font-bold">{p.sku} <div className="text-gray-500 font-normal">{p.name}</div></div>
            </div>
          ))}
        </div>, document.body
      )}
    </div>
  );
};

const CustomerSearch = ({ customers, value, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = customers.find((c: any) => c.id === value);

  const toggleOpen = () => {
    if (!isOpen && wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setDropdownStyle({ position: 'fixed', top: rect.bottom + window.scrollY, left: rect.left, width: rect.width, zIndex: 9999 });
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
      <div className={`w-full p-3 border rounded cursor-pointer flex justify-between items-center ${selected ? 'bg-blue-50 border-blue-200' : 'bg-white'}`} onClick={toggleOpen}>
        <span className="truncate font-bold">{selected ? selected.name : placeholder}</span>
        <ChevronDown size={16} />
      </div>
      {isOpen && createPortal(
        <div style={dropdownStyle as any} className="bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto fixed">
          <div className="p-2 border-b"><input autoFocus className="w-full p-2 bg-gray-50 border rounded text-sm" placeholder="Company..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()}/></div>
          {customers.filter((c: any) => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((c: any) => (
            <div key={c.id} className="p-3 hover:bg-blue-50 cursor-pointer border-b" onClick={() => { onChange(c.id); setIsOpen(false); }}>
              <div className="font-bold text-sm">{c.name}</div>
              <div className="text-xs text-gray-500">{c.contactPerson}</div>
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
  const [salesperson, setSalesperson] = useState({ name: '', email: '', phone: '' });
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showImages, setShowImages] = useState(true);

  // Draft key
  const DRAFT_KEY = `quote_draft_${initialQuote?.id || 'new'}`;

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    
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
      const dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      setQuoteNumber(`${settings.quotePrefix}${dateStr}${Math.floor(Math.random()*1000).toString().padStart(3, '0')}`);
      setValidUntil(new Date(now.setMonth(now.getMonth()+1)).toISOString().split('T')[0]);
      setSalesperson({ name: localStorage.getItem('user_fullName') || '', email: localStorage.getItem('user_email') || '', phone: localStorage.getItem('user_phone') || '' });
      setItems([{ id: generateId(), productId: '', sku: '', name: '', description: '', unit: 'pcs', quantity: 1, price: 0, amount: 0, brand: '', leadTime: 'in stock' }]);
    }

    // Recover Draft if exists and confirm with user
    if (savedDraft && !initialQuote) {
        if (confirm("Found an unsaved draft. Do you want to restore it?")) {
            const draft = JSON.parse(savedDraft);
            setCustomerId(draft.customerId);
            setItems(draft.items);
            setNotes(draft.notes);
            setDiscountRate(draft.discountRate);
            setShipping(draft.shipping);
        } else {
            localStorage.removeItem(DRAFT_KEY);
        }
    }
  }, [initialQuote]);

  // Real-time Draft Saving
  useEffect(() => {
    const draft = { customerId, items, notes, discountRate, shipping };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [customerId, items, notes, discountRate, shipping]);

  const totals = useMemo(() => {
    const sub = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const disc = sub * (discountRate / 100);
    return { subtotal: sub, discountAmount: disc, total: sub - disc + shipping };
  }, [items, discountRate, shipping]);

  const handleAddItem = () => {
    setItems([...items, { id: generateId(), productId: '', sku: '', name: '', description: '', unit: 'pcs', quantity: 1, price: 0, amount: 0, brand: '', leadTime: 'in stock' }]);
  };

  const handleItemChange = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'productId') {
          const p = products.find(prod => prod.id === value);
          if (p) { updated.sku = p.sku; updated.name = p.name; updated.price = p.price; updated.brand = p.brand; updated.imageDataUrl = p.imageDataUrl; }
        }
        updated.amount = updated.price * updated.quantity;
        return updated;
      }
      return item;
    }));
  };

  const getPreviewData = (): Quote => ({
      id: initialQuote?.id || 'preview',
      number: quoteNumber,
      type, status, date, validUntil,
      customerId,
      customerSnapshot: customers.find(c => c.id === customerId) || { name: 'Preview Client', address: '', contactPerson: '', phone: '', email: '', region: 'International', id: '', source: '' },
      salesperson, items, currency, ...totals,
      incoterms, leadTime, paymentTerms, notes
  });

  const handleSave = () => {
    if (!customerId) return alert('Please select customer');
    onSave(getPreviewData());
    localStorage.removeItem(DRAFT_KEY);
  };

  return (
    <div className="bg-white shadow rounded-lg flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center space-x-4">
            <button onClick={onCancel} className="text-gray-600 hover:text-black flex items-center"><ArrowLeft size={18} className="mr-1"/>{t('cancel')}</button>
            <h2 className="text-xl font-bold">{initialQuote ? t('edit') : t('newQuote')}</h2>
        </div>
        <div className="flex space-x-2">
            <label className="flex items-center px-3 py-1 bg-white border rounded text-xs cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={showImages} onChange={e => setShowImages(e.target.checked)} className="mr-2"/> Show Images
            </label>
            <button onClick={() => onExport(getPreviewData(), 'image', { showImages })} className="bg-orange-100 text-orange-700 px-4 py-2 rounded hover:bg-orange-200 flex items-center text-sm font-bold"><ImageIcon size={18} className="mr-2"/>{t('exportImage')}</button>
            <button onClick={() => setShowPreview(true)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 flex items-center text-sm font-bold"><Eye size={18} className="mr-2"/>{t('preview')}</button>
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center font-bold shadow-lg"><Save size={18} className="mr-2"/>{t('save')}</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-3 gap-8">
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                  <h4 className="text-xs font-bold text-gray-400 uppercase">Document Info</h4>
                  <div><label className="block text-[10px] font-bold text-gray-500">Ref No.</label><input className="w-full p-2 border rounded font-bold" value={quoteNumber} onChange={e => setQuoteNumber(e.target.value)}/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500">Type</label><select className="w-full p-2 border rounded" value={type} onChange={e => setType(e.target.value as QuoteType)}>{Object.values(QuoteType).map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-2">
                      <div><label className="block text-[10px] font-bold text-gray-500">Date</label><input type="date" className="w-full p-2 border rounded text-xs" value={date} onChange={e => setDate(e.target.value)}/></div>
                      <div><label className="block text-[10px] font-bold text-gray-500">Expiry</label><input type="date" className="w-full p-2 border rounded text-xs" value={validUntil} onChange={e => setValidUntil(e.target.value)}/></div>
                  </div>
              </div>
              <div className="col-span-2 space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Customer (Bill To)</h4>
                    <CustomerSearch customers={customers} value={customerId} onChange={setCustomerId} placeholder={t('selectCustomer')}/>
                    {customerId && (
                        <div className="mt-3 grid grid-cols-2 text-xs text-gray-600 gap-4">
                            <div className="border-l-2 border-blue-500 pl-3">
                                <p className="font-bold text-black">{customers.find(c => c.id === customerId)?.contactPerson}</p>
                                <p>{customers.find(c => c.id === customerId)?.email}</p>
                            </div>
                            <div className="text-right">
                                <p>{customers.find(c => c.id === customerId)?.address}</p>
                                <p>{customers.find(c => c.id === customerId)?.country}</p>
                            </div>
                        </div>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                      <div><label className="block text-[10px] font-bold text-gray-500 uppercase">Currency</label><select className="w-full p-2 border rounded font-bold" value={currency} onChange={e => setCurrency(e.target.value as Currency)}>{Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                      <div><label className="block text-[10px] font-bold text-gray-500 uppercase">Incoterms</label><input className="w-full p-2 border rounded" value={incoterms} onChange={e => setIncoterms(e.target.value)}/></div>
                      <div><label className="block text-[10px] font-bold text-gray-500 uppercase">Lead Time</label><input className="w-full p-2 border rounded" value={leadTime} onChange={e => setLeadTime(e.target.value)}/></div>
                      <div><label className="block text-[10px] font-bold text-gray-500 uppercase">Payment</label><input className="w-full p-2 border rounded" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}/></div>
                  </div>
              </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                  <thead className="bg-slate-900 text-white">
                      <tr>
                          <th className="p-3 text-left w-48">Select Product</th>
                          <th className="p-3 text-left">Description</th>
                          <th className="p-3 text-center w-24">Qty</th>
                          <th className="p-3 text-right w-32">Price</th>
                          <th className="p-3 text-right w-32">Total</th>
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
                                  <textarea className="w-full p-2 border rounded text-xs font-medium" rows={2} value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)}/>
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
              <button onClick={handleAddItem} className="w-full py-4 text-blue-600 font-bold hover:bg-blue-50 border-t flex justify-center items-center"><Plus size={18} className="mr-2"/> ADD NEW ITEM</button>
          </div>

          <div className="grid grid-cols-2 gap-12">
              <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Internal Notes / Terms</label>
                  <textarea className="w-full p-4 border rounded-xl h-32 text-sm bg-yellow-50/30" placeholder="Special requirements..." value={notes} onChange={e => setNotes(e.target.value)}/>
              </div>
              <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3 shadow-xl">
                  <div className="flex justify-between text-sm opacity-60"><span>Subtotal</span><span>{currency} {totals.subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center">Discount (%) <input type="number" className="ml-2 w-16 bg-slate-800 border-none rounded p-1 text-right text-xs" value={discountRate} onChange={e => setDiscountRate(parseFloat(e.target.value) || 0)}/></div>
                      <span className="text-red-400">- {currency} {totals.discountAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                      <span>Shipping Cost</span>
                      <div className="flex items-center"><span className="mr-1 text-xs opacity-40">{currency}</span><input type="number" className="w-24 bg-slate-800 border-none rounded p-1 text-right text-xs" value={shipping} onChange={e => setShipping(parseFloat(e.target.value) || 0)}/></div>
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
                <div className="p-4 border-b flex justify-between items-center flex-shrink-0 bg-gray-50">
                    <h3 className="font-bold text-lg">Document Preview</h3>
                    <div className="flex space-x-3">
                         <button onClick={() => onExport(getPreviewData(), 'pdf', { showImages })} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center"><Download size={18} className="mr-2"/>Export PDF</button>
                         <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-black"><X size={28} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto bg-gray-200 p-8 flex justify-center">
                    <div className="shadow-2xl h-fit">
                        <InvoiceTemplate quote={getPreviewData()} settings={settings} mode="preview" showImages={showImages} />
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
