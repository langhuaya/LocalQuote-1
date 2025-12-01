
import React, { useState } from 'react';
import { Brand, SupplierInfo, Currency } from '../types';
import { Plus, Edit, Trash2, Search, Truck, Check, Star, DollarSign } from 'lucide-react';
import { generateId } from '../services/api';

interface BrandsManagerProps {
  brands: Brand[];
  onSave: (brand: Brand) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

export const BrandsManager: React.FC<BrandsManagerProps> = ({ brands, onSave, onDelete, t }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Partial<Brand>>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingSuppliers, setEditingSuppliers] = useState<SupplierInfo[]>([]);

  const filtered = brands.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (b: Brand) => {
    setCurrentBrand(b);
    setEditingSuppliers(b.suppliers || []);
    setIsEditing(true);
  };

  const handleNew = () => {
    setCurrentBrand({ id: generateId() });
    setEditingSuppliers([]);
    setIsEditing(true);
  };

  const handleAddSupplier = () => {
    const newSupplier: SupplierInfo = {
        id: generateId(),
        name: '',
        cost: 0,
        currency: Currency.USD,
        hasStock: true,
        isDefault: editingSuppliers.length === 0, 
        reference: ''
    };
    setEditingSuppliers([...editingSuppliers, newSupplier]);
  };

  const handleUpdateSupplier = (id: string, field: keyof SupplierInfo, value: any) => {
    setEditingSuppliers(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleRemoveSupplier = (id: string) => {
    setEditingSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentBrand.name) {
      const finalBrand: Brand = {
        ...currentBrand as Brand,
        suppliers: editingSuppliers
      };
      onSave(finalBrand);
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {isEditing ? (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="font-bold text-xl text-gray-800 mb-6">{currentBrand.id ? t('edit') : t('new')} {t('brand')}</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('name')}</label>
                <input 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={currentBrand.name || ''} 
                  onChange={e => setCurrentBrand({...currentBrand, name: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('description')}</label>
                <textarea 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  rows={3}
                  value={currentBrand.description || ''} 
                  onChange={e => setCurrentBrand({...currentBrand, description: e.target.value})} 
                />
              </div>

              {/* Suppliers Section */}
              <div className="pt-4 border-t">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-orange-600 uppercase flex items-center">
                        <Truck size={16} className="mr-2" /> {t('suppliers')}
                    </h4>
                    <button type="button" onClick={handleAddSupplier} className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200 flex items-center">
                        <Plus size={14} className="mr-1" /> {t('addSupplier')}
                    </button>
                 </div>
                 
                 <div className="space-y-3">
                    {editingSuppliers.length === 0 && <p className="text-sm text-gray-400">{t('noData')}</p>}
                    {editingSuppliers.map((supplier, index) => (
                        <div key={supplier.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">Supplier #{index + 1}</span>
                                <button type="button" onClick={() => handleRemoveSupplier(supplier.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input 
                                    className="w-full p-2 border rounded text-sm"
                                    placeholder={t('name')}
                                    value={supplier.name}
                                    onChange={e => handleUpdateSupplier(supplier.id, 'name', e.target.value)}
                                />
                                <input 
                                    className="w-full p-2 border rounded text-sm"
                                    placeholder={t('supplierRef')}
                                    value={supplier.reference || ''}
                                    onChange={e => handleUpdateSupplier(supplier.id, 'reference', e.target.value)}
                                />
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
                        placeholder={t('search')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center shadow hover:bg-blue-700 transition w-full md:w-auto justify-center">
                    <Plus size={20} className="mr-2" /> {t('addBrand')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(brand => (
                    <div key={brand.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative group">
                        <div className="flex justify-between items-start">
                             <div>
                                <h4 className="font-bold text-lg text-gray-800">{brand.name}</h4>
                                <p className="text-xs text-gray-500 mt-1">{brand.suppliers?.length || 0} {t('suppliers')}</p>
                             </div>
                             <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(brand)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                                <button onClick={() => onDelete(brand.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                             </div>
                        </div>
                        {brand.description && (
                            <p className="text-sm text-gray-600 mt-3 line-clamp-2">{brand.description}</p>
                        )}
                        <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400 flex justify-between">
                            <span>Added: {brand.createdAt}</span>
                            <span>{brand.createdBy}</span>
                        </div>
                    </div>
                ))}
            </div>
             {filtered.length === 0 && <p className="text-center text-gray-400 py-10">{t('noData')}</p>}
        </>
      )}
    </div>
  );
}
