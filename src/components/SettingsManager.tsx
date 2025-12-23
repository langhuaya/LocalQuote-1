
import React, { useState } from 'react';
import { CompanySettings } from '../types';
import { Coins } from 'lucide-react';

interface SettingsManagerProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
  t: (key: string) => string;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ settings, onSave, t }) => {
    // SAFETY: Ensure domestic object exists before rendering to prevent white screen on legacy data
    const safeSettings = {
        ...settings,
        domestic: settings.domestic || {
             name: '', address: '', contact: '', phone: '', fax: '',
             taxId: '', bankName: '', bankAccount: '', stampDataUrl: '',
             contractTerms: '', contractPrefix: 'ULHTZH'
        }
    };

    const [data, setData] = useState<CompanySettings>(safeSettings);
    const [tab, setTab] = useState<'intl' | 'domestic'>('intl');

    const handleChange = (field: string, val: string) => setData({...data, [field]: val});
    
    // Nested update for domestic
    const handleDomesticChange = (field: keyof typeof data.domestic, val: string) => {
        setData({ ...data, domestic: { ...data.domestic, [field]: val }});
    };

    const handleImage = (e: any, field: 'logoDataUrl' | 'stampDataUrl', isDomestic = false) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if(isDomestic) {
                    setData({...data, domestic: {...data.domestic, stampDataUrl: reader.result as string}});
                } else {
                    setData({...data, [field]: reader.result as string});
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow border max-w-4xl">
            <div className="flex border-b mb-6 overflow-x-auto">
                <button 
                    className={`px-6 py-3 font-bold whitespace-nowrap ${tab === 'intl' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setTab('intl')}
                >
                    International Profile
                </button>
                <button 
                    className={`px-6 py-3 font-bold whitespace-nowrap ${tab === 'domestic' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setTab('domestic')}
                >
                    {t('domesticInfo')} & {t('contractTerms')}
                </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); onSave(data); }}>
                {tab === 'intl' && (
                    <div className="space-y-6">
                         <h4 className="font-bold text-blue-600">International Profile (For Quotes)</h4>

                         {/* Logo & Stamp */}
                         <div className="grid grid-cols-2 gap-6">
                             <div>
                                 <label className="text-xs font-bold text-gray-500 block mb-2">Company Logo</label>
                                 <div className="flex items-center space-x-4">
                                      {data.logoDataUrl && <img src={data.logoDataUrl} className="h-12 object-contain border p-1" />}
                                      <input type="file" accept="image/*" onChange={e => handleImage(e, 'logoDataUrl')} className="text-sm" />
                                 </div>
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-gray-500 block mb-2">Company Stamp / Signature</label>
                                 <div className="flex items-center space-x-4">
                                      {data.stampDataUrl && <img src={data.stampDataUrl} className="h-12 object-contain border p-1" />}
                                      <input type="file" accept="image/*" onChange={e => handleImage(e, 'stampDataUrl')} className="text-sm" />
                                 </div>
                             </div>
                         </div>

                         {/* Basic Info */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div><label className="text-xs font-bold text-gray-500">Company Name</label><input className="w-full p-2 border rounded" value={data.name} onChange={e => handleChange('name', e.target.value)}/></div>
                             <div><label className="text-xs font-bold text-gray-500">Address</label><input className="w-full p-2 border rounded" value={data.address} onChange={e => handleChange('address', e.target.value)}/></div>
                             <div><label className="text-xs font-bold text-gray-500">City</label><input className="w-full p-2 border rounded" value={data.city} onChange={e => handleChange('city', e.target.value)}/></div>
                             <div><label className="text-xs font-bold text-gray-500">Country</label><input className="w-full p-2 border rounded" value={data.country} onChange={e => handleChange('country', e.target.value)}/></div>
                             <div><label className="text-xs font-bold text-gray-500">Phone</label><input className="w-full p-2 border rounded" value={data.phone} onChange={e => handleChange('phone', e.target.value)}/></div>
                             <div><label className="text-xs font-bold text-gray-500">Email</label><input className="w-full p-2 border rounded" value={data.email} onChange={e => handleChange('email', e.target.value)}/></div>
                             <div><label className="text-xs font-bold text-gray-500 text-blue-600">Quote Number Prefix</label><input className="w-full p-2 border rounded font-mono" value={data.quotePrefix} onChange={e => handleChange('quotePrefix', e.target.value)} placeholder="e.g. LH-"/></div>
                         </div>

                         {/* Product Units Configuration */}
                         <div>
                             <label className="text-xs font-bold text-gray-500">Product Units (Comma separated)</label>
                             <input 
                                className="w-full p-2 border rounded text-sm" 
                                value={data.productUnits || ''} 
                                onChange={e => handleChange('productUnits', e.target.value)}
                                placeholder="PCS, SET, BOX, CTN, KG, M, ROLL, PACK, PAIR, UNIT, KIT, DRUM, BAG, DOZ"
                             />
                         </div>

                         {/* Bank Info */}
                         <div><label className="text-xs font-bold text-gray-500">Bank Info (Appears on Quote)</label><textarea rows={3} className="w-full p-2 border rounded font-mono text-sm" value={data.bankInfo} onChange={e => handleChange('bankInfo', e.target.value)}/></div>

                         {/* Exchange Rates */}
                         <div className="bg-gray-50 p-4 rounded border">
                             <h5 className="font-bold text-gray-700 text-sm mb-3 flex items-center"><Coins size={16} className="mr-2"/> Exchange Rates (Base: 1 USD)</h5>
                             <div className="grid grid-cols-3 gap-4">
                                 <div>
                                     <label className="text-xs font-bold text-gray-500">USD to CNY</label>
                                     <input type="number" step="0.01" className="w-full p-2 border rounded" value={data.exchangeRates?.['CNY'] || 7.2} onChange={e => setData({...data, exchangeRates: {...data.exchangeRates, 'CNY': parseFloat(e.target.value)}})}/>
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-gray-500">USD to EUR</label>
                                     <input type="number" step="0.01" className="w-full p-2 border rounded" value={data.exchangeRates?.['EUR'] || 0.92} onChange={e => setData({...data, exchangeRates: {...data.exchangeRates, 'EUR': parseFloat(e.target.value)}})}/>
                                 </div>
                                  <div>
                                     <label className="text-xs font-bold text-gray-500">USD to GBP</label>
                                     <input type="number" step="0.01" className="w-full p-2 border rounded" value={data.exchangeRates?.['GBP'] || 0.79} onChange={e => setData({...data, exchangeRates: {...data.exchangeRates, 'GBP': parseFloat(e.target.value)}})}/>
                                 </div>
                             </div>
                         </div>
                    </div>
                )}
                
                {tab === 'domestic' && (
                    <div className="space-y-4">
                        <h4 className="font-bold text-orange-600">国内供方信息 (用于购销合同)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-gray-500">公司名称</label><input className="w-full p-2 border rounded" value={data.domestic?.name || ''} onChange={e => handleDomesticChange('name', e.target.value)}/></div>
                            <div><label className="text-xs font-bold text-gray-500">联系人 (代理人)</label><input className="w-full p-2 border rounded" value={data.domestic?.contact || ''} onChange={e => handleDomesticChange('contact', e.target.value)}/></div>
                            <div><label className="text-xs font-bold text-gray-500">电话</label><input className="w-full p-2 border rounded" value={data.domestic?.phone || ''} onChange={e => handleDomesticChange('phone', e.target.value)}/></div>
                            <div><label className="text-xs font-bold text-gray-500">传真</label><input className="w-full p-2 border rounded" value={data.domestic?.fax || ''} onChange={e => handleDomesticChange('fax', e.target.value)}/></div>
                            <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500">地址</label><input className="w-full p-2 border rounded" value={data.domestic?.address || ''} onChange={e => handleDomesticChange('address', e.target.value)}/></div>
                            <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500">纳税人识别号</label><input className="w-full p-2 border rounded" value={data.domestic?.taxId || ''} onChange={e => handleDomesticChange('taxId', e.target.value)}/></div>
                            <div><label className="text-xs font-bold text-gray-500">开户行</label><input className="w-full p-2 border rounded" value={data.domestic?.bankName || ''} onChange={e => handleDomesticChange('bankName', e.target.value)}/></div>
                            <div><label className="text-xs font-bold text-gray-500">账号</label><input className="w-full p-2 border rounded" value={data.domestic?.bankAccount || ''} onChange={e => handleDomesticChange('bankAccount', e.target.value)}/></div>
                            <div><label className="text-xs font-bold text-gray-500 text-blue-600">合同编号前缀</label><input className="w-full p-2 border rounded font-mono" value={data.domestic?.contractPrefix || ''} onChange={e => handleDomesticChange('contractPrefix', e.target.value)} placeholder="e.g. ULHTZH"/></div>
                        </div>
                        
                        <div>
                             <label className="text-xs font-bold text-gray-500">合同公章 (用于合同盖章)</label>
                             <div className="flex items-center space-x-4">
                                 {data.domestic?.stampDataUrl && <img src={data.domestic.stampDataUrl} className="h-16" />}
                                 <input type="file" onChange={e => handleImage(e, 'stampDataUrl', true)} />
                             </div>
                        </div>

                        <div className="pt-4 border-t">
                            <label className="text-xs font-bold text-gray-500 block mb-2">{t('contractTerms')}</label>
                            <textarea 
                                className="w-full p-4 border rounded h-48 font-serif text-sm" 
                                value={data.domestic?.contractTerms || ''} 
                                onChange={e => handleDomesticChange('contractTerms', e.target.value)}
                            />
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 font-bold">{t('save')}</button>
                </div>
            </form>
        </div>
    );
};
