import React, { useState } from 'react';
import { Product, Currency } from '../types';
import { Search, Plus, Edit, Trash2, History, X } from 'lucide-react';
import { generateId } from '../services/api';

interface ProductsManagerProps {
    products: Product[];
    onSave: (product: Product) => void;
    onDelete: (id: string) => void;
    t: (key: string) => string;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({ products, onSave, onDelete, t }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [viewHistory, setViewHistory] = useState<Product | null>(null);

    const filtered = products.filter((p: Product) => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (p: Product) => {
        setCurrentProduct(p);
        setIsEditing(true);
    };

    const handleNew = () => {
        setCurrentProduct({ id: generateId(), currency: Currency.USD, unit: 'pcs' });
        setIsEditing(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(currentProduct.sku && currentProduct.name) {
            onSave(currentProduct as Product);
            setIsEditing(false);
        }
    };

    return (
        <div className="space-y-6">
             {/* History Modal */}
             {viewHistory && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                     <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
                         <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                             <div>
                                 <h3 className="font-bold text-gray-800">{viewHistory.sku} Price History</h3>
                                 <p className="text-xs text-gray-500">{viewHistory.name}</p>
                             </div>
                             <button onClick={() => setViewHistory(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                         </div>
                         <div className="p-0 max-h-[60vh] overflow-y-auto">
                             <table className="w-full text-sm">
                                 <thead className="bg-gray-100 text-gray-600 sticky top-0">
                                     <tr>
                                         <th className="p-3 text-left">Date</th>
                                         <th className="p-3 text-right">Old Price</th>
                                         <th className="p-3 text-right">Updated By</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y">
                                     {(!viewHistory.priceHistory || viewHistory.priceHistory.length === 0) ? (
                                         <tr><td colSpan={3} className="p-4 text-center text-gray-400">No history available</td></tr>
                                     ) : (
                                         viewHistory.priceHistory.map((h, i) => (
                                             <tr key={i} className="hover:bg-gray-50">
                                                 <td className="p-3 text-gray-600">{h.date}</td>
                                                 <td className="p-3 text-right font-mono">{h.price.toFixed(2)}</td>
                                                 <td className="p-3 text-right text-gray-500 italic">{h.updatedBy}</td>
                                             </tr>
                                         ))
                                     )}
                                 </tbody>
                             </table>
                         </div>
                         <div className="p-3 bg-gray-50 border-t text-xs text-gray-500 text-center">
                             Current Price: <strong>{viewHistory.price.toFixed(2)}</strong> (Updated by {viewHistory.updatedBy || 'Unknown'})
                         </div>
                     </div>
                 </div>
             )}

             {isEditing ? (
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                     <h3 className="font-bold text-lg mb-4">{currentProduct.id ? t('edit') : t('addProduct')}</h3>
                     <form onSubmit={handleSubmit} className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('sku')}</label>
                                <input required className="w-full p-2 border rounded" value={currentProduct.sku || ''} onChange={e => setCurrentProduct({...currentProduct, sku: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('name')}</label>
                                <input required className="w-full p-2 border rounded" value={currentProduct.name || ''} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('price')} ({currentProduct.currency})</label>
                                <input type="number" step="0.01" required className="w-full p-2 border rounded" value={currentProduct.price || ''} onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})} />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('cost')}</label>
                                <input type="number" step="0.01" className="w-full p-2 border rounded" value={currentProduct.cost || ''} onChange={e => setCurrentProduct({...currentProduct, cost: parseFloat(e.target.value)})} />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('unit')}</label>
                                <input className="w-full p-2 border rounded" value={currentProduct.unit || ''} onChange={e => setCurrentProduct({...currentProduct, unit: e.target.value})} />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t('currency')}</label>
                                <select className="w-full p-2 border rounded" value={currentProduct.currency || Currency.USD} onChange={e => setCurrentProduct({...currentProduct, currency: e.target.value as Currency})}>
                                    {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">{t('desc')}</label>
                            <textarea className="w-full p-2 border rounded" rows={3} value={currentProduct.description || ''} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} />
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
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('price')}</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Updated By</th>
                                        <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map((p: Product) => (
                                        <tr key={p.id} className="hover:bg-gray-50 group">
                                            <td className="p-4 font-bold text-gray-700">{p.sku}</td>
                                            <td className="p-4">
                                                <div className="font-medium text-gray-800">{p.name}</div>
                                                <div className="text-xs text-gray-400">{p.unit}</div>
                                            </td>
                                            <td className="p-4 font-mono text-blue-700 font-bold">{p.currency} {p.price.toFixed(2)}</td>
                                            <td className="p-4">
                                                {p.updatedBy && (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-600">{p.updatedBy}</span>
                                                        <span className="text-[10px] text-gray-400">{p.updatedAt}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-right flex justify-end space-x-2">
                                                <button onClick={() => setViewHistory(p)} className="p-2 text-gray-500 hover:bg-gray-100 rounded" title="View Price History"><History size={18} /></button>
                                                <button onClick={() => handleEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={18} /></button>
                                                <button onClick={() => onDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">{t('noQuotes')}</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
             )}
        </div>
    );
};