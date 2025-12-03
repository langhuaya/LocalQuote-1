
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, FileText, Package, Users, Settings, Plus, Search, Download, Edit, Trash2, Globe, Menu, X, Loader2, Image as ImageIcon, LogOut, Shield, Coins, Tag, FileSignature, TrendingUp, Clock, ArrowRight, DollarSign, Calendar
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
import { SettingsManager } from './components/SettingsManager'; // Added explicit import
import { AiAssistant } from './components/AiAssistant'; // Added AI Assistant
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
    importExcel: 'Import Excel',
    exportExcel: 'Export Excel',
    importSuccess: 'Import Successful',
    processing: 'Processing...',
    // Products
    sku: 'SKU / Model',
    name: 'Name',
    brand: 'Brand',
    price: 'Price',
    cost: 'Cost',
    unit: 'Unit',
    suppliers: 'Channels',
    addSupplier: 'Add Channel',
    channelName: 'Channel Name',
    noStock: 'No Stock',
    hasStock: 'In Stock',
    stock: 'Stock',
    supplierRef: 'Reference/Link',
    margin: 'Margin',
    salesInfo: 'Sales Info',
    desc: 'Description',
    note: 'Internal Note',
    entryTime: 'Entry Time',
    skuRequired: 'SKU is required',
    productImage: 'Product Image',
    simpleQuote: 'Simple Quote',
    selectedItems: 'Selected',
    clearSelection: 'Clear',
    generateSimpleQuote: 'Simple Quote View',
    bulkDelete: 'Bulk Delete',
    confirmBulkDelete: 'Delete selected items?',
    bulkCreate: 'Bulk Create',
    bulkFormat: 'Format: Model, Price, Name (Optional)',
    bulkPlaceholder: 'e.g.\nFluke 179, 300\nFluke 87V, 450, Digital Multimeter',
    bulkBrandSelect: 'Select Brand for all items',
    // Brands
    addBrand: 'Add Brand',
    description: 'Description',
    suppliersCount: 'Channels Count',
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
    createdUser: 'Created By',
    // Dashboard
    totalRevenue: 'Est. Revenue',
    pendingQuotes: 'Pending Quotes',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    exchangeRates: 'Exchange Rates',
    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening',
    viewAll: 'View All'
  },
  zh: {
    dashboard: '仪表盘',
    quotes: '出口报价单',
    contracts: '产品购销合同',
    products: '产品库管理',
    customers: '客户管理',
    brands: '品牌管理',
    settings: '系统设置',
    users: '账号管理',
    welcome: '欢迎',
    logout: '退出登录',
    generating: '正在生成...',
    customerRegion: '客户区域',
    domestic: '国内客户 (Domestic)',
    international: '国外客户 (International)',
    taxId: '纳税人识别号',
    bankName: '开户行',
    bankAccount: '银行账号',
    company: '公司名称',
    contact: '联系人',
    contractTerms: '合同条款模板',
    domesticInfo: '国内主体信息',
    // Common Actions
    add: '添加',
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
    importExcel: '导入 Excel',
    exportExcel: '导出 Excel',
    importSuccess: '导入成功',
    processing: '处理中...',
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
    supplierRef: '货号/链接',
    margin: '利润率',
    salesInfo: '销售信息',
    desc: '详细描述',
    note: '内部备注',
    entryTime: '入库时间',
    skuRequired: 'SKU 是必填项',
    productImage: '产品图片',
    simpleQuote: '简易报价',
    selectedItems: '已选择',
    clearSelection: '取消选择',
    generateSimpleQuote: '生成简易报价',
    bulkDelete: '批量删除',
    confirmBulkDelete: '确定要删除选中的产品吗？',
    bulkCreate: '批量创建',
    bulkFormat: '格式：型号, 价格, 产品名称[可选]',
    bulkPlaceholder: '例如：\nFluke 179, 300\nFluke 87V, 450, 数字万用表',
    bulkBrandSelect: '选择品牌 (所有产品)',
    // Brands
    addBrand: '添加品牌',
    description: '描述/备注',
    suppliersCount: '渠道数量',
    // Quotes/Contracts
    number: '编号',
    date: '日期',
    amount: '金额',
    total: '总计',
    status: '状态',
    validUntil: '有效期至',
    billTo: '客户信息',
    selectCustomer: '从客户管理选择客户',
    lineItems: '产品明细',
    addItem: '添加产品',
    subtotal: '小计',
    discountRate: '折扣率',
    discountAmount: '折扣金额',
    shipping: '运费',
    grandTotal: '总计',
    currency: '币种',
    incoterms: '贸易条款',
    leadTime: '货期',
    paymentTerms: '付款方式',
    notes: '备注',
    quoteDetails: '报价详情',
    newQuote: '新建报价单',
    contractNumber: '合同编号',
    signDate: '签订时间',
    buyer: '需方 (客户)',
    contractPlace: '签订地点',
    noData: '暂无数据',
    createdTime: '创建时间',
    createdUser: '创建人',
    // Dashboard
    totalRevenue: '合同总额',
    pendingQuotes: '报价单数量',
    recentActivity: '最近动态',
    quickActions: '快捷操作',
    exchangeRates: '参考汇率',
    goodMorning: '早上好',
    goodAfternoon: '下午好',
    goodEvening: '晚上好',
    viewAll: '查看全部'
  }
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Data
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(storageService.getSettings());
  
  // UI
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [lang, setLang] = useState<Lang>('zh');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Print Refs
  const printQuoteRef = useRef<HTMLDivElement>(null);
  const printContractRef = useRef<HTMLDivElement>(null);
  const [printQuote, setPrintQuote] = useState<Quote | null>(null);
  const [printContract, setPrintContract] = useState<Contract | null>(null);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'image'>('pdf');
  const [printOptions, setPrintOptions] = useState({ showImages: true });

  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[lang][key] || key;

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [q, ctr, p, c, b, s] = await Promise.all([
        api.getQuotes(),
        api.getContracts(),
        api.getProducts(),
        api.getCustomers(),
        api.getBrands(),
        api.getSettings()
      ]);
      
      const sortedQuotes = q.sort((a: Quote, b: Quote) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const sortedContracts = ctr.sort((a: Contract, b: Contract) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setQuotes(sortedQuotes);
      setContracts(sortedContracts);
      setProducts(p);
      setCustomers(c);
      setBrands(b);
      
      if (s) {
          const defaultSettings = storageService.getSettings();
          const mergedSettings = {
              ...defaultSettings,
              ...s,
              domestic: {
                  ...defaultSettings.domestic,
                  ...(s.domestic || {})
              },
              ai: { // Merge AI settings
                  ...defaultSettings.ai,
                  ...(s.ai || {})
              }
          };
          setSettings(mergedSettings);
      }
    } catch (error) {
      console.error("Failed to load data", error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
    else setIsLoading(false);
  }, [isAuthenticated]);

  const handleLoginSuccess = () => setIsAuthenticated(true);
  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
  };

  // --- Quote Actions ---
  const handleSaveQuote = async (quote: Quote) => {
    await api.saveQuote(quote);
    const updatedQuotes = await api.getQuotes();
    const sortedQuotes = updatedQuotes.sort((a: Quote, b: Quote) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setQuotes(sortedQuotes);
    setCurrentView('quotes');
    setEditingQuote(null);
  };
  const handleDeleteQuote = async (id: string) => {
    if(confirm(t('delete') + '?')) { 
      await api.deleteQuote(id); 
      setQuotes(quotes.filter(q => q.id !== id));
    }
  };

  // --- Contract Actions ---
  const handleSaveContract = async (contract: Contract) => {
    await api.saveContract(contract);
    const updatedContracts = await api.getContracts();
    const sortedContracts = updatedContracts.sort((a: Contract, b: Contract) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setContracts(sortedContracts);
    setCurrentView('contracts');
    setEditingContract(null);
  };
  const handleDeleteContract = async (id: string) => {
    if(confirm(t('delete') + '?')) { 
      await api.deleteContract(id); 
      setContracts(contracts.filter(c => c.id !== id));
    }
  };

  // --- Generic Actions (OPTIMIZED) ---
  
  // Product Save: Update Local State to avoid 10MB re-download
  const handleProductSave = async (p: Product) => { 
      await api.saveProduct(p);
      setProducts(prev => {
          const exists = prev.find(item => item.id === p.id);
          // Manually add current date for visual feedback if new
          const now = new Date().toISOString().split('T')[0];
          const productWithMeta = { 
              ...p, 
              updatedAt: now, 
              createdAt: exists ? exists.createdAt : now,
              createdBy: exists ? exists.createdBy : p.createdBy // Preserve creator
          };
          
          if (exists) {
              return prev.map(item => item.id === p.id ? productWithMeta : item);
          }
          return [productWithMeta, ...prev];
      });
  };
  
  const handleDeleteProduct = async (id: string) => { 
      if(confirm(t('delete') + '?')) { 
          await api.deleteProduct(id);
          setProducts(prev => prev.filter(p => p.id !== id));
      }
  };

  const handleCustomerSave = async (c: Customer) => { 
      await api.saveCustomer(c);
      const newCustomers = await api.getCustomers(); // Customers are small, safe to refetch
      setCustomers(newCustomers);
  };
  
  const handleDeleteCustomer = async (id: string) => { 
      if(confirm(t('delete') + '?')) { 
          await api.deleteCustomer(id); 
          setCustomers(customers.filter(c => c.id !== id));
      }
  };

  const handleBrandSave = async (b: Brand) => { 
      await api.saveBrand(b); 
      const newBrands = await api.getBrands();
      setBrands(newBrands);
  };
  
  const handleDeleteBrand = async (id: string) => { 
      if(confirm(t('delete') + '?')) { 
          await api.deleteBrand(id); 
          setBrands(brands.filter(b => b.id !== id));
      }
  };

  const handleSaveSettings = async (s: CompanySettings) => { 
      await api.saveSettings(s); 
      setSettings(s); 
      alert(t('save') + ' Success!'); 
  };

  // --- Export Logic ---
  const handleExport = async (
      doc: Quote | Contract, 
      format: 'pdf' | 'image', 
      type: 'quote' | 'contract', 
      options: { showImages: boolean } = { showImages: true }
  ) => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setExportFormat(format);
    setPrintOptions(options);
    
    if (type === 'quote') setPrintQuote(doc as Quote);
    else setPrintContract(doc as Contract);

    setTimeout(async () => {
        const ref = type === 'quote' ? printQuoteRef.current : printContractRef.current;
        if (ref) {
            try {
                const scale = format === 'pdf' ? 4 : 3;
                const canvas = await html2canvas(ref, { scale, useCORS: true, logging: false, windowWidth: 794, backgroundColor: '#ffffff' });

                if (format === 'image') {
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${type === 'quote' ? (doc as Quote).number : (doc as Contract).contractNumber}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                        }
                    }, 'image/png');
                } else {
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pdfWidth = 210; 
                    const pdfHeight = 297; 
                    const imgProps = pdf.getImageProperties(imgData);
                    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
                    let heightLeft = imgHeight;
                    let position = 0;

                    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
                    heightLeft -= pdfHeight;
                    while (heightLeft >= 1) {
                        position = heightLeft - imgHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
                        heightLeft -= pdfHeight;
                    }
                    pdf.save(`${type === 'quote' ? (doc as Quote).number : (doc as Contract).contractNumber}.pdf`);
                }
            } catch (err) {
                console.error("Export failed", err);
                alert("Failed to export.");
            } finally {
                setPrintQuote(null);
                setPrintContract(null);
                setIsGeneratingPdf(false);
            }
        }
    }, 1500);
  };

  const navigateTo = (view: ViewState) => { setCurrentView(view); setIsMobileMenuOpen(false); };

  const renderContent = () => {
    switch (currentView) {
      case 'quote-editor':
        return <QuoteEditor initialQuote={editingQuote} customers={customers} products={products} settings={settings} onSave={handleSaveQuote} onCancel={() => navigateTo('quotes')} onExport={(q, f, opts) => handleExport(q, f, 'quote', opts)} t={t} />;
      case 'contract-editor':
        return <ContractEditor initialContract={editingContract} customers={customers} products={products} settings={settings} onSave={handleSaveContract} onCancel={() => navigateTo('contracts')} onExport={(c, f) => handleExport(c, f, 'contract')} t={t} />;
      case 'quotes':
        return <QuotesList quotes={quotes} onEdit={(q:Quote) => { setEditingQuote(q); navigateTo('quote-editor'); }} onDelete={handleDeleteQuote} onNew={() => { setEditingQuote(null); navigateTo('quote-editor'); }} onExport={(q:Quote, f:any) => handleExport(q, f, 'quote')} isGenerating={isGeneratingPdf} t={t} />;
      case 'contracts':
        return <ContractsList contracts={contracts} onEdit={(c:Contract) => { setEditingContract(c); navigateTo('contract-editor'); }} onDelete={handleDeleteContract} onNew={() => { setEditingContract(null); navigateTo('contract-editor'); }} onExport={(c:Contract, f:any) => handleExport(c, f, 'contract')} isGenerating={isGeneratingPdf} t={t} />;
      case 'products':
        return <ProductsManager products={products} brands={brands} settings={settings} onSave={handleProductSave} onDelete={handleDeleteProduct} t={t} />;
      case 'customers':
        return <CustomersManager customers={customers} onSave={handleCustomerSave} onDelete={handleDeleteCustomer} t={t} />;
      case 'brands':
        return <BrandsManager brands={brands} onSave={handleBrandSave} onDelete={handleDeleteBrand} t={t} />;
      case 'settings':
        return <SettingsManager settings={settings} onSave={handleSaveSettings} t={t} />;
      case 'users':
        return <UsersManager t={t} />;
      case 'dashboard':
      default:
        return <Dashboard 
                  quotes={quotes} 
                  contracts={contracts} 
                  products={products} 
                  customers={customers} 
                  settings={settings}
                  onNewQuote={() => { setEditingQuote(null); navigateTo('quote-editor'); }}
                  onNewContract={() => { setEditingContract(null); navigateTo('contract-editor'); }}
                  onViewQuotes={() => navigateTo('quotes')}
                  onViewContracts={() => navigateTo('contracts')}
                  t={t} 
                />;
    }
  };

  if (!isAuthenticated) return <Login onLoginSuccess={handleLoginSuccess} />;
  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <>
      <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
        {isGeneratingPdf && (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin w-12 h-12 mb-4" />
                <p className="text-lg font-semibold">{t('generating')}</p>
            </div>
        )}

        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col shadow-xl transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
             <h1 className="text-xl font-bold">LH WAVE</h1>
             <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden"><X size={24}/></button>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
              <SidebarItem icon={<LayoutDashboard size={20} />} label={t('dashboard')} active={currentView === 'dashboard'} onClick={() => navigateTo('dashboard')} />
              <SidebarItem icon={<FileText size={20} />} label={t('quotes')} active={currentView === 'quotes' || currentView === 'quote-editor'} onClick={() => navigateTo('quotes')} />
              <SidebarItem icon={<FileSignature size={20} />} label={t('contracts')} active={currentView === 'contracts' || currentView === 'contract-editor'} onClick={() => navigateTo('contracts')} />
              <SidebarItem icon={<Package size={20} />} label={t('products')} active={currentView === 'products'} onClick={() => navigateTo('products')} />
              <SidebarItem icon={<Users size={20} />} label={t('customers')} active={currentView === 'customers'} onClick={() => navigateTo('customers')} />
              <SidebarItem icon={<Tag size={20} />} label={t('brands')} active={currentView === 'brands'} onClick={() => navigateTo('brands')} />
              <div className="pt-8">
                  <SidebarItem icon={<Settings size={20} />} label={t('settings')} active={currentView === 'settings'} onClick={() => navigateTo('settings')} />
                  <SidebarItem icon={<Shield size={20} />} label={t('users')} active={currentView === 'users'} onClick={() => navigateTo('users')} />
              </div>
          </nav>
          <div className="p-4 border-t border-slate-800 space-y-2">
              <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="flex items-center justify-center w-full py-2 bg-slate-800 rounded text-sm"><Globe size={16} className="mr-2" /> {lang === 'en' ? '中文' : 'English'}</button>
              <button onClick={handleLogout} className="flex items-center justify-center w-full py-2 bg-red-900/30 text-red-400 rounded text-sm"><LogOut size={16} className="mr-2" /> {t('logout')}</button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col w-full overflow-hidden relative">
           <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-8 z-10 flex-shrink-0">
               <div className="flex items-center">
                   <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden mr-4"><Menu/></button>
                   <h2 className="text-xl font-bold text-gray-800">{t(currentView as any) || currentView}</h2>
               </div>
           </header>
           <div className="flex-1 overflow-auto p-4 md:p-8">{renderContent()}</div>
           
           {/* AI Assistant Mounted Globally */}
           <AiAssistant 
              productsCount={products.length}
              customersCount={customers.length}
              quotesCount={quotes.length}
              onSaveProduct={handleProductSave}
              onSaveCustomer={handleCustomerSave}
           />
        </main>
      </div>

      {printQuote && (
          <div style={{ position: 'fixed', top: 0, left: '-10000px', width: '794px', height: 'auto', zIndex: -1 }}>
              <InvoiceTemplate ref={printQuoteRef} quote={printQuote} settings={settings} mode="generate" showImages={printOptions.showImages} />
          </div>
      )}
      {printContract && (
          <div style={{ position: 'fixed', top: 0, left: '-10000px', width: '794px', height: 'auto', zIndex: -1 }}>
              <ContractTemplate ref={printContractRef} contract={printContract} settings={settings.domestic} mode="generate" />
          </div>
      )}
    </>
  );
}

