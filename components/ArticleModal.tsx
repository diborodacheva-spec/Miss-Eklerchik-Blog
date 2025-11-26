
import React, { useEffect, useState } from 'react';
import { Article } from '../types';
import { X, Calendar, Clock, Link, Check } from 'lucide-react';
import CommentSection from './CommentSection';

interface ArticleModalProps {
  article: Article;
  onClose: () => void;
}

const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  const [copied, setCopied] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareUrl = window.location.href;
  const shareText = `Читаю классную статью: ${article.title}`;

  const socialLinks = [
     {
      id: 'vk',
      icon: <span className="font-serif font-bold italic text-sm pr-0.5">Vk</span>,
      color: 'bg-[#0077FF] hover:bg-[#006be6]', // VK Blue
      url: `https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`
    }
  ];

  // Helper to convert display date to ISO for Schema if possible, otherwise fallback to now
  const getIsoDate = () => {
      try {
          // If date is like "2023-10-10" or ISO
          const d = new Date(article.date);
          if (!isNaN(d.getTime())) return d.toISOString();
      } catch(e) {}
      // Fallback for "Yesterday", "Just now" - use current date for Schema validity
      return new Date().toISOString();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-clay-text/40 transition-opacity backdrop-blur-sm" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div className="relative inline-block align-bottom bg-white rounded-[3rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border-4 border-white">
          
          {/* WRAPPER FOR SCHEMA.ORG MICRODATA */}
          <article itemScope itemType="http://schema.org/BlogPosting">
            
            {/* HIDDEN META DATA FOR SCHEMA */}
            <meta itemProp="mainEntityOfPage" content={window.location.href} />
            <meta itemProp="datePublished" content={getIsoDate()} />
            <meta itemProp="dateModified" content={getIsoDate()} />
            <div itemProp="author" itemScope itemType="https://schema.org/Person" className="hidden">
                <meta itemProp="name" content="Miss Eklerchik" />
                <meta itemProp="url" content={window.location.origin} />
            </div>
            <div itemProp="publisher" itemScope itemType="https://schema.org/Organization" className="hidden">
                <meta itemProp="name" content="Miss Eklerchik Blog" />
                <div itemProp="logo" itemScope itemType="https://schema.org/ImageObject">
                    <meta itemProp="url" content={`${window.location.origin}/logo.png`} />
                </div>
            </div>

            {/* Close button (Sticky) */}
            <div className="absolute top-4 right-4 z-20">
                <button
                type="button"
                className="bg-white/80 backdrop-blur rounded-full p-2 text-gray-400 hover:text-clay-purple hover:bg-white focus:outline-none shadow-sm transition-all hover:rotate-90"
                onClick={onClose}
                >
                <span className="sr-only">Close</span>
                <X size={24} />
                </button>
            </div>

            {/* Hero Image */}
            <div className="h-64 sm:h-96 w-full relative">
                <img
                src={article.imageUrl}
                alt={article.title}
                itemProp="image"
                className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-clay-text/80 to-transparent p-6 sm:p-10">
                <span 
                    itemProp="articleSection"
                    className="bg-clay-pink text-white text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block shadow-sm border border-white/20"
                >
                    {article.category}
                </span>
                <h2 
                    itemProp="headline"
                    className="text-2xl sm:text-4xl font-serif font-bold text-white leading-tight drop-shadow-md"
                >
                    {article.title}
                </h2>
                </div>
            </div>

            <div className="px-6 py-6 sm:px-10 sm:py-8 bg-white">
                {/* Meta info & Share */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-gray-500 mb-8 border-b border-gray-100 pb-4 gap-4">
                <div className="flex items-center space-x-4">
                    <span className="flex items-center font-bold bg-clay-bg px-3 py-1 rounded-xl">
                    <Calendar size={16} className="mr-2 text-clay-purple" />
                    {article.date}
                    </span>
                    <span className="flex items-center font-bold bg-clay-bg px-3 py-1 rounded-xl">
                    <Clock size={16} className="mr-2 text-clay-pink" />
                    {article.readTime}
                    </span>
                </div>
                
                <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2 hidden md:block">Поделиться:</span>
                    {socialLinks.map((link) => (
                    <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:-translate-y-1 shadow-sm ${link.color}`}
                        title={`Поделиться в ${link.id}`}
                    >
                        {link.icon}
                    </a>
                    ))}
                    
                    <button 
                    onClick={handleCopyLink}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm ${
                        copied 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-clay-bg text-clay-text hover:bg-clay-yellow hover:text-white'
                    }`}
                    title="Скопировать ссылку"
                    >
                    {copied ? <Check size={18} /> : <Link size={18} />}
                    </button>
                </div>
                </div>

                {/* Content with itemProp="articleBody" */}
                <div 
                    itemProp="articleBody"
                    className="prose prose-lg max-w-none text-gray-600 font-medium prose-headings:font-serif prose-headings:text-clay-text prose-p:mb-4 prose-li:text-gray-600 prose-strong:text-clay-purple"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />

                {/* Secondary Image (if exists) */}
                {article.secondaryImageUrl && (
                <div className="mt-10 mb-6">
                    <img 
                        src={article.secondaryImageUrl} 
                        alt={article.secondaryImageAlt || article.title}
                        title={article.secondaryImageAlt}
                        className="w-full h-auto rounded-3xl shadow-clay border-4 border-white object-cover"
                    />
                    {article.secondaryImageAlt && (
                        <p className="text-center text-gray-400 text-xs font-bold mt-2">{article.secondaryImageAlt}</p>
                    )}
                </div>
                )}

                {/* Comments Section */}
                <CommentSection articleId={article.id} />

                {/* Footer of modal */}
                <div className="mt-12 pt-8 border-t border-gray-100 flex justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-clay-bg rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-3xl">🍪</span>
                    </div>
                    <p className="font-serif font-bold text-clay-text text-lg">Miss Eklerchik</p>
                    <p className="text-gray-400 text-sm font-bold">Пишу с любовью и крошками печенья на клавиатуре.</p>
                </div>
                </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default ArticleModal;
