
import React, { useState, useEffect } from 'react';
import { Send, Mail, Heart, Baby, Lock, User } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
  onCategoryClick: (category: string) => void;
  logoUrl?: string;
}

const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onCategoryClick, logoUrl }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [logoUrl]);

  const handleLinkClick = (e: React.MouseEvent, category: string) => {
    e.preventDefault();
    onCategoryClick(category);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeLogo = logoUrl || "/logo.png";

  return (
    <footer className="bg-white mt-20 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Column 1: Brand */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div 
                className="flex items-center mb-4 cursor-pointer group"
                onClick={scrollToTop}
            >
                {!imageError ? (
                  <img 
                    src={activeLogo} 
                    alt="Miss Eklerchik Logo" 
                    className="w-12 h-12 rounded-full object-cover mr-3 shadow-inner border-2 border-white group-hover:scale-110 transition-transform duration-300"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-12 h-12 bg-clay-purple rounded-full flex items-center justify-center mr-3 text-white shadow-inner transform transition-transform group-hover:scale-110 group-hover:rotate-12 relative overflow-hidden">
                     <User size={22} className="absolute left-1.5 bottom-1.5" strokeWidth={2.5} />
                     <Baby size={18} className="absolute right-1.5 top-2" strokeWidth={2.5} />
                  </div>
                )}
                
                <span className="font-serif font-bold text-2xl text-clay-text tracking-tight">
                  Miss <span className="text-clay-pink">Eklerchik</span>
                </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs font-medium">
              Мы тут не идеальные, зато веселые. Блог для мам, которые любят своих детей, но иногда хотят спрятаться в шкафу с шоколадкой.
            </p>
          </div>

          {/* Column 2: Links */}
          <div className="flex flex-col items-center">
            <h4 className="font-bold text-clay-purple mb-6 uppercase tracking-widest text-xs bg-clay-purple/10 px-3 py-1 rounded-full">Что почитать</h4>
            <ul className="space-y-3 text-center text-gray-600 font-bold">
              <li>
                <button onClick={(e) => handleLinkClick(e, 'Выживание')} className="hover:text-clay-pink transition-colors hover:underline">
                    Как выжить
                </button>
              </li>
              <li>
                <button onClick={(e) => handleLinkClick(e, 'Еда')} className="hover:text-clay-pink transition-colors hover:underline">
                    Что поесть
                </button>
              </li>
              <li>
                <button onClick={(e) => handleLinkClick(e, 'Психология')} className="hover:text-clay-pink transition-colors hover:underline">
                    Как не убить мужа
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Social & Contact */}
          <div className="flex flex-col items-center md:items-end">
            <h4 className="font-bold text-clay-purple mb-6 uppercase tracking-widest text-xs bg-clay-purple/10 px-3 py-1 rounded-full">Давай дружить</h4>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="w-11 h-11 flex items-center justify-center bg-[#229ED9] text-white rounded-2xl hover:bg-[#1e8dbf] hover:-translate-y-1 transition-all shadow-sm" title="Telegram">
                <Send size={20} className="-ml-0.5" />
              </a>
              <a href="#" className="w-11 h-11 flex items-center justify-center bg-[#0077FF] text-white rounded-2xl hover:bg-[#006be6] hover:-translate-y-1 transition-all shadow-sm" title="ВКонтакте">
                <span className="font-serif font-bold italic text-lg pr-0.5">Vk</span>
              </a>
              <a href="#" className="w-11 h-11 flex items-center justify-center bg-clay-bg text-clay-text rounded-2xl hover:bg-clay-yellow hover:text-white hover:-translate-y-1 transition-all shadow-sm" title="Написать письмо">
                <Mail size={20} />
              </a>
            </div>
            <p className="text-xs text-gray-400 font-bold">
              © 2023 Miss Eklerchik.
            </p>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-100 flex justify-center items-center text-sm text-gray-400 font-bold relative">
          <span>Сделано с</span>
          <Heart size={16} className="mx-2 text-red-400 fill-current animate-pulse" />
          <span>и успокоительным.</span>
          
          {/* Secret Admin Button - Completely Invisible until hovered */}
          <button 
            onClick={onOpenAdmin}
            className="absolute right-0 md:right-10 opacity-0 hover:opacity-100 transition-all text-clay-purple p-2 bg-clay-purple/10 rounded-full hover:bg-clay-purple hover:text-white"
            title="Вход для автора"
          >
            <Lock size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
