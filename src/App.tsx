
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  Globe, 
  Menu, 
  X, 
  Loader2, 
  Image as ImageIcon, 
  LogOut,
  Shield,
  Coins
} from 'lucide-react';
import { api, generateId } from './services/api';
import { storageService } from './services/storageService';
import { Quote, Product, Customer, CompanySettings, Currency } from './types';
import { QuoteEditor } from './components/QuoteEditor';
import { InvoiceTemplate } from './components/InvoiceTemplate';
import { Login } from './components/Login';
import { UsersManager } from './components/UsersManager';
import { ProductsManager } from './components/ProductsManager';

// Libraries needed for PDF generation
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ViewState = 'dashboard' | 'quotes' | 'products' | 'customers' | 'settings' | 'users' | 'quote-editor';
type Lang = 'en' | 'zh';

// --- Translations Dictionary ---
const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard v2.5 (Pro)',
    quotes: 'Quotes & Invoices',
    products: 'Product Inventory',
    customers: 'Customers',
    settings: 'System Settings',
    users: 'Account Management',
    welcome: 'Welcome',
    newQuote: 'Create New Quote',
    search: 'Search...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    actions: 'Actions',
    totalRevenue: 'Total Revenue',
    totalQuotes: 'Total Quotes',
    recentActivity: 'Recent Activity',
    noQuotes: 'No data available.',
    status: 'Status',
    date: 'Date',
    number: 'Number',
    amount: 'Amount',
    customer: 'Customer',
    sku: 'SKU / Model',
    name: 'Product Name',
    price: 'Sales Price',
    cost: 'Cost',
    supplier: 'Supplier',
    suppliers: 'Suppliers',
    supplierRef: 'Ref/Link',
    margin: 'Margin',
    desc: 'Description',
    unit: 'Unit',
    contact: 'Contact',
    company: 'Company Name',
    country: 'Country',
    phone: 'Phone',
    address: 'Street Address',
    city: 'City',
    zip: 'Zip Code',
    taxId: 'Tax/VAT ID',
    source: 'Source',
    email: 'Email',
    bankInfo: 'Bank Info (For Invoice)',
    logoUrl: 'Company Logo',
    stampUrl: 'Company Stamp (Seal)',
    quotePrefix: 'Quote Prefix',
    saveSettings: 'Save Settings',
    addProduct: 'Add Product',
    addCustomer: 'Add Customer',
    confirmDelete: 'Are you sure?',
    settingsSaved: 'Settings Saved!',
    startQuoteTitle: 'Start a new Quotation',
    startQuoteDesc: 'Create professional invoices in seconds.',
    companyProfile: 'Company Profile & PDF Settings',
    quoteDetails: 'Quote Details',
    billTo: 'Bill To',
    lineItems: 'Line Items',
    notes: 'Notes & Terms',
    subtotal: 'Subtotal',
    discountRate: 'Discount Rate',
    discountAmount: 'Discount Amount',
    shipping: 'Shipping Cost',
    grandTotal: 'Grand Total',
    type: 'Type',
    validUntil: 'Valid Until',
    currency: 'Currency',
    incoterms: 'Incoterms',
    leadTime: 'Lead Time',
    paymentTerms: 'Payment Terms',
    addItem: 'Add Line Item',
    qty: 'Qty',
    selectCustomer: '-- Select Customer --',
    customItem: 'Custom Item',
    uploadImage: 'Upload Image',
    preview: 'Preview PDF',
    exportImage: 'Export Image',
    close: 'Close',
    generating: 'Generating...',
    exportPdf: 'Export PDF',
    logout: 'Logout',
    createdBy: 'Created By',
    sourcingInfo: 'Sourcing & Cost Info',
    salesInfo: 'Sales Information',
    addSupplier: 'Add Supplier',
    hasStock: 'In Stock',
    noStock: 'No Stock',
    isDefault: 'Default',
    setDefault: 'Set as Default',
    exchangeRates: 'Exchange Rates (Base: 1 USD)',
    ratesDesc: 'Set exchange rates to calculate accurate margins when cost and sales currencies differ.',
    currencySettings: 'Currency Settings',
    customerValidation: 'Please provide either Company Name or Contact Person.',
    skuRequired: 'SKU is required.'
  },
  zh: {
    dashboard: '仪表盘 v2.5 (Pro)',
    quotes: '报价单管理',
    products: '产品库管理',
    customers: '客户管理',
    settings: '系统设置',
    users: '账号管理',
    welcome: '欢迎使用',
    newQuote: '新建报价单',
    search: '搜索...',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    actions: '操作',
    totalRevenue: '总收入',
    totalQuotes: '报价单总数',
    recentActivity: '最近活动',
    noQuotes: '暂无数据',
    status: '状态',
    date: '日期',
    number: '单号',
    amount: '总金额',
    customer: '客户',
    sku: 'SKU / 型号',
    name: '产品名称',
    price: '销售单价',
    cost: '成本价',
    supplier: '供应商',
    suppliers: '供应商列表',
    supplierRef: '货号/链接',
    margin: '利润率',
    desc: '详细描述',
    unit: '单位 (个/套)',
    contact: '联系人',
    company: '公司名称 (英文)',
    country: '国家',
    phone: '电话',
    address: '街道地址',
    city: '城市',
    zip: '邮编',
    taxId: '税号 (VAT/Tax)',
    source: '客户来源',
    email: '邮箱',
    bankInfo: '银行账户信息 (显示在PDF)',
    logoUrl: '公司 Logo (显示在左上角)',
    stampUrl: '公司公章 (显示在右下角)',
    quotePrefix: '编号前缀',
    saveSettings: '保存设置',
    addProduct: '新增产品',
    addCustomer: '新增客户',
    confirmDelete: '确认删除吗？',
    settingsSaved: '设置已保存！',
    startQuoteTitle: '快速报价',
    startQuoteDesc: '创建专业的出口报价单（PI/CI）。',
    companyProfile: '公司信息与打印设置',
    quoteDetails: '报价单详情',
    billTo: '客户信息 (Bill To)',
    lineItems: '产品明细',
    notes: '备注 / 贸易条款',
    subtotal: '小计',
    discountRate: '折扣率',
    discountAmount: '折扣金额',
    shipping: '运费',
    grandTotal: '总计',
    type: '类型',
    validUntil: '有效期至',
    currency: '货币',
    incoterms: '贸易条款',
    leadTime: '交货期',
    paymentTerms: '付款方式',
    addItem: '添加一行产品',
    qty: '数量',
    selectCustomer: '-- 从库中选择客户 --',
    customItem: '手动输入产品',
    uploadImage: '点击上传图片',
    preview: '预览报价单',
    exportImage: '导出图片',
    close: '关闭',
    generating: '正在生成...',
    exportPdf: '下载 PDF',
    logout: '退出登录',
    createdBy: '创建人',
    sourcingInfo: '供应链与成本信息',
    salesInfo: '销售信息',
    addSupplier: '添加供应商',
    hasStock: '有现货',
    noStock: '无现货',
    isDefault: '主要货源',
    setDefault: '设为主要',
    exchangeRates: '汇率设置 (基准: 1 USD)',
    ratesDesc: '设置汇率以便在采购币种与销售币种不同时计算准确的利润率。',
    currencySettings: '货币设置',
    customerValidation: '请填写公司名称或联系人（至少一项）。',
    skuRequired: '必须填写 SKU / 型号。'
  }
};

