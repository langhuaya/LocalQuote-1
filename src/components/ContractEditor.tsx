
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Contract, Customer, Product, QuoteItem, CompanySettings, Currency, CustomerRegion } from '../types';
import { Plus, Trash2, Save, ArrowLeft, Eye, X, Download, Image as ImageIcon, ChevronDown, Check, Search } from 'lucide-react';
import { generateId } from '../services/api';
import { ContractTemplate } from './ContractTemplate';

interface ContractEditorProps {
  initialContract?: Contract | null;
  customers: Customer[];
  products: Product[];
  settings: CompanySettings;
  onSave: (contract: Contract) => void;
  onCancel: () => void;
  onExport: (contract: Contract, format: 'pdf' | 'image') => void;
  t: (key: string) => string;
}

// --- Sub-component: Searchable Product Dropdown ---
const ProductSearch = ({ 
  products, 
  value, 
  onChange
}: { 
  products: Product[], 
  value: string, 
  onChange: (productId: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedProduct = products.find(p => p.id === value);

  const toggleOpen = () => {
    if (!isOpen && wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setDropdownStyle({
            position: 'fixed',
            top: rect.bottom,
            left: rect.left,
            width: Math.max(rect.width, 350),
            zIndex: 9999
        });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      const dropdownEl = document.getElementById('contract-prod-search-dropdown');
      if (wrapperRef.current && !wrapperRef.current.contains(target) && dropdownEl && !dropdownEl.contains(target)) {
        setIsOpen(false);
      }
    }
    if(isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter(p => 
      p.sku.toLowerCase().includes(lower) || 
      p.name.toLowerCase().includes(lower) ||
      (p.brand || '').toLowerCase().includes(lower)
    );
  }, [products, searchTerm]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative cursor-pointer" onClick={toggleOpen}>
        <div className={`w-full p-1 border rounded mb-1 text-xs flex items-center justify-between
          ${selectedProduct ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-gray-300 text-gray-500'}`}
        >
          <span className="truncate select-none">
            {selectedProduct ? `${selectedProduct.sku}` : "Search SKU..."}
          </span>
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      </div>

      {isOpen && createPortal(
        <div 
            id="contract-prod-search-dropdown"
            style={dropdownStyle} 
            className="bg-white border border-gray-200 rounded-lg shadow-2xl mt-1 max-h-72 overflow-y-auto flex flex-col"
        >
          <div className="sticky top-0 bg-white p-2 border-b border-gray-100 z-10">
             <input 
                autoFocus
                type="text"
                placeholder="Type SKU, Name..." 
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
             />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No products found.</div>
            ) : (
                <div className="py-1">
                {filteredProducts.map(p => (
                    <div 
                    key={p.id}
                    onClick={() => { onChange(p.id); setIsOpen(false); setSearchTerm(''); }}
                    className={`px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0
                        ${p.id === value ? 'bg-blue-50' : ''}`}
                    >
                    <div className="flex items-center overflow-hidden">
                        {p.imageDataUrl && <img src={p.imageDataUrl} alt="" className="w-8 h-8 object-contain mr-2 border rounded bg-white" />}
                        <div className="overflow-hidden">
                            <div className="flex items-center">
                                <span className="font-bold text-gray-800 text-sm mr-2">{p.sku}</span>
                            </div>
                            <div className="text-xs text-gray-600 truncate">{p.name}</div>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// --- Sub-component: Searchable Customer Dropdown ---
const CustomerSearch = ({ 
  customers, 
  value, 
  onChange,
  placeholder
}: { 
  customers: Customer[], 
  value: string, 
  onChange: (customerId: string) => void,
  placeholder: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedCustomer = customers.find(c => c.id === value);

  const toggleOpen = () => {
     if (!isOpen && wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setDropdownStyle({
            position: 'fixed',
            top: rect.bottom, 
            left: rect.left,
            width: rect.width,
            zIndex: 9999
        });
    }
    setIsOpen(!isOpen);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      const dropdownEl = document.getElementById('contract-cust-search-dropdown');
      if (wrapperRef.current && !wrapperRef.current.contains(target) && dropdownEl && !dropdownEl.contains(target)) {
        setIsOpen(false);
      }
    }
    if(isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredCustomers = customers.filter(c => 
     (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
     (c.contactPerson || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
       <div 
        className={`w-full p-2 border rounded cursor-pointer flex justify-between items-center mb-2 ${selectedCustomer ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
        onClick={toggleOpen}
       >
          <span className={`truncate ${!selectedCustomer && 'text-gray-500'}`}>
             {selectedCustomer ? `${selectedCustomer.name}` : placeholder}
          </span>
          <ChevronDown size={16} className="text-gray-400" />
       </div>

       {isOpen && createPortal(
          <div id="contract-cust-search-dropdown" style={dropdownStyle} className="bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto flex flex-col fixed">
             <div className="p-2 sticky top-0 bg-white border-b z-10">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 text-gray-400" size={14} />
                    <input 
                        autoFocus
                        className="w-full pl-8 p-2 border rounded text-sm bg-gray-50 focus:outline-none focus:border-blue-500"
                        placeholder="Search Company..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onClick={e => e.stopPropagation()} 
                    />
                </div>
             </div>
             <div className="flex-1 overflow-y-auto">
                 {filteredCustomers.length === 0 ? (
                     <div className="p-3 text-sm text-gray-500 text-center">No customers found</div>
                 ) : (
                     filteredCustomers.map(c => (
                         <div 
                            key={c.id} 
                            className={`p-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0 ${c.id === value ? 'bg-blue-50' : ''}`}
                            onClick={() => { onChange(c.id); setIsOpen(false); setSearchTerm(''); }}
                         >
                            <div className="font-bold text-gray-800">{c.name}</div>
                            <div className="text-xs text-gray-500">{c.contactPerson}</div>
                         </div>
                     ))
                 )}
             </div>
          </div>,
          document.body
       )}
    </div>
  )
}

export const ContractEditor: React.FC<ContractEditorProps> = ({
  initialContract,
  customers,
  products,
  settings,
  onSave,
  onCancel,
  onExport,
  t
}) => {
  const [contractNumber, setContractNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [place, setPlace] = useState('深圳');
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [terms, setTerms] = useState(settings.domestic?.contractTerms || '');
  const [showPreview, setShowPreview] = useState(false);

  // Filter only Domestic customers for Contract Editor
  const domesticCustomers = useMemo(() => customers.filter(c => c.region === 'Domestic'), [customers]);

  useEffect(() => {
    if (initialContract) {
      setContractNumber(initialContract.contractNumber);
      setDate(initialContract.date);
      setPlace(initialContract.place);
      setCustomerId(initialContract.customerId);
      setItems(initialContract.items);
      setTerms(initialContract.terms);
    } else {
      // New Contract
      const now = new Date();
      // Format: YYYYMMDD (e.g., 20251124)
      const dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      
      // Use Custom Prefix from settings or default
      const prefix = settings.domestic?.contractPrefix || 'ULHTZH';
      setContractNumber(`${prefix}${dateStr}${random}`);
      
      setItems([{
        id: generateId(),
        productId: '',
        sku: '',
        name: '',
        description: '',
        unit: '台',
        quantity: 1,
        price: 0,
        amount: 0,
        brand: '',
        leadTime: '现货'
      }]);
    }
  }, [initialContract, settings.domestic?.contractPrefix]);

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + (item.quantity * item.price), 0), [items]);

  const handleAddItem = () => {
    setItems([...items, {
      id: generateId(),
      productId: '',
      sku: '',
      name: '',
      description: '',
      unit: '台',
      quantity: 1,
      price: 0,
      amount: 0,
      brand: '',
      leadTime: '现货'
    }]);
  };

  const handleRemoveItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const handleItemChange = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'productId') {
           const prod = products.find(p => p.id === value);
           if (prod) {
              updated.sku = prod.sku;
              updated.name = prod.name;
              updated.brand = prod.brand;
              
              // PRICE LOGIC: Contracts are in CNY. 
              let priceInCNY = prod.price;
              if (prod.currency !== Currency.CNY) {
                 const prodRate = prod.currency === Currency.USD ? 1 : (settings.exchangeRates?.[prod.currency] || 1);
                 const cnyRate = settings.exchangeRates?.['CNY'] || 7.2;
                 const priceInUSD = prod.price / prodRate;
                 priceInCNY = priceInUSD * cnyRate;
              }

              updated.price = priceInCNY; 
              updated.unit = '台'; 
              updated.imageDataUrl = prod.imageDataUrl; // Sync Image
           }
        }
        updated.amount = updated.price * updated.quantity;
        return updated;
      }
      return item;
    }));
  };

  const getPreviewData = (): Contract => {
      const selectedCustomer = customers.find(c => c.id === customerId);
      const fallbackCustomer: Customer = { 
          id: '0', region: 'Domestic', name: '需方公司名称', contactPerson: '联系人', 
          phone: '', address: '地址', email: '', source: '',
          taxId: '税号', bankName: '开户行', bankAccount: '账号'
      };

      return {
          id: initialContract?.id || 'preview',
          contractNumber,
          date,
          place,
          customerId,
          customerSnapshot: selectedCustomer || fallbackCustomer,
          supplierSnapshot: settings.domestic,
          items,
          totalAmount,
          currency: Currency.CNY,
          terms,
          status: 'Draft'
      };
  };

  const handleSave = () => {
    if (!customerId) return alert('请选择需方客户');
    if (items.length === 0) return alert('请至少添加一个产品');
    
    const selectedCustomer = customers.find(c => c.id === customerId);
    if (!selectedCustomer) return;

    const contract: Contract = getPreviewData();
    contract.id = initialContract?.id || generateId();
    contract.customerSnapshot = selectedCustomer;
    onSave(contract);
  };

  return (
    <div className="bg-white shadow rounded-lg flex flex-col h-full relative">
      {/* Header Toolbar */}
      <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center rounded-t-lg">
        <div className="flex items-center">
            <button onClick={onCancel} className="mr-4 text-gray-600 hover:text-gray-900 flex items-center">
                <ArrowLeft size={20} className="mr-1"/> {t('cancel')}
            </button>
            <h2 className="text-xl font-bold text-gray-800">
                {initialContract ? t('edit') : t('new')} {t('contracts')}
            </h2>
        </div>
        <div className="flex space-x-3">
             <button onClick={() => onExport(getPreviewData(), 'image')} className="flex items-center bg-orange-100 text-orange-700 px-4 py-2 rounded hover:bg-orange-200">
                <ImageIcon size={18} className="mr-2" /> {t('exportImage')}
             </button>
             <button onClick={() => setShowPreview(true)} className="flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200">
                <Eye size={18} className="mr-2" /> {t('preview')}
             </button>
             <button onClick={handleSave} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                <Save size={18} className="mr-2" /> {t('save')}
             </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Info */}
          <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-bold text-gray-700 mb-4">{t('quoteDetails')}</h3>
                  <div className="space-y-3">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase">{t('contractNumber')}</label>
                          <input className="w-full p-2 border rounded" value={contractNumber} onChange={e => setContractNumber(e.target.value)} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase">{t('signDate')}</label>
                          <input type="date" className="w-full p-2 border rounded" value={date} onChange={e => setDate(e.target.value)} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase">{t('contractPlace')}</label>
                          <input className="w-full p-2 border rounded" value={place} onChange={e => setPlace(e.target.value)} />
                      </div>
                  </div>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-bold text-gray-700 mb-4">{t('buyer')}</h3>
                  <CustomerSearch 
                      customers={domesticCustomers}
                      value={customerId}
                      onChange={setCustomerId}
                      placeholder={t('selectCustomer')}
                  />
                  
                  {customerId && (() => {
                      const c = customers.find(cu => cu.id === customerId);
                      return c ? (
                          <div className="text-sm bg-blue-50 p-3 rounded text-blue-800 space-y-1 mt-2">
                              <p><strong>{c.name}</strong></p>
                              <p>{t('contact')}: {c.contactPerson}</p>
                              <p>Tel: {c.phone}</p>
                              <p>Addr: {c.address}</p>
                              <p>{t('taxId')}: {c.taxId || '-'}</p>
                          </div>
                      ) : null;
                  })()}
                  {domesticCustomers.length === 0 && (
                      <p className="text-xs text-red-500 mt-2">Hint: Add Domestic customers first.</p>
                  )}
              </div>
          </div>

          {/* Right Column: Items & Terms */}
          <div className="lg:col-span-2 space-y-6">
               <div className="bg-white border rounded-lg overflow-hidden">
                   <table className="w-full text-sm">
                       <thead className="bg-gray-100">
                           <tr>
                               <th className="p-3 text-left w-10">Img</th>
                               <th className="p-3 text-left w-1/4">{t('name')} / {t('sku')}</th>
                               <th className="p-3 text-left w-1/6">{t('brand')}</th>
                               <th className="p-3 text-center w-16">{t('unit')}</th>
                               <th className="p-3 text-center w-16">{t('qty')}</th>
                               <th className="p-3 text-right w-24">{t('price')} (￥)</th>
                               <th className="p-3 text-right w-24">{t('amount')}</th>
                               <th className="p-3 text-left w-24">{t('leadTime')}</th>
                               <th className="p-3 w-10"></th>
                           </tr>
                       </thead>
                       <tbody className="divide-y">
                           {items.map(item => (
                               <tr key={item.id}>
                                   <td className="p-2 align-top">
                                        {item.imageDataUrl && <img src={item.imageDataUrl} alt="" className="w-8 h-8 object-contain border rounded bg-white" />}
                                   </td>
                                   <td className="p-2 align-top">
                                       <ProductSearch 
                                          products={products}
                                          value={item.productId}
                                          onChange={(pid) => handleItemChange(item.id, 'productId', pid)}
                                       />
                                       <input className="w-full p-1 border rounded text-xs mt-1" placeholder={t('name')} value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} />
                                   </td>
                                   <td className="p-2 align-top">
                                       <input className="w-full p-1 border rounded text-xs" value={item.brand || ''} onChange={e => handleItemChange(item.id, 'brand', e.target.value)} />
                                   </td>
                                   <td className="p-2 align-top"><input className="w-full p-1 border rounded text-center text-xs" value={item.unit} onChange={e => handleItemChange(item.id, 'unit', e.target.value)} /></td>
                                   <td className="p-2 align-top"><input type="number" className="w-full p-1 border rounded text-center text-xs" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))} /></td>
                                   <td className="p-2 align-top"><input type="number" className="w-full p-1 border rounded text-right text-xs" value={item.price} onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value))} /></td>
                                   <td className="p-2 align-top text-right font-bold">{(item.price * item.quantity).toFixed(0)}</td>
                                   <td className="p-2 align-top"><input className="w-full p-1 border rounded text-xs" value={item.leadTime || ''} onChange={e => handleItemChange(item.id, 'leadTime', e.target.value)} placeholder="现货" /></td>
                                   <td className="p-2 align-top text-center">
                                       <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                       <tfoot className="bg-gray-50">
                           <tr>
                               <td colSpan={9} className="p-2">
                                   <button onClick={handleAddItem} className="w-full py-2 text-blue-600 font-bold flex justify-center items-center text-xs uppercase">
                                       <Plus size={14} className="mr-1" /> {t('addItem')}
                                   </button>
                               </td>
                           </tr>
                           <tr>
                               <td colSpan={6} className="p-3 text-right font-bold">{t('total')} (RMB):</td>
                               <td className="p-3 text-right font-bold text-lg">￥{totalAmount.toFixed(2)}</td>
                               <td colSpan={2}></td>
                           </tr>
                       </tfoot>
                   </table>
               </div>

               <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('contractTerms')}</label>
                   <textarea 
                      className="w-full p-4 border rounded-lg h-64 font-serif text-sm leading-relaxed" 
                      value={terms} 
                      onChange={e => setTerms(e.target.value)}
                   />
               </div>
          </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 flex-shrink-0">
                    <h3 className="font-bold text-lg text-gray-800">{t('preview')}</h3>
                    <div className="flex items-center space-x-3">
                         <button onClick={() => onExport(getPreviewData(), 'image')} className="flex items-center justify-center bg-orange-100 text-orange-700 px-3 py-1.5 rounded hover:bg-orange-200 text-sm font-medium">
                            <ImageIcon size={16} className="mr-2" /> {t('exportImage')}
                         </button>
                         <button onClick={() => onExport(getPreviewData(), 'pdf')} className="flex items-center justify-center bg-green-100 text-green-700 px-3 py-1.5 rounded hover:bg-green-200 text-sm font-medium">
                             <Download size={16} className="mr-2" /> {t('exportPdf')}
                         </button>
                        <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-red-600"><X size={24} /></button>
                    </div>
                </div>
                <div className="flex-1 bg-gray-200 overflow-auto p-4 flex justify-center">
                     <div className="w-fit">
                        <ContractTemplate contract={getPreviewData()} settings={settings.domestic} mode="preview" />
                     </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
