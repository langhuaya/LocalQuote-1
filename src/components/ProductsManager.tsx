
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Currency, SupplierInfo, CompanySettings, Brand } from '../types';
import { Search, Plus, Edit, Trash2, History, X, Truck, Tag, DollarSign, Image as ImageIcon, Check, Star, RefreshCw, ChevronLeft, ChevronRight, Filter, Download, Upload, Loader2 } from 'lucide-react';
import { generateId } from '../services/api';
import * as XLSX from 'xlsx';

interface ProductsManagerProps {
    products: Product[];
    brands?: Brand[]; 
    settings: CompanySettings;
    onSave: (product: Product) => void;
    onDelete: (id: string) => void;
    t: (key: string) => string;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({ products, brands = [], settings, onSave, onDelete, t }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [viewHistory, setViewHistory] = useState<Product | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // Pagination & Filter State
    const [itemsPerPage, setItemsPerPage] = useState(30);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBrand, setSelectedBrand] = useState('All');

    const [editingSuppliers, setEditingSuppliers] = useState<SupplierInfo[]>([]);
    
    // Import state
    const [isImporting, setIsImporting] = useState(false);

    // Derive units from settings or default to English standard units
    const unitsList = (settings.productUnits || 'PCS, SET, BOX, CTN, KG, M, ROLL, PACK, PAIR, UNIT').split(',').map(u => u.trim()).filter(Boolean);

    // Filtering Logic
    const filtered = useMemo(() => {
        return products.filter((p: Product) => {
            const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (p.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand;
            
            return matchesSearch && matchesBrand;
        });
    }, [products, searchTerm, selectedBrand]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedBrand, itemsPerPage]);

