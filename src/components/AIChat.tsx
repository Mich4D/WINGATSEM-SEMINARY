import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, MinusCircle, User, Bot, Loader2, Sparkles, RefreshCcw, ChevronDown, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateAIChatResponse } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "What programs do you offer?",
  "How do I apply for admission?",
  "Tell me about Winning Gate Seminary",
  "How can I contact the staff?"
];

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I am your **Winning Gate Seminary** AI Assistant. How can I help you today? \n\n*Feel free to ask about our programs or admission process.*',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (text?: string) => {
    const messageToSend = text || input.trim();
    if (!messageToSend || isLoading) return;

    setInput('');
    const newMessage: Message = { role: 'user', content: messageToSend, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      content: m.content
    }));

    try {
      const aiResponse = await generateAIChatResponse(messageToSend, history);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: aiResponse || 'I am sorry, I could not generate a response.', 
        timestamp: new Date() 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'There was an error communicating with the AI. Please try again.', 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { 
        role: 'assistant', 
        content: 'Chat cleared. How else can I assist you?', 
        timestamp: new Date() 
      }
    ]);
  };

  return (
    <div 
      id="ai-messenger-root"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end pointer-events-none"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, originY: 1, originX: 1 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '64px' : '550px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.9, originY: 1, originX: 1 }}
            className={`pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md w-[320px] sm:w-[380px] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden mb-4 transition-all duration-300 ring-1 ring-black/5`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-4 flex items-center justify-between text-white shrink-0 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1 opacity-10 pointer-events-none">
                <Sparkles size={48} />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-inner">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">WGTS AI Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                    <span className="text-[10px] font-medium opacity-90 uppercase tracking-wider">Ready to help</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 relative z-10">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <MinusCircle size={18} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white ml-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {messages.map((msg, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2.5 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-1 ${
                          msg.role === 'user' ? 'bg-yellow-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-yellow-600 dark:text-yellow-500'
                        }`}>
                          {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user' 
                              ? 'bg-yellow-600 text-white rounded-tr-none shadow-md' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'
                          }`}>
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900/50 prose-pre:p-2 prose-pre:rounded-lg">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                          <span className={`text-[10px] font-medium opacity-40 px-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="flex gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                          <Bot size={18} className="text-yellow-600" />
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-3 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                          <div className="flex gap-1">
                            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-yellow-600"></motion.span>
                            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-yellow-600"></motion.span>
                            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-yellow-600"></motion.span>
                          </div>
                          <span className="text-[10px] tracking-widest font-bold text-slate-400 uppercase">Processing</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Suggested Questions */}
                {messages.length === 1 && !isLoading && (
                  <div className="px-4 pb-2 flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(q)}
                        className="text-[11px] bg-slate-50 dark:bg-slate-800/50 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-slate-600 dark:text-slate-400 hover:text-yellow-700 dark:hover:text-yellow-400 py-1.5 px-3 rounded-full border border-slate-200 dark:border-slate-700 transition-all duration-200 active:scale-95"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Footer Input */}
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
                  className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3 shrink-0"
                >
                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask anything about WGTS..."
                      className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-yellow-600 focus:bg-white dark:focus:bg-slate-700 dark:text-white outline-none transition-all shadow-inner"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="bg-yellow-600 text-white p-2.5 rounded-xl hover:bg-yellow-700 active:scale-95 transition-all shadow-md shadow-yellow-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <span className="text-[9px] text-slate-400 font-medium tracking-tight">AI can make mistakes. Verify important info.</span>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.08, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          if (isOpen && isMinimized) {
            setIsMinimized(false);
          } else {
            setIsOpen(!isOpen);
            setIsMinimized(false);
          }
        }}
        className={`pointer-events-auto h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-br from-yellow-600 to-yellow-700 text-white rounded-full shadow-[0_8px_30px_rgb(202,138,4,0.3)] flex items-center justify-center hover:shadow-[0_12px_40px_rgb(202,138,4,0.4)] transition-all duration-300 border-2 border-white/20 ${
          isOpen && !isMinimized ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
      >
        <MessageCircle size={32} />
      </motion.button>
    </div>
  );
};

export default AIChat;
