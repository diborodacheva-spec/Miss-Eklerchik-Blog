
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Baby, Sparkles, Frown, Coffee, HelpCircle } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage } from '../types';

// Helper component to format text with Bold and Links
const FormattedMessage = ({ text, isUser }: { text: string, isUser: boolean }) => {
  // Regex explanation:
  // 1. (\[.+?\]\(https?:\/\/[^\s]+\)) -> Matches [Text](URL)
  // 2. (\*\*.+?\*\*) -> Matches **Bold**
  // 3. (https?:\/\/[^\s]+) -> Matches raw https://URL
  const regex = /(\[.+?\]\(https?:\/\/[^\s]+\)|\*\*.+?\*\*|https?:\/\/[^\s]+)/g;
  
  const parts = text.split(regex);

  const linkClass = isUser 
    ? "text-white underline font-bold hover:opacity-80 break-all cursor-pointer"
    : "text-blue-600 underline font-bold hover:text-blue-800 break-all cursor-pointer";

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        // 1. Handle Markdown Links: [Label](URL)
        const linkMatch = part.match(/^\[(.+?)\]\((https?:\/\/[^\s]+)\)$/);
        if (linkMatch) {
          return (
            <a 
              key={i} 
              href={linkMatch[2]} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={linkClass}
              onClick={(e) => e.stopPropagation()}
            >
              {linkMatch[1]}
            </a>
          );
        }

        // 2. Handle Bold: **Text**
        const boldMatch = part.match(/^\*\*(.+?)\*\*$/);
        if (boldMatch) {
          return <strong key={i} className="font-extrabold">{boldMatch[1]}</strong>;
        }

        // 3. Handle Raw URLs
        if (part.match(/^https?:\/\/[^\s]+$/)) {
            // Basic cleanup for trailing punctuation often found in chat (like dot at end of sentence)
            const cleanUrl = part.replace(/[.,!?)]+$/, '');
           return (
            <a 
              key={i} 
              href={cleanUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={linkClass}
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }

        // 4. Plain Text
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

const AICompanion: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Приветик! Я Мисс Эклерчик. Устала? Хочешь совет, рецепт или просто пожаловаться на мужа? Я слушаю! 😉' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const responseText = await sendMessageToGemini(textToSend);
    
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
      { label: '🆘 Хочу ныть', icon: <Frown size={14} />, text: 'Я очень устала, всё бесит, поддержи меня.' },
      { label: '🍳 Что готовить?', icon: <Coffee size={14} />, text: 'Что приготовить на ужин быстро и чтобы дети ели?' },
      { label: '💍 Хочу подарок', icon: <Sparkles size={14} />, text: 'Хочу себя порадовать, что посоветуешь?' },
      { label: '💊 Нужен совет', icon: <HelpCircle size={14} />, text: 'Дай мне мудрый (или смешной) совет на сегодня.' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 h-[600px] rounded-[2.5rem] shadow-clay mb-6 flex flex-col overflow-hidden pointer-events-auto animate-fade-in-up transform origin-bottom-right transition-all border-4 border-white">
          {/* Header */}
          <div className="bg-clay-purple p-6 rounded-t-[2.5rem] flex justify-between items-center text-white shadow-md relative overflow-hidden shrink-0">
             <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-5 -mt-5"></div>
             <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-5 -mb-5"></div>
             
            <div className="flex items-center relative z-10">
              <div className="bg-white text-clay-purple p-2 rounded-2xl mr-3 shadow-inner">
                <Baby size={20} />
              </div>
              <div>
                <h3 className="font-bold font-serif text-lg">Эклерчик-Бот</h3>
                <p className="text-xs opacity-90 font-medium bg-white/20 px-2 py-0.5 rounded-lg inline-block">Всегда онлайн</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-clay-bg space-y-4">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-4 text-sm font-medium leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-clay-purple text-white rounded-3xl rounded-br-none' 
                      : 'bg-white text-clay-text rounded-3xl rounded-bl-none border border-white'
                  }`}
                >
                  <FormattedMessage text={msg.text} isUser={msg.role === 'user'} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-3xl rounded-bl-none shadow-sm flex items-center space-x-2">
                  <span className="block w-2 h-2 bg-clay-pink rounded-full animate-bounce"></span>
                  <span className="block w-2 h-2 bg-clay-purple rounded-full animate-bounce delay-100"></span>
                  <span className="block w-2 h-2 bg-clay-yellow rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area & Quick Actions */}
          <div className="bg-white pt-2 pb-4 px-4 shrink-0">
             {/* Quick Chips */}
             <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mb-1">
                {quickActions.map((action, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleSend(action.text)}
                        disabled={isLoading}
                        className="whitespace-nowrap flex items-center px-3 py-1.5 bg-clay-bg border border-gray-100 rounded-xl text-xs font-bold text-clay-text hover:bg-clay-purple hover:text-white transition-colors shrink-0"
                    >
                        <span className="mr-1">{action.icon}</span> {action.label}
                    </button>
                ))}
             </div>

            <div className="flex items-center bg-clay-bg rounded-3xl px-2 py-2 shadow-inner">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Спроси что угодно..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-clay-text font-bold placeholder-gray-400 px-3"
                disabled={isLoading}
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={`p-3 rounded-2xl transition-all shadow-plastic ${
                  input.trim() && !isLoading 
                    ? 'bg-clay-pink text-white hover:scale-105' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
            <div className="text-center mt-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">AI для уставших мам</p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-clay-purple hover:bg-clay-purple-dark text-white p-4 w-16 h-16 rounded-[1.5rem] shadow-plastic hover:shadow-clay-hover transition-all transform hover:scale-110 hover:rotate-3 pointer-events-auto flex items-center justify-center border-4 border-white ${isOpen ? 'hidden' : ''}`}
      >
        <MessageCircle size={32} />
        <span className="absolute -top-1 -right-1 flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-clay-pink opacity-75"></span>
          <span className="relative inline-flex rounded-full h-5 w-5 bg-clay-pink border-2 border-white"></span>
        </span>
      </button>
    </div>
  );
};

export default AICompanion;
