
import React, { useState, useEffect, useRef } from 'react';
import { api, generateId } from '../services/api';
import { Product, Customer, Currency } from '../types';
import { Bot, Send, X, Sparkles, MessageSquare, Loader2 } from 'lucide-react';

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

export const AiAssistant: React.FC<AiAssistantProps> = ({ 
    productsCount, customersCount, quotesCount, 
    onSaveProduct, onSaveCustomer 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
      { role: 'assistant', content: 'Hi! I am your SwiftQuote AI assistant. I can help you create products, customers, or answer questions about your data.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

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
1. If the user asks to create a product, output JSON: {"action": "create_product", "data": {"sku": "...", "name": "...", "price": 0, "currency": "USD", "unit": "PCS", "description": "..."}}
2. If the user asks to create a customer, output JSON: {"action": "create_customer", "data": {"name": "...", "contactPerson": "...", "email": "..."}}
3. If the user asks a general question, just reply with text.
4. For "create_product", ensure SKU is provided. If not, generate a random one or ask. Default currency is USD unless specified.
5. If creating data, always mark note/description with "(AI Created)".
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
              try {
                  // Sometimes AI wraps JSON in ```json ... ```
                  const cleanText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
                  if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
                      const action = JSON.parse(cleanText);
                      
                      if (action.action === 'create_product') {
                          const p = action.data;
                          const newProduct: Product = {
                              id: generateId(),
                              sku: p.sku || `AI-${Math.floor(Math.random()*1000)}`,
                              name: p.name || 'New Product',
                              price: p.price || 0,
                              currency: p.currency || Currency.USD,
                              unit: p.unit || 'PCS',
                              description: p.description || '',
                              note: '(Created by AI Assistant)',
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString()
                          };
                          onSaveProduct(newProduct);
                          setMessages(prev => [...prev, { role: 'assistant', content: `✅ I've created the product: **${newProduct.sku}** - ${newProduct.name}` }]);
                      } else if (action.action === 'create_customer') {
                          const c = action.data;
                          const newCust: Customer = {
                              id: generateId(),
                              region: 'International', // Default
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
                          onSaveCustomer(newCust);
                          setMessages(prev => [...prev, { role: 'assistant', content: `✅ I've added the customer: **${newCust.name}**` }]);
                      } else {
                          // Fallback if action unknown
                          setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
                      }
                  } else {
                      // Normal text response
                      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
                  }
              } catch (parseError) {
                   // If regex fails or not JSON, just show text
                   setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
              }
          }
      } catch (err) {
          setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't reach the server." }]);
      } finally {
          setIsLoading(false);
      }
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
          <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 animate-in slide-in-from-bottom-10 fade-in duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-t-2xl flex justify-between items-center text-white">
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
                            className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
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

              {/* Input Area */}
              <form onSubmit={handleSend} className="p-3 bg-white border-t rounded-b-2xl flex space-x-2">
                  <input 
                    className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Ask to create product..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    disabled={isLoading || !input.trim()}
                    className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors"
                  >
                      <Send size={18} />
                  </button>
              </form>
          </div>
      )}
    </>
  );
};
