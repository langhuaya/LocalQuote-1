
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
    // Move off-screen but keep width intact
    wrapperClass = "fixed top-0 left-[-2000px] z-[-100]"; 
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
                        <div className="mt-3 space-y-0.5">
                             {quote.salesperson?.name ? (
                               <>
                                   <p><span className="font-bold text-slate-700">Rep:</span> {quote.salesperson.name}</p>
                                   <p><span className="font-bold text-slate-700">Email:</span> {quote.salesperson.email}</p>
                                   {quote.salesperson.phone && <p><span className="font-bold text-slate-700">Tel:</span> {quote.salesperson.phone}</p>}
                               </>
                           ) : (
                               <>
                                   {settings.email && <p><span className="font-bold text-slate-700">Email:</span> {settings.email}</p>}
                                   {settings.phone && <p><span className="font-bold text-slate-700">Tel:</span> {settings.phone}</p>}
                               </>
                           )}
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
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</h3>
                 <div className="border-t border-slate-200 pt-4">
                    <h2 className="text-lg font-bold text-slate-800 mb-1">{customer.name}</h2>
                    <div className="grid grid-cols-2 gap-8 text-sm text-slate-600">
                        <div>
                            <p className="mb-1 text-slate-800">{customer.address}</p>
                            <p>{customer.city} {customer.zipCode}</p>
                            <p>{customer.country}</p>
                        </div>
                        <div className="text-right sm:text-left">
                            <p><span className="text-slate-400 w-12 inline-block">Attn</span> <span className="font-medium text-slate-800">{customer.contactPerson}</span></p>
                            <p><span className="text-slate-400 w-12 inline-block">Tel</span> {customer.phone}</p>
                            <p><span className="text-slate-400 w-12 inline-block">Email</span> {customer.email}</p>
                        </div>
                    </div>
                 </div>
            </div>

            {/* --- PRODUCT TABLE --- */}
            <div className="mb-8 flex-grow">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-300">
                            {showImages && (
                                <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-[8%]">Image</th>
                            )}
                            <th className={`pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider ${showImages ? 'w-[32%]' : 'w-[40%]'}`}>Description</th>
                            <th className="pb-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-[10%]">Brand</th>
                            <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-[10%]">Lead Time</th>
                            <th className="pb-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-[10%]">Qty</th>
                            <th className="pb-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-[15%] pr-8">Price</th>
                            <th className="pb-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-[15%]">Amount</th>
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
                                    <p className="font-bold text-slate-800 text-sm mb-0.5">{item.sku}</p>
                                    <p className="text-slate-600 text-xs leading-relaxed">{item.name}</p>
                                </td>
                                <td className="py-4 align-top text-center text-slate-600">{item.brand || '—'}</td>
                                <td className="py-4 align-top text-left text-slate-600 text-xs">{item.leadTime || '-'}</td>
                                <td className="py-4 align-top text-right font-medium">
                                    {item.quantity} <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                                </td>
                                <td className="py-4 align-top text-right text-slate-600 pr-8">{fmt(item.price)}</td>
                                <td className="py-4 align-top text-right font-bold text-slate-800">{fmt(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- TOTALS & BANK INFO --- */}
            <div className="flex justify-between items-start mb-8 no-split pt-6 border-t border-slate-200">
                <div className="w-[58%] pr-8">
                     <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Payment Details</h4>
                     <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 text-[11px] text-slate-600 font-mono leading-normal whitespace-pre-wrap shadow-inner">
                        {settings.bankInfo}
                     </div>

                     <div className="mt-4 text-[11px] text-slate-500 space-y-1">
                        <p><strong className="text-slate-700">Incoterms:</strong> {quote.incoterms}</p>
                        <p><strong className="text-slate-700">Payment:</strong> {quote.paymentTerms}</p>
                        {quote.notes && <p className="mt-2 italic">"{quote.notes}"</p>}
                     </div>
                </div>

                <div className="w-[38%]">
                    <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span className="font-medium">{quote.currency} {fmt(quote.subtotal)}</span>
                        </div>
                        {quote.discountAmount > 0 && (
                            <div className="flex justify-between text-orange-600">
                                <span>Discount ({quote.discountRate}%)</span>
                                <span>- {quote.currency} {fmt(quote.discountAmount)}</span>
                            </div>
                        )}
                        {quote.shipping > 0 && (
                            <div className="flex justify-between text-slate-600">
                                <span>Shipping</span>
                                <span>{quote.currency} {fmt(quote.shipping)}</span>
                            </div>
                        )}
                        <div className="h-px bg-slate-200 my-2"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-base font-bold text-slate-800">Total</span>
                            <span className="text-2xl font-bold text-blue-600">{quote.currency} {fmt(quote.total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FOOTER / SIGNATURE --- */}
            <div className="mt-auto no-split border-t border-slate-100 pt-8">
                <div className="grid grid-cols-2 gap-12">
                     <div className="text-center">
                         <div className="border-b border-slate-300 h-16 mb-2"></div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Confirmed & Accepted By (Buyer)</p>
                     </div>
                     
                     <div className="text-center flex flex-col items-center">
                         <div className="h-28 w-full relative flex flex-col items-center justify-end pb-2">
                             {settings.stampDataUrl && (
                                 <img 
                                    src={settings.stampDataUrl} 
                                    alt="Stamp"
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-40 h-40 object-contain mix-blend-multiply opacity-90 pointer-events-none"
                                    crossOrigin="anonymous"
                                 />
                             )}
                             <span className="font-serif font-bold text-lg text-slate-800 relative z-10">{settings.name}</span>
                         </div>
                         <div className="border-b border-slate-300 w-full mb-2"></div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Authorized Signature (Seller)</p>
                     </div>
                </div>
                
                <div className="text-center mt-12 text-[10px] text-slate-400 uppercase tracking-widest">
                    Thank you for your business
                </div>
            </div>

          </div>
       </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
