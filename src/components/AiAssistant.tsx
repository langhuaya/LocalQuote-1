
import React, { useState, useEffect, useRef } from 'react';
import { api, generateId } from '../services/api';
import { Product, Customer, Currency } from '../types';
import { Bot, Send, X, Sparkles, Loader2, Save, Trash2, Edit3, Check } from 'lucide-react';

interface AiAssistantProps {
  productsCount: number;
  customersCount: number;
  quotesCount: number;
  onSaveProduct: (p: Product) => void;
  onSaveCustomer: (c: Customer) => void;
}

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ReviewDraft {
    type: 'product' | 'customer';
    data: any;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ 
    productsCount, customersCount, quotesCount, 
    onSaveProduct, onSaveCustomer 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
      { role: 'assistant', content: 'Hi! I am your AI assistant. I can help you create products or customers. Try saying "Create a product Brand Model Price".' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewItem, setReviewItem] = useState<ReviewDraft | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, reviewItem]);

  const handleSend = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || isLoading) return;

      const userMsg: Message = { role: 'user', content: input };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      // Construct System Prompt with Context
      const systemPrompt = `
You are an intelligent assistant for SwiftQuote Pro, a CRM and Quotation system.
Current System Stats:
- Products: ${productsCount}
- Customers: ${customersCount}
- Quotes: ${quotesCount}

You can perform actions by outputting a JSON object.
Rules:
1. If the user asks to create a product, output JSON: {"action": "create_product", "data": {"sku": "...", "brand": "...", "name": "...", "price": 0, "currency": "USD", "unit": "PCS", "description": "..."}}
   - Map "型号" or "Model" to 'sku'.
   - Map "品牌" or "Brand" to 'brand'.
   - Map "价格" to 'price'.
2. If the user asks to create a customer, output JSON: {"action": "create_customer", "data": {"name": "...", "contactPerson": "...", "email": "..."}}
3. If the user asks a general question, just reply with text.
4. For "create_product", ensure SKU is provided. If not, generate a random one or ask. Default currency is USD unless specified.
5. If creating data, always mark note/description with "(AI Created)".
6. Do not output markdown code blocks (like \`\`\`json), just the raw JSON object if you are performing an action.
      `;

      try {
          const apiMessages = [
              { role: 'system', content: systemPrompt },
              ...messages.map(m => ({ role: m.role, content: m.content })), // History
              userMsg // Current
          ];

          const response = await api.chatWithAi(apiMessages);
          
          if (response.error) {
              setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${response.error}` }]);
          } else {
              const aiText = response.choices?.[0]?.message?.content || "I didn't get a response.";
              
              // Try parsing JSON action
              let isAction = false;
              try {
                  // Attempt to clean and parse JSON
                  const cleanText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
                  
                  if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
                      const action = JSON.parse(cleanText);
                      
                      if (action.action === 'create_product') {
                          isAction = true;
                          const p = action.data;
                          const newProduct: Product = {
                              id: generateId(),
                              sku: p.sku || `AI-${Math.floor(Math.random()*1000)}`,
                              name: p.name || `${p.brand || ''} ${p.sku || ''}`.trim() || 'New Product',
                              brand: p.brand || '',
                              price: p.price || 0,
                              currency: p.currency || Currency.USD,
                              unit: p.unit || 'PCS',
                              description: p.description || '',
                              note: '(Created by AI Assistant)',
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString()
                          };
                          
                          setReviewItem({ type: 'product', data: newProduct });
                          setMessages(prev => [...prev, { role: 'assistant', content: "I've drafted a product for you. Please review and confirm below." }]);
                      
                      } else if (action.action === 'create_customer') {
                          isAction = true;
                          const c = action.data;
                          const newCust: Customer = {
                              id: generateId(),
                              region: 'International', 
                              name: c.name || 'New Customer',
                              contactPerson: c.contactPerson || '',
                              email: c.email || '',
                              phone: '',
                              address: '',
                              city: '',
                              country: '',
                              zipCode: '',
                              source: 'AI Assistant',
                              createdAt: new Date().toISOString()
                          };
                          
                          setReviewItem({ type: 'customer', data: newCust });
                          setMessages(prev => [...prev, { role: 'assistant', content: "I've drafted a customer for you. Please review and confirm below." }]);
                      }
                  }
              } catch (e) {
                  // Not JSON, ignore
              }

              if (!isAction) {
                  setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
              }
          }
      } catch (err) {
          setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't reach the server." }]);
      } finally {
          setIsLoading(false);
      }
  };

  const handleReviewChange = (field: string, value: any) => {
      if (!reviewItem) return;
      setReviewItem({
          ...reviewItem,
          data: { ...reviewItem.data, [field]: value }
      });
  };

  const handleConfirmSave = () => {
      if (!reviewItem) return;
      if (reviewItem.type === 'product') {
          onSaveProduct(reviewItem.data);
          setMessages(prev => [...prev, { role: 'assistant', content: `✅ Created Product: **${reviewItem.data.sku}**` }]);
      } else {
          onSaveCustomer(reviewItem.data);
          setMessages(prev => [...prev, { role: 'assistant', content: `✅ Created Customer: **${reviewItem.data.name}**` }]);
      }
      setReviewItem(null);
  };

  const handleCancelReview = () => {
      setReviewItem(null);
      setMessages(prev => [...prev, { role: 'assistant', content: "❌ Action cancelled." }]);
  };

  return (
    <>
      {/* Floating Trigger */}
      {!isOpen && (
          <button 
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform z-50 flex items-center justify-center group"
          >
             <Sparkles className="animate-pulse" size={24} />
             <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
                 AI Assistant
             </span>
          </button>
      )}

      {/* Chat Window */}
      {isOpen && (
          <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 animate-in slide-in-from-bottom-10 fade-in duration-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-t-2xl flex justify-between items-center text-white flex-shrink-0">
                  <div className="flex items-center space-x-2">
                      <Bot size={20} />
                      <span className="font-bold">AI Assistant</span>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={18}/></button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div 
                            className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                            }`}
                          >
                             {msg.content}
                          </div>
                      </div>
                  ))}
                  {isLoading && (
                      <div className="flex justify-start">
                          <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                              <Loader2 size={14} className="animate-spin text-purple-600" />
                              <span className="text-xs text-gray-500">Thinking...</span>
                          </div>
                      </div>
                  )}
                  <div ref={messagesEndRef} />
              </div>

              {/* Input or Review Area */}
              {reviewItem ? (
                  <div className="bg-white border-t p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-10 animate-in slide-in-from-bottom-5">
                      <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold text-gray-800 text-sm flex items-center">
                              <Edit3 size={14} className="mr-2 text-purple-600"/> 
                              Review {reviewItem.type === 'product' ? 'Product' : 'Customer'}
                          </h4>
                          <span className="text-[10px] text-gray-400">Edit before saving</span>
                      </div>
                      
                      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                          {reviewItem.type === 'product' && (
                              <>
                                  <div className="grid grid-cols-2 gap-2">
                                      <div>
                                          <label className="text-[10px] font-bold text-gray-400 uppercase">SKU / Model</label>
                                          <input className="w-full border rounded p-1 text-sm font-bold" value={reviewItem.data.sku} onChange={e => handleReviewChange('sku', e.target.value)} />
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-bold text-gray-400 uppercase">Brand</label>
                                          <input className="w-full border rounded p-1 text-sm" value={reviewItem.data.brand} onChange={e => handleReviewChange('brand', e.target.value)} />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-400 uppercase">Name</label>
                                      <input className="w-full border rounded p-1 text-sm" value={reviewItem.data.name} onChange={e => handleReviewChange('name', e.target.value)} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                      <div>
                                          <label className="text-[10px] font-bold text-gray-400 uppercase">Price</label>
                                          <input type="number" className="w-full border rounded p-1 text-sm" value={reviewItem.data.price} onChange={e => handleReviewChange('price', parseFloat(e.target.value))} />
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-bold text-gray-400 uppercase">Currency</label>
                                          <select className="w-full border rounded p-1 text-sm bg-white" value={reviewItem.data.currency} onChange={e => handleReviewChange('currency', e.target.value)}>
                                              {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                                          </select>
                                      </div>
                                  </div>
                              </>
                          )}

                          {reviewItem.type === 'customer' && (
                              <>
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-400 uppercase">Company Name</label>
                                      <input className="w-full border rounded p-1 text-sm font-bold" value={reviewItem.data.name} onChange={e => handleReviewChange('name', e.target.value)} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                      <div>
                                          <label className="text-[10px] font-bold text-gray-400 uppercase">Contact</label>
                                          <input className="w-full border rounded p-1 text-sm" value={reviewItem.data.contactPerson} onChange={e => handleReviewChange('contactPerson', e.target.value)} />
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-bold text-gray-400 uppercase">Email</label>
                                          <input className="w-full border rounded p-1 text-sm" value={reviewItem.data.email} onChange={e => handleReviewChange('email', e.target.value)} />
                                      </div>
                                  </div>
                              </>
                          )}
                      </div>

                      <div className="flex space-x-2">
                          <button 
                              onClick={handleCancelReview}
                              className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors flex items-center justify-center"
                          >
                              <Trash2 size={14} className="mr-1"/> Cancel
                          </button>
                          <button 
                              onClick={handleConfirmSave}
                              className="flex-1 py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors flex items-center justify-center shadow-sm"
                          >
                              <Check size={14} className="mr-1"/> Confirm & Save
                          </button>
                      </div>
                  </div>
              ) : (
                  <form onSubmit={handleSend} className="p-3 bg-white border-t flex space-x-2 flex-shrink-0">
                      <input 
                        className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-shadow"
                        placeholder="Ask AI..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                      />
                      <button 
                        type="submit" 
                        disabled={isLoading || !input.trim()}
                        className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors shadow-sm"
                      >
                          <Send size={18} />
                      </button>
                  </form>
              )}
          </div>
      )}
    </>
  );
};