    // Pagination Logic
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedProducts = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleEdit = (p: Product) => {
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
        setCurrentProduct({ id: generateId(), currency: Currency.USD, unit: 'PCS', price: 0 });
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

    const handleSetDefaultSupplier = (id: string) => {
        setEditingSuppliers(prev => prev.map(s => ({ ...s, isDefault: s.id === id })));
    };

    const handleRemoveSupplier = (id: string) => {
        setEditingSuppliers(prev => {
            const newList = prev.filter(s => s.id !== id);
            if (prev.find(s => s.id === id)?.isDefault && newList.length > 0) {
                newList[0].isDefault = true;
            }
            return newList;
        });
    };

    const processFile = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCurrentProduct(prev => ({ ...prev, imageDataUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    // Paste listener for image
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (!isEditing) return;
            const items = e.clipboardData?.items;
            if (items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        if (file) {
                            e.preventDefault();
                            processFile(file);
                        }
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isEditing]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(currentProduct.sku) {
            const primary = editingSuppliers.find(s => s.isDefault) || editingSuppliers[0];
            const finalProduct: Product = {
                ...currentProduct as Product,
                name: currentProduct.name || '',
                suppliers: editingSuppliers,
                cost: primary ? primary.cost : 0,
                supplierName: primary ? primary.name : undefined,
                supplierReference: primary ? primary.reference : undefined
            };
            onSave(finalProduct);
            setIsEditing(false);
        } else {
            alert(t('skuRequired'));
        }
    };

    // --- Excel Import/Export Logic ---

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        
        // Group products by brand
        const grouped: Record<string, any[]> = {};
        
        // If no products, just create one empty sheet
        if (products.length === 0) {
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), "Sheet1");
        } else {
            products.forEach(p => {
                const brand = p.brand || 'Other';
                if (!grouped[brand]) grouped[brand] = [];
                
                // Flatten data structure for Excel
                // IMPORTANT: Excluding Image Data
                const primarySupplier = p.suppliers?.find(s => s.isDefault) || p.suppliers?.[0];
                
                const row = {
                    SKU: p.sku,
                    Name: p.name,
                    Brand: p.brand,
                    Unit: p.unit,
                    Price: p.price,
                    Currency: p.currency,
                    Description: p.description,
                    Note: p.note,
                    Supplier: primarySupplier?.name || p.supplierName,
                    Cost: primarySupplier?.cost || p.cost,
                    SupplierRef: primarySupplier?.reference || p.supplierReference
                };
                grouped[brand].push(row);
            });

            // Create a sheet for each brand
            Object.keys(grouped).sort().forEach(brand => {
                // Excel sheet names max 31 chars
                const safeName = brand.substring(0, 31).replace(/[:\\\/?*\[\]]/g, ""); 
                const ws = XLSX.utils.json_to_sheet(grouped[brand]);
                XLSX.utils.book_append_sheet(wb, ws, safeName || "Sheet1");
            });
        }

        XLSX.writeFile(wb, `Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsImporting(true);
        const reader = new FileReader();
        
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                
                const importedProducts: Product[] = [];
                
                // Iterate through all sheets
                wb.SheetNames.forEach(sheetName => {
                    const ws = wb.Sheets[sheetName];
                    const data = XLSX.utils.sheet_to_json(ws);
                    
                    data.forEach((row: any) => {
                        // Minimal validation: SKU is required
                        if (!row.SKU) return;
                        
                        // Map row back to Product structure
                        // Note: Using 'sheetName' as brand fallback if brand column empty is optional, 
                        // but user said labels are based on brand.
                        const brand = row.Brand || (sheetName === 'Other' || sheetName === 'Sheet1' ? '' : sheetName);
                        
                        const p: Product = {
                            id: generateId(), // New ID by default
                            sku: String(row.SKU).trim(),
                            name: row.Name || '',
                            brand: brand,
                            unit: row.Unit || 'PCS',
                            price: parseFloat(row.Price) || 0,
                            currency: row.Currency || 'USD',
                            description: row.Description || '',
                            note: row.Note || '',
                            // Supplier info
                            supplierName: row.Supplier,
                            supplierReference: row.SupplierRef,
                            cost: parseFloat(row.Cost) || 0,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };

                        // Construct default supplier info
                        if (p.supplierName || p.cost) {
                            p.suppliers = [{
                                id: generateId(),
                                name: p.supplierName || 'Unknown',
                                cost: p.cost || 0,
                                currency: p.currency, // Defaulting to same currency
                                reference: p.supplierReference,
                                hasStock: true,
                                isDefault: true
                            }];
                        }
                        
                        importedProducts.push(p);
                    });
                });

                if (importedProducts.length > 0) {
                    if (confirm(`Found ${importedProducts.length} items. Import now? \n(Existing SKUs will be updated, Images preserved if exists)`)) {
                         // Process Import
                         // We need to check if SKU exists to preserve ID and Images
                         for (const newP of importedProducts) {
                             const existing = products.find(ex => ex.sku === newP.sku);
                             if (existing) {
                                 // Preserve ID and Image
                                 newP.id = existing.id;
                                 newP.imageDataUrl = existing.imageDataUrl;
                                 newP.createdAt = existing.createdAt;
                                 // Update price history if changed (handled by backend usually, but here we just send data)
                             }
                             // Call save for each (Parent component handles the API call)
                             // Note: This might spam the server if list is huge. 
                             // Ideally backend has a bulk import, but for this app structure we reuse onSave.
                             onSave(newP);
                         }
                         alert(t('importSuccess'));
                    }
                } else {
                    alert('No valid data found (SKU column is required).');
                }
            } catch (err) {
                console.error("Import error", err);
                alert("Failed to parse Excel file.");
            } finally {
                setIsImporting(false);
                // Reset file input
                e.target.value = '';
            }
        };
        
        reader.readAsBinaryString(file);
    };

    const getRate = (curr: string) => {
        if (curr === 'USD') return 1;
        return settings.exchangeRates?.[curr] || 1;
    };

    const calculateMargin = () => {
        const price = currentProduct.price || 0;
        const prodCurrency = currentProduct.currency || 'USD';
        const defaultSupplier = editingSuppliers.find(s => s.isDefault) || editingSuppliers[0];
        if (!defaultSupplier) return 0;
        const cost = defaultSupplier.cost || 0;
        const suppCurrency = defaultSupplier.currency;
        if (price === 0) return 0;
        let finalCostInProdCurrency = cost;
        if (prodCurrency !== suppCurrency) {
            const costInUSD = cost / getRate(suppCurrency);
            finalCostInProdCurrency = costInUSD * getRate(prodCurrency);
        }
        return ((price - finalCostInProdCurrency) / price) * 100;
    };
    
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
    const safeMargin = isFinite(margin) ? margin : 0;
    const marginColor = safeMargin < 10 ? 'text-red-600 bg-red-50' : safeMargin < 30 ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50';

    return (
        <div className="space-y-6">
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
                                         <th className="p-3 text-left">{t('date')}</th>
                                         <th className="p-3 text-left">{t('suppliers')}</th>
                                         <th className="p-3 text-right">{t('cost')}</th>
                                         <th className="p-3 text-right">{t('price')}</th>
                                         <th className="p-3 text-right">User</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y">
                                     {(!viewHistory.priceHistory || viewHistory.priceHistory.length === 0) ? (
                                         <tr><td colSpan={5} className="p-4 text-center text-gray-400">{t('noData')}</td></tr>
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
                     </div>
                 </div>
             )}

             {isEditing ? (
                 <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-gray-800">{currentProduct.id ? t('edit') : t('new')} {t('products')}</h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center ${marginColor}`}>
                             <span className="mr-1">{t('margin')}:</span>
                             {safeMargin.toFixed(1)}%
                        </div>
                     </div>
                     
                     <form onSubmit={handleSubmit} className="space-y-6">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                                        <input list="units" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={currentProduct.unit || ''} onChange={e => setCurrentProduct({...currentProduct, unit: e.target.value})} placeholder="e.g. PCS" />
                                        <datalist id="units">{unitsList.map(u => <option key={u} value={u} />)}</datalist>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('brand')}</label>
                                    <input list="brand-list" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={currentProduct.brand || ''} onChange={e => setCurrentProduct({...currentProduct, brand: e.target.value})} />
                                    <datalist id="brand-list">{brands.map(b => <option key={b.id} value={b.name} />)}</datalist>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('name')}</label>
                                    <input className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={currentProduct.name || ''} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} />
                                </div>
                                
                                {/* Product Image Upload - Drag & Drop Enhanced */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('productImage')}</label>
                                    <div className="flex items-start space-x-4">
                                        {currentProduct.imageDataUrl ? (
                                            <div className="relative group">
                                                <img src={currentProduct.imageDataUrl} alt="Product" className="w-24 h-24 object-contain border rounded p-1 bg-white" />
                                                <button 
                                                    type="button"
                                                    onClick={() => setCurrentProduct({...currentProduct, imageDataUrl: undefined})}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div 
                                                className={`w-24 h-24 border-2 border-dashed rounded flex flex-col items-center justify-center text-gray-400 bg-gray-50 transition-colors
                                                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                                                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                                onDragLeave={() => setIsDragging(false)}
                                                onDrop={handleDrop}
                                            >
                                                <ImageIcon size={24} className="mb-1"/>
                                                <span className="text-[10px]">Drop / Paste</span>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <label className="block">
                                                <span className="sr-only">Choose file</span>
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                            </label>
                                            <p className="text-xs text-gray-400 mt-2">
                                                Supported: Drag & drop, Ctrl+V (Paste), or Click to Browse. 
                                                <br/>Recommended: Square image, max 1MB.
                                            </p>
                                        </div>
                                    </div>
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
                                        <p className="text-center text-gray-400 text-sm py-4">{t('noData')}</p>
                                    )}
                                    {editingSuppliers.map((supplier, index) => (
                                        <div key={supplier.id} className={`p-4 rounded-lg border-2 relative transition-all ${supplier.isDefault ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-gray-50'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center">
                                                    {supplier.isDefault && <Star size={14} className="text-orange-500 mr-1 fill-orange-500" />}
                                                    <span className="text-xs font-bold text-gray-500 uppercase">Channel #{index + 1}</span>
                                                </div>
                                                <div className="flex space-x-2">
                                                    {!supplier.isDefault && (
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleSetDefaultSupplier(supplier.id)}
                                                            className="text-xs text-gray-500 hover:text-orange-600 flex items-center"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                    )}
                                                    <button type="button" onClick={() => handleRemoveSupplier(supplier.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <input className="w-full p-2 border rounded text-sm" placeholder={t('channelName')} value={supplier.name} onChange={e => handleUpdateSupplier(supplier.id, 'name', e.target.value)}/>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="relative">
                                                        <input type="number" step="0.01" className="w-full pl-6 p-2 border rounded text-sm font-mono" placeholder={t('cost')} value={supplier.cost} onChange={e => handleUpdateSupplier(supplier.id, 'cost', parseFloat(e.target.value))}/>
                                                        <DollarSign size={12} className="absolute left-2 top-3 text-gray-400" />
                                                    </div>
                                                    <select className="w-full p-2 border rounded text-sm bg-white" value={supplier.currency} onChange={e => handleUpdateSupplier(supplier.id, 'currency', e.target.value)}>
                                                        {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                
                                                {supplier.currency !== (currentProduct.currency || 'USD') && supplier.isDefault && (
                                                    <div className="flex items-center text-xs text-gray-500 bg-white p-1 rounded border border-gray-100">
                                                        <RefreshCw size={12} className="mr-1" /> 
                                                        Converted: <span className="font-bold ml-1">{getConvertedCostDisplay()}</span>
                                                    </div>
                                                )}

                                                <input className="w-full p-2 border rounded text-sm" placeholder={t('supplierRef')} value={supplier.reference || ''} onChange={e => handleUpdateSupplier(supplier.id, 'reference', e.target.value)}/>

                                                <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded border border-gray-200">
                                                    <input type="checkbox" className="rounded text-orange-600 focus:ring-orange-500" checked={supplier.hasStock} onChange={e => handleUpdateSupplier(supplier.id, 'hasStock', e.target.checked)}/>
                                                    <span className={`text-xs font-bold ${supplier.hasStock ? 'text-green-600' : 'text-red-500'}`}>{supplier.hasStock ? t('hasStock') : t('noStock')}</span>
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
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                         <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                            <div className="relative flex-grow md:w-80">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input 
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                                    placeholder={t('search')} 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="relative min-w-[180px]">
                                <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <select 
                                    className="w-full pl-10 pr-8 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white appearance-none cursor-pointer"
                                    value={selectedBrand}
                                    onChange={(e) => setSelectedBrand(e.target.value)}
                                >
                                    <option value="All">All Brands</option>
                                    {brands.map(b => (
                                        <option key={b.id} value={b.name}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 w-full xl:w-auto overflow-x-auto">
                            <label className={`bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center shadow-sm cursor-pointer hover:bg-gray-50 transition w-full xl:w-auto justify-center text-sm font-medium whitespace-nowrap ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isImporting ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Upload size={18} className="mr-2" />}
                                {isImporting ? t('processing') : t('importExcel')}
                                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} disabled={isImporting} />
                            </label>
                            
                            <button onClick={handleExportExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center shadow hover:bg-green-700 transition w-full xl:w-auto justify-center text-sm font-medium whitespace-nowrap">
                                <Download size={18} className="mr-2" /> {t('exportExcel')}
                            </button>

                            <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center shadow hover:bg-blue-700 transition w-full xl:w-auto justify-center text-sm font-medium whitespace-nowrap">
                                <Plus size={18} className="mr-2" /> {t('new')}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-left">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase w-16">Img</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('sku')}</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('name')}</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">{t('brand')}</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase w-32 text-right">{t('price')}</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">{t('suppliers')}</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">{t('entryTime')}</th>
                                        <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedProducts.map((p: Product) => (
                                        <tr key={p.id} className="hover:bg-gray-50 group transition-colors">
                                            <td className="p-4 align-top">
                                                {p.imageDataUrl ? (
                                                    <img src={p.imageDataUrl} alt="Product" className="w-10 h-10 object-contain border rounded bg-white" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-300">
                                                        <ImageIcon size={16} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 font-bold text-gray-700 align-top">{p.sku}</td>
                                            <td className="p-4 align-top">
                                                <div className="font-medium text-gray-800">{p.name || '-'}</div>
                                                <div className="text-xs text-gray-400">{p.unit}</div>
                                            </td>
                                            <td className="p-4 align-top text-sm text-gray-600">{p.brand || '-'}</td>
                                            {/* Optimized Price Display: Separated Currency and Amount */}
                                            <td className="p-4 align-top text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-gray-400 font-semibold mb-0.5">{p.currency}</span>
                                                    <span className="font-mono text-blue-700 font-bold text-base leading-none">
                                                        {Number(p.price || 0).toFixed(2)}
                                                    </span>
                                                </div>
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
                                                        {p.suppliers.length > 2 && <div className="text-[10px] text-gray-400 pl-4">+{p.suppliers.length - 2} more...</div>}
                                                    </div>
                                                ) : <span className="text-gray-300 text-xs">-</span>}
                                            </td>
                                            <td className="p-4 hidden md:table-cell align-top">
                                                <span className="text-xs text-gray-500 whitespace-nowrap">{p.createdAt || '-'}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <button onClick={() => setViewHistory(p)} className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors"><History size={18} /></button>
                                                    <button onClick={() => handleEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit size={18} /></button>
                                                    <button onClick={() => onDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedProducts.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-400">{t('noData')}</td></tr>}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {filtered.length > 0 && (
                            <div className="bg-gray-50 border-t p-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
                                <div className="text-gray-500">
                                    Showing <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-bold">{filtered.length}</span> results
                                </div>
                                
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-500">Rows per page:</span>
                                        <select 
                                            className="border rounded p-1 bg-white outline-none focus:ring-1 focus:ring-blue-500"
                                            value={itemsPerPage}
                                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                        >
                                            <option value={30}>30</option>
                                            <option value={40}>40</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>

                                    <div className="flex space-x-1">
                                        <button 
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <div className="flex items-center px-2 font-medium text-gray-700">
                                            {currentPage} / {totalPages}
                                        </div>
                                        <button 
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
             )}
        </div>
    );
};