const SidebarItem = ({ icon, label, active, onClick }: any) => (
    <button onClick={onClick} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}>
        <span className="mr-3">{icon}</span><span className="font-medium">{label}</span>
    </button>
);

const Dashboard = ({ quotes, contracts, products, customers, settings, onNewQuote, onNewContract, onViewQuotes, onViewContracts, t }: any) => {
    // Greeting Logic
    const hour = new Date().getHours();
    const greeting = hour < 12 ? t('goodMorning') : hour < 18 ? t('goodAfternoon') : t('goodEvening');
    const username = localStorage.getItem('user_fullName') || localStorage.getItem('username') || 'User';

    // Stats
    const totalContractValue = contracts.reduce((acc: number, c: Contract) => acc + (c.totalAmount || 0), 0);
    const recentQuotes = quotes.slice(0, 5);
    const recentContracts = contracts.slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white shadow-lg flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{greeting}, {username}!</h1>
                    <p className="opacity-90">Welcome to SwiftQuote Pro. Here is what's happening today.</p>
                </div>
                <div className="hidden md:block opacity-20">
                    <TrendingUp size={80} />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title={t('pendingQuotes')} 
                    value={quotes.length} 
                    icon={<FileText className="text-blue-600" size={24}/>} 
                    bg="bg-blue-50" 
                    sub="Latest"
                />
                <StatCard 
                    title={t('totalRevenue')} 
                    value={`¥ ${(totalContractValue / 10000).toFixed(2)} W`} 
                    icon={<FileSignature className="text-green-600" size={24}/>} 
                    bg="bg-green-50" 
                    sub={`${contracts.length} Contracts`}
                />
                <StatCard 
                    title={t('products')} 
                    value={products.length} 
                    icon={<Package className="text-orange-600" size={24}/>} 
                    bg="bg-orange-50" 
                    sub="Active SKUs"
                />
                <StatCard 
                    title={t('customers')} 
                    value={customers.length} 
                    icon={<Users className="text-purple-600" size={24}/>} 
                    bg="bg-purple-50" 
                    sub="Global Clients"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Quotes */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center"><Clock size={16} className="mr-2 text-gray-400"/> {t('recentActivity')} - {t('quotes')}</h3>
                            <button onClick={onViewQuotes} className="text-xs text-blue-600 font-medium hover:underline flex items-center">{t('viewAll')} <ArrowRight size={12} className="ml-1"/></button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-gray-50">
                                    {recentQuotes.map((q: Quote) => (
                                        <tr key={q.id} className="hover:bg-blue-50 transition-colors">
                                            <td className="p-3 text-blue-600 font-medium">{q.number}</td>
                                            <td className="p-3 text-gray-600">{q.customerSnapshot?.name}</td>
                                            <td className="p-3 text-gray-500">{q.date}</td>
                                            <td className="p-3 text-right font-bold text-gray-700">{q.currency} {q.total.toFixed(2)}</td>
                                            <td className="p-3 text-right">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${q.status === 'Accepted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {q.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {recentQuotes.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">{t('noData')}</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Contracts */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center"><FileSignature size={16} className="mr-2 text-gray-400"/> {t('recentActivity')} - {t('contracts')}</h3>
                            <button onClick={onViewContracts} className="text-xs text-blue-600 font-medium hover:underline flex items-center">{t('viewAll')} <ArrowRight size={12} className="ml-1"/></button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-gray-50">
                                    {recentContracts.map((c: Contract) => (
                                        <tr key={c.id} className="hover:bg-green-50 transition-colors">
                                            <td className="p-3 text-green-700 font-medium">{c.contractNumber}</td>
                                            <td className="p-3 text-gray-600">{c.customerSnapshot?.name}</td>
                                            <td className="p-3 text-gray-500">{c.date}</td>
                                            <td className="p-3 text-right font-bold text-gray-700">¥ {c.totalAmount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {recentContracts.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-400">{t('noData')}</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Quick Actions & Info */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                         <h3 className="font-bold text-gray-800 mb-4">{t('quickActions')}</h3>
                         <div className="space-y-3">
                             <button onClick={onNewQuote} className="w-full flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group">
                                 <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Plus size={18} /></div>
                                 <div className="text-left">
                                     <div className="font-bold text-gray-700 group-hover:text-blue-700 text-sm">{t('newQuote')}</div>
                                     <div className="text-xs text-gray-400">Create a commercial quote</div>
                                 </div>
                             </button>
                             <button onClick={onNewContract} className="w-full flex items-center p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group">
                                 <div className="bg-green-100 text-green-600 p-2 rounded-lg mr-3 group-hover:bg-green-600 group-hover:text-white transition-colors"><FileSignature size={18} /></div>
                                 <div className="text-left">
                                     <div className="font-bold text-gray-700 group-hover:text-green-700 text-sm">{t('new')} {t('contracts')}</div>
                                     <div className="text-xs text-gray-400">Domestic sales contract</div>
                                 </div>
                             </button>
                         </div>
                    </div>

                    {/* Exchange Rates Widget */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b bg-gray-50">
                             <h3 className="font-bold text-gray-800 text-sm">{t('exchangeRates')}</h3>
                             <p className="text-xs text-gray-400">Base: 1 USD</p>
                        </div>
                        <div className="divide-y">
                            {Object.entries(settings.exchangeRates || {}).map(([currency, rate]) => (
                                <div key={currency} className="p-3 flex justify-between items-center text-sm">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">
                                            {currency.substring(0,2)}
                                        </div>
                                        <span className="font-medium text-gray-700">{currency}</span>
                                    </div>
                                    <span className="font-mono font-bold">{Number(rate).toFixed(4)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, bg, sub }: any) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between">
        <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">{value}</h3>
            <p className="text-xs text-gray-400">{sub}</p>
        </div>
        <div className={`p-3 rounded-lg ${bg}`}>
            {icon}
        </div>
    </div>
);

const QuotesList = ({ quotes, onEdit, onDelete, onNew, onExport, isGenerating, t }: any) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredQuotes = quotes.filter((q: Quote) => 
        q.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (q.customerSnapshot?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
             <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                 <div className="relative w-full md:w-80">
                     <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                     <input 
                         className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                         placeholder={`${t('search')} ${t('number')} / ${t('company')}`}
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                     />
                 </div>
                 <button onClick={onNew} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center w-full md:w-auto justify-center">
                     <Plus size={16} className="mr-2"/> {t('newQuote')}
                 </button>
             </div>
             <div className="bg-white rounded shadow overflow-hidden">
                 <table className="w-full text-sm">
                     <thead className="bg-gray-50">
                         <tr>
                             <th className="p-3 text-left">{t('number')}</th>
                             <th className="p-3 text-left">{t('date')}</th>
                             <th className="p-3 text-left">{t('createdTime')}</th>
                             <th className="p-3 text-left">{t('createdUser')}</th>
                             <th className="p-3 text-left">{t('billTo')}</th>
                             <th className="p-3 text-right">{t('amount')}</th>
                             <th className="p-3 text-right">{t('actions')}</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y">
                         {filteredQuotes.map((q: Quote) => (
                             <tr key={q.id} className="hover:bg-gray-50">
                                 <td className="p-3 font-medium text-blue-600">{q.number}</td>
                                 <td className="p-3">{q.date}</td>
                                 <td className="p-3 text-xs text-gray-500">{q.createdAt}</td>
                                 <td className="p-3 text-xs text-gray-500">{q.createdBy || 'System'}</td>
                                 <td className="p-3">{q.customerSnapshot?.name}</td>
                                 <td className="p-3 text-right">{q.currency} {q.total.toFixed(2)}</td>
                                 <td className="p-3 text-right space-x-2">
                                     <button onClick={() => onExport(q, 'pdf')} disabled={isGenerating} className="text-green-600"><Download size={18}/></button>
                                     <button onClick={() => onEdit(q)} className="text-blue-600"><Edit size={18}/></button>
                                     <button onClick={() => onDelete(q.id)} className="text-red-500"><Trash2 size={18}/></button>
                                 </td>
                             </tr>
                         ))}
                         {filteredQuotes.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-400">{t('noData')}</td></tr>}
                     </tbody>
                 </table>
             </div>
        </div>
    );
};

const ContractsList = ({ contracts, onEdit, onDelete, onNew, onExport, isGenerating, t }: any) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredContracts = contracts.filter((c: Contract) => 
        c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.customerSnapshot?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
             <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                 <div className="relative w-full md:w-80">
                     <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                     <input 
                         className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                         placeholder={`${t('search')} ${t('contractNumber')} / ${t('company')}`}
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                     />
                 </div>
                 <button onClick={onNew} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center w-full md:w-auto justify-center"><Plus size={16} className="mr-2"/> {t('new')}</button>
             </div>
             <div className="bg-white rounded shadow overflow-hidden">
                 <table className="w-full text-sm">
                     <thead className="bg-gray-50">
                         <tr>
                             <th className="p-3 text-left">{t('contractNumber')}</th>
                             <th className="p-3 text-left">{t('createdTime')}</th>
                             <th className="p-3 text-left">{t('buyer')}</th>
                             <th className="p-3 text-right">{t('total')} (CNY)</th>
                             <th className="p-3 text-right">{t('actions')}</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y">
                         {filteredContracts.map((c: Contract) => (
                             <tr key={c.id} className="hover:bg-gray-50">
                                 <td className="p-3 font-medium text-blue-600">{c.contractNumber}</td>
                                 <td className="p-3">{c.createdAt || c.date}</td>
                                 <td className="p-3">{c.customerSnapshot?.name}</td>
                                 <td className="p-3 text-right font-bold">￥{c.totalAmount.toFixed(2)}</td>
                                 <td className="p-3 text-right space-x-2">
                                     <button onClick={() => onExport(c, 'pdf')} disabled={isGenerating} className="text-green-600"><Download size={18}/></button>
                                     <button onClick={() => onEdit(c)} className="text-blue-600"><Edit size={18}/></button>
                                     <button onClick={() => onDelete(c.id)} className="text-red-500"><Trash2 size={18}/></button>
                                 </td>
                             </tr>
                         ))}
                         {filteredContracts.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">{t('noData')}</td></tr>}
                     </tbody>
                 </table>
             </div>
        </div>
    );
};

const CustomersManager = ({ customers, onSave, onDelete, t }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [current, setCurrent] = useState<Partial<Customer>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [regionFilter, setRegionFilter] = useState<CustomerRegion | 'All'>('All');

    const handleEdit = (c: Customer) => { setCurrent(c); setIsEditing(true); };
    // Updated: Default to International
    const handleNew = () => { setCurrent({ id: generateId(), region: 'International' }); setIsEditing(true); }; 

    const filtered = customers.filter((c: Customer) => 
        (regionFilter === 'All' || c.region === regionFilter) &&
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(current as Customer);
        setIsEditing(false);
    };

    return (
        <div className="space-y-6">
            {isEditing ? (
                 <div className="bg-white p-6 rounded-xl shadow border">
                     <h3 className="font-bold text-lg mb-4">{current.id ? t('edit') : t('new')} {t('customers')}</h3>
                     <form onSubmit={handleSubmit} className="space-y-4">
                         {/* Region Switcher - Swapped Order */}
                         <div className="flex space-x-4 mb-4">
                             <label className="flex items-center space-x-2 cursor-pointer">
                                 <input type="radio" name="region" checked={current.region === 'International'} onChange={() => setCurrent({...current, region: 'International'})} />
                                 <span className="font-bold text-gray-700">{t('international')}</span>
                             </label>
                             <label className="flex items-center space-x-2 cursor-pointer">
                                 <input type="radio" name="region" checked={current.region === 'Domestic'} onChange={() => setCurrent({...current, region: 'Domestic'})} />
                                 <span className="font-bold text-gray-700">{t('domestic')}</span>
                             </label>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('company')}</label>
                                <input className="w-full p-2 border rounded" value={current.name || ''} onChange={e => setCurrent({...current, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('contact')}</label>
                                <input className="w-full p-2 border rounded" value={current.contactPerson || ''} onChange={e => setCurrent({...current, contactPerson: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">Email</label>
                                <input className="w-full p-2 border rounded" value={current.email || ''} onChange={e => setCurrent({...current, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">Phone</label>
                                <input className="w-full p-2 border rounded" value={current.phone || ''} onChange={e => setCurrent({...current, phone: e.target.value})} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase">Address</label>
                                <input className="w-full p-2 border rounded" value={current.address || ''} onChange={e => setCurrent({...current, address: e.target.value})} />
                            </div>
                            
                            {/* Conditional Fields */}
                            {current.region === 'Domestic' ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase text-blue-600">{t('taxId')}</label>
                                        <input className="w-full p-2 border rounded bg-blue-50" value={current.taxId || ''} onChange={e => setCurrent({...current, taxId: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase text-blue-600">{t('bankName')}</label>
                                        <input className="w-full p-2 border rounded bg-blue-50" value={current.bankName || ''} onChange={e => setCurrent({...current, bankName: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase text-blue-600">{t('bankAccount')}</label>
                                        <input className="w-full p-2 border rounded bg-blue-50" value={current.bankAccount || ''} onChange={e => setCurrent({...current, bankAccount: e.target.value})} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Country</label>
                                        <input className="w-full p-2 border rounded" value={current.country || ''} onChange={e => setCurrent({...current, country: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase">City</label>
                                        <input className="w-full p-2 border rounded" value={current.city || ''} onChange={e => setCurrent({...current, city: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Zip Code</label>
                                        <input className="w-full p-2 border rounded" value={current.zipCode || ''} onChange={e => setCurrent({...current, zipCode: e.target.value})} />
                                    </div>
                                </>
                            )}
                         </div>
                         <div className="flex justify-end space-x-2">
                             <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded">{t('cancel')}</button>
                             <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{t('save')}</button>
                         </div>
                     </form>
                 </div>
            ) : (
                <>
                    <div className="flex justify-between items-center">
                         <div className="flex items-center space-x-4">
                             <input className="p-2 border rounded w-64" placeholder={t('search')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                             <select className="p-2 border rounded" value={regionFilter} onChange={e => setRegionFilter(e.target.value as any)}>
                                 <option value="All">All Regions</option>
                                 <option value="Domestic">{t('domestic')}</option>
                                 <option value="International">{t('international')}</option>
                             </select>
                         </div>
                         <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"><Plus size={16} className="mr-2"/> {t('add')} {t('customers')}</button>
                    </div>
                    <div className="bg-white rounded shadow overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 text-left">{t('customerRegion')}</th>
                                    <th className="p-3 text-left">{t('company')}</th>
                                    <th className="p-3 text-left">{t('contact')}</th>
                                    <th className="p-3 text-left">{t('taxId')} / Country</th>
                                    <th className="p-3 text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filtered.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="p-3"><span className={`text-xs px-2 py-1 rounded ${c.region === 'Domestic' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{c.region || 'International'}</span></td>
                                        <td className="p-3 font-bold">{c.name}</td>
                                        <td className="p-3">{c.contactPerson}</td>
                                        <td className="p-3">{c.region === 'Domestic' ? c.taxId : c.country}</td>
                                        <td className="p-3 text-right space-x-2">
                                            <button onClick={() => handleEdit(c)} className="text-blue-600"><Edit size={18}/></button>
                                            <button onClick={() => onDelete(c.id)} className="text-red-500"><Trash2 size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};
