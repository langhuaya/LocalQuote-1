
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, FileText, Package, Users, Settings, Plus, Search, Download, Edit, Trash2, Globe, Menu, X, Loader2, Image as ImageIcon, LogOut, Shield, Coins, Tag, FileSignature
} from 'lucide-react';
import { api, generateId } from './services/api';
import { storageService } from './services/storageService';
import { Quote, Product, Customer, CompanySettings, Currency, Brand, Contract, CustomerRegion } from './types';
import { QuoteEditor } from './components/QuoteEditor';
import { ContractEditor } from './components/ContractEditor';
import { InvoiceTemplate } from './components/InvoiceTemplate';
import { ContractTemplate } from './components/ContractTemplate';
import { Login } from './components/Login';
import { UsersManager } from './components/UsersManager';
import { ProductsManager } from './components/ProductsManager';
import { BrandsManager } from './components/BrandsManager';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ViewState = 'dashboard' | 'quotes' | 'contracts' | 'products' | 'customers' | 'brands' | 'settings' | 'users' | 'quote-editor' | 'contract-editor';
type Lang = 'en' | 'zh';

const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard',
    quotes: 'Export Quotes',
    contracts: 'Sales Contracts',
    products: 'Product Inventory',
    customers: 'Customers',
    brands: 'Brand Management',
    settings: 'System Settings',
    users: 'Account Management',
    welcome: 'Welcome',
    logout: 'Logout',
    generating: 'Generating...',
    customerRegion: 'Region',
    domestic: 'Domestic (China)',
    international: 'International',
    taxId: 'Tax ID',
    bankName: 'Bank Name',
    bankAccount: 'Account No.',
    company: 'Company Name',
    contact: 'Contact Person',
    contractTerms: 'Contract Terms',
    domesticInfo: 'Domestic Company Info',
    // Common Actions
    add: 'Add',
    new: 'New',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search...',
    actions: 'Actions',
    exportPdf: 'Export PDF',
    exportImage: 'Export Image',
    preview: 'Preview',
    // Products
    sku: 'SKU / Model',
    name: 'Name',
    brand: 'Brand',
    price: 'Price',
    cost: 'Cost',
    unit: 'Unit',
    suppliers: 'Channel Info',
    addSupplier: 'Add Channel',
    channelName: 'Channel Name',
    noStock: 'No Stock',
    hasStock: 'In Stock',
    stock: 'Stock',
    supplierRef: 'Ref/Link',
    margin: 'Margin',
    salesInfo: 'Sales Info',
    desc: 'Description',
    note: 'Internal Note',
    entryTime: 'Entry Time',
    skuRequired: 'SKU is required',
    productImage: 'Product Image',
    // Brands
    addBrand: 'Add Brand',
    description: 'Description',
    suppliersCount: 'Channel Count',
    // Quotes/Contracts
    number: 'Number',
    date: 'Date',
    amount: 'Amount',
    total: 'Total',
    status: 'Status',
    validUntil: 'Valid Until',
    billTo: 'Bill To',
    selectCustomer: 'Select Customer',
    lineItems: 'Line Items',
    addItem: 'Add Item',
    subtotal: 'Subtotal',
    discountRate: 'Discount Rate',
    discountAmount: 'Discount Amount',
    shipping: 'Shipping',
    grandTotal: 'Grand Total',
    currency: 'Currency',
    incoterms: 'Incoterms',
    leadTime: 'Lead Time',
    paymentTerms: 'Payment Terms',
    notes: 'Notes',
    quoteDetails: 'Quote Details',
    newQuote: 'New Quote',
    contractNumber: 'Contract No.',
    signDate: 'Sign Date',
    buyer: 'Buyer',
    contractPlace: 'Sign Place',
    noData: 'No data available',
    createdTime: 'Created Time',
    createdUser: 'Created By'
  },
  zh: {
    dashboard: '仪表盘',
    quotes: '报价单导出',
    contracts: '销售合同',
    products: '产品库管理',
    customers: '客户管理',
    brands: '品牌管理',
    settings: '系统设置',
    users: '账号管理',
    welcome: '欢迎',
    logout: '退出登录',
    generating: '生成中...',
    customerRegion: '客户区域',
    domestic: '国内 (中国)',
    international: '国际 (海外)',
    taxId: '税号',
    bankName: '开户行',
    bankAccount: '银行账号',
    company: '公司名称',
    contact: '联系人',
    contractTerms: '合同条款',
    domesticInfo: '国内主体信息',
    // Common Actions
    add: '新建',
    new: '新建',
    edit: '编辑',
    delete: '删除',
    save: '保存',
    cancel: '取消',
    search: '搜索...',
    actions: '操作',
    exportPdf: '导出 PDF',
    exportImage: '导出图片',
    preview: '预览',
    // Products
    sku: 'SKU / 型号',
    name: '产品名称',
    brand: '品牌',
    price: '销售单价',
    cost: '成本价',
    unit: '单位',
    suppliers: '渠道信息',
    addSupplier: '添加渠道',
    channelName: '渠道名称',
    noStock: '无货',
    hasStock: '有现货',
    stock: '库存',
    supplierRef: '渠道货号/链接',
    margin: '利润率',
    salesInfo: '销售信息',
    desc: '详细描述',
    note: '内部备注',
    entryTime: '入库时间',
    skuRequired: '必须填写 SKU',
    productImage: '产品图片',
    // Brands
    addBrand: '新建品牌',
    description: '描述',
    suppliersCount: '渠道数量',
    // Quotes/Contracts
    number: '单号',
    date: '日期',
    amount: '金额',
    total: '总计',
    status: '状态',
    validUntil: '有效期至',
    billTo: '致 (客户)',
    selectCustomer: '选择客户',
    lineItems: '产品明细',
    addItem: '添加产品',
    subtotal: '小计',
    discountRate: '折扣率',
    discountAmount: '折扣金额',
    shipping: '运费',
    grandTotal: '总金额',
    currency: '币种',
    incoterms: '贸易条款',
    leadTime: '货期',
    paymentTerms: '付款条款',
    notes: '备注',
    quoteDetails: '报价详情',
    newQuote: '新建报价单',
    contractNumber: '合同编号',
    signDate: '签订日期',
    buyer: '需方',
    contractPlace: '签订地点',
    noData: '暂无数据',
    createdTime: '创建时间',
    createdUser: '创建人'
  }
};

