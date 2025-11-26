
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroProps {
  onReadClick: () => void;
  imageUrl?: string;
  leftDeco?: string;
  rightDeco?: string;
}

const Hero: React.FC<HeroProps> = ({ onReadClick, imageUrl, leftDeco, rightDeco }) => {
  // Default image if none provided
  const activeImage = imageUrl || "/hero.jpg";

  // Helper to render decoration content
  const renderDeco = (value: string | undefined, defaultEmoji: string) => {
    if (!value) return <span className="text-3xl">{defaultEmoji}</span>;
    
    // Check if it looks like a URL
    if (value.startsWith('http') || value.startsWith('/')) {
        return <img src={value} alt="decoration" className="w-full h-full object-cover rounded-full" />;
    }
    
    // Otherwise treat as text/emoji
    return <span className="text-3xl">{value}</span>;
  };

  return (
    <section className="relative overflow-hidden py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
          
          {/* Text Content */}
          <div className="lg:col-span-7 text-center lg:text-left z-10 relative">
            <div className="inline-block px-4 py-2 rounded-full bg-clay-purple/10 text-clay-purple font-bold text-sm mb-6 border-2 border-clay-purple/20 transform -rotate-2">
              Блог для тех, кто не спит 😴
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-clay-text leading-tight mb-6">
              Материнство <span className="text-clay-purple inline-block transform hover:scale-105 transition-transform cursor-default">без паники</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mb-8 font-sans font-bold bg-white/60 inline-block px-6 py-3 rounded-3xl backdrop-blur-md shadow-sm">
              (и почти без <span className="text-clay-pink font-extrabold decoration-wavy underline decoration-clay-yellow">валерьянки</span>) 💊
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={onReadClick}
                className="px-8 py-4 bg-clay-purple text-white font-bold rounded-3xl shadow-plastic hover:shadow-clay-hover hover:-translate-y-1 transition-all text-lg flex items-center justify-center border-4 border-white/20"
              >
                Читать с валерьянкой
                <ArrowRight className="ml-2 h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Image Content */}
          <div className="lg:col-span-5 mt-12 lg:mt-0 relative">
            <div className="relative rounded-[3rem] overflow-hidden shadow-clay bg-white p-3 transform rotate-3 hover:rotate-0 transition-transform duration-500 border-4 border-white">
               {/* Light overlay for blending, removed dark tint */}
               <div className="absolute inset-0 bg-gradient-to-tr from-clay-purple/10 to-transparent mix-blend-overlay z-10 pointer-events-none rounded-[2.5rem]"></div>
               
               <img
                className="rounded-[2.5rem] w-full object-cover h-96 sm:h-[500px]"
                src={activeImage}
                onError={(e) => {
                    // Если ссылка битая, ставим заглушку
                    e.currentTarget.src = "https://picsum.photos/800/1000?random=55";
                    e.currentTarget.onerror = null; 
                }}
                alt="Mom with colorful toys"
              />
              
              {/* Floating decorative elements */}
              {/* Left Bottom - Yellow */}
              <div className="absolute -bottom-6 -left-6 bg-clay-yellow w-24 h-24 rounded-full border-4 border-white shadow-plastic flex items-center justify-center z-20 animate-bounce overflow-hidden">
                 {renderDeco(leftDeco, '🤪')}
              </div>
              
              {/* Right Top - Pink */}
              <div className="absolute -top-6 -right-6 bg-clay-pink w-20 h-20 rounded-3xl border-4 border-white shadow-plastic flex items-center justify-center z-20 transform rotate-12 overflow-hidden">
                 {renderDeco(rightDeco, '🍼')}
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Background decorative blobs */}
      <div className="absolute top-20 left-[-100px] w-64 h-64 bg-clay-purple/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-[-100px] w-80 h-80 bg-clay-yellow/20 rounded-full blur-3xl"></div>
    </section>
  );
};

export default Hero;
