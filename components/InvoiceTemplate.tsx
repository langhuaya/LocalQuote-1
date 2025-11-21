
import React, { forwardRef } from 'react';
import { Quote, CompanySettings } from '../types';

interface InvoiceTemplateProps {
  quote: Quote;
  settings: CompanySettings;
  mode?: 'preview' | 'generate' | 'hidden'; // 'hidden' is for the invisible print container
}

// We use forwardRef so the parent can target this DOM element for html2canvas
export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ quote, settings, mode = 'preview' }, ref) => {
  const { customerSnapshot: customer, items } = quote;

  // --- Styles Configuration ---
  
  // A4 width in pixels at 96 DPI is approx 794px. Height is 1123px.
  // For generation, we want explicit width/height behavior.
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
    // Natural A4 Preview
    containerStyle = {
      ...baseStyle,
      width: '100%',
      maxWidth: '210mm', // Standard A4 width
      minHeight: '297mm', // Standard A4 height
      margin: '0 auto',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    };
    wrapperClass = "flex justify-center p-8 min-h-full";
  } else if (mode === 'generate') {
    // Full size, auto height to capture all items
    containerStyle = {
      ...baseStyle,
      minHeight: '1123px', 
      height: 'auto', // Allow growing indefinitely
      overflow: 'visible'
    };
    wrapperClass = "absolute top-0 left-0";
  } else {
    // Hidden Default
    containerStyle = { ...baseStyle, display: 'none' };
  }

  return (
    <div className={wrapperClass}>
       <div ref={ref} style={containerStyle} className="text-gray-900 bg-white flex flex-col">
          <div className="p-12 flex flex-col flex-grow relative">
            
            {/* --- HEADER --- */}
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
                <div className="w-1/2 pr-6">
                   {/* Logo Area */}
                  {settings.logoDataUrl ? (
                    <img 
                        src={settings.logoDataUrl} 
                        alt="Logo" 
                        className="h-24 object-contain mb-4 block" 
                        crossOrigin="anonymous"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 uppercase tracking-wide">{settings.name}</h1>
                  )}
                  
                  {/* Seller Info (Top Left) */}
                  <div className="text-xs text-gray-600 leading-relaxed">
                      <p className="font-bold text-gray-800 text-sm mb-1">{settings.name}</p>
                      <p>{settings.address}</p>
                      <p>{settings.city}, {settings.country}</p>
                      <div className="mt-2 flex flex-wrap gap-4">
                          <span><strong>Tel:</strong> {settings.phone}</span>
                          <span><strong>Email:</strong> {settings.email}</span>
                      </div>
                  </div>
                </div>

                <div className="w-1/2 text-right">
                  {/* Darker text for better print visibility */}
                  <h2 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-widest uppercase">{quote.type}</h2>
                  
                  {/* Quote Metadata Box - REFACTORED FOR HTML2CANVAS STABILITY */}
                  <div className="inline-block text-left bg-gray-100 border-2 border-gray-900 min-w-[260px]">
                      {/* Row 1 */}
                      <div className="flex border-b border-gray-400">
                          <div className="w-24 p-2 flex items-center">
                              <span className="text-[10px] font-bold text-black uppercase">Invoice No:</span>
                          </div>
                          <div className="flex-1 p-2 text-right bg-white">
                              <span className="text-sm font-bold text-black">{quote.number}</span>
                          </div>
                      </div>
                      {/* Row 2 */}
                      <div className="flex border-b border-gray-400">
                          <div className="w-24 p-2 flex items-center">
                              <span className="text-[10px] font-bold text-black uppercase">Date:</span>
                          </div>
                          <div className="flex-1 p-2 text-right bg-white">
                              <span className="text-sm text-black">{quote.date}</span>
                          </div>
                      </div>
                      {/* Row 3 */}
                      <div className="flex">
                          <div className="w-24 p-2 flex items-center">
                              <span className="text-[10px] font-bold text-black uppercase">Expiry:</span>
                          </div>
                          <div className="flex-1 p-2 text-right bg-white">
                              <span className="text-sm text-black">{quote.validUntil}</span>
                          </div>
                      </div>
                  </div>
                </div>
            </div>

            {/* --- BILL TO --- */}
            <div className="mb-8">
                 <div className="flex items-center mb-2">
                    <div className="h-4 w-1 bg-blue-600 mr-2 rounded-full"></div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bill To / Buyer</h3>
                 </div>
                 <div className="ml-3">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{customer.name}</h2>
                    <div className="grid grid-cols-2 gap-8 text-sm text-gray-700">
                        <div>
                            <p><span className="font-semibold text-gray-500 w-16 inline-block">Attn:</span> {customer.contactPerson}</p>
                            <p><span className="font-semibold text-gray-500 w-16 inline-block">Tel:</span> {customer.phone}</p>
                            <p><span className="font-semibold text-gray-500 w-16 inline-block">Email:</span> {customer.email}</p>
                        </div>
                        <div>
                            <p>{customer.address}</p>
                            <p>{customer.city} {customer.zipCode}</p>
                            <p>{customer.country}</p>
                            {customer.taxId && <p className="mt-1"><span className="font-semibold text-gray-500">Tax ID:</span> {customer.taxId}</p>}
                        </div>
                    </div>
                 </div>
            </div>

            {/* --- TABLE --- */}
            <div className="mb-6 flex-grow">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-800 text-white">
                            <th className="py-3 px-4 text-left text-xs uppercase font-semibold w-1/2 text-white">Description</th>
                            <th className="py-3 px-4 text-right text-xs uppercase font-semibold w-20 text-white">Qty</th>
                            <th className="py-3 px-4 text-center text-xs uppercase font-semibold w-20 text-white">Unit</th>
                            <th className="py-3 px-4 text-right text-xs uppercase font-semibold w-32 text-white">Price</th>
                            <th className="py-3 px-4 text-right text-xs uppercase font-semibold w-32 text-white">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-gray-700">
                        {items.map((item, idx) => (
                            <tr key={item.id} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                <td className="py-4 px-4 align-top">
                                    <p className="font-bold text-gray-900">{item.sku}</p>
                                    <p className="text-gray-800">{item.name}</p>
                                    {item.description && <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{item.description}</p>}
                                </td>
                                <td className="py-4 px-4 text-right align-top font-medium">{item.quantity}</td>
                                <td className="py-4 px-4 text-center align-top text-xs uppercase text-gray-500">{item.unit || 'pcs'}</td>
                                <td className="py-4 px-4 text-right align-top">{item.price.toFixed(2)}</td>
                                <td className="py-4 px-4 text-right align-top font-bold text-gray-900">{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- TOTALS --- */}
            <div className="flex justify-end mb-6 break-inside-avoid">
                <div className="w-5/12">
                    <div className="flex justify-between py-2 border-b border-gray-200 text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>{quote.currency} {quote.subtotal.toFixed(2)}</span>
                    </div>
                    {quote.discountAmount > 0 && (
                        <div className="flex justify-between py-2 border-b border-gray-200 text-sm text-red-500">
                            <span>Discount ({quote.discountRate}%)</span>
                            <span>- {quote.currency} {quote.discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    {quote.shipping > 0 && (
                        <div className="flex justify-between py-2 border-b border-gray-200 text-sm text-gray-600">
                            <span>Shipping / Freight</span>
                            <span>{quote.currency} {quote.shipping.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between py-4 items-center">
                        <span className="text-lg font-bold text-gray-900">TOTAL</span>
                        <span className="text-2xl font-bold text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-100">{quote.currency} {quote.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* --- TERMS & BANK --- */}
            <div className="grid grid-cols-2 gap-8 mb-8 border-t-2 border-gray-200 pt-6 break-inside-avoid">
                 {/* Bank Info */}
                 <div>
                     <h4 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-2">Payment Information</h4>
                     <div className="bg-gray-50 p-3 border border-gray-300">
                         <pre className="whitespace-pre-wrap font-mono text-[9px] text-black leading-tight">{settings.bankInfo}</pre>
                     </div>
                 </div>
                 
                 {/* Terms */}
                 <div>
                     <h4 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-2">Terms & Conditions</h4>
                     <ul className="text-[10px] space-y-1.5 text-gray-800">
                        <li className="grid grid-cols-[70px_1fr]"><span className="font-bold text-gray-600">Incoterms:</span> {quote.incoterms}</li>
                        <li className="grid grid-cols-[70px_1fr]"><span className="font-bold text-gray-600">Lead Time:</span> {quote.leadTime}</li>
                        <li className="grid grid-cols-[70px_1fr]"><span className="font-bold text-gray-600">Payment:</span> {quote.paymentTerms}</li>
                     </ul>
                     {quote.notes && (
                         <div className="mt-3">
                             <p className="font-bold text-gray-600 text-[9px] uppercase mb-1">Notes:</p>
                             <p className="text-[10px] text-gray-800 italic leading-snug">{quote.notes}</p>
                         </div>
                     )}
                 </div>
            </div>

            {/* --- FOOTER / SIGNATURE --- */}
            <div className="mt-auto pt-4 break-inside-avoid">
                <div className="flex justify-between items-end pb-4">
                    {/* Buyer Signature */}
                    <div className="w-1/3 text-center">
                         <div className="border-b border-gray-400 h-20 mb-2"></div>
                         <p className="text-[9px] font-bold text-gray-600 uppercase">Authorized Signature & Date</p>
                         <p className="text-[9px] text-gray-400">(Buyer)</p>
                    </div>

                    {/* Seller Signature & Stamp */}
                    <div className="w-1/3 text-center relative">
                         {settings.stampDataUrl && (
                             <img 
                                src={settings.stampDataUrl} 
                                alt="Stamp" 
                                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-32 h-32 object-contain opacity-90 mix-blend-multiply pointer-events-none z-0"
                                style={{ transform: 'translate(-50%, 0) rotate(-10deg)' }}
                                crossOrigin="anonymous"
                             />
                         )}
                         <div className="h-20 flex items-end justify-center relative z-10">
                             <span className="font-serif font-bold text-lg text-gray-900 mb-1">{settings.name}</span>
                         </div>
                         <div className="border-b border-gray-400 mb-2 relative z-10"></div>
                         <p className="text-[9px] font-bold text-gray-600 uppercase relative z-10">Authorized Signature</p>
                         <p className="text-[9px] text-gray-400 relative z-10">(Seller)</p>
                    </div>
                </div>
                
                {/* System Footer */}
                <div className="border-t border-gray-200 pt-2 text-center">
                    <p className="text-[8px] text-gray-400">System Generated by SwiftQuote Pro | {settings.name}</p>
                </div>
            </div>

          </div>
       </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
