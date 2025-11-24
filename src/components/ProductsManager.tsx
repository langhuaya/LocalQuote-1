

import React, { useState } from 'react';
import { Product, Currency, SupplierInfo, CompanySettings, Brand } from '../types';
import { Search, Plus, Edit, Trash2, History, X, Truck, Tag, DollarSign, ExternalLink, Star, Check, RefreshCw, FileText } from 'lucide-react';
import { generateId } from '../services/api';

interface ProductsManagerProps {
    products: Product[];
    brands?: Brand[]; // Optional to avoid breaking legacy usage
    settings: CompanySettings;
    onSave: (product: Product) => void;
    onDelete: (id: string) => void;
    t: (key: string) => string;
}

const PREDEFINED_UNITS = [
  'pcs (个)', 
  'set (套)', 
  'unit (台)', 
  'box (盒)', 
  'kg (公斤)', 
  'm (米)',
  'pair (双)',
  'roll (卷)',
  'pack (包)'
];

export const ProductsManager: React.FC<ProductsManagerProps> = ({ products, brands = [], settings, onSave, onDelete, t }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [viewHistory, setViewHistory] = useState<Product | null>(null);

    // Local state for editing suppliers in the modal
    const [editingSuppliers, setEditingSuppliers] = useState<SupplierInfo[]>([]);

    const filtered = products.filter((p: Product) => 
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (p: Product) => {
        // Migration: If no suppliers array, create one from legacy fields
        let suppliersList = p.suppliers || [];
        if (suppliersList.length === 0 && (p.cost || p.supplierName)) {
            suppliersList = [{
                id: generateId(),
                name: p.supplierName || 'Unknown',
                reference: p.supplierReference || '',
                cost: p.cost || 0,
                currency: Currency.USD,
                hasStock: true,
                isDefault: true
            }];
        }
        
        setEditingSuppliers([...suppliersList]);
        setCurrentProduct(p);
        setIsEditing(true);
    };

    const handleNew = () => {
        setEditingSuppliers([]);
        setCurrentProduct({ id: generateId(), currency: Currency.USD, unit: 'pcs (个)', price: 0 });
        setIsEditing(true);
    };

    const handleAddSupplier = () => {
        const newSupplier: SupplierInfo = {
            id: generateId(),
            name: '',
            cost: 0,
            currency: Currency.USD,
            hasStock: true,
            isDefault: editingSuppliers.length === 0, // First one is default
            reference: ''
        };
        setEditingSuppliers([...editingSuppliers, newSupplier]);
    };

    const handleUpdateSupplier = (id: string, field: keyof SupplierInfo, value: any) => {
        setEditingSuppliers(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleSetDefaultSupplier = (id: string) => {
        setEditingSuppliers(prev => prev.map(s => ({ ...s, isDefault: s.id === id })));
    };

    const handleRemoveSupplier = (id: string) => {
        setEditingSuppliers(prev => {
            const newList = prev.filter(s => s.id !== id);
            // If we deleted the default, make the first one default
            if (prev.find(s => s.id === id)?.isDefault && newList.length > 0) {
                newList[0].isDefault = true;
            }
            return newList;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validation: Only SKU is strictly required
        if(currentProduct.sku) {
            // Determine primary supplier stats
            const primary = editingSuppliers.find(s => s.isDefault) || editingSuppliers[0];
            
            const finalProduct: Product = {
                ...currentProduct as Product,
                name: currentProduct.name || '', // Ensure string
                suppliers: editingSuppliers,
                // Update derived fields for compatibility
                cost: primary ? primary.cost : 0,
                supplierName: primary ? primary.name : undefined,
                supplierReference: primary ? primary.reference : undefined
            };

            onSave(finalProduct);
            setIsEditing(false);
        } else {
            alert(t('skuRequired') || 'SKU is required');
        }
    };

    // Helper: Get exchange rate relative to USD
    const getRate = (curr: string) => {
        if (curr === 'USD') return 1;
        return settings.exchangeRates?.[curr] || 1;
    };

    // Margin Calculation with Currency Conversion
    const calculateMargin = () => {
        const price = currentProduct.price || 0;
        const prodCurrency = currentProduct.currency || 'USD';
        
        // Use the default supplier from editing state
        const defaultSupplier = editingSuppliers.find(s => s.isDefault) || editingSuppliers[0];
        
        if (!defaultSupplier) return 0;
        
        const cost = defaultSupplier.cost || 0;
        const suppCurrency = defaultSupplier.currency;

        if (price === 0) return 0;

        let finalCostInProdCurrency = cost;

        // Perform conversion if currencies differ
        if (prodCurrency !== suppCurrency) {
            // 1. Convert Supplier Cost to USD (Base)
            // If Supplier is CNY (7.2), Cost USD = Cost CNY / 7.2
            const costInUSD = cost / getRate(suppCurrency);
            
            // 2. Convert USD Cost to Product Currency
            // If Product is EUR (0.92), Cost EUR = Cost USD * 0.92
            finalCostInProdCurrency = costInUSD * getRate(prodCurrency);
        }

        return ((price - finalCostInProdCurrency) / price) * 100;
    };
    
    // Helper to display converted cost
    const getConvertedCostDisplay = () => {
        const prodCurrency = currentProduct.currency || 'USD';
        const defaultSupplier = editingSuppliers.find(s => s.isDefault) || editingSuppliers[0];
        
        if (!defaultSupplier || defaultSupplier.currency === prodCurrency) return null;
        
        const cost = defaultSupplier.cost || 0;
        const suppCurrency = defaultSupplier.currency;
        
        const costInUSD = cost / getRate(suppCurrency);
        const finalCost = costInUSD * getRate(prodCurrency);
        
        return `≈ ${finalCost.toFixed(2)} ${prodCurrency}`;
    }

    const margin = calculateMargin();
    // Safety check for NaN or infinite margin
    const safeMargin = isFinite(margin) ? margin : 0;
    const marginColor = safeMargin < 10 ? 'text-red-600 bg-red-50' : safeMargin < 30 ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50';

    return (
        <div className="space-y-6">
             {/* History Modal */}
             {viewHistory && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                     <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
                         <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                             <div>
                                 <h3 className="font-bold text-gray-800">{viewHistory.sku} History</h3>
                                 <p className="text-xs text-gray-500">{viewHistory.name}</p>
                             </div>
                             <button onClick={() => setViewHistory(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                         </div>
                         <div className="p-0 max-h-[60vh] overflow-y-auto">
                             <table className="w-full text-sm">
                                 <thead className="bg-gray-100 text-gray-600 sticky top-0">
                                     <tr>
                                         <th className="p-3 text-left">Date</th>
                                         <th className="p-3 text-left">Supplier Info</th>
                                         <th className="p-3 text-right">Cost</th>
                                         <th className="p-3 text-right">Sales Price</th>
                                         <th className="p-3 text-right">User</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y">
                                     {(!viewHistory.priceHistory || viewHistory.priceHistory.length === 0) ? (
                                         <tr><td colSpan={5} className="p-4 text-center text-gray-400">No history available</td></tr>
                                     ) : (
                                         viewHistory.priceHistory.map((h, i) => (
                                             <tr key={i} className="hover:bg-gray-50">
                                                 <td className="p-3 text-gray-600 whitespace-nowrap">{h.date}</td>
                                                 <td className="p-3 text-gray-800 font-medium">{h.supplier || '-'}</td>
                                                 <td className="p-3 text-right text-gray-500 font-mono">{(h.cost !== undefined && h.cost !== null) ? Number(h.cost).toFixed(2) : '-'}</td>
                                                 <td className="p-3 text-right font-mono font-bold">{Number(h.price || 0).toFixed(2)}</td>
                                                 <td className="p-3 text-right text-gray-500 text-xs italic">{h.updatedBy}</td>
                                             </tr>
                                         ))
                                     )}
                                 </tbody>
                             </table>
                         </div>
                         <div className="p-3 bg-gray-50 border-t flex justify-between items-center text-xs text-gray-600">
                             <span>Current Primary Supplier: <strong>{viewHistory.supplierName || 'N/A'}</strong></span>
                         </div>
                     </div>
                 </div>
             )}

             {isEditing ? (
                 <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-gray-800">{currentProduct.id ? t('edit') : t('addProduct')}</h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center ${marginColor}`}>
                             <span className="mr-1">{t('margin')}:</span>
                             {safeMargin.toFixed(1)}%
                        </div>
                     </div>
                     
                     <form onSubmit={handleSubmit} className="space-y-6">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Left Column: Sales Info */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-blue-600 uppercase flex items-center border-b pb-2">
                                    <Tag size={16} className="mr-2" /> {t('salesInfo')}
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('sku')} <span className="text-red-500">*</span></label>
                                        <input required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={currentProduct.sku || ''} onChange={e => setCurrentProduct({...currentProduct, sku: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('unit')}</label>
                                        <input 
                                            list="units" 
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                            value={currentProduct.unit || ''} 
                                            onChange={e => setCurrentProduct({...currentProduct, unit: e.target.value})} 
                                            placeholder="Select or type..."
                                        />
                                        <datalist id="units">
                                            {PREDEFINED_UNITS.map(u => <option key={u} value={u} />)}
                                        </datalist>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('brand')}</label>
                                    <input 
                                        list="brand-list"
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={currentProduct.brand || ''} 
                                        onChange={e => setCurrentProduct({...currentProduct, brand: e.target.value})} 
                                        placeholder="Select or type brand..."
                                    />
                                    <datalist id="brand-list">
                                        {brands.map(b => (
                                            <option key={b.id} value={b.name} />
                                        ))}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('name')}</label>
                                    <input className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={currentProduct.name || ''} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('price')}</label>
                                        <div className="relative">
                                            <input type="number" step="0.01" className="w-full pl-8 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={currentProduct.price || ''} onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})} />
                                            <DollarSign size={14} className="absolute left-2.5 top-3 text-gray-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('currency')}</label>
                                        <select className="w-full p-2 border rounded bg-gray-50" value={currentProduct.currency || Currency.USD} onChange={e => setCurrentProduct({...currentProduct, currency: e.target.value as Currency})}>
                                            {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('desc')}</label>
                                    <textarea className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" rows={3} value={currentProduct.description || ''} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('note')}</label>
                                    <textarea className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-yellow-50" rows={2} value={currentProduct.note || ''} onChange={e => setCurrentProduct({...currentProduct, note: e.target.value})} placeholder="Internal remarks..." />
                                </div>
                            </div>

                            {/* Right Column: Sourcing Info (Multi-Supplier) */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <h4 className="text-sm font-bold text-orange-600 uppercase flex items-center">
                                        <Truck size={16} className="mr-2" /> {t('suppliers')}
                                    </h4>
                                    <button type="button" onClick={handleAddSupplier} className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200 flex items-center">
                                        <Plus size={14} className="mr-1" /> {t('addSupplier')}
                                    </button>
                                </div>
                                
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {editingSuppliers.length === 0 && (
                                        <p className="text-center text-gray-400 text-sm py-4">No suppliers added yet.</p>
                                    )}
                                    {editingSuppliers.map((supplier, index) => (
                                        <div key={supplier.id} className={`p-4 rounded-lg border-2 relative transition-all ${supplier.isDefault ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-gray-50'}`}>
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center">
                                                    {supplier.isDefault && <Star size={14} className="text-orange-500 mr-1 fill-orange-500" />}
                                                    <span className="text-xs font-bold text-gray-500 uppercase">Supplier #{index + 1}</span>
                                                </div>
                                                <div className="flex space-x-2">
                                                    {!supplier.isDefault && (
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleSetDefaultSupplier(supplier.id)}
                                                            className="text-xs text-gray-500 hover:text-orange-600 flex items-center"
                                                            title={t('setDefault')}
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                    )}
                                                    <button type="button" onClick={() => handleRemoveSupplier(supplier.id)} className="text-gray-400 hover:text-red-500">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="space-y-3">
                                                <input 
                                                    className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                    placeholder={t('supplier')}
                                                    value={supplier.name}
                                                    onChange={e => handleUpdateSupplier(supplier.id, 'name', e.target.value)}
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="relative">
                                                        <input 
                                                            type="number" 
                                                            step="0.01" 
                                                            className="w-full pl-6 p-2 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                            placeholder={t('cost')}
                                                            value={supplier.cost}
                                                            onChange={e => handleUpdateSupplier(supplier.id, 'cost', parseFloat(e.target.value))}
                                                        />
                                                        <DollarSign size={12} className="absolute left-2 top-3 text-gray-400" />
                                                    </div>
                                                    <select 
                                                        className="w-full p-2 border rounded text-sm bg-white"
                                                        value={supplier.currency}
                                                        onChange={e => handleUpdateSupplier(supplier.id, 'currency', e.target.value)}
                                                    >
                                                        {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                
                                                {/* Auto Conversion Display */}
                                                {supplier.currency !== (currentProduct.currency || 'USD') && supplier.isDefault && (
                                                    <div className="flex items-center text-xs text-gray-500 bg-white p-1 rounded border border-gray-100">
                                                        <RefreshCw size={12} className="mr-1" /> 
                                                        Converted Cost: <span className="font-bold ml-1">{getConvertedCostDisplay()}</span>
                                                    </div>
                                                )}

                                                <input 
                                                    className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                    placeholder={t('supplierRef')}
                                                    value={supplier.reference || ''}
                                                    onChange={e => handleUpdateSupplier(supplier.id, 'reference', e.target.value)}
                                                />

                                                <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded border border-gray-200">
                                                    <input 
                                                        type="checkbox" 
                                                        className="rounded text-orange-600 focus:ring-orange-500"
                                                        checked={supplier.hasStock}
                                                        onChange={e => handleUpdateSupplier(supplier.id, 'hasStock', e.target.checked)}
                                                    />
                                                    <span className={`text-xs font-bold ${supplier.hasStock ? 'text-green-600' : 'text-red-500'}`}>
                                                        {supplier.hasStock ? t('hasStock') : t('noStock')}
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         </div>
                         
                         <div className="flex justify-end space-x-3 pt-4 border-t">
                             <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">{t('cancel')}</button>
                             <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 font-bold">{t('save')}</button>
                         </div>
                     </form>
                 </div>
             ) : (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                         <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input 
                                className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                placeholder={`${t('search')} (Name, SKU, Brand)`}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center shadow hover:bg-blue-700 transition w-full md:w-auto justify-center">
                            <Plus size={20} className="mr-2" /> {t('addProduct')}
                        </button>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-left">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('sku')}</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('name')}</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('brand')}</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase w-32">{t('price')}</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">{t('suppliers')}</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Entry Time</th>
                                        <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map((p: Product) => (
                                        <tr key={p.id} className="hover:bg-gray-50 group transition-colors">
                                            <td className="p-4 font-bold text-gray-700 align-top">{p.sku}</td>
                                            <td className="p-4 align-top">
                                                <div className="font-medium text-gray-800">{p.name || '-'}</div>
                                                <div className="text-xs text-gray-400">{p.unit}</div>
                                            </td>
                                            <td className="p-4 align-top text-sm text-gray-600">{p.brand || '-'}</td>
                                            <td className="p-4 align-top">
                                                <div className="font-mono text-blue-700 font-bold">{p.currency} {Number(p.price || 0).toFixed(2)}</div>
                                                {(p.cost !== undefined && p.cost !== null) && (
                                                    <div className="text-[10px] text-gray-400 mt-1">Cost: {Number(p.cost).toFixed(2)}</div>
                                                )}
                                            </td>
                                            <td className="p-4 hidden md:table-cell align-top">
                                                {p.suppliers && p.suppliers.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {p.suppliers.slice(0, 2).map(s => (
                                                            <div key={s.id} className="flex items-center text-xs">
                                                                <span className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${s.hasStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                                <span className={`${s.isDefault ? 'font-bold text-gray-800' : 'text-gray-500'} truncate max-w-[150px]`}>{s.name}</span>
                                                                {s.isDefault && <Star size={10} className="ml-1 text-orange-500 fill-orange-500" />}
                                                            </div>
                                                        ))}
                                                        {p.suppliers.length > 2 && (
                                                            <div className="text-[10px] text-gray-400 pl-4">+{p.suppliers.length - 2} more...</div>
                                                        )}
                                                    </div>
                                                ) : p.supplierName ? (
                                                     // Legacy display
                                                    <div className="text-sm text-gray-700 font-medium truncate max-w-[150px]">{p.supplierName}</div>
                                                ) : (
                                                    <span className="text-gray-300 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 hidden md:table-cell align-top">
                                                <span className="text-xs text-gray-500 whitespace-nowrap">{p.createdAt || '-'}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <button onClick={() => setViewHistory(p)} className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors" title="View History">
                                                        <History size={18} />
                                                    </button>
                                                    <button onClick={() => handleEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                                        <Edit size={18} />
                                                    </button>
                                                    <button onClick={() => onDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                                {p.updatedBy && (
                                                    <div className="mt-2 text-[10px] text-gray-300">Last: {p.updatedAt}</div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">{t('noQuotes')}</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
             )}
        </div>
    );
};