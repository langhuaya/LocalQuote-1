
import React, { forwardRef } from 'react';
import { Quote, CompanySettings } from '../types';

interface InvoiceTemplateProps {
  quote: Quote;
  settings: CompanySettings;
  mode?: 'preview' | 'generate' | 'hidden';
  showImages?: boolean;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ quote, settings, mode = 'preview', showImages = true }, ref) => {
  const { customerSnapshot: customer, items } = quote;

  // Standard A4 dimensions at 96 DPI
  const a4Width = 794; 
  const a4Height = 1123;

  const baseStyle: React.CSSProperties = {
    width: `${a4Width}px`,
    backgroundColor: 'white',
    position: 'relative',
    boxSizing: 'border-box',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#1e293b',
  };

  let containerStyle: React.CSSProperties = { ...baseStyle };
  let wrapperClass = "";

  if (mode === 'preview') {
    containerStyle = {
      ...baseStyle,
      margin: '0 auto',
      minHeight: `${a4Height}px`,
      boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.2)',
    };
    wrapperClass = "flex justify-center py-8 bg-gray-200 min-h-screen";
  } else if (mode === 'generate') {
    containerStyle = {
      ...baseStyle,
      height: 'auto', 
      minHeight: `${a4Height}px`,
      overflow: 'visible'
    };
    wrapperClass = ""; 
  } else {
    containerStyle = { ...baseStyle, display: 'none' };
  }

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={wrapperClass}>
       <div ref={ref} style={containerStyle} className="flex flex-col bg-white">
          
          {/* Decorative Top Bar */}
          <div className="h-2 w-full bg-blue-600"></div>

          <div className="p-12 flex flex-col flex-grow relative">
            
            {/* --- HEADER --- */}
            <div className="flex justify-between items-start mb-10 no-split">
                <div className="w-1/2 pr-6">
                    {settings.logoDataUrl ? (
                        <img src={settings.logoDataUrl} alt="Logo" className="h-20 object-contain mb-4" crossOrigin="anonymous"/>
                    ) : (
                        <h1 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">{settings.name}</h1>
                    )}
                    
                    <div className="text-sm text-slate-500 leading-relaxed">
                        <p className="font-bold text-slate-900 text-base mb-1">{settings.name}</p>
                        <p>{settings.address}</p>
                        <p>{settings.city}, {settings.country}</p>
                        <div className="mt-4 space-y-1">
                             <p><span className="font-bold text-slate-700">Rep:</span> {quote.salesperson?.name || 'Authorized Representative'}</p>
                             <p><span className="font-bold text-slate-700">Email:</span> {quote.salesperson?.email || settings.email}</p>
                             {quote.salesperson?.phone && <p><span className="font-bold text-slate-700">Tel:</span> {quote.salesperson.phone}</p>}
                        </div>
                    </div>
                </div>

                <div className="w-1/2 text-right">
                    <h2 className="text-4xl font-light text-slate-300 uppercase tracking-widest mb-6 pr-2">{quote.type}</h2>
                    <div className="inline-block text-left min-w-[210px]">
                        <div className="grid grid-cols-[85px_1fr] gap-y-1.5 text-sm border-l-4 border-blue-600 pl-4 py-1">
                            <span className="text-slate-500 font-medium">Ref No.</span>
                            <span className="font-bold text-slate-900">{quote.number}</span>
                            <span className="text-slate-500 font-medium">Date</span>
                            <span className="text-slate-900">{quote.date}</span>
                            <span className="text-slate-500 font-medium">Expiry</span>
                            <span className="text-slate-900">{quote.validUntil}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ADDRESSES --- */}
            <div className="mb-10 no-split">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Bill To</h3>
                 <div className="border-t-2 border-slate-900 pt-4 px-1">
                    <h2 className="text-xl font-black text-slate-900 mb-1">{customer.name}</h2>
                    <div className="grid grid-cols-2 gap-8 text-sm text-slate-600">
                        <div>
                            <p className="mb-1 text-slate-800">{customer.address}</p>
                            <p>{customer.city} {customer.zipCode}</p>
                            <p>{customer.country}</p>
                        </div>
                        <div className="text-right sm:text-left">
                            <p><span className="text-slate-400 w-12 inline-block font-bold">Attn</span> <span className="font-bold text-slate-900">{customer.contactPerson}</span></p>
                            <p><span className="text-slate-400 w-12 inline-block font-bold">Tel</span> {customer.phone}</p>
                            <p><span className="text-slate-400 w-12 inline-block font-bold">Email</span> {customer.email}</p>
                        </div>
                    </div>
                 </div>
            </div>

            {/* --- PRODUCT TABLE (Fixed widths for robust layout) --- */}
            <div className="mb-8 flex-grow overflow-visible">
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                    <thead>
                        <tr className="border-b-2 border-slate-900">
                            {showImages && (
                                <th className="pb-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider w-[8%]">Image</th>
                            )}
                            <th className={`pb-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider ${showImages ? 'w-[32%]' : 'w-[40%]'}`}>Description</th>
                            <th className="pb-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider w-[12%]">Brand</th>
                            <th className="pb-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider w-[12%]">Lead Time</th>
                            <th className="pb-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider w-[8%]">Qty</th>
                            <th className="pb-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider w-[13%]">Price</th>
                            <th className="pb-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider w-[15%]">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {items.map((item, idx) => (
                            <tr key={item.id} className="border-b border-slate-100 last:border-0 no-split">
                                {showImages && (
                                    <td className="py-4 align-top">
                                        {item.imageDataUrl ? (
                                            <img src={item.imageDataUrl} alt="" className="w-12 h-12 object-contain bg-white border border-slate-100 rounded p-0.5" />
                                        ) : (
                                            <div className="w-12 h-12 bg-slate-50 rounded flex items-center justify-center text-[9px] text-slate-300">No Img</div>
                                        )}
                                    </td>
                                )}
                                <td className="py-4 align-top pr-4">
                                    <p className="font-bold text-slate-900 text-sm mb-0.5">{item.sku}</p>
                                    <p className="text-slate-500 text-xs leading-relaxed">{item.name}</p>
                                </td>
                                <td className="py-4 align-top text-center text-slate-600 text-xs">{item.brand || '—'}</td>
                                <td className="py-4 align-top text-center text-slate-600 text-xs">{item.leadTime || 'in stock'}</td>
                                <td className="py-4 align-top text-center">
                                    <span className="font-bold text-slate-900">{item.quantity}</span>
                                    <span className="text-[10px] text-slate-400 block font-medium">{item.unit}</span>
                                </td>
                                <td className="py-4 align-top text-right text-slate-600 font-mono">{fmt(item.price)}</td>
                                <td className="py-4 align-top text-right font-black text-slate-900 font-mono">{fmt(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- TOTALS & BANK INFO --- */}
            <div className="flex justify-between items-start mb-8 no-split pt-8 border-t border-slate-200">
                <div className="w-[55%] pr-8">
                     <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3">Payment Details</h4>
                     <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-[11px] text-slate-600 font-mono leading-normal whitespace-pre-wrap shadow-inner overflow-hidden">
                        {settings.bankInfo}
                     </div>

                     <div className="mt-6 text-[11px] text-slate-500 space-y-1.5">
                        <p><strong className="text-slate-900 uppercase tracking-tighter">Incoterms:</strong> {quote.incoterms}</p>
                        <p><strong className="text-slate-900 uppercase tracking-tighter">Payment:</strong> {quote.paymentTerms}</p>
                        {quote.notes && (
                            <div className="mt-4 p-3 border-l-2 border-slate-200 italic text-slate-400">
                                "{quote.notes}"
                            </div>
                        )}
                     </div>
                </div>

                <div className="w-[40%]">
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between text-slate-500">
                            <span className="font-bold uppercase text-[10px] tracking-wider">Subtotal</span>
                            <span className="font-bold font-mono">{quote.currency} {fmt(quote.subtotal)}</span>
                        </div>
                        {quote.discountAmount > 0 && (
                            <div className="flex justify-between text-orange-600">
                                <span className="font-bold uppercase text-[10px] tracking-wider">Discount ({quote.discountRate}%)</span>
                                <span className="font-bold font-mono">- {quote.currency} {fmt(quote.discountAmount)}</span>
                            </div>
                        )}
                        {quote.shipping > 0 && (
                            <div className="flex justify-between text-slate-500">
                                <span className="font-bold uppercase text-[10px] tracking-wider">Shipping</span>
                                <span className="font-bold font-mono">{quote.currency} {fmt(quote.shipping)}</span>
                            </div>
                        )}
                        <div className="h-px bg-slate-200 my-4"></div>
                        <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl">
                            <span className="text-xs font-black uppercase tracking-widest">Total Amount</span>
                            <span className="text-2xl font-black font-mono tracking-tighter">{quote.currency} {fmt(quote.total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FOOTER / SIGNATURE --- */}
            <div className="mt-auto no-split border-t border-slate-100 pt-10">
                <div className="grid grid-cols-2 gap-16">
                     <div className="text-center">
                         <div className="border-b border-slate-200 h-16 mb-3"></div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmed & Accepted By (Buyer)</p>
                     </div>
                     
                     <div className="text-center flex flex-col items-center">
                         <div className="h-32 w-full relative flex flex-col items-center justify-end pb-3">
                             {settings.stampDataUrl && (
                                 <img 
                                    src={settings.stampDataUrl} 
                                    alt="Stamp"
                                    className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 h-48 object-contain mix-blend-multiply opacity-90 pointer-events-none"
                                    crossOrigin="anonymous"
                                 />
                             )}
                             <span className="font-serif font-black text-lg text-slate-900 relative z-10">{settings.name}</span>
                         </div>
                         <div className="border-b border-slate-200 w-full mb-3"></div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Signature (Seller)</p>
                     </div>
                </div>
                
                <div className="text-center mt-12 text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em]">
                    Thank you for your business
                </div>
            </div>

          </div>
       </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
