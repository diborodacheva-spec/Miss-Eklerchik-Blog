
import React from 'react';
import { Article } from '../types';
import { Calendar, Clock, ArrowUpRight, Hash } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  onClick: (article: Article) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  // Safety check for missing article or required props
  if (!article) return null;

  const getExcerpt = () => {
    if (article.excerpt && article.excerpt.trim().length > 0) {
        return article.excerpt;
    }
    // Fallback: Strip HTML and truncate
    const plainText = article.content?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '';
    if (!plainText) return 'Читать далее...';
    return plainText.slice(0, 140) + (plainText.length > 140 ? '...' : '');
  };

  return (
    <a 
      href={`/${article.slug || article.id}`}
      className="group relative block bg-white rounded-[2.5rem] p-3 shadow-clay hover:shadow-clay-hover transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-2 border-white h-full flex flex-col no-underline"
      onClick={(e) => {
        e.preventDefault();
        onClick(article);
      }}
    >
      {/* Image Container */}
      <div className="relative h-52 overflow-hidden rounded-[2rem] mb-4 shadow-inner">
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10"></div>
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            // Fallback if image fails
            e.currentTarget.src = 'https://picsum.photos/800/600?blur=2';
          }}
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-2xl text-xs font-bold text-clay-text shadow-sm z-20 border border-clay-bg uppercase tracking-wider">
          {article.category}
        </div>
      </div>
      
      <div className="px-2 pb-4 flex-1 flex flex-col">
        {/* Meta */}
        <div className="flex flex-wrap items-center text-gray-400 text-xs mb-3 gap-2 font-bold">
          <div className="flex items-center bg-clay-bg px-2 py-1 rounded-lg">
            <Calendar size={12} className="mr-1 text-clay-purple" />
            {article.date}
          </div>
          <div className="flex items-center bg-clay-bg px-2 py-1 rounded-lg">
            <Clock size={12} className="mr-1 text-clay-pink" />
            {article.readTime}
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-serif font-bold text-clay-text mb-3 leading-snug group-hover:text-clay-purple transition-colors">
          {article.title}
        </h3>
        
        {/* Excerpt */}
        <p className="text-gray-500 text-sm line-clamp-3 mb-4 font-medium">
          {getExcerpt()}
        </p>

        {/* Button */}
        <div className="mt-auto flex justify-end">
           <div className="w-10 h-10 rounded-full bg-clay-bg text-clay-text flex items-center justify-center group-hover:bg-clay-yellow group-hover:text-white transition-colors shadow-sm">
              <ArrowUpRight size={20} />
           </div>
        </div>
      </div>
    </a>
  );
};

export default ArticleCard;
