import React, { forwardRef } from 'react';
import { Quote, CompanySettings } from '../types';

interface InvoiceTemplateProps {
  quote: Quote;
  settings: CompanySettings;
  mode?: 'preview' | 'generate' | 'hidden';
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ quote, settings, mode = 'preview' }, ref) => {
  const { customerSnapshot: customer, items } = quote;

  const baseStyle: React.CSSProperties = {
    width: '794px',
    backgroundColor: 'white',
    position: 'relative',
    boxSizing: 'border-box',
    fontFamily: '"Inter", sans-serif',
  };

  let containerStyle: React.CSSProperties = { ...baseStyle };
  let wrapperClass = "";

  if (mode === 'preview') {
    containerStyle = {
      ...baseStyle,
      width: '100%',
      maxWidth: '210mm',
      minHeight: '297mm',
      margin: '0 auto',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    };
    wrapperClass = "flex justify-center p-8 min-h-full";
  } else if (mode === 'generate') {
    containerStyle = {
      ...baseStyle,
      minHeight: '1123px', 
      height: 'auto', 
      overflow: 'visible'
    };
    wrapperClass = "absolute top-0 left-0";
  } else {
    containerStyle = { ...baseStyle, display: 'none' };
  }

  return (
    <div className={wrapperClass}>
       <div ref={ref} style={containerStyle} className="text-gray-900 bg-white flex flex-col">
          {/* Main content padding reduced from p-12 to p-8 (approx 2cm) */}
          <div className="p-8 flex flex-col flex-grow relative">
            
            {/* Header Section */}
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
                <div className="w-1/2 pr-6">
                  {settings.logoDataUrl ? (
                    <img 
                        src={settings.logoDataUrl} 
                        alt="Logo" 
                        className="h-16 object-contain mb-2 block" 
                        crossOrigin="anonymous"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-900 mb-1 uppercase tracking-wide">{settings.name}</h1>
                  )}
                  
                  <div className="text-[10px] text-gray-600 leading-tight">
                      <p className="font-bold text-gray-800 text-xs mb-0.5">{settings.name}</p>
                      <p>{settings.address}</p>
                      <p>{settings.city}, {settings.country}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-gray-800">
                           {/* Priority: Show specific Salesperson info if available */}
                           {quote.salesperson?.name ? (
                               <>
                                   <div className="font-bold text-blue-800">{quote.salesperson.name}</div>
                                   {quote.salesperson.email && <div>Email: {quote.salesperson.email}</div>}
                                   {quote.salesperson.phone && <div>Tel: {quote.salesperson.phone}</div>}
                               </>
                           ) : (
                               <>
                                   {settings.phone && <span><strong>Tel:</strong> {settings.phone}</span>}
                                   {settings.email && <span><strong>Email:</strong> {settings.email}</span>}
                               </>
                           )}
                      </div>
                  </div>
                </div>

                <div className="w-1/2 text-right">
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-widest uppercase">{quote.type}</h2>
                  
                  {/* Changed from Flex to Table for consistent PDF borders */}
                  <table className="ml-auto border-collapse border border-gray-900 min-w-[220px]">
                    <tbody>
                        <tr>
                            <td className="w-20 p-1.5 bg-gray-100 border-b border-r border-gray-400 align-middle text-left">
                                <span className="text-[9px] font-bold text-black uppercase">Ref No:</span>
                            </td>
                            <td className="p-1.5 bg-white border-b border-gray-400 text-right align-middle">
                                <span className="text-xs font-bold text-black">{quote.number}</span>
                            </td>
                        </tr>
                        <tr>
                            <td className="w-20 p-1.5 bg-gray-100 border-b border-r border-gray-400 align-middle text-left">
                                <span className="text-[9px] font-bold text-black uppercase">Date:</span>
                            </td>
                            <td className="p-1.5 bg-white border-b border-gray-400 text-right align-middle">
                                <span className="text-xs text-black">{quote.date}</span>
                            </td>
                        </tr>
                        <tr>
                            <td className="w-20 p-1.5 bg-gray-100 border-r border-gray-400 align-middle text-left">
                                <span className="text-[9px] font-bold text-black uppercase">Expiry:</span>
                            </td>
                            <td className="p-1.5 bg-white text-right align-middle">
                                <span className="text-xs text-black">{quote.validUntil}</span>
                            </td>
                        </tr>
                    </tbody>
                  </table>
                </div>
            </div>

            {/* Bill To Section */}
            <div className="mb-4">
                 <div className="flex items-center mb-1">
                    <div className="h-3 w-1 bg-blue-600 mr-2 rounded-full"></div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bill To / Buyer</h3>
                 </div>
                 <div className="ml-3 bg-gray-50 p-3 rounded">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{customer.name}</h2>
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-700">
                        <div>
                            <p className="flex"><span className="font-semibold text-gray-500 w-12 flex-shrink-0">Attn:</span> {customer.contactPerson}</p>
                            <p className="flex"><span className="font-semibold text-gray-500 w-12 flex-shrink-0">Tel:</span> {customer.phone}</p>
                            <p className="flex"><span className="font-semibold text-gray-500 w-12 flex-shrink-0">Email:</span> {customer.email}</p>
                        </div>
                        <div>
                            <p>{customer.address}</p>
                            <p>{customer.city} {customer.zipCode}, {customer.country}</p>
                            {customer.taxId && <p className="mt-0.5"><span className="font-semibold text-gray-500">Tax ID:</span> {customer.taxId}</p>}
                        </div>
                    </div>
                 </div>
            </div>

            {/* Table Section */}
            <div className="mb-4 flex-grow">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-800 text-white">
                            <th className="py-2 px-3 text-left text-[10px] uppercase font-semibold w-[45%] text-white">Description</th>
                            <th className="py-2 px-3 text-right text-[10px] uppercase font-semibold w-[10%] text-white">Qty</th>
                            <th className="py-2 px-3 text-center text-[10px] uppercase font-semibold w-[10%] text-white">Unit</th>
                            <th className="py-2 px-3 text-right text-[10px] uppercase font-semibold w-[15%] text-white">Price</th>
                            <th className="py-2 px-3 text-right text-[10px] uppercase font-semibold w-[20%] text-white">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs text-gray-700">
                        {items.map((item, idx) => (
                            <tr key={item.id} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                <td className="py-2 px-3 align-top">
                                    <p className="font-bold text-gray-900 text-xs">{item.sku}</p>
                                    <p className="text-gray-800">{item.name}</p>
                                    {item.description && <p className="text-[10px] text-gray-500 mt-0.5 whitespace-pre-wrap leading-tight">{item.description}</p>}
                                </td>
                                <td className="py-2 px-3 text-right align-top font-medium">{item.quantity}</td>
                                <td className="py-2 px-3 text-center align-top text-[10px] uppercase text-gray-500">{item.unit || 'pcs'}</td>
                                <td className="py-2 px-3 text-right align-top">{item.price.toFixed(2)}</td>
                                <td className="py-2 px-3 text-right align-top font-bold text-gray-900">{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-4 break-inside-avoid">
                <div className="w-5/12">
                    <div className="flex justify-between py-1.5 border-b border-gray-200 text-xs text-gray-600">
                        <span>Subtotal</span>
                        <span>{quote.currency} {quote.subtotal.toFixed(2)}</span>
                    </div>
                    {quote.discountAmount > 0 && (
                        <div className="flex justify-between py-1.5 border-b border-gray-200 text-xs text-red-500">
                            <span>Discount ({quote.discountRate}%)</span>
                            <span>- {quote.currency} {quote.discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    {quote.shipping > 0 && (
                        <div className="flex justify-between py-1.5 border-b border-gray-200 text-xs text-gray-600">
                            <span>Shipping / Freight</span>
                            <span>{quote.currency} {quote.shipping.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between py-2 items-center">
                        <span className="text-sm font-bold text-gray-900">TOTAL</span>
                        <span className="text-xl font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{quote.currency} {quote.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Footer / Terms */}
            <div className="grid grid-cols-2 gap-6 mb-4 border-t border-gray-200 pt-4 break-inside-avoid">
                 <div>
                     <h4 className="text-[9px] font-bold text-gray-900 uppercase tracking-wider mb-1">Payment Information</h4>
                     <div className="bg-gray-50 p-2 border border-gray-300">
                         <pre className="whitespace-pre-wrap font-mono text-[8px] text-black leading-tight">{settings.bankInfo}</pre>
                     </div>
                 </div>
                 <div>
                     <h4 className="text-[9px] font-bold text-gray-900 uppercase tracking-wider mb-1">Terms & Conditions</h4>
                     <ul className="text-[9px] space-y-1 text-gray-800">
                        <li className="grid grid-cols-[60px_1fr]"><span className="font-bold text-gray-600">Incoterms:</span> {quote.incoterms}</li>
                        <li className="grid grid-cols-[60px_1fr]"><span className="font-bold text-gray-600">Lead Time:</span> {quote.leadTime}</li>
                        <li className="grid grid-cols-[60px_1fr]"><span className="font-bold text-gray-600">Payment:</span> {quote.paymentTerms}</li>
                     </ul>
                     {quote.notes && (
                         <div className="mt-2">
                             <p className="font-bold text-gray-600 text-[9px] uppercase mb-0.5">Notes:</p>
                             <p className="text-[9px] text-gray-800 italic leading-tight">{quote.notes}</p>
                         </div>
                     )}
                 </div>
            </div>

            {/* Signature Section */}
            <div className="mt-auto pt-2 break-inside-avoid">
                <div className="flex justify-between items-end pb-2">
                    <div className="w-1/3 text-center">
                         <div className="border-b border-gray-400 h-16 mb-1"></div>
                         <p className="text-[8px] font-bold text-gray-600 uppercase">Authorized Signature & Date</p>
                         <p className="text-[8px] text-gray-400">(Buyer)</p>
                    </div>
                    <div className="w-1/3 text-center relative">
                         {settings.stampDataUrl && (
                             <img 
                                src={settings.stampDataUrl} 
                                alt="Stamp" 
                                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-40 h-40 object-contain opacity-90 mix-blend-multiply pointer-events-none z-0"
                                style={{ transform: 'translate(-50%, 0) rotate(-10deg)' }}
                                crossOrigin="anonymous"
                             />
                         )}
                         <div className="h-16 flex items-end justify-center relative z-10">
                             <span className="font-serif font-bold text-base text-gray-900 mb-1">{settings.name}</span>
                         </div>
                         <div className="border-b border-gray-400 mb-1 relative z-10"></div>
                         <p className="text-[8px] font-bold text-gray-600 uppercase relative z-10">Authorized Signature</p>
                         <p className="text-[8px] text-gray-400 relative z-10">(Seller)</p>
                    </div>
                </div>
                <div className="border-t border-gray-200 pt-1 text-center">
                    <p className="text-[7px] text-gray-400">{settings.name}</p>
                </div>
            </div>
          </div>
       </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';