export const App = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [view, setView] = useState<ViewState>('dashboard');
  const [lang, setLang] = useState<Lang>('zh');
  const [products, setProducts] = useState<Product[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(storageService.getSettings());
  
  const [editQuote, setEditQuote] = useState<Quote | null>(null);
  const [editContract, setEditContract] = useState<Contract | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const t = (key: string) => TRANSLATIONS[lang][key as keyof typeof TRANSLATIONS['en']] || key;

  // --- Data Loading ---
  const loadData = async () => {
    if (!token) return;
    try {
      const [p, c, b, q, k, s] = await Promise.all([
        api.getProducts(),
        api.getCustomers(),
        api.getBrands(),
        api.getQuotes(),
        api.getContracts(),
        api.getSettings()
      ]);
      setProducts(p);
      setCustomers(c);
      setBrands(b);
      setQuotes(q);
      setContracts(k);
      if (s) {
          setSettings(s);
          storageService.saveSettings(s);
      }
    } catch (e) {
      console.error("Failed to load data", e);
      if (localStorage.getItem('token')) {
          // Token might be invalid
          handleLogout();
      }
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  // --- Handlers ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
  };

  const handleSaveProduct = async (product: Product) => {
    await api.saveProduct(product);
    loadData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm(t('delete') + '?')) {
      await api.deleteProduct(id);
      loadData();
    }
  };

  const handleSaveBrand = async (brand: Brand) => {
    await api.saveBrand(brand);
    loadData();
  };

  const handleDeleteBrand = async (id: string) => {
    if (confirm(t('delete') + '?')) {
        await api.deleteBrand(id);
        loadData();
    }
  };

  const handleSaveCustomer = async (customer: Customer) => {
    await api.saveCustomer(customer);
    loadData();
  };

  const handleDeleteCustomer = async (id: string) => {
    if (confirm(t('delete') + '?')) {
      await api.deleteCustomer(id);
      loadData();
    }
  };

  const handleSaveQuote = async (quote: Quote) => {
    await api.saveQuote(quote);
    await loadData();
    setView('quotes');
    setEditQuote(null);
  };

  const handleDeleteQuote = async (id: string) => {
    if (confirm(t('delete') + '?')) {
      await api.deleteQuote(id);
      loadData();
    }
  };

  const handleSaveContract = async (contract: Contract) => {
      await api.saveContract(contract);
      await loadData();
      setView('contracts');
      setEditContract(null);
  }

  const handleDeleteContract = async (id: string) => {
      if(confirm(t('delete') + '?')) {
          await api.deleteContract(id);
          loadData();
      }
  }

  const handleSaveSettings = async (newSettings: CompanySettings) => {
    await api.saveSettings(newSettings);
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    alert(t('save') + ' ' + t('status'));
  };

  // --- PDF / Image Export Logic ---
  const invoiceRef = useRef<HTMLDivElement>(null);
  const contractRef = useRef<HTMLDivElement>(null);

  const handleExport = async (data: Quote | Contract, format: 'pdf' | 'image') => {
    setIsGenerating(true);
    // Determine which ref and template to use based on data type
    const isQuote = 'type' in data;
    const targetRef = isQuote ? invoiceRef : contractRef;
    const filename = isQuote ? `Quote_${(data as Quote).number}` : `Contract_${(data as Contract).contractNumber}`;

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    if (targetRef.current) {
        try {
            const canvas = await html2canvas(targetRef.current, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            if (format === 'image') {
                const imgData = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = imgData;
                link.download = `${filename}.png`;
                link.click();
            } else {
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                
                // Calculate aspect ratio to fit A4
                const imgProps = pdf.getImageProperties(imgData);
                const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
                
                // If content is longer than A4, we might need multi-page (Basic implementation supports single page auto-fit or long page)
                // For this strict template, we fit to width.
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
                pdf.save(`${filename}.pdf`);
            }
        } catch (err) {
            console.error("Export failed", err);
            alert("Export failed. Please check console.");
        }
    }
    setIsGenerating(false);
  };

  // --- Views ---
  if (!token) {
    return <Login onLoginSuccess={() => setToken(localStorage.getItem('token'))} />;
  }

  // Hidden Render Area for PDF Generation
  const HiddenRender = () => (
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          {/* We render a "Generate Mode" template which might have different styling logic if needed */}
          {editQuote && <InvoiceTemplate ref={invoiceRef} quote={editQuote} settings={settings} mode="generate" />}
          {editContract && <ContractTemplate ref={contractRef} contract={editContract} settings={settings.domestic} mode="generate" />}
      </div>
  );

  const renderSidebarItem = (id: ViewState, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => { setView(id); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        view === id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* --- Sidebar --- */}
      <aside 
        className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col`}
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">L</div>
                <span className="text-lg font-bold tracking-tight">SwiftQuote</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400"><X size={24}/></button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {renderSidebarItem('dashboard', <LayoutDashboard size={20} />, t('dashboard'))}
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-500 uppercase">Sales</div>
          {renderSidebarItem('quotes', <FileText size={20} />, t('quotes'))}
          {renderSidebarItem('contracts', <FileSignature size={20} />, t('contracts'))}
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-500 uppercase">Inventory</div>
          {renderSidebarItem('products', <Package size={20} />, t('products'))}
          {renderSidebarItem('brands', <Tag size={20} />, t('brands'))}
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-500 uppercase">Management</div>
          {renderSidebarItem('customers', <Users size={20} />, t('customers'))}
          {renderSidebarItem('users', <Shield size={20} />, t('users'))}
          {renderSidebarItem('settings', <Settings size={20} />, t('settings'))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center justify-between mb-4 px-2">
                <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="flex items-center text-sm text-gray-400 hover:text-white">
                    <Globe size={16} className="mr-1"/> {lang === 'en' ? '中文' : 'English'}
                </button>
           </div>
           <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 p-2 rounded text-sm transition-colors text-red-400">
               <LogOut size={16} /> <span>{t('logout')}</span>
           </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header (Mobile) */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 md:hidden flex-shrink-0">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600"><Menu size={24}/></button>
            <span className="font-bold text-gray-800">SwiftQuote Pro</span>
            <div className="w-6"></div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
           {isGenerating && (
               <div className="absolute inset-0 z-50 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                   <div className="flex flex-col items-center">
                       <Loader2 className="animate-spin text-blue-600 mb-2" size={48} />
                       <p className="text-gray-600 font-medium">{t('generating')}</p>
                   </div>
               </div>
           )}
           
           {/* Render Hidden Templates for Export */}
           <HiddenRender />

           {view === 'dashboard' && (
             <div className="max-w-6xl mx-auto space-y-6">
                 <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{t('welcome')}, {localStorage.getItem('username')}</h1>
                        <p className="text-gray-500 mt-1">Here is what's happening today.</p>
                    </div>
                    <div className="hidden md:block text-sm text-gray-400 bg-white px-3 py-1 rounded-full border">
                         {new Date().toLocaleDateString()}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                         <div className="flex justify-between items-start mb-4">
                             <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText size={24}/></div>
                         </div>
                         <h3 className="text-2xl font-bold text-gray-800">{quotes.length}</h3>
                         <p className="text-sm text-gray-500">Total Quotes</p>
                     </div>
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                         <div className="flex justify-between items-start mb-4">
                             <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Package size={24}/></div>
                         </div>
                         <h3 className="text-2xl font-bold text-gray-800">{products.length}</h3>
                         <p className="text-sm text-gray-500">Products</p>
                     </div>
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                         <div className="flex justify-between items-start mb-4">
                             <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Users size={24}/></div>
                         </div>
                         <h3 className="text-2xl font-bold text-gray-800">{customers.length}</h3>
                         <p className="text-sm text-gray-500">Customers</p>
                     </div>
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                         <div className="flex justify-between items-start mb-4">
                             <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Tag size={24}/></div>
                         </div>
                         <h3 className="text-2xl font-bold text-gray-800">{brands.length}</h3>
                         <p className="text-sm text-gray-500">Brands</p>
                     </div>
                 </div>
                 
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                     <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
                     <div className="flex flex-wrap gap-4">
                         <button onClick={() => { setEditQuote(null); setView('quote-editor'); }} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                             <Plus size={18} /> <span>{t('newQuote')}</span>
                         </button>
                         <button onClick={() => { setEditContract(null); setView('contract-editor'); }} className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                             <FileSignature size={18} /> <span>New Contract</span>
                         </button>
                         <button onClick={() => setView('products')} className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                             <Package size={18} /> <span>Manage Products</span>
                         </button>
                     </div>
                 </div>
             </div>
           )}

           {view === 'quotes' && (
               <div className="max-w-6xl mx-auto space-y-6">
                   <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                       <h2 className="text-2xl font-bold text-gray-800">{t('quotes')}</h2>
                       <button onClick={() => { setEditQuote(null); setView('quote-editor'); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center shadow hover:bg-blue-700 transition">
                            <Plus size={18} className="mr-2" /> {t('newQuote')}
                       </button>
                   </div>
                   <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                       <div className="overflow-x-auto">
                           <table className="w-full text-sm text-left">
                               <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                                   <tr>
                                       <th className="p-4">{t('number')}</th>
                                       <th className="p-4">{t('date')}</th>
                                       <th className="p-4">{t('billTo')}</th>
                                       <th className="p-4 text-right">{t('total')}</th>
                                       <th className="p-4 text-center">{t('status')}</th>
                                       <th className="p-4 text-right">{t('actions')}</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y">
                                   {quotes.length === 0 ? (
                                       <tr><td colSpan={6} className="p-8 text-center text-gray-400">{t('noData')}</td></tr>
                                   ) : quotes.map(q => (
                                       <tr key={q.id} className="hover:bg-gray-50">
                                           <td className="p-4 font-bold text-blue-600">{q.number}</td>
                                           <td className="p-4 text-gray-600">{q.date}</td>
                                           <td className="p-4 font-medium text-gray-800">{q.customerSnapshot?.name}</td>
                                           <td className="p-4 text-right font-mono font-bold">{q.currency} {q.total.toFixed(2)}</td>
                                           <td className="p-4 text-center">
                                               <span className={`px-2 py-1 rounded text-xs font-bold ${q.status === 'Draft' ? 'bg-gray-200 text-gray-600' : q.status === 'Sent' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                                   {q.status}
                                               </span>
                                           </td>
                                           <td className="p-4 text-right space-x-2">
                                               <button onClick={() => { setEditQuote(q); setView('quote-editor'); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                                               <button onClick={() => handleDeleteQuote(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                   </div>
               </div>
           )}
           
           {view === 'contracts' && (
               <div className="max-w-6xl mx-auto space-y-6">
                   <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                       <h2 className="text-2xl font-bold text-gray-800">{t('contracts')}</h2>
                       <button onClick={() => { setEditContract(null); setView('contract-editor'); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center shadow hover:bg-blue-700 transition">
                            <Plus size={18} className="mr-2" /> {t('new')} {t('contracts')}
                       </button>
                   </div>
                   <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                       <div className="overflow-x-auto">
                           <table className="w-full text-sm text-left">
                               <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                                   <tr>
                                       <th className="p-4">{t('contractNumber')}</th>
                                       <th className="p-4">{t('signDate')}</th>
                                       <th className="p-4">{t('buyer')}</th>
                                       <th className="p-4 text-right">{t('amount')} (RMB)</th>
                                       <th className="p-4 text-right">{t('actions')}</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y">
                                   {contracts.length === 0 ? (
                                       <tr><td colSpan={5} className="p-8 text-center text-gray-400">{t('noData')}</td></tr>
                                   ) : contracts.map(c => (
                                       <tr key={c.id} className="hover:bg-gray-50">
                                           <td className="p-4 font-bold text-blue-600">{c.contractNumber}</td>
                                           <td className="p-4 text-gray-600">{c.date}</td>
                                           <td className="p-4 font-medium text-gray-800">{c.customerSnapshot?.name}</td>
                                           <td className="p-4 text-right font-mono font-bold">￥{c.totalAmount.toFixed(2)}</td>
                                           <td className="p-4 text-right space-x-2">
                                               <button onClick={() => { setEditContract(c); setView('contract-editor'); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                                               <button onClick={() => handleDeleteContract(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                   </div>
               </div>
           )}

           {view === 'quote-editor' && (
             <div className="h-full">
               <QuoteEditor 
                 initialQuote={editQuote}
                 customers={customers}
                 products={products}
                 settings={settings}
                 onSave={handleSaveQuote}
                 onCancel={() => setView('quotes')}
                 onExport={(q, fmt) => { setEditQuote(q); handleExport(q, fmt); }}
                 t={t}
               />
             </div>
           )}

           {view === 'contract-editor' && (
             <div className="h-full">
               <ContractEditor 
                 initialContract={editContract}
                 customers={customers}
                 products={products}
                 settings={settings}
                 onSave={handleSaveContract}
                 onCancel={() => setView('contracts')}
                 onExport={(c, fmt) => { setEditContract(c); handleExport(c, fmt); }}
                 t={t}
               />
             </div>
           )}

           {view === 'products' && (
             <div className="max-w-6xl mx-auto">
               <ProductsManager products={products} brands={brands} settings={settings} onSave={handleSaveProduct} onDelete={handleDeleteProduct} t={t} />
             </div>
           )}

           {view === 'brands' && (
             <div className="max-w-6xl mx-auto">
               <BrandsManager brands={brands} onSave={handleSaveBrand} onDelete={handleDeleteBrand} t={t} />
             </div>
           )}

           {view === 'users' && (
             <div className="max-w-6xl mx-auto">
               <UsersManager t={t} />
             </div>
           )}

           {view === 'customers' && (
             <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                     <h2 className="text-2xl font-bold text-gray-800">{t('customers')}</h2>
                     <button onClick={() => {
                        const name = prompt(t('company'));
                        if(name) handleSaveCustomer({ 
                             id: generateId(), 
                             name, 
                             contactPerson: '', 
                             email: '', 
                             phone: '', 
                             address: '', 
                             city: '', 
                             country: '', 
                             zipCode: '', 
                             taxId: '', 
                             source: 'Manual',
                             region: 'International' // Default
                        } as Customer)
                     }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center shadow hover:bg-blue-700 transition">
                        <Plus size={18} className="mr-2" /> {t('add')} {t('customers')}
                     </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customers.map(c => (
                        <div key={c.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative group">
                            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleDeleteCustomer(c.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                            </div>
                            <div className="mb-3">
                                <h3 className="font-bold text-lg text-gray-800">{c.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${c.region === 'Domestic' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {c.region === 'Domestic' ? t('domestic') : t('international')}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="grid grid-cols-1 gap-2">
                                     <input className="w-full border-b border-dashed border-gray-300 focus:border-blue-500 outline-none py-1 bg-transparent" value={c.contactPerson} onChange={e => handleSaveCustomer({...c, contactPerson: e.target.value})} placeholder={t('contact')} />
                                     <input className="w-full border-b border-dashed border-gray-300 focus:border-blue-500 outline-none py-1 bg-transparent" value={c.email} onChange={e => handleSaveCustomer({...c, email: e.target.value})} placeholder="Email" />
                                     <input className="w-full border-b border-dashed border-gray-300 focus:border-blue-500 outline-none py-1 bg-transparent" value={c.phone} onChange={e => handleSaveCustomer({...c, phone: e.target.value})} placeholder="Phone" />
                                     <input className="w-full border-b border-dashed border-gray-300 focus:border-blue-500 outline-none py-1 bg-transparent" value={c.address} onChange={e => handleSaveCustomer({...c, address: e.target.value})} placeholder="Address" />
                                </div>
                                
                                {/* Region Specific Fields Toggle */}
                                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase">Region Type</label>
                                        <select 
                                            className="w-full mt-1 p-1 border rounded text-xs"
                                            value={c.region || 'International'}
                                            onChange={e => handleSaveCustomer({...c, region: e.target.value as CustomerRegion})}
                                        >
                                            <option value="International">International</option>
                                            <option value="Domestic">Domestic (China)</option>
                                        </select>
                                    </div>
                                    <div>
                                         <label className="block text-xs font-bold text-gray-400 uppercase">{t('taxId')}</label>
                                         <input className="w-full mt-1 p-1 border rounded text-xs" value={c.taxId || ''} onChange={e => handleSaveCustomer({...c, taxId: e.target.value})} />
                                    </div>
                                </div>

                                {c.region === 'Domestic' && (
                                    <div className="grid grid-cols-2 gap-4 bg-orange-50 p-2 rounded">
                                        <div>
                                            <label className="block text-[10px] font-bold text-orange-400 uppercase">{t('bankName')}</label>
                                            <input className="w-full mt-1 p-1 border border-orange-200 rounded text-xs bg-white" value={c.bankName || ''} onChange={e => handleSaveCustomer({...c, bankName: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-orange-400 uppercase">{t('bankAccount')}</label>
                                            <input className="w-full mt-1 p-1 border border-orange-200 rounded text-xs bg-white" value={c.bankAccount || ''} onChange={e => handleSaveCustomer({...c, bankAccount: e.target.value})} />
                                        </div>
                                    </div>
                                )}
                                {c.region !== 'Domestic' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <input className="p-1 border rounded text-xs" value={c.city || ''} onChange={e => handleSaveCustomer({...c, city: e.target.value})} placeholder="City" />
                                        <input className="p-1 border rounded text-xs" value={c.country || ''} onChange={e => handleSaveCustomer({...c, country: e.target.value})} placeholder="Country" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
             </div>
           )}

           {view === 'settings' && (
             <div className="max-w-4xl mx-auto space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">{t('settings')}</h2>
                
                {/* Global / International Settings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-blue-600 uppercase text-sm mb-4 border-b pb-2">International Entity (For Quotes)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('company')}</label>
                                <input className="w-full p-2 border rounded" value={settings.name} onChange={e => handleSaveSettings({...settings, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                                <textarea className="w-full p-2 border rounded" rows={2} value={settings.address} onChange={e => handleSaveSettings({...settings, address: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input className="p-2 border rounded" value={settings.city} onChange={e => handleSaveSettings({...settings, city: e.target.value})} placeholder="City" />
                                <input className="p-2 border rounded" value={settings.country} onChange={e => handleSaveSettings({...settings, country: e.target.value})} placeholder="Country" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input className="p-2 border rounded" value={settings.email} onChange={e => handleSaveSettings({...settings, email: e.target.value})} placeholder="Email" />
                                <input className="p-2 border rounded" value={settings.phone} onChange={e => handleSaveSettings({...settings, phone: e.target.value})} placeholder="Phone" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quote Prefix</label>
                                <input className="w-full p-2 border rounded font-mono" value={settings.quotePrefix} onChange={e => handleSaveSettings({...settings, quotePrefix: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Info (Appears on Invoice)</label>
                                <textarea className="w-full p-2 border rounded font-mono text-xs" rows={6} value={settings.bankInfo} onChange={e => handleSaveSettings({...settings, bankInfo: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company Logo (URL or Base64)</label>
                                <input className="w-full p-2 border rounded text-xs" value={settings.logoDataUrl} onChange={e => handleSaveSettings({...settings, logoDataUrl: e.target.value})} />
                                {settings.logoDataUrl && <img src={settings.logoDataUrl} alt="Logo Preview" className="h-10 mt-2 object-contain" />}
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stamp / Chop (Base64)</label>
                                <input className="w-full p-2 border rounded text-xs" value={settings.stampDataUrl} onChange={e => handleSaveSettings({...settings, stampDataUrl: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Domestic Settings */}
                <div className="bg-orange-50 p-6 rounded-xl shadow-sm border border-orange-100">
                    <h3 className="font-bold text-orange-600 uppercase text-sm mb-4 border-b border-orange-200 pb-2">{t('domesticInfo')} (For Contracts)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('company')}</label>
                                <input className="w-full p-2 border rounded" value={settings.domestic?.name || ''} onChange={e => handleSaveSettings({...settings, domestic: {...settings.domestic!, name: e.target.value}})} />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                                <input className="w-full p-2 border rounded" value={settings.domestic?.address || ''} onChange={e => handleSaveSettings({...settings, domestic: {...settings.domestic!, address: e.target.value}})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('contact')}</label>
                                    <input className="w-full p-2 border rounded" value={settings.domestic?.contact || ''} onChange={e => handleSaveSettings({...settings, domestic: {...settings.domestic!, contact: e.target.value}})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                                    <input className="w-full p-2 border rounded" value={settings.domestic?.phone || ''} onChange={e => handleSaveSettings({...settings, domestic: {...settings.domestic!, phone: e.target.value}})} />
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contract Prefix</label>
                                <input className="w-full p-2 border rounded font-mono" value={settings.domestic?.contractPrefix || ''} onChange={e => handleSaveSettings({...settings, domestic: {...settings.domestic!, contractPrefix: e.target.value}})} />
                            </div>
                        </div>
                        <div className="space-y-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('taxId')}</label>
                                <input className="w-full p-2 border rounded" value={settings.domestic?.taxId || ''} onChange={e => handleSaveSettings({...settings, domestic: {...settings.domestic!, taxId: e.target.value}})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('bankName')}</label>
                                <input className="w-full p-2 border rounded" value={settings.domestic?.bankName || ''} onChange={e => handleSaveSettings({...settings, domestic: {...settings.domestic!, bankName: e.target.value}})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('bankAccount')}</label>
                                <input className="w-full p-2 border rounded" value={settings.domestic?.bankAccount || ''} onChange={e => handleSaveSettings({...settings, domestic: {...settings.domestic!, bankAccount: e.target.value}})} />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Domestic Stamp (Base64)</label>
                                <input className="w-full p-2 border rounded text-xs" value={settings.domestic?.stampDataUrl || ''} onChange={e => handleSaveSettings({...settings, domestic: {...settings.domestic!, stampDataUrl: e.target.value}})} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Configuration */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 uppercase text-sm mb-4 border-b pb-2">Configuration</h3>
                    <div className="space-y-4">
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Unit Options (comma separated)</label>
                             <input className="w-full p-2 border rounded" value={settings.productUnits || ''} onChange={e => handleSaveSettings({...settings, productUnits: e.target.value})} />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Exchange Rates (Base USD = 1)</label>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 {Object.entries(settings.exchangeRates || {}).map(([curr, rate]) => (
                                     <div key={curr} className="flex items-center space-x-2">
                                         <span className="font-bold text-gray-600 w-8">{curr}</span>
                                         <input 
                                            type="number" 
                                            step="0.01" 
                                            className="w-full p-1 border rounded" 
                                            value={rate} 
                                            onChange={e => handleSaveSettings({...settings, exchangeRates: {...settings.exchangeRates, [curr]: parseFloat(e.target.value)}})}
                                          />
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                </div>
             </div>
           )}
        </div>
      </main>
    </div>
  );
};
