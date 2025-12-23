
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
            
            {/* Header Section */}
            <div className="flex justify-between items-start mb-10 no-split">
                <div className="w-1/2">
                    {settings.logoDataUrl && <img src={settings.logoDataUrl} alt="Logo" className="h-14 object-contain mb-4" />}
                    <div className="text-sm text-slate-500 leading-tight">
                        <p className="font-bold text-slate-900 text-lg mb-1">{settings.name}</p>
                        <p>{settings.address}</p>
                        <p>{settings.city}, {settings.country}</p>
                        <div className="mt-4 space-y-0.5">
                             <p><span className="font-bold text-slate-700">Rep:</span> {quote.salesperson?.name || 'Authorized'}</p>
                             <p><span className="font-bold text-slate-700">Email:</span> {quote.salesperson?.email || settings.email}</p>
                             <p><span className="font-bold text-slate-700">Tel:</span> {quote.salesperson?.phone || settings.phone}</p>
                        </div>
                    </div>
                </div>
                <div className="w-1/2 text-right">
                    <h2 className="text-4xl font-light text-slate-300 uppercase tracking-widest mb-6">{quote.type}</h2>
                    <div className="inline-block text-left bg-slate-50 p-4 border-l-4 border-blue-600">
                        <div className="grid grid-cols-[80px_1fr] gap-x-4 gap-y-1 text-xs uppercase tracking-wider">
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

            {/* Bill To Section */}
            <div className="mb-8 no-split">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b-2 border-slate-100 pb-1">BILL TO</h3>
                 <div className="flex justify-between">
                    <div className="max-w-[60%]">
                        <h2 className="text-xl font-black text-slate-900 leading-tight mb-1">{customer.name}</h2>
                        <p className="text-sm text-slate-500">{customer.address}</p>
                    </div>
                    <div className="text-right text-sm">
                        <p><span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Attn:</span> <span className="font-bold">{customer.contactPerson}</span></p>
                        <p><span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Tel:</span> {customer.phone}</p>
                        <p><span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Email:</span> {customer.email}</p>
                    </div>
                 </div>
            </div>

            {/* Professional Table Section */}
            <div className="mb-10 flex-grow overflow-visible">
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                    <thead>
                        <tr className="border-y-2 border-slate-800 bg-slate-50">
                            {showImages && <th className="py-2 px-2 text-left text-[9px] font-black text-slate-500 uppercase w-[10%] tracking-tighter">Image</th>}
                            <th className="py-2 px-2 text-left text-[9px] font-black text-slate-500 uppercase w-[35%] tracking-tighter">Description / Part No.</th>
                            <th className="py-2 px-2 text-center text-[9px] font-black text-slate-500 uppercase w-[12%] tracking-tighter">Brand</th>
                            <th className="py-2 px-2 text-center text-[9px] font-black text-slate-500 uppercase w-[12%] tracking-tighter">Lead Time</th>
                            <th className="py-2 px-2 text-center text-[9px] font-black text-slate-500 uppercase w-[8%] tracking-tighter">Qty</th>
                            <th className="py-2 px-2 text-right text-[9px] font-black text-slate-500 uppercase w-[10%] tracking-tighter">Price</th>
                            <th className="py-2 px-2 text-right text-[9px] font-black text-slate-500 uppercase w-[13%] tracking-tighter">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {items.map((item, idx) => (
                            <tr key={item.id} className="border-b border-slate-200 no-split hover:bg-slate-50/50">
                                {showImages && (
                                    <td className="py-3 px-2 align-middle">
                                        {item.imageDataUrl ? (
                                            <img src={item.imageDataUrl} alt="" className="w-12 h-12 object-contain border border-slate-100 rounded bg-white shadow-sm" />
                                        ) : <div className="w-12 h-12 bg-slate-50 rounded flex items-center justify-center text-slate-200 font-black text-[10px]">NO IMG</div>}
                                    </td>
                                )}
                                <td className="py-3 px-2 align-top">
                                    <p className="font-black text-slate-900 text-sm leading-tight mb-1 overflow-wrap-anywhere break-all">{item.sku}</p>
                                    <p className="text-slate-500 text-[11px] leading-tight">{item.name}</p>
                                </td>
                                <td className="py-3 px-2 align-top text-center text-[11px] font-medium text-slate-600 break-words">{item.brand || '—'}</td>
                                <td className="py-3 px-2 align-top text-center text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-tight">{item.leadTime || 'IN STOCK'}</td>
                                <td className="py-3 px-2 align-top text-center">
                                    <span className="font-black text-slate-900">{item.quantity}</span>
                                    <span className="text-[10px] text-slate-400 block uppercase font-bold">{item.unit || 'PCS'}</span>
                                </td>
                                <td className="py-3 px-2 align-top text-right font-mono text-xs text-slate-600 font-bold">{fmt(item.price)}</td>
                                <td className="py-3 px-2 align-top text-right font-black text-slate-900 font-mono text-sm">{fmt(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals & Terms Section */}
            <div className="flex justify-between items-start no-split pt-8 border-t-2 border-slate-100">
                <div className="w-[55%]">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">PAYMENT DETAILS</h4>
                     <div className="bg-slate-50 p-4 rounded border border-slate-200 text-[11px] text-slate-600 font-mono whitespace-pre-wrap leading-relaxed overflow-hidden">
                        {settings.bankInfo}
                     </div>
                     <div className="mt-6 text-[10px] text-slate-400 space-y-1.5 uppercase font-black tracking-widest">
                        <p>INCOTERMS: <span className="text-slate-900">{quote.incoterms}</span></p>
                        <p>PAYMENT: <span className="text-slate-900">{quote.paymentTerms}</span></p>
                        {quote.notes && <p className="mt-4 normal-case italic font-normal text-slate-500 lowercase tracking-normal leading-tight">"{quote.notes}"</p>}
                     </div>
                </div>
                <div className="w-[35%] space-y-2">
                    <div className="flex justify-between items-center text-sm px-2">
                        <span className="text-slate-400 font-bold uppercase text-[10px]">SUBTOTAL</span>
                        <span className="font-bold text-slate-600">{quote.currency} {fmt(quote.subtotal)}</span>
                    </div>
                    {quote.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm px-2 text-red-500">
                            <span className="font-bold uppercase text-[10px]">DISCOUNT ({quote.discountRate}%)</span>
                            <span className="font-bold">- {fmt(quote.discountAmount)}</span>
                        </div>
                    )}
                    <div className="h-px bg-slate-100 my-2"></div>
                    <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col items-end shadow-xl">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">TOTAL AMOUNT</span>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-sm font-bold opacity-80">{quote.currency}</span>
                            <span className="text-3xl font-black font-mono tracking-tighter">{fmt(quote.total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Signature Section */}
            <div className="mt-auto pt-16 no-split flex justify-between items-end px-4">
                <div className="text-center w-64">
                    <div className="border-b-2 border-slate-200 h-20 mb-3 flex items-center justify-center text-slate-100 font-black text-xs uppercase tracking-widest">Seal Area</div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">CONFIRMED & ACCEPTED BY (BUYER)</p>
                </div>
                <div className="text-center w-80 relative">
                    {settings.stampDataUrl && (
                        <img src={settings.stampDataUrl} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 h-48 object-contain opacity-90 mix-blend-multiply pointer-events-none" />
                    )}
                    <p className="font-serif font-black text-xl text-slate-900 relative z-10 mb-1">{settings.name}</p>
                    <div className="border-b-2 border-slate-200 w-full mb-3"></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">AUTHORIZED SIGNATURE (SELLER)</p>
                </div>
            </div>
            <p className="text-center mt-10 text-[9px] text-slate-300 font-black uppercase tracking-[0.5em]">THANK YOU FOR YOUR BUSINESS</p>
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
