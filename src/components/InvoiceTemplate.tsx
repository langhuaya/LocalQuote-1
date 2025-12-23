
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
    containerStyle = { ...baseStyle, margin: '0 auto', minHeight: `${a4Height}px`, boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.2)' };
    wrapperClass = "flex justify-center py-8 bg-gray-200 min-h-screen";
  } else if (mode === 'generate') {
    containerStyle = { ...baseStyle, height: 'auto', minHeight: `${a4Height}px`, overflow: 'visible' };
    wrapperClass = ""; 
  } else {
    containerStyle = { ...baseStyle, display: 'none' };
  }

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={wrapperClass}>
       <div ref={ref} style={containerStyle} className="flex flex-col bg-white">
          <div className="h-2 w-full bg-blue-600"></div>

          <div className="p-12 flex flex-col flex-grow">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-10 no-split">
                <div className="w-1/2">
                    {settings.logoDataUrl && <img src={settings.logoDataUrl} alt="Logo" className="h-16 object-contain mb-4" />}
                    <div className="text-sm text-slate-500 leading-relaxed">
                        <p className="font-bold text-slate-900 text-lg">{settings.name}</p>
                        <p>{settings.address}</p>
                        <p>{settings.city}, {settings.country}</p>
                        <div className="mt-4">
                             <p><span className="font-bold text-slate-700">Rep:</span> {quote.salesperson?.name || 'Authorized'}</p>
                             <p><span className="font-bold text-slate-700">Email:</span> {quote.salesperson?.email || settings.email}</p>
                             <p><span className="font-bold text-slate-700">Tel:</span> {quote.salesperson?.phone || settings.phone}</p>
                        </div>
                    </div>
                </div>
                <div className="w-1/2 text-right">
                    <h2 className="text-4xl font-light text-slate-300 uppercase tracking-widest mb-6">{quote.type}</h2>
                    <div className="inline-block text-left bg-slate-50 p-4 border-l-4 border-blue-600">
                        <div className="grid grid-cols-[80px_1fr] gap-y-1 text-sm">
                            <span className="text-slate-400 font-bold">Ref No.</span>
                            <span className="font-black text-slate-900 break-all">{quote.number}</span>
                            <span className="text-slate-400 font-bold">Date</span>
                            <span className="text-slate-900">{quote.date}</span>
                            <span className="text-slate-400 font-bold">Expiry</span>
                            <span className="text-slate-900">{quote.validUntil}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bill To */}
            <div className="mb-10 no-split">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b-2 border-slate-100 pb-1">Bill To</h3>
                 <div className="flex justify-between">
                    <div className="max-w-[60%]">
                        <h2 className="text-xl font-black text-slate-900 leading-tight">{customer.name}</h2>
                        <p className="text-sm text-slate-500 mt-1">{customer.address}</p>
                    </div>
                    <div className="text-right text-sm">
                        <p><span className="text-slate-400 font-bold">Attn:</span> <span className="font-bold">{customer.contactPerson}</span></p>
                        <p><span className="text-slate-400 font-bold">Tel:</span> {customer.phone}</p>
                        <p><span className="text-slate-400 font-bold">Email:</span> {customer.email}</p>
                    </div>
                 </div>
            </div>

            {/* Product Table - EXTREME LOCKDOWN LAYOUT */}
            <div className="mb-8 flex-grow overflow-visible">
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                    <thead>
                        <tr className="bg-slate-50 border-y-2 border-slate-900">
                            {showImages && <th className="py-3 px-2 text-left text-[10px] font-black text-slate-500 uppercase w-[10%]">Image</th>}
                            <th className="py-3 px-2 text-left text-[10px] font-black text-slate-500 uppercase w-[35%]">Description / Model</th>
                            <th className="py-3 px-2 text-center text-[10px] font-black text-slate-500 uppercase w-[12%]">Brand</th>
                            <th className="py-3 px-2 text-center text-[10px] font-black text-slate-500 uppercase w-[12%]">Lead Time</th>
                            <th className="py-3 px-2 text-center text-[10px] font-black text-slate-500 uppercase w-[8%]">Qty</th>
                            <th className="py-3 px-2 text-right text-[10px] font-black text-slate-500 uppercase w-[10%]">Price</th>
                            <th className="py-3 px-2 text-right text-[10px] font-black text-slate-500 uppercase w-[13%]">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {items.map((item, idx) => (
                            <tr key={item.id} className="border-b border-slate-200 no-split">
                                {showImages && (
                                    <td className="py-3 px-2 align-middle">
                                        {item.imageDataUrl ? (
                                            <img src={item.imageDataUrl} alt="" className="w-12 h-12 object-contain border border-slate-100 rounded" />
                                        ) : <div className="w-12 h-12 bg-slate-50 rounded" />}
                                    </td>
                                )}
                                <td className="py-3 px-2 align-top">
                                    <p className="font-black text-slate-900 mb-1 leading-tight overflow-wrap-anywhere break-all">{item.sku}</p>
                                    <p className="text-slate-500 text-xs leading-snug">{item.name}</p>
                                </td>
                                <td className="py-3 px-2 align-top text-center text-xs font-medium text-slate-600 break-words">{item.brand || '—'}</td>
                                <td className="py-3 px-2 align-top text-center text-[10px] text-slate-500">{item.leadTime || 'in stock'}</td>
                                <td className="py-3 px-2 align-top text-center">
                                    <span className="font-bold text-slate-900">{item.quantity}</span>
                                    <span className="text-[10px] text-slate-400 block">{item.unit}</span>
                                </td>
                                <td className="py-3 px-2 align-top text-right font-mono text-slate-600">{fmt(item.price)}</td>
                                <td className="py-3 px-2 align-top text-right font-black text-slate-900 font-mono">{fmt(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bottom Section */}
            <div className="flex justify-between items-start no-split pt-6 border-t-2 border-slate-100">
                <div className="w-[55%]">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Payment Details</h4>
                     <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-[11px] text-slate-600 font-mono whitespace-pre-wrap leading-normal overflow-hidden">
                        {settings.bankInfo}
                     </div>
                     <div className="mt-4 text-[10px] text-slate-400 space-y-1 uppercase font-bold">
                        <p>Incoterms: <span className="text-slate-900">{quote.incoterms}</span></p>
                        <p>Payment: <span className="text-slate-900">{quote.paymentTerms}</span></p>
                        {quote.notes && <p className="mt-2 normal-case italic font-normal">Note: {quote.notes}</p>}
                     </div>
                </div>
                <div className="w-[35%] space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Subtotal</span>
                        <span className="font-bold">{quote.currency} {fmt(quote.subtotal)}</span>
                    </div>
                    {quote.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-red-500">
                            <span className="font-bold uppercase text-[10px]">Discount ({quote.discountRate}%)</span>
                            <span className="font-bold">- {fmt(quote.discountAmount)}</span>
                        </div>
                    )}
                    <div className="h-px bg-slate-100 my-2"></div>
                    <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center shadow-lg">
                        <span className="text-xs font-black uppercase tracking-widest">Total</span>
                        <span className="text-2xl font-black font-mono">{quote.currency} {fmt(quote.total)}</span>
                    </div>
                </div>
            </div>

            {/* Signature */}
            <div className="mt-auto pt-12 no-split flex justify-between items-end px-4">
                <div className="text-center w-64">
                    <div className="border-b border-slate-300 h-16"></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Buyer Acceptance</p>
                </div>
                <div className="text-center w-72 relative">
                    {settings.stampDataUrl && (
                        <img src={settings.stampDataUrl} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-44 h-44 object-contain opacity-85 mix-blend-multiply pointer-events-none" />
                    )}
                    <p className="font-serif font-black text-lg text-slate-900 relative z-10">{settings.name}</p>
                    <div className="border-b border-slate-300 w-full mb-2"></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authorized Signature (Seller)</p>
                </div>
            </div>
            <p className="text-center mt-8 text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em]">Thank you for your business</p>
          </div>
       </div>
       <style dangerouslySetInnerHTML={{ __html: `
         .overflow-wrap-anywhere {
            overflow-wrap: anywhere;
            word-break: break-all;
         }
       `}} />
    </div>
  );
});