export default function App() {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // --- Global Data State ---
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(storageService.getSettings()); // Fallback to default
  
  // --- UI State ---
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [lang, setLang] = useState<Lang>('zh');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // --- PDF Ref ---
  const printRef = useRef<HTMLDivElement>(null);
  const [printQuote, setPrintQuote] = useState<Quote | null>(null);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'image'>('pdf');

  // --- Helper: Translate ---
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[lang][key] || key;

  // --- Load Data ---
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [q, p, c, s] = await Promise.all([
        api.getQuotes(),
        api.getProducts(),
        api.getCustomers(),
        api.getSettings()
      ]);
      setQuotes(q);
      setProducts(p);
      setCustomers(c);
      if (s) setSettings(s);
    } catch (error) {
      console.error("Failed to load data", error);
      // Handle auth failure (token expired)
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // --- Actions ---

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_fullName');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_phone');
    setIsAuthenticated(false);
  };

  const handleSaveQuote = async (quote: Quote) => {
    await api.saveQuote(quote);
    await loadData(); 
    setCurrentView('quotes');
    setEditingQuote(null);
  };

  const handleDeleteQuote = async (id: string) => {
    if(confirm(t('confirmDelete'))) {
        await api.deleteQuote(id);
        await loadData();
    }
  };

  const handleProductSave = async (product: Product) => {
    await api.saveProduct(product);
    await loadData();
  };
  
  const handleDeleteProduct = async (id: string) => {
      if(confirm(t('confirmDelete'))) {
        await api.deleteProduct(id);
        await loadData();
      }
  };

  const handleCustomerSave = async (customer: Customer) => {
    await api.saveCustomer(customer);
    await loadData();
  };

   const handleDeleteCustomer = async (id: string) => {
      if(confirm(t('confirmDelete'))) {
        await api.deleteCustomer(id);
        await loadData();
      }
  };

  const handleSaveSettings = async (newSettings: CompanySettings) => {
    await api.saveSettings(newSettings);
    setSettings(newSettings);
    alert(t('settingsSaved'));
  };

  // Unified Export Handler
  const handleExport = async (quote: Quote, format: 'pdf' | 'image') => {
    if (isGeneratingPdf) return;
    
    setIsGeneratingPdf(true);
    setPrintQuote(quote);
    setExportFormat(format);

    // Give React time to render the "generate" mode template
    setTimeout(async () => {
        if (printRef.current) {
            try {
                // INCREASED SCALE FOR BETTER QUALITY (from 2 to 4)
                const scale = format === 'pdf' ? 4 : 3;

                const canvas = await html2canvas(printRef.current, {
                    scale: scale, 
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    windowWidth: 794, // Lock width to A4 pixel width
                    scrollY: 0,
                    backgroundColor: '#ffffff'
                });

                if (format === 'image') {
                    // --- IMAGE EXPORT ---
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${quote.number}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                        }
                    }, 'image/png');

                } else {
                    // --- PDF EXPORT ---
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    
                    if (imgData === 'data:,') throw new Error('Empty image data');

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
                    pdf.save(`${quote.number}.pdf`);
                }

            } catch (err) {
                console.error("Export failed", err);
                alert("Failed to export. Please check console.");
            } finally {
                setPrintQuote(null);
                setIsGeneratingPdf(false);
            }
        } else {
            console.error("Print ref not found");
            setIsGeneratingPdf(false);
        }
    }, 1500); 
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const navigateTo = (view: ViewState) => {
      setCurrentView(view);
      closeMobileMenu();
  };

  // --- Render Logic ---

  const renderContent = () => {
    switch (currentView) {
      case 'quote-editor':
        return (
            <QuoteEditor 
                initialQuote={editingQuote}
                customers={customers}
                products={products}
                settings={settings}
                onSave={handleSaveQuote}
                onCancel={() => navigateTo('quotes')}
                onExport={handleExport} 
                t={t}
            />
        );
      case 'quotes':
        return <QuotesList 
            quotes={quotes} 
            onEdit={(q: Quote) => { setEditingQuote(q); navigateTo('quote-editor'); }} 
            onDelete={handleDeleteQuote}
            onNew={() => { setEditingQuote(null); navigateTo('quote-editor'); }}
            onExport={handleExport} 
            isGenerating={isGeneratingPdf}
            t={t}
        />;
      case 'products':
        return <ProductsManager products={products} settings={settings} onSave={handleProductSave} onDelete={handleDeleteProduct} t={t} />;
      case 'customers':
        return <CustomersManager customers={customers} onSave={handleCustomerSave} onDelete={handleDeleteCustomer} t={t} />;
      case 'settings':
        return <SettingsManager settings={settings} onSave={handleSaveSettings} t={t} />;
      case 'users':
        return <UsersManager t={t} />;
      case 'dashboard':
      default:
        return <Dashboard quotes={quotes} products={products} customers={customers} onCreateQuote={() => { setEditingQuote(null); navigateTo('quote-editor'); }} t={t} />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (isLoading && products.length === 0 && quotes.length === 0) {
      return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;
  }

  return (
    <>
      <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
        
        {isGeneratingPdf && (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin w-12 h-12 mb-4" />
                <p className="text-lg font-semibold">{t('generating')}</p>
            </div>
        )}

        {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={closeMobileMenu}></div>
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col shadow-xl transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 flex-shrink-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6 flex items-center border-b border-slate-800 justify-between">
              <div className="flex items-center overflow-hidden">
                  {settings.logoDataUrl ? (
                      <img src={settings.logoDataUrl} alt="Logo" className="h-8 w-auto object-contain" />
                  ) : (
                      <>
                          <div className="w-8 h-8 bg-blue-600 rounded-lg mr-3 flex items-center justify-center font-bold text-white flex-shrink-0">L</div>
                          <h1 className="text-xl font-bold tracking-wide whitespace-nowrap">LH WAVE</h1>
                      </>
                  )}
              </div>
              <button onClick={closeMobileMenu} className="md:hidden text-slate-400 hover:text-white">
                  <X size={24} />
              </button>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
              <SidebarItem icon={<LayoutDashboard size={20} />} label={t('dashboard')} active={currentView === 'dashboard'} onClick={() => navigateTo('dashboard')} />
              <SidebarItem icon={<FileText size={20} />} label={t('quotes')} active={currentView === 'quotes' || currentView === 'quote-editor'} onClick={() => navigateTo('quotes')} />
              <SidebarItem icon={<Package size={20} />} label={t('products')} active={currentView === 'products'} onClick={() => navigateTo('products')} />
              <SidebarItem icon={<Users size={20} />} label={t('customers')} active={currentView === 'customers'} onClick={() => navigateTo('customers')} />
              <div className="pt-8">
                  <SidebarItem icon={<Settings size={20} />} label={t('settings')} active={currentView === 'settings'} onClick={() => navigateTo('settings')} />
                  <SidebarItem icon={<Shield size={20} />} label={t('users')} active={currentView === 'users'} onClick={() => navigateTo('users')} />
              </div>
          </nav>
          
          <div className="p-4 border-t border-slate-800 space-y-2">
              <button 
                  onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
                  className="flex items-center justify-center w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 rounded transition-colors text-sm"
              >
                  <Globe size={16} className="mr-2" />
                  {lang === 'en' ? '切换到 中文' : 'Switch to English'}
              </button>
              <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center w-full py-2 px-4 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded transition-colors text-sm"
              >
                  <LogOut size={16} className="mr-2" />
                  {t('logout')}
              </button>
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 overflow-hidden flex flex-col relative w-full">
          <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-8 z-10 flex-shrink-0">
              <div className="flex items-center">
                  <button onClick={toggleMobileMenu} className="mr-4 md:hidden text-gray-600 hover:text-blue-600">
                      <Menu size={24} />
                  </button>
                  <h2 className="text-lg md:text-2xl font-bold text-gray-800 capitalize truncate max-w-[200px] md:max-w-none">
                      {currentView === 'quote-editor' ? (editingQuote ? t('edit') : t('newQuote')) : t(currentView as any) || currentView}
                  </h2>
              </div>
              <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                     <div className="text-right hidden md:block">
                         <p className="text-sm font-bold text-gray-700">{localStorage.getItem('user_fullName') || localStorage.getItem('username') || 'Admin'}</p>
                         <p className="text-xs text-green-500">Online</p>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        {(localStorage.getItem('username') || 'A')[0].toUpperCase()}
                     </div>
                  </div>
              </div>
          </header>

          <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50 w-full">
              {renderContent()}
          </div>
        </main>
      </div>

      {printQuote && (
          <div style={{ position: 'fixed', top: 0, left: '-10000px', width: '794px', height: 'auto', zIndex: -1, overflow: 'visible' }}>
              <InvoiceTemplate ref={printRef} quote={printQuote} settings={settings} mode="generate" />
          </div>
      )}
    </>
  );
}

const SidebarItem = ({ icon, label, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 rounded-lg transition-all ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
    >
        <span className="mr-3">{icon}</span>
        <span className="font-medium">{label}</span>
    </button>
);

const Dashboard = ({ quotes, products, customers, onCreateQuote, t }: any) => {
    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <StatCard label={t('totalQuotes')} value={quotes.length} icon={<FileText className="text-blue-500" />} />
                <StatCard label={t('customers')} value={customers.length} icon={<Users className="text-green-500" />} />
                <StatCard label={t('products')} value={products.length} icon={<Package className="text-orange-500" />} />
             </div>

             <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-center shadow-lg space-y-4 md:space-y-0">
                <div className="text-center md:text-left">
                    <h3 className="text-xl md:text-2xl font-bold mb-2">{t('startQuoteTitle')}</h3>
                    <p className="text-blue-100 opacity-90">{t('startQuoteDesc')}</p>
                </div>
                <button onClick={onCreateQuote} className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold shadow hover:bg-gray-100 transition w-full md:w-auto">
                    + {t('newQuote')}
                </button>
             </div>

             <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                 <h3 className="font-bold text-gray-800 mb-4">{t('recentActivity')}</h3>
                 {quotes.length === 0 ? (
                     <p className="text-gray-400 text-center py-8">{t('noQuotes')}</p>
                 ) : (
                     <div className="space-y-3">
                         {quotes.slice(0, 5).map((q: Quote) => (
                             <div key={q.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border-b border-gray-50 last:border-0">
                                 <div>
                                     <span className="font-bold text-gray-700 block text-sm md:text-base">{q.number}</span>
                                     <span className="text-xs md:text-sm text-gray-500">{q.customerSnapshot?.name || 'Unknown Customer'}</span>
                                     {q.createdBy && <span className="text-[10px] text-gray-400 block">By: {q.createdBy}</span>}
                                 </div>
                                 <div className="text-right">
                                     <span className="block font-bold text-sm md:text-base">{q.currency} {q.total.toFixed(2)}</span>
                                     <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{q.status}</span>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
        </div>
    );
};

const StatCard = ({ label, value, icon }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
        <div className="p-4 bg-gray-50 rounded-full mr-4">{icon}</div>
        <div>
            <p className="text-gray-500 text-sm uppercase font-bold">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const QuotesList = ({ quotes, onEdit, onDelete, onNew, onExport, isGenerating, t }: any) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filtered = quotes.filter((q: Quote) => 
        q.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (q.customerSnapshot?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input 
                        className="w-full pl-10 pr-4 py-2 border rounded-lg" 
                        placeholder={t('search')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={onNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center shadow w-full md:w-auto justify-center">
                    <Plus size={20} className="mr-2" /> {t('newQuote')}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('number')}</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('date')}</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('customer')}</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('amount')}</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('createdBy')}</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('status')}</th>
                                <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((q: Quote) => (
                                <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium text-blue-600">{q.number}</td>
                                    <td className="p-4 text-gray-600 text-sm">{q.date}</td>
                                    <td className="p-4 text-gray-800 font-medium">{q.customerSnapshot?.name || 'Unknown'}</td>
                                    <td className="p-4 font-bold text-gray-700">{q.currency} {q.total.toFixed(2)}</td>
                                    <td className="p-4 text-xs text-gray-500">{q.createdBy || '-'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            q.status === 'Accepted' ? 'bg-green-100 text-green-700' : 
                                            q.status === 'Sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {q.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button 
                                            onClick={() => onExport(q, 'image')} 
                                            className="p-2 text-orange-500 hover:bg-orange-50 rounded transition-colors" 
                                            title={t('exportImage')}
                                            disabled={isGenerating}
                                        >
                                            <ImageIcon size={18} />
                                        </button>
                                        <button 
                                            onClick={() => onExport(q, 'pdf')} 
                                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors" 
                                            title={t('exportPdf')}
                                            disabled={isGenerating}
                                        >
                                            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                                        </button>
                                        <button onClick={() => onEdit(q)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => onDelete(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-400">{t('noQuotes')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const CustomersManager = ({ customers, onSave, onDelete, t }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer>>({});
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = customers.filter((c: Customer) => 
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.contactPerson || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (c: Customer) => {
        setCurrentCustomer(c);
        setIsEditing(true);
    };

    const handleNew = () => {
        setCurrentCustomer({ id: generateId() });
        setIsEditing(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // CHANGED: Validation logic allow Name OR Contact
        if(currentCustomer.name || currentCustomer.contactPerson) {
            onSave(currentCustomer as Customer);
            setIsEditing(false);
        } else {
            alert(t('customerValidation'));
        }
    };

    return (
        <div className="space-y-6">
            {isEditing ? (
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                     <h3 className="font-bold text-lg mb-4">{currentCustomer.id ? t('edit') : t('addCustomer')}</h3>
                     <form onSubmit={handleSubmit} className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('company')}</label>
                                <input className="w-full p-2 border rounded" value={currentCustomer.name || ''} onChange={e => setCurrentCustomer({...currentCustomer, name: e.target.value})} placeholder="Required if Contact is empty" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('contact')}</label>
                                <input className="w-full p-2 border rounded" value={currentCustomer.contactPerson || ''} onChange={e => setCurrentCustomer({...currentCustomer, contactPerson: e.target.value})} placeholder="Required if Company is empty" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('email')}</label>
                                <input type="email" className="w-full p-2 border rounded" value={currentCustomer.email || ''} onChange={e => setCurrentCustomer({...currentCustomer, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('phone')}</label>
                                <input className="w-full p-2 border rounded" value={currentCustomer.phone || ''} onChange={e => setCurrentCustomer({...currentCustomer, phone: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('address')}</label>
                                <input className="w-full p-2 border rounded" value={currentCustomer.address || ''} onChange={e => setCurrentCustomer({...currentCustomer, address: e.target.value})} />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('city')}</label>
                                <input className="w-full p-2 border rounded" value={currentCustomer.city || ''} onChange={e => setCurrentCustomer({...currentCustomer, city: e.target.value})} />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('country')}</label>
                                <input className="w-full p-2 border rounded" value={currentCustomer.country || ''} onChange={e => setCurrentCustomer({...currentCustomer, country: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('zip')}</label>
                                <input className="w-full p-2 border rounded" value={currentCustomer.zipCode || ''} onChange={e => setCurrentCustomer({...currentCustomer, zipCode: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('taxId')}</label>
                                <input className="w-full p-2 border rounded" value={currentCustomer.taxId || ''} onChange={e => setCurrentCustomer({...currentCustomer, taxId: e.target.value})} />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('source')}</label>
                                <input className="w-full p-2 border rounded" value={currentCustomer.source || ''} onChange={e => setCurrentCustomer({...currentCustomer, source: e.target.value})} />
                            </div>
                         </div>
                         <div className="flex justify-end space-x-3">
                             <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">{t('cancel')}</button>
                             <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700">{t('save')}</button>
                         </div>
                     </form>
                 </div>
            ) : (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                         <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input 
                                className="w-full pl-10 pr-4 py-2 border rounded-lg" 
                                placeholder={t('search')}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center shadow w-full md:w-auto justify-center">
                            <Plus size={20} className="mr-2" /> {t('addCustomer')}
                        </button>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-left">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('company')}</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('contact')}</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('country')}</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('email')}</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('createdBy')}</th>
                                        <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map((c: Customer) => (
                                        <tr key={c.id} className="hover:bg-gray-50">
                                            <td className="p-4 font-bold text-gray-700">{c.name || '-'}</td>
                                            <td className="p-4">{c.contactPerson || '-'}</td>
                                            <td className="p-4">{c.country}</td>
                                            <td className="p-4 text-gray-500 text-sm">{c.email}</td>
                                            <td className="p-4 text-gray-500 text-xs">{c.createdBy || '-'}</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleEdit(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded mr-2"><Edit size={18} /></button>
                                                <button onClick={() => onDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">{t('noQuotes')}</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const SettingsManager = ({ settings, onSave, t }: any) => {
    const [formData, setFormData] = useState<CompanySettings>(settings);

    // Sync state when settings prop changes (e.g. after async load)
    useEffect(() => {
        if(settings) {
            setFormData(settings);
        }
    }, [settings]);

    if (!formData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleRateChange = (currency: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            exchangeRates: {
                ...prev.exchangeRates,
                [currency]: parseFloat(value) || 0
            }
        }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoDataUrl' | 'stampDataUrl') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [field]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-4xl">
            <h3 className="font-bold text-lg mb-6">{t('companyProfile')}</h3>
            <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-500 text-xs uppercase border-b pb-2">Basic Info</h4>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('company')}</label>
                            <input name="name" className="w-full p-2 border rounded" value={formData.name || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('address')}</label>
                            <input name="address" className="w-full p-2 border rounded" value={formData.address || ''} onChange={handleChange} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('city')}</label>
                                <input name="city" className="w-full p-2 border rounded" value={formData.city || ''} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('country')}</label>
                                <input name="country" className="w-full p-2 border rounded" value={formData.country || ''} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('phone')}</label>
                                <input name="phone" className="w-full p-2 border rounded" value={formData.phone || ''} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('email')}</label>
                                <input name="email" className="w-full p-2 border rounded" value={formData.email || ''} onChange={handleChange} />
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('quotePrefix')}</label>
                            <input name="quotePrefix" className="w-full p-2 border rounded" value={formData.quotePrefix || ''} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-500 text-xs uppercase border-b pb-2">Images & Banking</h4>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('logoUrl')}</label>
                            <div className="flex items-center space-x-4">
                                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                                    {formData.logoDataUrl ? (
                                        <img src={formData.logoDataUrl} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-gray-400 text-xs">No Logo</span>
                                    )}
                                </div>
                                <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100 transition-colors text-sm font-medium">
                                    {t('uploadImage')}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logoDataUrl')} />
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('stampUrl')}</label>
                            <div className="flex items-center space-x-4">
                                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                                    {formData.stampDataUrl ? (
                                        <img src={formData.stampDataUrl} alt="Stamp" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-gray-400 text-xs">No Stamp</span>
                                    )}
                                </div>
                                <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100 transition-colors text-sm font-medium">
                                    {t('uploadImage')}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'stampDataUrl')} />
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('bankInfo')}</label>
                            <textarea name="bankInfo" rows={5} className="w-full p-2 border rounded font-mono text-sm" value={formData.bankInfo || ''} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* Currency & Exchange Rates Section */}
                <div className="pt-4 border-t">
                    <h4 className="font-bold text-gray-500 text-xs uppercase border-b pb-2 mb-4 flex items-center">
                        <Coins size={14} className="mr-2"/> {t('currencySettings')}
                    </h4>
                    
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-blue-800 font-medium mb-1">{t('exchangeRates')}</p>
                        <p className="text-xs text-blue-600">{t('ratesDesc')}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['CNY', 'EUR', 'GBP'].map(curr => (
                            <div key={curr}>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">1 USD = ? {curr}</label>
                                <input 
                                    type="number" 
                                    step="0.0001"
                                    className="w-full p-2 border rounded font-mono" 
                                    value={formData.exchangeRates?.[curr] || ''} 
                                    onChange={(e) => handleRateChange(curr, e.target.value)} 
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition font-medium">
                        {t('saveSettings')}
                    </button>
                </div>
            </form>
        </div>
    );
};
