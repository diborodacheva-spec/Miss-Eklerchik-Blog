
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ArticleCard from './components/ArticleCard';
import ArticleModal from './components/ArticleModal';
import AICompanion from './components/AICompanion';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import SubscribeModal from './components/SubscribeModal';
import AdminModal from './components/AdminModal';
import Pagination from './components/Pagination';
import { BLOG_ARTICLES } from './constants';
import { Article, ViewState } from './types';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { XCircle, Search, X } from 'lucide-react';

const ITEMS_PER_PAGE = 6; // Number of articles per page

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [articles, setArticles] = useState<Article[]>(BLOG_ARTICLES);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); // Search State
  const [currentPage, setCurrentPage] = useState(1); // Pagination State
  
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  
  // Site Settings State
  const [heroImageUrl, setHeroImageUrl] = useState<string | undefined>(undefined);
  const [heroDecoLeft, setHeroDecoLeft] = useState<string | undefined>(undefined);
  const [heroDecoRight, setHeroDecoRight] = useState<string | undefined>(undefined);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [aboutImageUrl, setAboutImageUrl] = useState<string | undefined>(undefined);
  const [faviconUrl, setFaviconUrl] = useState<string | undefined>(undefined);
  const [siteKeywords, setSiteKeywords] = useState<string>('мамский блог, дети, воспитание, юмор, материнство, miss eklerchik');
  const [siteTitle, setSiteTitle] = useState<string>('Miss Eklerchik | Мамский блог без цензуры');
  const [siteDescription, setSiteDescription] = useState<string>('Честный блог о материнстве, валерьянке и любви. Советы, рецепты и поддержка для уставших мам.');

  // Function to fetch articles from Supabase or fallback to constants
  const fetchArticles = async () => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('date', { ascending: false });

        if (!error && data && Array.isArray(data) && data.length > 0) {
          // DATA SANITIZATION: Ensure all required fields exist to prevent Uncaught crashes
          const safeData = data.map((item: any) => {
              try {
                  if (!item) return null;
                  // Robust defaulting for missing fields
                  return {
                      ...item,
                      content: typeof item.content === 'string' ? item.content : '',
                      excerpt: typeof item.excerpt === 'string' ? item.excerpt : '',
                      title: typeof item.title === 'string' ? item.title : 'Без названия',
                      imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : 'https://picsum.photos/800/600',
                      category: typeof item.category === 'string' ? item.category : 'Блог',
                      readTime: typeof item.readTime === 'string' ? item.readTime : '5 мин',
                      date: typeof item.date === 'string' ? item.date : 'Недавно',
                      slug: typeof item.slug === 'string' ? item.slug : (item.id || Math.random().toString())
                  };
              } catch (e) {
                  console.warn("Skipping corrupted article", e);
                  return null;
              }
          }).filter(Boolean);
          
          // DOUBLE CHECK IT IS AN ARRAY before setting state
          if (Array.isArray(safeData)) {
              setArticles(safeData as Article[]);
          }
        }
      } catch (e) {
        console.error("Failed to fetch articles, using fallback", e);
      }
    }
  };

  // Function to fetch site settings
  const fetchSiteSettings = async () => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('site_settings')
          .select('key, value');

        if (data && Array.isArray(data)) {
            const settingsMap: Record<string, string> = {};
            data.forEach((item: any) => { 
                if (item && item.key) settingsMap[item.key] = item.value; 
            });
            
            if (settingsMap['hero_image']) setHeroImageUrl(settingsMap['hero_image']);
            if (settingsMap['hero_deco_left']) setHeroDecoLeft(settingsMap['hero_deco_left']);
            if (settingsMap['hero_deco_right']) setHeroDecoRight(settingsMap['hero_deco_right']);
            if (settingsMap['logo_image']) setLogoUrl(settingsMap['logo_image']);
            if (settingsMap['about_image']) setAboutImageUrl(settingsMap['about_image']);
            if (settingsMap['favicon_url']) setFaviconUrl(settingsMap['favicon_url']);
            if (settingsMap['site_keywords']) setSiteKeywords(settingsMap['site_keywords']);
            if (settingsMap['site_title']) setSiteTitle(settingsMap['site_title']);
            if (settingsMap['site_description']) setSiteDescription(settingsMap['site_description']);
        }
      } else {
        // Fallback LocalStorage
        const img = localStorage.getItem('site_settings_hero_image');
        if (img) setHeroImageUrl(img);
        
        const left = localStorage.getItem('site_settings_hero_deco_left');
        if (left) setHeroDecoLeft(left);

        const right = localStorage.getItem('site_settings_hero_deco_right');
        if (right) setHeroDecoRight(right);

        const logo = localStorage.getItem('site_settings_logo_image');
        if (logo) setLogoUrl(logo);
        
        const about = localStorage.getItem('site_settings_about_image');
        if (about) setAboutImageUrl(about);

        const fav = localStorage.getItem('site_settings_favicon_url');
        if (fav) setFaviconUrl(fav);

        const kw = localStorage.getItem('site_settings_keywords');
        if (kw) setSiteKeywords(kw);
        
        const title = localStorage.getItem('site_settings_title');
        if (title) setSiteTitle(title);
        
        const desc = localStorage.getItem('site_settings_description');
        if (desc) setSiteDescription(desc);
      }
    } catch (e) {
      // Quiet fail, stick to default
    }
  };

  // Update Favicon Dynamically
  useEffect(() => {
    try {
      if (faviconUrl) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = faviconUrl;
      }
    } catch(e) {
      // ignore favicon errors
    }
  }, [faviconUrl]);

  // Initial fetch
  useEffect(() => {
    fetchArticles();
    fetchSiteSettings();
  }, []);

  // Callback when admin updates settings
  const handleSettingsUpdate = () => {
    fetchArticles();
    fetchSiteSettings();
  };

  // --- ADVANCED SEO HELPER ---
  const updateMetaTags = (
      title: string, 
      description: string, 
      keywords?: string, 
      imageUrl?: string, 
      url?: string, 
      type: 'website' | 'article' = 'website'
  ) => {
    try {
        // 1. Basic Meta
        if (title) document.title = title;
        
        const setMeta = (name: string, content: string) => {
            if (!content) return;
            let meta = document.querySelector(`meta[name="${name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('name', name);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        };

        const setProperty = (property: string, content: string) => {
            if (!content) return;
            let meta = document.querySelector(`meta[property="${property}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('property', property);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        };

        setMeta('description', description || '');
        setMeta('keywords', keywords || 'мамский блог, дети, воспитание, юмор, материнство, miss eklerchik');
        setMeta('robots', 'index, follow, max-image-preview:large');

        // 2. Open Graph (Facebook, LinkedIn, messengers)
        setProperty('og:title', title || '');
        setProperty('og:description', description || '');
        setProperty('og:type', type);
        setProperty('og:url', url || window.location.href);
        if (imageUrl) setProperty('og:image', imageUrl);

        // 3. Twitter Card
        setMeta('twitter:card', 'summary_large_image');
        setMeta('twitter:title', title || '');
        setMeta('twitter:description', description || '');
        if (imageUrl) setMeta('twitter:image', imageUrl);

        // 4. Canonical URL
        let linkCanonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
        if (!linkCanonical) {
            linkCanonical = document.createElement('link');
            linkCanonical.setAttribute('rel', 'canonical');
            document.head.appendChild(linkCanonical);
        }
        linkCanonical.setAttribute('href', url || window.location.href);
    } catch (e) {
        console.warn("Error updating meta tags:", e);
    }
  };

  // --- JSON-LD SCHEMA GENERATOR ---
  const updateJsonLd = (article: Article | null) => {
      try {
          const scriptId = 'json-ld-schema';
          let script = document.getElementById(scriptId) as HTMLScriptElement;
          
          if (!script) {
              script = document.createElement('script');
              script.id = scriptId;
              script.type = 'application/ld+json';
              document.head.appendChild(script);
          }

          let schemaStr = '';

          if (article) {
              // Article Schema
              const schema = {
                  "@context": "https://schema.org",
                  "@type": "BlogPosting",
                  "headline": article.seoTitle || article.title,
                  "image": [article.imageUrl, article.secondaryImageUrl].filter(Boolean),
                  "datePublished": new Date().toISOString(), 
                  "dateModified": new Date().toISOString(),
                  "author": [{
                      "@type": "Person",
                      "name": "Miss Eklerchik",
                      "url": window.location.origin
                  }],
                  "description": article.seoDescription || article.excerpt,
                  "mainEntityOfPage": {
                      "@type": "WebPage",
                      "@id": window.location.href
                  }
              };
              schemaStr = JSON.stringify(schema);
          } else {
              // Website Schema
              const schema = {
                  "@context": "https://schema.org",
                  "@type": "WebSite",
                  "name": "Miss Eklerchik",
                  "url": window.location.origin,
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": window.location.origin + "/?search={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
              };
              schemaStr = JSON.stringify(schema);
          }
          
          // Use textContent safely
          if (script.textContent !== schemaStr) {
              script.textContent = schemaStr;
          }
      } catch (e) {
          console.warn("Error updating JSON-LD:", e);
      }
  };

  // Handle URL synchronization (PATH BASED ROUTING)
  useEffect(() => {
    const handlePopState = () => {
      // Get the path, remove leading slash
      const path = window.location.pathname.substring(1);
      
      // Check if the path matches an article slug (and isn't empty or system path)
      if (path && path !== '') {
        // Decode URI component handles Cyrillic slugs if they happen
        let decodedSlug = path;
        try {
            decodedSlug = decodeURIComponent(path);
        } catch (e) {
            console.warn('Malformed URL path', e);
        }

        // Ensure articles is an array before searching
        const safeArticles = Array.isArray(articles) ? articles : [];
        const found = safeArticles.find(a => a.slug === decodedSlug || a.id === decodedSlug);
        
        if (found) {
          setSelectedArticle(found);
        } else {
          // If path exists but article not found, just show home
          // This prevents showing blank screens on invalid URLs
          setSelectedArticle(null);
        }
      } else {
        setSelectedArticle(null);
      }
    };

    // Run on mount and when articles load
    handlePopState();
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [articles]);

  // Yandex Metrika Hit Tracking for SPA
  const initialRender = useRef(true);
  useEffect(() => {
    try {
      // Skip the first render because index.html script handles the initial page load hit
      if (initialRender.current) {
        initialRender.current = false;
        return;
      }
      
      // Trigger hit on navigation (article change or returning to home)
      if (typeof window !== 'undefined' && (window as any).ym) {
          (window as any).ym(42119784, 'hit', window.location.href);
      }
    } catch (e) {
      // Ignore tracking errors to prevent app crash
      console.warn("Metrika tracking failed", e);
    }
  }, [selectedArticle?.id]);

  useEffect(() => {
    if (selectedArticle) {
      const pageUrl = `${window.location.origin}/${selectedArticle.slug}`;
      updateMetaTags(
        selectedArticle.seoTitle || `${selectedArticle.title} | Miss Eklerchik`,
        selectedArticle.seoDescription || selectedArticle.excerpt,
        selectedArticle.seoKeywords,
        selectedArticle.imageUrl,
        pageUrl,
        'article'
      );
      updateJsonLd(selectedArticle);
    } else {
      updateMetaTags(
        siteTitle,
        siteDescription,
        siteKeywords,
        heroImageUrl || 'https://picsum.photos/1200/630?random=99', // Default Social Image
        window.location.origin,
        'website'
      );
      updateJsonLd(null);
    }
  }, [selectedArticle, siteKeywords, heroImageUrl, siteTitle, siteDescription]);
  
  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    // Push clean URL: /slug
    const newUrl = `/${article.slug}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const closeModal = () => {
    setSelectedArticle(null);
    // Push home URL: /
    window.history.pushState({ path: '/' }, '', '/');
  };

  const scrollToArticles = () => {
    const element = document.getElementById('articles-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page on filter change
    setCurrentView(ViewState.HOME);
    setTimeout(() => scrollToArticles(), 100);
  };

  const resetFilter = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setCurrentPage(1); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToArticles();
  };

  const handleHomeClick = () => {
    setCurrentView(ViewState.HOME);
    setSelectedCategory(null);
    setSearchQuery('');
    setSelectedArticle(null);
    setCurrentPage(1);
    window.history.pushState({ path: '/' }, '', '/');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search
  };

  const displayContent = () => {
    if (currentView === ViewState.ABOUT) {
      const activeAboutImage = aboutImageUrl || "/about.jpg";
      
      return (
        <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
          <div className="bg-white rounded-[3rem] shadow-clay overflow-hidden border-4 border-white">
            <div className="md:flex">
              <div className="md:flex-shrink-0 relative">
                 <div className="absolute inset-0 bg-clay-purple/10 z-10"></div>
                <img 
                  className="h-full w-full object-cover md:w-96 min-h-[400px]" 
                  src={activeAboutImage} 
                  onError={(e) => {
                    e.currentTarget.src = "https://picsum.photos/800/1000?random=99";
                    e.currentTarget.onerror = null;
                  }}
                  alt="Miss Eklerchik" 
                />
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center bg-white">
                <div className="uppercase tracking-widest text-xs bg-clay-yellow/30 text-clay-text font-bold px-3 py-1 rounded-full w-fit mb-4">Кто я такая</div>
                <h2 className="mt-2 text-3xl leading-8 font-serif font-bold text-clay-text sm:text-4xl">
                  Привет, я Аня.<br/> <span className="text-clay-purple">И у меня дергается глаз.</span>
                </h2>
                <p className="mt-4 text-lg text-gray-500 leading-relaxed font-medium">
                  Этот блог — моя терапия. Я люблю своего ребенка больше жизни, но иногда я люблю тишину больше ребенка. Это нормально.
                </p>
                <p className="mt-4 text-lg text-gray-500 leading-relaxed font-medium">
                  Я не учу вас жить. Я просто рассказываю, как я выживаю, и делюсь рецептами, которые не требуют диплома шеф-повара.
                </p>
                
                <div className="mt-8 flex space-x-4">
                  <div className="text-center p-4 bg-clay-bg rounded-2xl shadow-inner">
                      <span className="block text-2xl font-bold text-clay-pink">1</span>
                      <span className="text-xs font-bold text-gray-400">Ребенок</span>
                  </div>
                  <div className="text-center p-4 bg-clay-bg rounded-2xl shadow-inner">
                      <span className="block text-2xl font-bold text-clay-teal">2</span>
                      <span className="text-xs font-bold text-gray-400">Кота</span>
                  </div>
                  <div className="text-center p-4 bg-clay-bg rounded-2xl shadow-inner">
                      <span className="block text-2xl font-bold text-clay-purple">∞</span>
                      <span className="text-xs font-bold text-gray-400">Любви</span>
                  </div>
                </div>

                <div className="mt-8">
                  <button 
                    onClick={handleHomeClick}
                    className="text-white bg-clay-text px-6 py-3 rounded-2xl font-bold hover:bg-clay-purple transition-colors shadow-plastic"
                  >
                    &larr; Обратно в дурдом
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Ensure articles is definitely an array to prevent Uncaught TypeErrors
    const safeArticles = Array.isArray(articles) ? articles : [];

    // Filter Logic
    const filteredArticles = safeArticles.filter(article => {
      // 1. Category Filter
      if (selectedCategory && article.category !== selectedCategory) {
          return false;
      }
      
      // 2. Search Filter
      if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase();
          const inTitle = (article.title || '').toLowerCase().includes(lowerQuery);
          const inExcerpt = (article.excerpt || '').toLowerCase().includes(lowerQuery);
          // Optional: search in content too (might be slower on large datasets, but fine here)
          const inContent = (article.content || '').toLowerCase().includes(lowerQuery);
          
          return inTitle || inExcerpt || inContent;
      }

      return true;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
    const paginatedArticles = filteredArticles.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );

    return (
      <>
        <Hero 
          onReadClick={scrollToArticles} 
          imageUrl={heroImageUrl}
          leftDeco={heroDecoLeft}
          rightDeco={heroDecoRight}
        />

        <main id="articles-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* SEARCH BAR UI */}
          <div className="max-w-2xl mx-auto mb-10 -mt-6 relative z-20">
             <div className="bg-white p-2 pl-5 rounded-[2rem] shadow-clay border-4 border-white flex items-center transition-all focus-within:ring-4 focus-within:ring-clay-purple/20">
                <Search size={22} className="text-clay-purple mr-3 shrink-0" strokeWidth={2.5} />
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Найти статью (например: сон, еда, нервы)..."
                    className="w-full bg-transparent border-none outline-none text-clay-text font-bold placeholder-gray-300 text-lg py-2"
                />
                {searchQuery && (
                    <button 
                        onClick={() => handleSearch('')}
                        className="p-2 text-gray-300 hover:text-clay-pink transition-colors rounded-full hover:bg-clay-bg"
                    >
                        <XCircle size={22} strokeWidth={2.5} />
                    </button>
                )}
             </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif font-bold text-clay-text">
              {selectedCategory ? `${selectedCategory}` : searchQuery ? `Результаты поиска: "${searchQuery}"` : 'Свежие истории'}
            </h2>
            {(selectedCategory || searchQuery) && (
              <button 
                onClick={resetFilter}
                className="text-clay-purple hover:text-clay-pink font-bold flex items-center bg-white px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all border-2 border-white"
              >
                <X size={18} className="mr-1" />
                Сбросить
              </button>
            )}
          </div>
          
          {paginatedArticles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedArticles.map((article) => (
                  <div key={article.id} className="h-full">
                    <ArticleCard 
                      article={article} 
                      onClick={handleArticleClick} 
                    />
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
             <div className="text-center py-20 bg-white rounded-[3rem] shadow-clay border-4 border-white">
                <div className="text-6xl mb-4">🤷‍♀️</div>
                <h3 className="text-2xl font-serif font-bold text-clay-text mb-2">Ничего не найдено</h3>
                <p className="text-gray-500 font-medium">
                   {searchQuery ? `По запросу "${searchQuery}" ничего нет.` : 'В этой категории пока пусто.'}
                   <br/> Может, поискать что-то другое?
                </p>
                <button 
                    onClick={resetFilter}
                    className="mt-6 px-6 py-3 bg-clay-purple text-white rounded-2xl font-bold shadow-plastic hover:bg-clay-purple-dark transition-all"
                >
                    Показать все статьи
                </button>
             </div>
          )}
        </main>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-clay-bg font-sans selection:bg-clay-pink selection:text-white">
      <Header 
        setView={setCurrentView} 
        onSubscribe={() => setIsSubscribeModalOpen(true)} 
        logoUrl={logoUrl}
      />
      
      {displayContent()}
      
      <Footer 
        onOpenAdmin={() => setIsAdminModalOpen(true)} 
        onCategoryClick={handleCategoryClick}
        logoUrl={logoUrl}
      />
      
      <AICompanion />
      <ScrollToTop />

      {selectedArticle && (
        <ArticleModal 
          article={selectedArticle} 
          onClose={closeModal} 
        />
      )}

      <SubscribeModal 
        isOpen={isSubscribeModalOpen} 
        onClose={() => setIsSubscribeModalOpen(false)} 
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onUpdateArticles={handleSettingsUpdate}
      />
    </div>
  );
};

export default App;
