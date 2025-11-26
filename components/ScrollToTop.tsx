import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <div 
      className={`fixed bottom-6 left-6 z-40 transition-all duration-500 transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
      }`}
    >
      <button
        onClick={scrollToTop}
        className="bg-white text-clay-purple hover:text-clay-pink p-4 rounded-full shadow-plastic hover:shadow-clay-hover transition-all border-4 border-white hover:rotate-12 group flex items-center justify-center"
        aria-label="Вернуться наверх"
      >
        <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" strokeWidth={3} />
      </button>
    </div>
  );
};

export default ScrollToTop;