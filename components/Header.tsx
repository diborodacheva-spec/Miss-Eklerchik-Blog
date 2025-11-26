
import React, { useState, useEffect } from 'react';
import { Menu, X, Baby, User, Gem } from 'lucide-react';
import { ViewState } from '../types';

interface HeaderProps {
  setView: (view: ViewState) => void;
  onSubscribe: () => void;
  logoUrl?: string;
}

const Header: React.FC<HeaderProps> = ({ setView, onSubscribe, logoUrl }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [logoUrl]);

  const navLinks = [
    { name: 'Главная', value: ViewState.HOME },
    { name: 'Обо мне', value: ViewState.ABOUT },
  ];

  const handleNavClick = (value: ViewState) => {
    setView(value);
    setIsMobileMenuOpen(false);
  };

  const handleSubscribeClick = () => {
    onSubscribe();
    setIsMobileMenuOpen(false);
  };

  const brandUrl = "https://market.yandex.ru/search?shopPromoId=92839930_5WATME92&promo-type-name=promo-code&businessId=92839930&promoKey=FpOoVwvrfPAHLnedWYjY5g";
  const activeLogo = logoUrl || "/logo.png";

  return (
    <header className="bg-clay-bg/90 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-full shadow-clay px-6 flex justify-between items-center h-20 border-2 border-white">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer group"
            onClick={() => setView(ViewState.HOME)}
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

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-2 lg:space-x-4 items-center">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.value)}
                className="text-clay-text hover:text-clay-purple font-bold text-lg px-3 py-2 rounded-xl hover:bg-clay-bg transition-all duration-200"
              >
                {link.name}
              </button>
            ))}

            {/* BRAND LINK */}
            <a 
              href={brandUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-clay-text hover:text-clay-pink font-bold text-lg px-3 py-2 rounded-xl hover:bg-clay-bg transition-all duration-200 border-2 border-transparent hover:border-clay-pink/20"
            >
              <Gem size={18} className="mr-2 text-clay-pink" />
              Мой бренд
            </a>

            <button 
              onClick={onSubscribe}
              className="bg-clay-yellow text-clay-text px-6 py-3 rounded-full hover:bg-yellow-300 hover:-translate-y-1 transition-all shadow-plastic font-bold border-2 border-white ml-2"
            >
              Подписаться
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-clay-purple p-2 rounded-xl hover:bg-clay-pink/20 focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute w-full px-4 z-50">
          <div className="bg-white rounded-3xl shadow-clay p-4 space-y-2 border-2 border-white">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.value)}
                className="block w-full text-left px-4 py-4 rounded-2xl text-lg font-bold text-clay-text hover:bg-clay-bg"
              >
                {link.name}
              </button>
            ))}
            
            {/* Mobile Brand Link */}
            <a 
              href={brandUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center w-full text-left px-4 py-4 rounded-2xl text-lg font-bold text-clay-text hover:bg-clay-pink/10"
            >
              <Gem size={20} className="mr-3 text-clay-pink" />
              Мой бренд украшений
            </a>

            <button 
              onClick={handleSubscribeClick}
              className="block w-full text-center mt-4 bg-clay-yellow text-clay-text px-4 py-4 rounded-2xl font-bold shadow-sm"
            >
              Подписаться
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
