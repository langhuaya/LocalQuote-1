
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, FileText, Package, Users, Settings, Plus, Search, Download, Edit, Trash2, Globe, Menu, X, Loader2, LogOut, Shield, Tag, FileSignature, TrendingUp, Clock, ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { api, generateId } from './services/api';
import { storageService } from './services/storageService';
import { Quote, Product, Customer, CompanySettings, Currency, Brand, Contract } from './types';
import { QuoteEditor } from './components/QuoteEditor';
import { ContractEditor } from './components/ContractEditor';
import { InvoiceTemplate } from './components/InvoiceTemplate';
import { ContractTemplate } from './components/ContractTemplate';
import { Login } from './components/Login';
import { UsersManager } from './components/UsersManager';
import { ProductsManager } from './components/ProductsManager';
import { BrandsManager } from './components/BrandsManager';
import { SettingsManager } from './components/SettingsManager';
import { AiAssistant } from './components/AiAssistant';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ViewState = 'dashboard' | 'quotes' | 'contracts' | 'products' | 'customers' | 'brands' | 'settings' | 'users' | 'quote-editor' | 'contract-editor';
type Lang = 'en' | 'zh';

const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard', quotes: 'Quotes', contracts: 'Contracts', products: 'Products', customers: 'Customers', brands: 'Brands', settings: 'Settings', users: 'Accounts',
    welcome: 'Welcome', logout: 'Logout', generating: 'Generating Document...',
    save: 'Save', cancel: 'Cancel', search: 'Search...', actions: 'Actions', exportPdf: 'Export PDF', exportImage: 'Export Image', preview: 'Preview', 
    newQuote: 'New Quote', new: 'New', edit: 'Edit', delete: 'Delete', 
    importExcel: 'Import Excel', exportExcel: 'Export Excel', importSuccess: 'Success', processing: 'Processing...',
    createdTime: 'Created Time', createdUser: 'Created By', totalRevenue: 'Total Amount', pendingQuotes: 'Quotes Count', recentActivity: 'Recent Activity', quickActions: 'Quick Actions', exchangeRates: 'Exchange Rates', viewAll: 'View All'
  },
  zh: {
    dashboard: '仪表盘', quotes: '出口报价单', contracts: '产品购销合同', products: '产品管理', customers: '客户管理', brands: '品牌管理', settings: '系统设置', users: '账号管理',
    welcome: '欢迎', logout: '退出', generating: '正在生成高保真文档...',
    save: '保存', cancel: '取消', search: '搜索...', actions: '操作', exportPdf: '导出 PDF', exportImage: '导出图片', preview: '预览',
    newQuote: '新建报价单', new: '新建', edit: '编辑', delete: '删除', 
    importExcel: '导入 Excel', exportExcel: '导出 Excel', importSuccess: '导入成功', processing: '正在处理...',
    createdTime: '创建时间', createdUser: '创建人', totalRevenue: '成交总额', pendingQuotes: '报价单数量', recentActivity: '最近动态', quickActions: '快捷操作', exchangeRates: '参考汇率', viewAll: '查看全部'
  }
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(storageService.getSettings());
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [lang, setLang] = useState<Lang>('zh');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [printDoc, setPrintDoc] = useState<{data: any, type: 'quote'|'contract'}|null>(null);
  const [printOpts, setPrintOpts] = useState({ showImages: true });

  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[lang][key] || key;

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [q, ctr, p, c, b, s] = await Promise.all([api.getQuotes(), api.getContracts(), api.getProducts(), api.getCustomers(), api.getBrands(), api.getSettings()]);
      setQuotes(q.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setContracts(ctr.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setProducts(p); setCustomers(c); setBrands(b);
      if (s) setSettings({...storageService.getSettings(), ...s});
    } catch (error) { handleLogout(); } finally { setIsLoading(false); }
  };

  useEffect(() => { if (isAuthenticated) loadData(); else setIsLoading(false); }, [isAuthenticated]);

  const handleLogout = () => { localStorage.clear(); setIsAuthenticated(false); };

  // --- Hybrid PDF Generation Engine (Fixes Table Slicing) ---
  const handleExport = async (doc: any, format: 'pdf'|'image', type: 'quote'|'contract', opts = { showImages: true }) => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setPrintOpts(opts);
    setPrintDoc({ data: doc, type });

    // Wait for template rendering
    setTimeout(async () => {
      const el = printRef.current;
      if (!el) return;
      try {
        const canvas = await html2canvas(el, { 
          scale: 2, useCORS: true, backgroundColor: '#ffffff', width: 794, windowWidth: 794, logging: false 
        });
        
        if (format === 'image') {
          const link = document.createElement('a');
          link.download = `${type === 'quote' ? doc.number : doc.contractNumber}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        } else {
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = 210;
          const pdfHeight = 297;
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const pageHeight = (imgHeight * pdfWidth) / imgWidth;
          
          let heightLeft = pageHeight;
          let position = 0;

          // Add First Page
          pdf.addImage(canvas, 'JPEG', 0, position, pdfWidth, pageHeight, undefined, 'FAST');
          heightLeft -= pdfHeight;

          // Add subsequent pages with correct slicing offset
          while (heightLeft > 0) {
            position = heightLeft - pageHeight; // Shift up
            pdf.addPage();
            pdf.addImage(canvas, 'JPEG', 0, position, pdfWidth, pageHeight, undefined, 'FAST');
            heightLeft -= pdfHeight;
          }
          pdf.save(`${type === 'quote' ? doc.number : doc.contractNumber}.pdf`);
        }
      } catch (err) { alert("Generation Failed"); } finally {
        setIsGeneratingPdf(false);
        setPrintDoc(null);
      }
    }, 1500);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'quote-editor': return <QuoteEditor initialQuote={editingQuote} customers={customers} products={products} settings={settings} onSave={async q => { await api.saveQuote(q); await loadData(); setCurrentView('quotes'); }} onCancel={() => setCurrentView('quotes')} onExport={(q, f, o) => handleExport(q, f, 'quote', o)} t={t} />;
      case 'contract-editor': return <ContractEditor initialContract={editingContract} customers={customers} products={products} settings={settings} onSave={async c => { await api.saveContract(c); await loadData(); setCurrentView('contracts'); }} onCancel={() => setCurrentView('contracts')} onExport={(c, f) => handleExport(c, f, 'contract')} t={t} />;
      case 'quotes': return <QuotesList quotes={quotes} onEdit={q => { setEditingQuote(q); setCurrentView('quote-editor'); }} onDelete={id => api.deleteQuote(id).then(loadData)} onNew={() => { setEditingQuote(null); setCurrentView('quote-editor'); }} onExport={(q, f) => handleExport(q, f, 'quote')} isGenerating={isGeneratingPdf} t={t} />;
      case 'contracts': return <ContractsList contracts={contracts} onEdit={c => { setEditingContract(c); setCurrentView('contract-editor'); }} onDelete={id => api.deleteContract(id).then(loadData)} onNew={() => { setEditingContract(null); setCurrentView('contract-editor'); }} onExport={(c, f) => handleExport(c, f, 'contract')} isGenerating={isGeneratingPdf} t={t} />;
      case 'products': return <ProductsManager products={products} brands={brands} settings={settings} onSave={p => api.saveProduct(p).then(loadData)} onDelete={id => api.deleteProduct(id).then(loadData)} t={t} />;
      case 'customers': return <CustomersManager customers={customers} onSave={c => api.saveCustomer(c).then(loadData)} onDelete={id => api.deleteCustomer(id).then(loadData)} t={t} />;
      case 'brands': return <BrandsManager brands={brands} onSave={b => api.saveBrand(b).then(loadData)} onDelete={id => api.deleteBrand(id).then(loadData)} t={t} />;
      case 'settings': return <SettingsManager settings={settings} onSave={s => api.saveSettings(s).then(() => { setSettings(s); alert('Saved!'); })} t={t} />;
      case 'users': return <UsersManager t={t} />;
      case 'dashboard':
      default: return <Dashboard quotes={quotes} contracts={contracts} products={products} customers={customers} settings={settings} onNewQuote={() => { setEditingQuote(null); setCurrentView('quote-editor'); }} onNewContract={() => { setEditingContract(null); setCurrentView('contract-editor'); }} onViewQuotes={() => setCurrentView('quotes')} onViewContracts={() => setCurrentView('contracts')} t={t} />;
    }
  };

  if (!isAuthenticated) return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  if (isLoading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {isGeneratingPdf && <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex flex-col items-center justify-center text-white backdrop-blur-sm"><Loader2 className="animate-spin w-16 h-16 mb-4" /><p className="text-xl font-bold">{t('generating')}</p></div>}
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center"><h1 className="text-2xl font-black italic tracking-tighter">LH WAVE</h1><button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden"><X/></button></div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
          <NavItem icon={<LayoutDashboard size={20}/>} label={t('dashboard')} active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <NavItem icon={<FileText size={20}/>} label={t('quotes')} active={currentView === 'quotes' || currentView === 'quote-editor'} onClick={() => setCurrentView('quotes')} />
          <NavItem icon={<FileSignature size={20}/>} label={t('contracts')} active={currentView === 'contracts' || currentView === 'contract-editor'} onClick={() => setCurrentView('contracts')} />
          <NavItem icon={<Package size={20}/>} label={t('products')} active={currentView === 'products'} onClick={() => setCurrentView('products')} />
          <NavItem icon={<Users size={20}/>} label={t('customers')} active={currentView === 'customers'} onClick={() => setCurrentView('customers')} />
          <NavItem icon={<Tag size={20}/>} label={t('brands')} active={currentView === 'brands'} onClick={() => setCurrentView('brands')} />
          <div className="pt-6 border-t border-white/5 mt-6">
            <NavItem icon={<Settings size={20}/>} label={t('settings')} active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
            <NavItem icon={<Shield size={20}/>} label={t('users')} active={currentView === 'users'} onClick={() => setCurrentView('users')} />
          </div>
        </nav>
        <div className="p-4 border-t border-white/10 bg-black/20 flex flex-col space-y-2">
            <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="flex items-center text-xs opacity-60 hover:opacity-100 transition"><Globe size={14} className="mr-2"/> {lang === 'en' ? '切换中文' : 'Switch English'}</button>
            <button onClick={handleLogout} className="flex items-center text-red-400 text-xs font-bold"><LogOut size={14} className="mr-2"/> {t('logout')}</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-6 md:px-8 justify-between z-10">
          <div className="flex items-center"><button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden mr-4"><Menu/></button><h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">{t(currentView as any) || currentView}</h2></div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">{renderContent()}</div>
        <AiAssistant productsCount={products.length} customersCount={customers.length} quotesCount={quotes.length} onSaveProduct={async p => { await api.saveProduct(p); await loadData(); }} onSaveCustomer={async c => { await api.saveCustomer(c); await loadData(); }} />
      </main>

      {/* Hidden Export Rendering Container */}
      <div id="export-container" className="fixed top-[-10000px] left-[-10000px] pointer-events-none">
        {printDoc?.type === 'quote' && <InvoiceTemplate ref={printRef} quote={printDoc.data} settings={settings} mode="generate" showImages={printOpts.showImages} />}
        {printDoc?.type === 'contract' && <ContractTemplate ref={printRef} contract={printDoc.data} settings={settings.domestic} mode="generate" />}
      </div>
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
    <span className="mr-3">{icon}</span><span>{label}</span>
  </button>
);

const StatCard = ({ title, value, sub, bg, color }: any) => (
  <div className={`${bg} p-6 rounded-2xl border flex flex-col justify-between shadow-sm`}>
    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">{title}</p>
    <h3 className={`text-2xl font-black ${color}`}>{value}</h3>
    {sub && <p className="text-[10px] text-gray-400 mt-2">{sub}</p>}
  </div>
);

const Dashboard = ({ quotes, contracts, products, customers, settings, onNewQuote, onNewContract, onViewQuotes, onViewContracts, t }: any) => {
  const totalVal = contracts.reduce((acc: number, c: any) => acc + (c.totalAmount || 0), 0);
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10"><h1 className="text-4xl font-black mb-2">Welcome back.</h1><p className="opacity-60 text-lg">Manage your global business from one high-performance dashboard.</p></div>
         <div className="absolute right-[-20px] bottom-[-20px] text-white/5 font-black text-[200px] leading-none pointer-events-none italic">WAVE</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title={t('pendingQuotes')} value={quotes.length} sub="Latest 30 days" bg="bg-blue-50" color="text-blue-700" />
        <StatCard title={t('totalRevenue')} value={`¥ ${(totalVal/10000).toFixed(2)}W`} sub={`${contracts.length} Contracts`} bg="bg-green-50" color="text-green-700" />
        <StatCard title={t('products')} value={products.length} sub="Active SKUs" bg="bg-orange-50" color="text-orange-700" />
        <StatCard title={t('customers')} value={customers.length} sub="International & Domestic" bg="bg-purple-50" color="text-purple-700" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-200">
          <div className="flex justify-between items-center mb-6"><h3 className="font-black text-slate-800 flex items-center"><FileText size={20} className="mr-2 text-blue-600"/>{t('quotes')}</h3><button onClick={onViewQuotes} className="text-xs font-bold text-blue-600 flex items-center">{t('viewAll')}<ArrowRight size={14} className="ml-1"/></button></div>
          <div className="space-y-3">{quotes.slice(0, 5).map((q: any) => (<div key={q.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all"><div className="flex flex-col"><span className="text-xs font-black text-slate-400">{q.number}</span><span className="text-sm font-bold text-slate-800">{q.customerSnapshot?.name}</span></div><span className="text-sm font-black text-blue-600">{q.currency} {q.total.toLocaleString()}</span></div>))}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200">
          <div className="flex justify-between items-center mb-6"><h3 className="font-black text-slate-800 flex items-center"><FileSignature size={20} className="mr-2 text-green-600"/>{t('contracts')}</h3><button onClick={onViewContracts} className="text-xs font-bold text-green-600 flex items-center">{t('viewAll')}<ArrowRight size={14} className="ml-1"/></button></div>
          <div className="space-y-3">{contracts.slice(0, 5).map((c: any) => (<div key={c.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all"><div className="flex flex-col"><span className="text-xs font-black text-slate-400">{c.contractNumber}</span><span className="text-sm font-bold text-slate-800">{c.customerSnapshot?.name}</span></div><span className="text-sm font-black text-green-700">¥ {c.totalAmount.toLocaleString()}</span></div>))}</div>
        </div>
      </div>
    </div>
  );
};

const QuotesList = ({ quotes, onEdit, onDelete, onNew, onExport, isGenerating, t }: any) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center"><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{t('quotes')}</h3><button onClick={onNew} className="bg-blue-600 text-white px-6 py-2 rounded-2xl flex items-center font-bold shadow-xl shadow-blue-600/20"><Plus size={20} className="mr-2"/>{t('newQuote')}</button></div>
    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-400 border-b">
          <tr><th className="p-5 text-left font-black uppercase text-[10px] tracking-widest">{t('number')}</th><th className="p-5 text-left font-black uppercase text-[10px] tracking-widest">Client</th><th className="p-5 text-right font-black uppercase text-[10px] tracking-widest">Total</th><th className="p-5 text-center font-black uppercase text-[10px] tracking-widest">Actions</th></tr>
        </thead>
        <tbody className="divide-y">
          {quotes.map((q: any) => (<tr key={q.id} className="hover:bg-blue-50/30 group transition-colors"><td className="p-5 font-black text-slate-800">{q.number}</td><td className="p-5 text-slate-600 font-medium">{q.customerSnapshot?.name}</td><td className="p-5 text-right font-black text-blue-600">{q.currency} {q.total.toLocaleString()}</td><td className="p-5 text-center"><div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => onExport(q, 'pdf')} disabled={isGenerating} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Download size={18}/></button><button onClick={() => onEdit(q)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18}/></button><button onClick={() => onDelete(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button></div></td></tr>))}
          {quotes.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-gray-400 font-bold">{t('noData')}</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

const ContractsList = ({ contracts, onEdit, onDelete, onNew, onExport, isGenerating, t }: any) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center"><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{t('contracts')}</h3><button onClick={onNew} className="bg-green-600 text-white px-6 py-2 rounded-2xl flex items-center font-bold shadow-xl shadow-green-600/20"><Plus size={20} className="mr-2"/>{t('new')} {t('contracts')}</button></div>
    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-400 border-b">
          <tr><th className="p-5 text-left font-black uppercase text-[10px] tracking-widest">NO.</th><th className="p-5 text-left font-black uppercase text-[10px] tracking-widest">Buyer</th><th className="p-5 text-right font-black uppercase text-[10px] tracking-widest">Amount</th><th className="p-5 text-center font-black uppercase text-[10px] tracking-widest">Actions</th></tr>
        </thead>
        <tbody className="divide-y">
          {contracts.map((c: any) => (<tr key={c.id} className="hover:bg-green-50/30 group transition-colors"><td className="p-5 font-black text-slate-800">{c.contractNumber}</td><td className="p-5 text-slate-600 font-medium">{c.customerSnapshot?.name}</td><td className="p-5 text-right font-black text-green-700">¥ {c.totalAmount.toLocaleString()}</td><td className="p-5 text-center"><div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => onExport(c, 'pdf')} disabled={isGenerating} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Download size={18}/></button><button onClick={() => onEdit(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18}/></button><button onClick={() => onDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button></div></td></tr>))}
          {contracts.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-gray-400 font-bold">{t('noData')}</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

const CustomersManager = ({ customers, onSave, onDelete, t }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [current, setCurrent] = useState<any>({});
    const handleSubmit = (e: any) => { e.preventDefault(); onSave({ ...current, id: current.id || generateId() }); setIsEditing(false); };
    return (
        <div className="space-y-6">
            {isEditing ? (
                <div className="bg-white p-8 rounded-3xl shadow-2xl border"><h3 className="font-black text-xl mb-6">{current.id ? t('edit') : t('new')} {t('customers')}</h3><form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="text-[10px] font-black uppercase text-gray-400">Region</label><select className="w-full p-3 border rounded-xl" value={current.region || 'International'} onChange={e => setCurrent({...current, region: e.target.value})}><option value="International">International</option><option value="Domestic">Domestic</option></select></div>
                  <div className="col-span-2"><label className="text-[10px] font-black uppercase text-gray-400">Company Name</label><input required className="w-full p-3 border rounded-xl font-bold" value={current.name || ''} onChange={e => setCurrent({...current, name: e.target.value})}/></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400">Contact</label><input className="w-full p-3 border rounded-xl" value={current.contactPerson || ''} onChange={e => setCurrent({...current, contactPerson: e.target.value})}/></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400">Phone</label><input className="w-full p-3 border rounded-xl" value={current.phone || ''} onChange={e => setCurrent({...current, phone: e.target.value})}/></div>
                  <div className="col-span-2"><label className="text-[10px] font-black uppercase text-gray-400">Address</label><input className="w-full p-3 border rounded-xl" value={current.address || ''} onChange={e => setCurrent({...current, address: e.target.value})}/></div>
                  {current.region === 'Domestic' && (
                    <div className="col-span-2 grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="col-span-2"><label className="text-[10px] font-black uppercase text-gray-400">Tax ID</label><input className="w-full p-3 border rounded-xl" value={current.taxId || ''} onChange={e => setCurrent({...current, taxId: e.target.value})}/></div>
                        <div><label className="text-[10px] font-black uppercase text-gray-400">Bank Name</label><input className="w-full p-3 border rounded-xl" value={current.bankName || ''} onChange={e => setCurrent({...current, bankName: e.target.value})}/></div>
                        <div><label className="text-[10px] font-black uppercase text-gray-400">A/C No.</label><input className="w-full p-3 border rounded-xl font-mono" value={current.bankAccount || ''} onChange={e => setCurrent({...current, bankAccount: e.target.value})}/></div>
                    </div>
                  )}
                  <div className="col-span-2 flex justify-end space-x-3 mt-8"><button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 text-gray-500 font-bold">{t('cancel')}</button><button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black shadow-xl shadow-blue-600/20">{t('save')}</button></div>
                </form></div>
            ) : (
                <><div className="flex justify-between items-center"><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{t('customers')}</h3><button onClick={() => { setCurrent({ region: 'International' }); setIsEditing(true); }} className="bg-blue-600 text-white px-6 py-2 rounded-2xl flex items-center font-bold shadow-xl shadow-blue-600/20"><Plus size={20} className="mr-2"/>{t('new')}</button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{customers.map((c: any) => (<div key={c.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative group hover:border-blue-300 transition-all"><span className={`absolute top-4 right-4 text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${c.region === 'Domestic' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{c.region}</span><h4 className="font-black text-slate-800 mb-1 pr-12 truncate">{c.name}</h4><p className="text-xs text-gray-500 mb-4">{c.contactPerson || 'No Contact'}</p><div className="pt-4 border-t flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] text-gray-400 font-mono">{c.phone || c.email}</span><div className="flex space-x-2"><button onClick={() => { setCurrent(c); setIsEditing(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16}/></button><button onClick={() => onDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button></div></div></div>))}</div></>
            )}
        </div>
    );
};
