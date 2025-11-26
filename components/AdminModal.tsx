
import React, { useEffect, useState, useRef } from 'react';
import { X, User, Database, AlertCircle, Edit2, Plus, Save, ArrowLeft, Lock, Search, Upload, Image as ImageIcon, Loader, Wand2, Gem, Settings, Smile, FileImage, Target, Globe, FileText, Sparkles, FileCode, BrainCircuit, Trash2, MessageSquareQuote, FileDown, Key, CheckCircle2, XCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Article } from '../types';
import { BLOG_ARTICLES } from '../constants';
import { generateBlogImage, suggestCategory, improveArticleContent, generateSnippet } from '../services/geminiService';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateArticles?: () => void;
}

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
  date?: string; // Legacy for localstorage
}

type Tab = 'subscribers' | 'articles' | 'settings';

// --- HELPER: ROBUST HTML CLEANER ---
const cleanArticleHtml = (html: string): string => {
  if (!html) return '';
  let content = String(html); // Force string to prevent type errors

  try {
      // 1. REMOVE HTML COMMENTS
      content = content.replace(/<!--[\s\S]*?-->/g, '');

      // 2. REMOVE SCRIPTS & STYLES (Case insensitive, multiline)
      content = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gim, "");
      content = content.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gim, "");

      // 3. REMOVE ALL LINKS (<a>) BUT KEEP TEXT
      content = content.replace(/<\/?a\b[^>]*>/gi, "");

      // 4. REMOVE WORDPRESS SHORTCODES [caption...] or [gallery...]
      content = content.replace(/\[\/?[\w-]+[^\]]*\]/g, '');

      // 5. REMOVE SPECIFIC ATTRIBUTES
      // Use a simple loop to remove attributes safely instead of complex regex
      const attributesToRemove = ['style', 'class', 'width', 'height', 'id', 'align', 'face', 'dir', 'lang'];
      
      let safetyCounter = 0;
      attributesToRemove.forEach(attr => {
          // Safety break to prevent infinite loops on malformed regex
          if (safetyCounter > 1000) return;
          safetyCounter++;

          const regex = new RegExp(`\\s${attr}=["'][^"']*["']`, 'gi');
          content = content.replace(regex, '');
          // Also try unquoted (simple)
          const regexSimple = new RegExp(`\\s${attr}=[^\\s>]+`, 'gi');
          content = content.replace(regexSimple, '');
      });

      // Remove data-* attributes
      content = content.replace(/\sdata-[a-z0-9\-]+="[^"]*"/gi, '');

      // 6. REMOVE SPAN TAGS BUT KEEP TEXT
      content = content.replace(/<\/?span\b[^>]*>/gi, "");
      
      // 7. REMOVE EMPTY P TAGS AND &nbsp;
      content = content.replace(/&nbsp;/gi, ' ');
      content = content.replace(/<p>\s*<\/p>/gi, '');
      
      // 8. NORMALIZE WHITESPACE
      content = content.replace(/\n\s*\n/g, '\n');
  } catch (e) {
      console.warn("Error during HTML cleaning, returning original content", e);
      return html || '';
  }

  return content;
};

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onUpdateArticles }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('subscribers');
  
  // Subscriber State
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  
  // Article State
  const [articles, setArticles] = useState<Article[]>([]);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  
  // Settings State
  const [heroImageSetting, setHeroImageSetting] = useState<string>('');
  const [heroDecoLeft, setHeroDecoLeft] = useState<string>('');
  const [heroDecoRight, setHeroDecoRight] = useState<string>('');
  const [logoImageSetting, setLogoImageSetting] = useState<string>('');
  const [aboutImageSetting, setAboutImageSetting] = useState<string>('');
  const [faviconUrl, setFaviconUrl] = useState<string>('');
  const [siteKeywords, setSiteKeywords] = useState<string>('');
  const [siteTitle, setSiteTitle] = useState<string>('');
  const [siteDescription, setSiteDescription] = useState<string>('');
  
  // Ad Generator State
  const [showAdGenerator, setShowAdGenerator] = useState(false);
  const [adConfig, setAdConfig] = useState({
      name: 'Кольцо "Антистресс"',
      price: '2 500 ₽',
      url: 'https://market.yandex.ru/search?shopPromoId=92839930_5WATME92&promo-type-name=promo-code&businessId=92839930&promoKey=FpOoVwvrfPAHLnedWYjY5g',
      imageUrl: 'https://avatars.mds.yandex.net/get-mpic/5235286/img_id5676798159368923295.jpeg/orig'
  });

  // Smart Paste State
  const [showSmartPaste, setShowSmartPaste] = useState(false);
  const [smartPasteContent, setSmartPasteContent] = useState('');
  
  // Import Options
  const [addAdToImport, setAddAdToImport] = useState(false);
  const [cleanTrash, setCleanTrash] = useState(true); // Default true for cleaning

  // Common State
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Image Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const [isImportingXml, setIsImportingXml] = useState(false);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
  const [isAiImproving, setIsAiImproving] = useState(false);
  const [isGeneratingSnippet, setIsGeneratingSnippet] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondFileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const aboutFileInputRef = useRef<HTMLInputElement>(null);
  const decoLeftInputRef = useRef<HTMLInputElement>(null);
  const decoRightInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const xmlInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '561296') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin('');
    }
  };

  const handleSupabaseError = (error: any, context: 'upload' | 'save') => {
    console.error(`${context} error:`, error);
    
    if (error.message && error.message.includes('row-level security')) {
       const action = context === 'upload' ? 'загрузку файла' : 'сохранение данных';
       const fix = context === 'upload' 
         ? '1. Зайдите в Supabase -> Storage -> Policies.\n2. Для "article-images" добавьте Policy.\n3. Разрешите INSERT/UPDATE/SELECT для public/anon.'
         : '1. Зайдите в Supabase -> SQL Editor.\n2. Выполните команду:\nALTER TABLE articles DISABLE ROW LEVEL SECURITY;\nALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;';
       
       alert(`🛑 ОШИБКА ДОСТУПА (RLS) 🛑\n\nSupabase блокирует ${action}.\n\nКАК ИСПРАВИТЬ:\n${fix}`);
    } else {
       alert(`Ошибка: ${error.message || 'Неизвестная ошибка'}`);
    }
  };

  const fetchSubscribers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('subscribers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSubscribers(data || []);
      } else {
        const stored = localStorage.getItem('miss_eklerchik_subscribers');
        if (stored) {
          try {
            if (stored === "undefined" || stored === "null") {
                setSubscribers([]);
                return;
            }
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
               setSubscribers(parsed);
            } else {
               setSubscribers([]);
            }
          } catch (e) {
            console.error("Failed to parse subscribers", e);
            setSubscribers([]);
          }
        } else {
            setSubscribers([]);
        }
      }
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки подписчиков");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false }); 

        if (error) throw error;
        if (data && data.length > 0) {
            setArticles(data as Article[]);
        } else {
             setArticles(BLOG_ARTICLES);
        }
      } else {
        setArticles(BLOG_ARTICLES);
      }
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки статей");
       setArticles(BLOG_ARTICLES);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
     setIsLoading(true);
     try {
        if (isSupabaseConfigured()) {
            const { data } = await supabase
                .from('site_settings')
                .select('key, value');
            
            if (data) {
                const map: Record<string, string> = {};
                data.forEach((item: any) => { map[item.key] = item.value; });
                if (map['hero_image']) setHeroImageSetting(map['hero_image']);
                if (map['hero_deco_left']) setHeroDecoLeft(map['hero_deco_left']);
                if (map['hero_deco_right']) setHeroDecoRight(map['hero_deco_right']);
                if (map['logo_image']) setLogoImageSetting(map['logo_image']);
                if (map['about_image']) setAboutImageSetting(map['about_image']);
                if (map['favicon_url']) setFaviconUrl(map['favicon_url']);
                if (map['site_keywords']) setSiteKeywords(map['site_keywords']);
                if (map['site_title']) setSiteTitle(map['site_title']);
                if (map['site_description']) setSiteDescription(map['site_description']);
            }
        } else {
            const img = localStorage.getItem('site_settings_hero_image');
            if (img && img !== "undefined") setHeroImageSetting(img);
            
            const left = localStorage.getItem('site_settings_hero_deco_left');
            if (left && left !== "undefined") setHeroDecoLeft(left);
            
            const right = localStorage.getItem('site_settings_hero_deco_right');
            if (right && right !== "undefined") setHeroDecoRight(right);
            
            const logo = localStorage.getItem('site_settings_logo_image');
            if (logo && logo !== "undefined") setLogoImageSetting(logo);

            const about = localStorage.getItem('site_settings_about_image');
            if (about && about !== "undefined") setAboutImageSetting(about);
            
            const fav = localStorage.getItem('site_settings_favicon_url');
            if (fav && fav !== "undefined") setFaviconUrl(fav);

            const kw = localStorage.getItem('site_settings_keywords');
            if (kw && kw !== "undefined") setSiteKeywords(kw);
            
            const title = localStorage.getItem('site_settings_title');
            if (title && title !== "undefined") setSiteTitle(title);
            
            const desc = localStorage.getItem('site_settings_description');
            if (desc && desc !== "undefined") setSiteDescription(desc);
        }
     } catch (e) {
         console.error(e);
     } finally {
         setIsLoading(false);
     }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      if (activeTab === 'subscribers') fetchSubscribers();
      if (activeTab === 'articles') fetchArticles();
      if (activeTab === 'settings') fetchSettings();
    }
  }, [isOpen, activeTab, isAuthenticated]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'deco_left' | 'deco_right' | 'logo' | 'article' | 'article_secondary' | 'about' | 'favicon') => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    if (!isSupabaseConfigured()) {
        alert("Для загрузки фото нужно подключить Supabase!");
        return;
    }

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const folder = (type === 'article' || type === 'article_secondary') ? '' : 'hero/';
    const filePath = `${folder}${fileName}`;

    setIsUploading(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      if (type === 'hero') setHeroImageSetting(publicUrl);
      else if (type === 'deco_left') setHeroDecoLeft(publicUrl);
      else if (type === 'deco_right') setHeroDecoRight(publicUrl);
      else if (type === 'logo') setLogoImageSetting(publicUrl);
      else if (type === 'about') setAboutImageSetting(publicUrl);
      else if (type === 'favicon') setFaviconUrl(publicUrl);
      else if (type === 'article') setEditingArticle(prev => prev ? ({ ...prev, imageUrl: publicUrl }) : null);
      else if (type === 'article_secondary') setEditingArticle(prev => prev ? ({ ...prev, secondaryImageUrl: publicUrl }) : null);

    } catch (error: any) {
      handleSupabaseError(error, 'upload');
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const getAdHtml = () => {
     return `
<div class="my-8 p-6 bg-white rounded-3xl shadow-clay border-2 border-clay-pink/20 flex flex-col sm:flex-row items-center gap-6 not-prose relative overflow-hidden">
  <div class="absolute top-0 right-0 bg-clay-pink text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">РЕКОМЕНДУЮ</div>
  <img src="${adConfig.imageUrl}" alt="Реклама" class="w-32 h-32 rounded-2xl object-cover shadow-sm border-2 border-white flex-shrink-0" />
  <div class="text-center sm:text-left flex-1">
    <h4 class="font-serif font-bold text-xl text-clay-text mb-1">Порадуй себя</h4>
    <p class="text-sm text-gray-500 mb-4 font-bold">Скидки на Яндекс Маркете по промокоду.</p>
    <div class="flex flex-col sm:flex-row items-center gap-4">
       <a href="${adConfig.url}" target="_blank" class="inline-block px-6 py-2 bg-clay-pink text-white rounded-xl font-bold shadow-md hover:scale-105 transition-transform no-underline">
          Перейти к покупкам →
       </a>
    </div>
  </div>
</div>`;
  };

  // --- XML UPLOAD LOGIC FOR WORDPRESS EXPORT ---
  const handleXmlUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    if (!isSupabaseConfigured()) {
        alert("Для импорта XML нужно подключить Supabase!");
        return;
    }

    const file = event.target.files[0];
    setIsImportingXml(true);

    try {
        const text = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const items = xmlDoc.querySelectorAll('item');
        
        if (items.length === 0) {
            alert("В файле не найдены статьи (<item>). Убедитесь, что это формат WordPress Export.");
            return;
        }

        let importedCount = 0;
        const ru: {[key: string]: string} = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };

        const batch: any[] = [];
        const adBlock = getAdHtml();

        items.forEach(item => {
            // 1. Title
            const title = item.querySelector('title')?.textContent || 'Без названия';
            if (title === 'Без названия') return; // Skip empty

            // 2. Content
            let content = item.getElementsByTagName('content:encoded')[0]?.textContent || '';
            
            // Apply cleanup if requested
            if (cleanTrash) {
                content = cleanArticleHtml(content);
            } else {
                 // Minimal cleanup
                 content = content.replace(/\[caption[^\]]*\]/g, '').replace(/\[\/caption\]/g, '');
            }
            
            // Add basic formatting if missing <p> tags
            if (!content.includes('<p>')) {
                content = content.split('\n').filter(l => l.trim()).map(l => `<p class="mb-4">${l}</p>`).join('');
            }

            // INJECT ADVERTISEMENT IF CHECKED
            if (addAdToImport) {
                // Find index of 2nd closing </p> tag
                let pos = -1;
                let count = 0;
                const regex = /<\/p>/gi;
                let match;
                
                while ((match = regex.exec(content)) !== null) {
                    count++;
                    if (count === 2) {
                        pos = match.index + 4; // length of </p> is 4
                        break;
                    }
                }
                
                if (pos !== -1) {
                    // Insert after 2nd paragraph
                    content = content.slice(0, pos) + adBlock + content.slice(pos);
                } else {
                    // Fallback: Append to end
                    content += adBlock;
                }
            }

            // 3. Date Safe Parsing
            const wpDate = item.getElementsByTagName('wp:post_date')[0]?.textContent;
            const pubDate = item.querySelector('pubDate')?.textContent;
            const dateToUse = wpDate || pubDate;
            let dateStr = new Date().toLocaleDateString('ru-RU');
            if (dateToUse) {
                const d = new Date(dateToUse);
                if (!isNaN(d.getTime())) {
                    dateStr = d.toLocaleDateString('ru-RU');
                }
            }

            // 4. Category
            const category = item.querySelector('category')?.textContent || 'Блог';

            // 5. Slug
            let slug = item.getElementsByTagName('wp:post_name')[0]?.textContent;
            if (!slug) {
                slug = title.toLowerCase().split('').map(char => ru[char] || char).join('').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            }

            // 6. SEO Data
            const metaTags = item.getElementsByTagName('wp:postmeta');
            let extractedSeoTitle = '';
            let extractedSeoDesc = '';
            let extractedSeoKw = '';

            for (let i = 0; i < metaTags.length; i++) {
                const key = metaTags[i].getElementsByTagName('wp:meta_key')[0]?.textContent;
                const val = metaTags[i].getElementsByTagName('wp:meta_value')[0]?.textContent;

                if (!key || !val) continue;

                if (['_yoast_wpseo_title', '_aioseop_title', 'rank_math_title'].includes(key)) extractedSeoTitle = val;
                if (['_yoast_wpseo_metadesc', '_aioseop_description', 'rank_math_description'].includes(key)) extractedSeoDesc = val;
                if (['_yoast_wpseo_focuskw', '_aioseop_keywords', 'rank_math_focus_keyword'].includes(key)) extractedSeoKw = val;
            }

            // Fallback SEO
            const plainText = content.replace(/<[^>]*>?/gm, '');
            const excerpt = plainText.substring(0, 150) + '...';

            batch.push({
                title,
                content,
                date: dateStr,
                category,
                slug,
                excerpt,
                readTime: '5 мин',
                imageUrl: 'https://picsum.photos/800/600?random=' + Math.floor(Math.random() * 1000),
                seoTitle: extractedSeoTitle || title,
                seoDescription: extractedSeoDesc || excerpt,
                seoKeywords: extractedSeoKw
            });
            importedCount++;
        });

        if (batch.length > 0) {
            const { error } = await supabase.from('articles').upsert(batch, { onConflict: 'slug' });
            if (error) throw error;
            
            alert(`Успешно импортировано статей: ${importedCount}! \n(SEO сохранено${cleanTrash ? ', мусор очищен' : ''}${addAdToImport ? ', реклама добавлена' : ''})`);
            fetchArticles();
            if (onUpdateArticles) onUpdateArticles();
        }

    } catch (e: any) {
        console.error(e);
        alert("Ошибка при разборе XML: " + e.message);
    } finally {
        setIsImportingXml(false);
        if (event.target) event.target.value = '';
    }
  };

  const handleGlobalCleanup = async () => {
      if (!confirm("ВЫ УВЕРЕНЫ? \n\nЭто действие пройдет по ВСЕМ статьям в базе данных и удалит:\n- Inline стили\n- Классы\n- Ссылки (оставит текст)\n- Скрипты и мусорный код.\n\nЭто сделает статьи красивыми и единообразными, но может сломать сложную верстку.")) return;
      
      if (!isSupabaseConfigured()) {
          alert("Нужен Supabase.");
          return;
      }

      setIsCleaning(true);
      try {
          // 1. Fetch all existing articles
          const { data: allArticles, error } = await supabase.from('articles').select('*');
          if (error) throw error;
          if (!allArticles || allArticles.length === 0) {
              alert("Статей нет.");
              return;
          }

          const updates = allArticles.map((article: any) => {
              const content = article.content || '';
              const cleanedContent = cleanArticleHtml(content);

              return {
                  ...article,
                  content: cleanedContent
              };
          });

          // 2. Bulk Upsert
          const { error: upsertError } = await supabase.from('articles').upsert(updates);
          if (upsertError) throw upsertError;

          alert(`Готово! Очищено статей: ${updates.length}. Теперь они выглядят аккуратно.`);
          fetchArticles();
          if (onUpdateArticles) onUpdateArticles();

      } catch (e: any) {
          console.error(e);
          alert("Ошибка очистки: " + e.message);
      } finally {
          setIsCleaning(false);
      }
  };

  const handleDownloadSitemap = async () => {
      setIsGeneratingSitemap(true);
      try {
          let articlesForSitemap: {slug: string, date: string}[] = [];
          
          if (isSupabaseConfigured()) {
              const { data, error } = await supabase
                .from('articles')
                .select('slug, date');
              if (data && !error) {
                  articlesForSitemap = data as any[];
              }
          } else {
              // Fallback to constants
              articlesForSitemap = BLOG_ARTICLES.map(a => ({
                  slug: a.slug || a.id,
                  date: new Date().toISOString() // fallback
              }));
          }

          // Build XML String
          const baseUrl = 'https://miss-eklerchik.ru';
          const today = new Date().toISOString().split('T')[0];

          let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

          articlesForSitemap.forEach(art => {
             // Try to format date to YYYY-MM-DD
             let dateStr = today;
             try {
                 if (art.date) {
                     // If it's ISO
                     if (art.date.includes('-') && art.date.length >= 10) {
                         dateStr = new Date(art.date).toISOString().split('T')[0];
                     } else {
                         // If it's Russian formatted DD.MM.YYYY or textual
                         // Just use current date to be safe for validators
                     }
                 }
             } catch(e) {}

             xml += `
  <url>
    <loc>${baseUrl}/${art.slug}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
          });

          xml += `
</urlset>`;

          // Trigger Download
          const blob = new Blob([xml], { type: 'text/xml' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'sitemap.xml';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

      } catch (e) {
          console.error(e);
          alert("Ошибка генерации карты сайта");
      } finally {
          setIsGeneratingSitemap(false);
      }
  };

  // --- AI IMAGE GENERATION LOGIC ---
  const handleGenerateAiImage = async () => {
      if (!editingArticle?.title) {
          alert("Сначала введите заголовок статьи!");
          return;
      }
      if (!isSupabaseConfigured()) {
          alert("Для сохранения AI-картинки нужен Supabase!");
          return;
      }

      setIsGeneratingAiImage(true);
      try {
          // 1. Generate Base64
          const base64Data = await generateBlogImage(editingArticle.title);
          
          if (!base64Data) {
              throw new Error("Не удалось сгенерировать изображение (пустой ответ от AI).");
          }

          // 2. Convert Base64 to Blob
          const binaryString = window.atob(base64Data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
             bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'image/png' });
          const file = new File([blob], `ai-gen-${Date.now()}.png`, { type: 'image/png' });

          // 3. Upload to Supabase
          const fileName = `${Date.now()}-ai-gen.png`;
          const filePath = `${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('article-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from('article-images')
            .getPublicUrl(filePath);

          // 4. Set URL to state
          setEditingArticle(prev => prev ? ({ ...prev, imageUrl: data.publicUrl }) : null);

      } catch (e: any) {
          console.error(e);
          alert("Ошибка генерации: " + e.message);
      } finally {
          setIsGeneratingAiImage(false);
      }
  };

  const handleSuggestCategory = async () => {
      if (!editingArticle?.title && !editingArticle?.content) {
          alert("Заполните заголовок или текст, чтобы ИИ мог определить тему.");
          return;
      }
      setIsSuggestingCategory(true);
      try {
          const cat = await suggestCategory(editingArticle.title || '', editingArticle.content || '');
          setEditingArticle(prev => prev ? ({ ...prev, category: cat }) : null);
      } catch (e) {
          console.error(e);
      } finally {
          setIsSuggestingCategory(false);
      }
  };
  
  const handleAiImprove = async () => {
      if (!editingArticle?.content) {
          alert("Нет текста для редактирования");
          return;
      }
      setIsAiImproving(true);
      try {
          const improved = await improveArticleContent(editingArticle.content);
          if (improved) {
              setEditingArticle(prev => prev ? ({ ...prev, content: improved }) : null);
          } else {
              alert("ИИ не смог обработать текст. Попробуйте позже.");
          }
      } catch (e) {
          console.error(e);
          alert("Ошибка при обращении к ИИ");
      } finally {
          setIsAiImproving(false);
      }
  };

  const handleGenerateSnippet = async () => {
      if (!editingArticle?.content && !editingArticle?.title) {
          alert("Нужен текст или заголовок для генерации описания.");
          return;
      }
      setIsGeneratingSnippet(true);
      try {
          const snippet = await generateSnippet(editingArticle.title || '', editingArticle.content || '');
          if (snippet) {
              setEditingArticle(prev => prev ? ({ ...prev, excerpt: snippet }) : null);
          } else {
              alert("Не удалось создать описание.");
          }
      } catch(e) {
          console.error(e);
      } finally {
          setIsGeneratingSnippet(false);
      }
  };

  const saveSettings = async () => {
      setSaveStatus('saving');
      try {
        if (isSupabaseConfigured()) {
            const updates = [
                { key: 'hero_image', value: heroImageSetting },
                { key: 'hero_deco_left', value: heroDecoLeft },
                { key: 'hero_deco_right', value: heroDecoRight },
                { key: 'logo_image', value: logoImageSetting },
                { key: 'about_image', value: aboutImageSetting },
                { key: 'favicon_url', value: faviconUrl },
                { key: 'site_keywords', value: siteKeywords },
                { key: 'site_title', value: siteTitle },
                { key: 'site_description', value: siteDescription }
            ];
            
            const { error } = await supabase
                .from('site_settings')
                .upsert(updates, { onConflict: 'key' });
            
            if (error) throw error;
        } else {
            localStorage.setItem('site_settings_hero_image', heroImageSetting);
            localStorage.setItem('site_settings_hero_deco_left', heroDecoLeft);
            localStorage.setItem('site_settings_hero_deco_right', heroDecoRight);
            localStorage.setItem('site_settings_logo_image', logoImageSetting);
            localStorage.setItem('site_settings_about_image', aboutImageSetting);
            localStorage.setItem('site_settings_favicon_url', faviconUrl);
            localStorage.setItem('site_settings_keywords', siteKeywords);
            localStorage.setItem('site_settings_title', siteTitle);
            localStorage.setItem('site_settings_description', siteDescription);
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        if (onUpdateArticles) onUpdateArticles();
      } catch (e: any) {
          setSaveStatus('error');
          handleSupabaseError(e, 'save');
      }
  };

  const isUUID = (str: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(str);
  };

  const handleSaveArticle = async () => {
    if (!editingArticle) return;
    setSaveStatus('saving');

    try {
        if (!isSupabaseConfigured()) {
            throw new Error("Для редактирования нужно подключить Supabase!");
        }

        const articleToSave: any = {
            ...editingArticle,
            slug: editingArticle.slug || `article-${Date.now()}`,
            date: editingArticle.date || new Date().toLocaleDateString('ru-RU'),
            readTime: editingArticle.readTime || '5 мин',
            category: editingArticle.category || 'Разное',
            imageUrl: editingArticle.imageUrl || 'https://picsum.photos/800/600',
            secondaryImageUrl: editingArticle.secondaryImageUrl || null,
            secondaryImageAlt: editingArticle.secondaryImageAlt || null,
            seoKeywords: editingArticle.seoKeywords || null,
        };

        if (articleToSave.id && !isUUID(articleToSave.id)) {
            delete articleToSave.id; 
        }

        if (!articleToSave.id) {
             const { error } = await supabase.from('articles').insert([articleToSave]);
             if(error) throw error;
        } else {
             const { error } = await supabase.from('articles').upsert(articleToSave);
             if(error) throw error;
        }

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        setEditingArticle(null); 
        fetchArticles(); 
        if (onUpdateArticles) onUpdateArticles(); 
    } catch (e: any) {
        setSaveStatus('error');
        handleSupabaseError(e, 'save');
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту статью? Это действие необратимо.")) return;

    setIsLoading(true);
    try {
        if (isSupabaseConfigured()) {
            const { error } = await supabase
                .from('articles')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            await fetchArticles();
            if (onUpdateArticles) onUpdateArticles();
        } else {
            alert("Удаление работает только с подключенным Supabase.");
        }
    } catch (e: any) {
        handleSupabaseError(e, 'save');
    } finally {
        setIsLoading(false);
    }
  };

  const createNewArticle = () => {
      setEditingArticle({
          title: '',
          excerpt: '',
          content: '<p>Начните писать здесь...</p>',
          category: 'Жизнь',
          slug: '',
          imageUrl: '',
          secondaryImageUrl: '',
          secondaryImageAlt: '',
          seoKeywords: '',
          seoTitle: '',
          seoDescription: ''
      });
  };

  // --- SMART PASTE LOGIC ---
  const processSmartPaste = () => {
    if (!smartPasteContent.trim()) return;

    const lines = smartPasteContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return;

    const title = lines[0];
    
    // Transliterate for slug
    const ru: {[key: string]: string} = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };
    const slug = title.toLowerCase().split('').map(char => ru[char] || char).join('').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    // SEO Logic
    const excerpt = lines.slice(1, 2).join(' ').substring(0, 160);
    const seoTitle = title;
    const seoDescription = excerpt;

    // HTML Content
    const contentHtml = lines.slice(1).map(line => `<p>${line}</p>`).join('\n');

    setEditingArticle({
        ...editingArticle,
        title: title,
        slug: slug,
        content: contentHtml,
        excerpt: excerpt + '...',
        seoTitle: seoTitle,
        seoDescription: seoDescription,
        date: new Date().toLocaleDateString('ru-RU'),
        category: 'Новое',
        readTime: '5 мин'
    });

    setShowSmartPaste(false);
    setSmartPasteContent('');
  };

  const insertAdHtml = () => {
      if (!editingArticle) return;
      const adHtml = `
<div class="my-8 p-6 bg-white rounded-3xl shadow-clay border-2 border-clay-pink/20 flex flex-col sm:flex-row items-center gap-6 not-prose relative overflow-hidden">
  <div class="absolute top-0 right-0 bg-clay-pink text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">РЕКОМЕНДУЮ</div>
  <img src="${adConfig.imageUrl}" alt="${adConfig.name}" class="w-32 h-32 rounded-2xl object-cover shadow-sm border-2 border-white flex-shrink-0" />
  <div class="text-center sm:text-left flex-1">
    <h4 class="font-serif font-bold text-xl text-clay-text mb-1">${adConfig.name}</h4>
    <p class="text-sm text-gray-500 mb-4 font-bold">Идеально, чтобы порадовать себя.</p>
    <div class="flex flex-col sm:flex-row items-center gap-4">
       <span class="text-2xl font-bold text-clay-purple">${adConfig.price}</span>
       <a href="${adConfig.url}" target="_blank" class="inline-block px-6 py-2 bg-clay-pink text-white rounded-xl font-bold shadow-md hover:scale-105 transition-transform no-underline">
          Хочу купить →
       </a>
    </div>
  </div>
</div>`;
      setEditingArticle({
          ...editingArticle,
          content: (editingArticle.content || '') + adHtml
      });
      setShowAdGenerator(false);
  };

  const generateSlugFromTitle = () => {
    if (!editingArticle?.title) return;
    const ru: {[key: string]: string} = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };
    const slug = editingArticle.title.toLowerCase().split('').map(char => ru[char] || char).join('').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    setEditingArticle({...editingArticle, slug});
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '---';
    try { return new Date(dateString).toLocaleString('ru-RU'); } catch { return dateString; }
  };

  const renderDecoPreview = (value: string, defaultText: string) => {
      if (!value) return <span className="text-2xl">{defaultText}</span>;
      if (value.startsWith('http') || value.startsWith('/')) {
          return <img src={value} className="w-full h-full object-cover rounded-full" alt="preview" />;
      }
      return <span className="text-2xl">{value}</span>;
  };

  // Check API Key status
  const apiKeyStatus = !!process.env.API_KEY;

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
       <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-center justify-center min-h-screen px-4 text-center">
           <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
           <div className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full border-4 border-clay-purple">
              <div className="mx-auto w-16 h-16 bg-clay-bg rounded-full flex items-center justify-center mb-4 text-clay-purple">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-serif font-bold text-clay-text mb-2">Секретная зона</h3>
              <p className="text-gray-500 text-sm mb-6">Введите PIN-код для входа.</p>
              <form onSubmit={handleLogin}>
                <input 
                  type="password" 
                  autoFocus
                  maxLength={6}
                  className="w-full text-center text-3xl tracking-[0.5em] font-bold border-2 border-gray-200 rounded-xl p-3 mb-4 focus:border-clay-purple outline-none text-clay-text"
                  placeholder="••••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
                {pinError && <p className="text-red-500 text-xs font-bold mb-4">Неверный код</p>}
                <button type="submit" className="w-full bg-clay-purple text-white font-bold py-3 rounded-xl shadow-plastic hover:bg-clay-purple-dark transition-colors">Войти</button>
              </form>
              <button onClick={onClose} className="mt-4 text-gray-400 text-xs font-bold hover:text-clay-text">Отмена</button>
           </div>
        </div>
       </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="relative inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border-4 border-clay-purple flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="bg-clay-purple px-6 py-4 flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar">
                <h3 className="text-xl font-bold text-white flex items-center mr-4 whitespace-nowrap">
                    <Database className="mr-2" /> 
                    Админка
                </h3>
                <div className="flex space-x-2 bg-white/20 rounded-lg p-1">
                    <button onClick={() => setActiveTab('subscribers')} className={`px-3 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${activeTab === 'subscribers' ? 'bg-white text-clay-purple' : 'text-white hover:bg-white/10'}`}>
                        Подписчики
                    </button>
                    <button onClick={() => setActiveTab('articles')} className={`px-3 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${activeTab === 'articles' ? 'bg-white text-clay-purple' : 'text-white hover:bg-white/10'}`}>
                        Статьи
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`px-3 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'bg-white text-clay-purple' : 'text-white hover:bg-white/10'}`}>
                        Настройки
                    </button>
                </div>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1 flex-shrink-0 ml-2">
              <X size={24} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-clay-bg p-6 relative">
            
            {/* --- SUBSCRIBERS TAB --- */}
            {activeTab === 'subscribers' && (
                <div className="space-y-4">
                    {!isSupabaseConfigured() && (
                        <div className="p-4 bg-yellow-50 rounded-xl text-xs text-gray-600 border border-yellow-200">
                            <p className="font-bold mb-2 text-yellow-700">Режим локального хранилища</p>
                            <p>Чтобы видеть реальных подписчиков, создайте таблицу <code>subscribers</code> в Supabase.</p>
                        </div>
                    )}
                    {isLoading ? (
                        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clay-purple"></div></div>
                    ) : subscribers.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 font-bold">Нет подписчиков</div>
                    ) : (
                        <ul className="space-y-2">
                            {subscribers.map((sub, index) => (
                            <li key={sub.id || index} className="bg-white p-3 rounded-xl shadow-sm flex justify-between items-center">
                                <div className="flex items-center">
                                <div className="bg-clay-bg p-2 rounded-full mr-3 text-clay-purple"><User size={16} /></div>
                                <div>
                                    <p className="font-bold text-clay-text text-sm">{sub.email}</p>
                                    <p className="text-[10px] text-gray-400">{formatDate(sub.created_at || sub.date)}</p>
                                </div>
                                </div>
                            </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* --- SETTINGS TAB --- */}
            {activeTab === 'settings' && (
                <div className="space-y-6 animate-fade-in">
                    {!isSupabaseConfigured() && (
                        <div className="mb-4 p-3 bg-yellow-50 rounded-xl text-xs text-yellow-700 border border-yellow-200">
                            Для полноценной работы нужна таблица <code>site_settings (key text pk, value text)</code>
                        </div>
                    )}

                    {/* API KEY STATUS */}
                    <div className={`p-4 rounded-2xl border border-white shadow-sm flex items-center justify-between ${apiKeyStatus ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                        <div className="flex items-center">
                            <div className={`p-2 rounded-full mr-3 ${apiKeyStatus ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                <Key size={20} />
                            </div>
                            <div>
                                <h4 className={`font-bold text-sm ${apiKeyStatus ? 'text-green-800' : 'text-red-800'}`}>
                                    API Key Status
                                </h4>
                                <p className="text-xs text-gray-500 font-medium">
                                    {apiKeyStatus ? 'Ключ подключен успешно' : 'Ключ не найден (AI не будет работать)'}
                                </p>
                            </div>
                        </div>
                        {apiKeyStatus ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                    </div>

                     {/* SEO Settings */}
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-white">
                        <h4 className="font-bold text-clay-text mb-4 flex items-center">
                            <Search size={18} className="mr-2 text-purple-500" />
                            SEO Главной страницы
                        </h4>
                        <div className="space-y-3">
                             <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">Title (Заголовок сайта)</label>
                                <input 
                                    type="text"
                                    value={siteTitle}
                                    onChange={(e) => setSiteTitle(e.target.value)}
                                    placeholder="Miss Eklerchik | Мамский блог..."
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-clay-purple outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">Description (Описание)</label>
                                <textarea 
                                    value={siteDescription}
                                    onChange={(e) => setSiteDescription(e.target.value)}
                                    placeholder="Блог о материнстве, советы, рецепты..."
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-clay-purple outline-none text-sm min-h-[60px]"
                                />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">Ключевые слова (через запятую)</label>
                                <textarea 
                                    value={siteKeywords}
                                    onChange={(e) => setSiteKeywords(e.target.value)}
                                    placeholder="мамский блог, дети, воспитание..."
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-clay-purple outline-none text-sm min-h-[60px]"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Эти данные важны для Yandex и Google.</p>
                            </div>
                        </div>
                    </div>

                    {/* Favicon Settings */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-white">
                        <h4 className="font-bold text-clay-text mb-4 flex items-center">
                            <Globe size={18} className="mr-2 text-blue-500" />
                            Иконка сайта (Favicon)
                        </h4>
                        <div className="flex items-center gap-4 mb-4">
                             <div className="w-16 h-16 rounded-xl bg-clay-bg border-2 border-gray-200 flex items-center justify-center overflow-hidden shadow-inner">
                                 {faviconUrl ? (
                                     <img src={faviconUrl} alt="Favicon Preview" className="w-8 h-8 object-contain" />
                                 ) : (
                                     <span className="text-[10px] text-gray-400 text-center leading-tight px-1">Нет</span>
                                 )}
                             </div>
                             <div className="flex-1">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={faviconUrl}
                                        onChange={(e) => setFaviconUrl(e.target.value)}
                                        placeholder="URL иконки (.ico, .png)..."
                                        className="flex-1 p-2 rounded-lg border border-gray-200 focus:border-clay-purple outline-none text-sm"
                                    />
                                    <button 
                                        onClick={() => faviconInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="bg-clay-bg text-clay-purple font-bold p-2 rounded-lg border border-clay-purple/20 hover:bg-clay-purple hover:text-white transition-colors text-sm flex items-center justify-center"
                                    >
                                        {isUploading ? <Loader size={16} className="animate-spin"/> : <Upload size={16} />}
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={faviconInputRef}
                                        onChange={(e) => handleImageUpload(e, 'favicon')}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Logo Settings */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-white">
                        <h4 className="font-bold text-clay-text mb-4 flex items-center">
                            <Target size={18} className="mr-2 text-clay-pink" />
                            Логотип сайта
                        </h4>
                        <div className="flex items-center gap-4 mb-4">
                             <div className="w-16 h-16 rounded-full bg-clay-bg border-2 border-gray-200 flex items-center justify-center overflow-hidden shadow-inner">
                                 {logoImageSetting ? (
                                     <img src={logoImageSetting} alt="Logo Preview" className="w-full h-full object-cover" />
                                 ) : (
                                     <span className="text-xs text-gray-400 text-center leading-tight px-1">Стандарт</span>
                                 )}
                             </div>
                             <div className="flex-1">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={logoImageSetting}
                                        onChange={(e) => setLogoImageSetting(e.target.value)}
                                        placeholder="URL логотипа..."
                                        className="flex-1 p-2 rounded-lg border border-gray-200 focus:border-clay-purple outline-none text-sm"
                                    />
                                    <button 
                                        onClick={() => logoFileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="bg-clay-bg text-clay-purple font-bold p-2 rounded-lg border border-clay-purple/20 hover:bg-clay-purple hover:text-white transition-colors text-sm flex items-center justify-center"
                                    >
                                        {isUploading ? <Loader size={16} className="animate-spin"/> : <Upload size={16} />}
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={logoFileInputRef}
                                        onChange={(e) => handleImageUpload(e, 'logo')}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* About Me Image Settings */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-white">
                        <h4 className="font-bold text-clay-text mb-4 flex items-center">
                            <User size={18} className="mr-2 text-clay-teal" />
                            Фото "Обо мне"
                        </h4>
                        <div className="flex items-center gap-4 mb-4">
                             <div className="w-16 h-20 rounded-xl bg-clay-bg border-2 border-gray-200 flex items-center justify-center overflow-hidden shadow-inner">
                                 {aboutImageSetting ? (
                                     <img src={aboutImageSetting} alt="About Preview" className="w-full h-full object-cover" />
                                 ) : (
                                     <span className="text-xs text-gray-400 text-center leading-tight px-1">Стандарт</span>
                                 )}
                             </div>
                             <div className="flex-1">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={aboutImageSetting}
                                        onChange={(e) => setAboutImageSetting(e.target.value)}
                                        placeholder="URL фото автора..."
                                        className="flex-1 p-2 rounded-lg border border-gray-200 focus:border-clay-purple outline-none text-sm"
                                    />
                                    <button 
                                        onClick={() => aboutFileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="bg-clay-bg text-clay-purple font-bold p-2 rounded-lg border border-clay-purple/20 hover:bg-clay-purple hover:text-white transition-colors text-sm flex items-center justify-center"
                                    >
                                        {isUploading ? <Loader size={16} className="animate-spin"/> : <Upload size={16} />}
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={aboutFileInputRef}
                                        onChange={(e) => handleImageUpload(e, 'about')}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-white">
                        <h4 className="font-bold text-clay-text mb-4 flex items-center">
                            <Settings size={18} className="mr-2 text-clay-purple" />
                            Главная картинка (Hero Image)
                        </h4>

                        <div className="mb-4">
                            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100 mb-4 border-2 border-dashed border-gray-300 flex items-center justify-center group">
                                {heroImageSetting ? (
                                    <>
                                    <img src={heroImageSetting} alt="Hero" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">
                                        Текущая заставка
                                    </div>
                                    </>
                                ) : (
                                    <span className="text-gray-400 font-bold">Нет картинки (используется стандартная)</span>
                                )}
                            </div>
                            
                            <label className="block text-xs font-bold text-gray-400 mb-1">Ссылка на картинку</label>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    type="text" 
                                    value={heroImageSetting}
                                    onChange={(e) => setHeroImageSetting(e.target.value)}
                                    placeholder="https://..."
                                    className="flex-1 p-3 rounded-xl border border-gray-200 focus:border-clay-purple outline-none text-sm"
                                />
                                <button 
                                    onClick={() => heroFileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="bg-clay-bg text-clay-purple font-bold p-3 rounded-xl border border-clay-purple/20 hover:bg-clay-purple hover:text-white transition-colors text-sm flex items-center justify-center"
                                >
                                    {isUploading ? <Loader size={16} className="animate-spin"/> : <Upload size={16} />}
                                </button>
                                <input 
                                    type="file" 
                                    ref={heroFileInputRef}
                                    onChange={(e) => handleImageUpload(e, 'hero')}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                        </div>

                        <h4 className="font-bold text-clay-text mb-4 flex items-center mt-6 border-t pt-6 border-gray-100">
                            <Smile size={18} className="mr-2 text-clay-pink" />
                            Декорации (Смайлы)
                        </h4>
                        <div className="grid grid-cols-2 gap-6">
                             {/* Left Decoration */}
                             <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2">Левый (Желтый)</label>
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-clay-yellow rounded-full border-4 border-white shadow-md flex items-center justify-center mb-3 overflow-hidden">
                                         {renderDecoPreview(heroDecoLeft, '🤪')}
                                    </div>
                                    <div className="w-full space-y-2">
                                        <input 
                                            type="text" 
                                            value={heroDecoLeft}
                                            onChange={(e) => setHeroDecoLeft(e.target.value)}
                                            placeholder="Смайл или ссылка"
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:border-clay-purple outline-none text-xs text-center"
                                        />
                                        <button 
                                            onClick={() => decoLeftInputRef.current?.click()}
                                            className="w-full py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-500 hover:bg-clay-bg"
                                        >
                                            Загрузить фото
                                        </button>
                                        <input type="file" ref={decoLeftInputRef} onChange={(e) => handleImageUpload(e, 'deco_left')} accept="image/*" className="hidden" />
                                    </div>
                                </div>
                             </div>

                             {/* Right Decoration */}
                             <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2">Правый (Розовый)</label>
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-clay-pink rounded-3xl border-4 border-white shadow-md flex items-center justify-center mb-3 overflow-hidden">
                                         {renderDecoPreview(heroDecoRight, '🍼')}
                                    </div>
                                    <div className="w-full space-y-2">
                                        <input 
                                            type="text" 
                                            value={heroDecoRight}
                                            onChange={(e) => setHeroDecoRight(e.target.value)}
                                            placeholder="Смайл или ссылка"
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:border-clay-purple outline-none text-xs text-center"
                                        />
                                        <button 
                                            onClick={() => decoRightInputRef.current?.click()}
                                            className="w-full py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-500 hover:bg-clay-bg"
                                        >
                                            Загрузить фото
                                        </button>
                                        <input type="file" ref={decoRightInputRef} onChange={(e) => handleImageUpload(e, 'deco_right')} accept="image/*" className="hidden" />
                                    </div>
                                </div>
                             </div>
                        </div>

                        <button 
                            onClick={saveSettings}
                            disabled={saveStatus === 'saving'}
                            className="w-full mt-8 bg-clay-purple text-white font-bold py-3 rounded-xl shadow-plastic hover:shadow-clay-hover transition-all flex items-center justify-center"
                        >
                            {saveStatus === 'saving' ? 'Сохраняю...' : saveStatus === 'saved' ? 'Сохранено!' : 'Сохранить настройки'}
                        </button>
                    </div>
                    
                    {/* Sitemap Generator */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-white">
                       <h4 className="font-bold text-clay-text mb-4 flex items-center">
                           <FileCode size={18} className="mr-2 text-gray-500" />
                           Sitemap (Карта сайта)
                       </h4>
                       <p className="text-sm text-gray-500 mb-4 font-medium">
                           Нажмите кнопку ниже, чтобы сгенерировать актуальный файл <code>sitemap.xml</code> на основе всех статей в базе данных. 
                           Этот файл нужно будет положить в корень сайта (заменить текущий).
                       </p>
                       <button 
                           onClick={handleDownloadSitemap}
                           disabled={isGeneratingSitemap}
                           className="w-full bg-gray-100 text-clay-text font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center border border-gray-200"
                       >
                           {isGeneratingSitemap ? <Loader size={18} className="animate-spin mr-2"/> : <FileDown size={18} className="mr-2"/>}
                           Скачать sitemap.xml
                       </button>
                    </div>
                </div>
            )}

            {/* --- ARTICLES TAB --- */}
            {activeTab === 'articles' && (
                <div className="h-full flex flex-col">
                    {!editingArticle ? (
                        // Article List View
                        <>
                            {/* ... (article list header) ... */}
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-clay-text">Все статьи ({articles.length})</h4>
                                <div className="flex gap-2 flex-wrap justify-end items-center">
                                    
                                    {/* SEARCH INPUT */}
                                    <div className="relative mr-1 group">
                                        <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="text" 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Поиск..."
                                            className="pl-8 pr-6 py-2 w-28 focus:w-48 transition-all rounded-xl border border-gray-200 bg-white text-xs font-bold focus:border-clay-purple outline-none shadow-sm"
                                        />
                                        {searchTerm && (
                                            <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500">
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center bg-white px-2 rounded-xl shadow-sm border border-gray-100">
                                        <input 
                                            type="checkbox" 
                                            id="cleanCheck" 
                                            checked={cleanTrash} 
                                            onChange={e => setCleanTrash(e.target.checked)}
                                            className="w-3 h-3 text-clay-purple rounded focus:ring-0"
                                        />
                                        <label htmlFor="cleanCheck" className="ml-1 text-[10px] font-bold text-gray-500 cursor-pointer whitespace-nowrap flex items-center" title="Удаляет классы, ссылки и стили">
                                            <Trash2 size={12} className="mr-1"/>
                                            Чистить
                                        </label>
                                    </div>
                                    <div className="flex items-center bg-white px-2 rounded-xl shadow-sm border border-gray-100 mr-1">
                                        <input 
                                            type="checkbox" 
                                            id="adCheck" 
                                            checked={addAdToImport} 
                                            onChange={e => setAddAdToImport(e.target.checked)}
                                            className="w-3 h-3 text-clay-purple rounded focus:ring-0"
                                        />
                                        <label htmlFor="adCheck" className="ml-1 text-[10px] font-bold text-gray-500 cursor-pointer whitespace-nowrap">
                                            +Реклама
                                        </label>
                                    </div>
                                    <button 
                                        onClick={handleGlobalCleanup} 
                                        disabled={isCleaning}
                                        className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold flex items-center shadow-sm hover:shadow-none transition-all hover:bg-gray-200 mr-1"
                                        title="Очистить ВСЕ статьи от мусора (стили, классы)"
                                    >
                                        {isCleaning ? <Loader size={16} className="animate-spin"/> : <Trash2 size={16} className="mr-1" />}
                                        Очистить все
                                    </button>

                                    <button 
                                        onClick={() => xmlInputRef.current?.click()} 
                                        disabled={isImportingXml}
                                        className="bg-clay-yellow text-clay-text px-3 py-2 rounded-xl text-xs font-bold flex items-center shadow-plastic hover:shadow-none transition-all hover:bg-yellow-300"
                                        title="Импорт из WordPress/RSS (XML)"
                                    >
                                        {isImportingXml ? <Loader size={16} className="animate-spin"/> : <FileCode size={16} className="mr-1" />}
                                        XML
                                    </button>
                                    <input type="file" ref={xmlInputRef} onChange={handleXmlUpload} accept=".xml" className="hidden" />

                                    <button onClick={createNewArticle} className="bg-clay-pink text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center shadow-plastic hover:shadow-none transition-all">
                                        <Plus size={16} className="mr-1" /> Создать
                                    </button>
                                </div>
                            </div>
                             {!isSupabaseConfigured() && (
                                <div className="mb-4 p-3 bg-red-50 rounded-xl text-xs text-red-600 border border-red-200 flex items-start">
                                    <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />
                                    <div>
                                        <strong>Внимание:</strong> Редактирование работает только с Supabase.
                                        <br/>
                                        Создайте таблицу: <br/>
                                        <code>create table articles (id uuid default gen_random_uuid() primary key, slug text, title text, excerpt text, content text, date text, category text, "imageUrl" text, "readTime" text, "secondaryImageUrl" text, "secondaryImageAlt" text, "seoKeywords" text);</code>
                                    </div>
                                </div>
                            )}
                            {isLoading ? (
                                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clay-purple"></div></div>
                            ) : (
                                <div className="space-y-3">
                                    {articles
                                        .filter(article => {
                                            const term = searchTerm.toLowerCase();
                                            return (article.title || '').toLowerCase().includes(term) || 
                                                   (article.category || '').toLowerCase().includes(term);
                                        })
                                        .map((article) => (
                                        <div key={article.id} className="bg-white p-3 rounded-xl shadow-sm flex justify-between items-center group hover:shadow-md transition-shadow">
                                            <div className="flex items-center overflow-hidden">
                                                <img src={article.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover mr-3 bg-gray-200" />
                                                <div className="truncate">
                                                    <p className="font-bold text-clay-text text-sm truncate">{article.title}</p>
                                                    <p className="text-[10px] text-gray-400">{article.date} • {article.category}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => setEditingArticle(article)} className="p-2 text-gray-400 hover:text-clay-purple hover:bg-clay-bg rounded-lg transition-colors" title="Редактировать">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteArticle(article.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Удалить">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {articles.filter(a => (a.title || '').toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && searchTerm && (
                                        <div className="text-center py-8 text-gray-400 text-sm font-bold">
                                            Ничего не найдено по запросу "{searchTerm}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        // Editor View
                        <div className="flex flex-col h-full animate-fade-in">
                            {/* ... (editor controls) ... */}
                             <div className="flex justify-between items-center mb-4">
                                <button onClick={() => setEditingArticle(null)} className="text-gray-400 hover:text-clay-text flex items-center text-sm font-bold">
                                    <ArrowLeft size={16} className="mr-1" /> Назад
                                </button>
                                <div className="flex items-center">
                                   <button onClick={() => setShowSmartPaste(!showSmartPaste)} className="mr-2 text-[10px] font-bold text-clay-purple bg-clay-purple/10 px-3 py-1 rounded-lg flex items-center hover:bg-clay-purple hover:text-white transition-colors">
                                     <Sparkles size={12} className="mr-1" />
                                     Умная вставка
                                   </button>
                                   <h4 className="font-bold text-clay-text text-sm">
                                       {editingArticle.id ? 'Редактирование' : 'Новая статья'}
                                   </h4>
                                </div>
                            </div>

                            {/* SMART PASTE OVERLAY */}
                            {showSmartPaste && (
                                <div className="bg-white p-4 rounded-2xl border-2 border-clay-purple shadow-lg mb-4 animate-fade-in z-10 relative">
                                    <div className="flex justify-between items-center mb-3">
                                        <h5 className="font-bold text-clay-purple flex items-center text-sm"><Sparkles className="mr-2" size={16}/> Копировать из Word/TXT</h5>
                                        <button onClick={() => setShowSmartPaste(false)}><X size={16} className="text-gray-400"/></button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mb-2">
                                        Скопируйте сюда весь текст. Первая строка станет заголовком, вторая — отрывком, остальное — контентом. SEO заполнится само.
                                    </p>
                                    <textarea 
                                        value={smartPasteContent} 
                                        onChange={(e) => setSmartPasteContent(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:border-clay-purple outline-none text-xs min-h-[150px]"
                                        placeholder="Вставьте текст сюда..."
                                    />
                                    <button onClick={processSmartPaste} className="w-full bg-clay-purple text-white py-2 rounded-lg font-bold text-sm hover:bg-clay-purple-dark mt-2">Разобрать и заполнить</button>
                                </div>
                            )}

                            <div className="space-y-3 overflow-y-auto pr-1 pb-4 relative">
                                {/* Title */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Заголовок</label>
                                    <input 
                                        type="text" 
                                        value={editingArticle.title || ''} 
                                        onChange={e => setEditingArticle({...editingArticle, title: e.target.value})}
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:border-clay-purple outline-none font-bold text-clay-text"
                                    />
                                </div>
                                
                                {/* AD GENERATOR */}
                                {showAdGenerator && (
                                    <div className="bg-white p-4 rounded-2xl border-2 border-clay-pink shadow-lg mb-4 animate-fade-in">
                                        <div className="flex justify-between items-center mb-3">
                                            <h5 className="font-bold text-clay-pink flex items-center text-sm"><Gem className="mr-2" size={16}/> Конструктор рекламы</h5>
                                            <button onClick={() => setShowAdGenerator(false)}><X size={16} className="text-gray-400"/></button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 mb-3">
                                            <input type="text" placeholder="Название украшения" className="p-2 border rounded-lg text-sm" value={adConfig.name} onChange={e => setAdConfig({...adConfig, name: e.target.value})} />
                                            <input type="text" placeholder="Цена (например: 3 500 ₽)" className="p-2 border rounded-lg text-sm" value={adConfig.price} onChange={e => setAdConfig({...adConfig, price: e.target.value})} />
                                            <input type="text" placeholder="Ссылка на товар" className="p-2 border rounded-lg text-sm" value={adConfig.url} onChange={e => setAdConfig({...adConfig, url: e.target.value})} />
                                            <input type="text" placeholder="Ссылка на фото товара" className="p-2 border rounded-lg text-sm" value={adConfig.imageUrl} onChange={e => setAdConfig({...adConfig, imageUrl: e.target.value})} />
                                        </div>
                                        <button onClick={insertAdHtml} className="w-full bg-clay-pink text-white py-2 rounded-lg font-bold text-sm hover:bg-red-500">Вставить карточку товара</button>
                                    </div>
                                )}
                                
                                {/* ... (rest of fields) ... */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">Категория</label>
                                        <div className="flex">
                                            <input 
                                                type="text" 
                                                value={editingArticle.category || ''} 
                                                onChange={e => setEditingArticle({...editingArticle, category: e.target.value})}
                                                className="w-full p-3 rounded-l-xl border border-gray-200 focus:border-clay-purple outline-none text-sm"
                                            />
                                            <button 
                                                onClick={handleSuggestCategory} 
                                                disabled={isSuggestingCategory}
                                                className="px-3 bg-white border-t border-b border-r border-gray-200 rounded-r-xl text-clay-purple hover:bg-clay-bg transition-colors flex items-center justify-center"
                                                title="Подобрать категорию через AI"
                                            >
                                                {isSuggestingCategory ? <Loader size={16} className="animate-spin"/> : <BrainCircuit size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">Slug (URL)</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={editingArticle.slug || ''} 
                                                onChange={e => setEditingArticle({...editingArticle, slug: e.target.value})}
                                                className="flex-1 p-3 rounded-xl border border-gray-200 focus:border-clay-purple outline-none text-sm"
                                            />
                                            <button onClick={generateSlugFromTitle} className="p-3 rounded-xl bg-gray-100 text-gray-500 hover:bg-clay-purple hover:text-white transition-colors"><Wand2 size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Изображение (Главное)</label>
                                    <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-center hover:bg-white hover:border-clay-purple relative">
                                        {/* AI GENERATE BUTTON */}
                                        <button 
                                            onClick={handleGenerateAiImage}
                                            disabled={isGeneratingAiImage || isUploading}
                                            className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-lg shadow-lg hover:scale-105 transition-transform font-bold text-[10px] flex items-center z-10"
                                            title="Сгенерировать в стиле Plasticine World"
                                        >
                                            {isGeneratingAiImage ? <Loader size={12} className="animate-spin mr-1"/> : <Wand2 size={12} className="mr-1" />}
                                            AI Art
                                        </button>

                                        {editingArticle.imageUrl ? (
                                            <img src={editingArticle.imageUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg shadow-sm mb-3" />
                                        ) : <div className="mb-3 text-gray-300"><ImageIcon size={48} /></div>}
                                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                                            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex-1 bg-white border border-gray-200 text-clay-text font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-clay-bg flex items-center justify-center text-sm">
                                                {isUploading ? <Loader className="animate-spin mr-2" size={16} /> : <Upload className="mr-2" size={16} />} {isUploading ? '...' : 'Загрузить'}
                                            </button>
                                            <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e, 'article')} accept="image/*" className="hidden" />
                                            <input type="text" placeholder="Или ссылка..." value={editingArticle.imageUrl || ''} onChange={e => setEditingArticle({...editingArticle, imageUrl: e.target.value})} className="flex-1 p-2 rounded-lg border border-gray-200 text-sm focus:border-clay-purple outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* SECONDARY IMAGE SECTION */}
                                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                                    <h5 className="font-bold text-clay-text mb-3 flex items-center text-xs uppercase tracking-wider"><FileImage size={14} className="mr-2 text-clay-pink" /> Дополнительное фото (SEO)</h5>
                                    <div className="p-3 border border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-center mb-3">
                                        {editingArticle.secondaryImageUrl ? (
                                            <img src={editingArticle.secondaryImageUrl} alt="Secondary Preview" className="w-full h-32 object-cover rounded-lg shadow-sm mb-3" />
                                        ) : <div className="mb-3 text-gray-300 text-xs">Нет дополнительного фото</div>}
                                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                                            <button onClick={() => secondFileInputRef.current?.click()} disabled={isUploading} className="bg-white border border-gray-200 text-clay-text font-bold py-1 px-3 rounded-lg shadow-sm hover:bg-clay-bg flex items-center justify-center text-xs">
                                                {isUploading ? '...' : 'Загрузить'}
                                            </button>
                                            <input type="file" ref={secondFileInputRef} onChange={(e) => handleImageUpload(e, 'article_secondary')} accept="image/*" className="hidden" />
                                            <input type="text" placeholder="Ссылка..." value={editingArticle.secondaryImageUrl || ''} onChange={e => setEditingArticle({...editingArticle, secondaryImageUrl: e.target.value})} className="flex-1 p-1 rounded-lg border border-gray-200 text-xs outline-none" />
                                        </div>
                                    </div>
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Описание для SEO (Alt Text)</label>
                                    <input 
                                        type="text" 
                                        value={editingArticle.secondaryImageAlt || ''} 
                                        onChange={e => setEditingArticle({...editingArticle, secondaryImageAlt: e.target.value})}
                                        className="w-full p-2 rounded-lg border border-gray-200 text-xs focus:border-clay-pink outline-none"
                                        placeholder="Например: Ребенок играет с котом на ковре..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Краткое описание</label>
                                    <div className="flex gap-2">
                                        <textarea 
                                            rows={2} 
                                            value={editingArticle.excerpt || ''} 
                                            onChange={e => setEditingArticle({...editingArticle, excerpt: e.target.value})} 
                                            className="w-full p-3 rounded-xl border border-gray-200 focus:border-clay-purple outline-none text-sm" 
                                        />
                                        <button 
                                            onClick={handleGenerateSnippet}
                                            disabled={isGeneratingSnippet}
                                            className="px-3 bg-white border border-gray-200 rounded-xl text-clay-purple hover:bg-clay-bg transition-colors flex flex-col items-center justify-center shrink-0"
                                            title="Сгенерировать через AI"
                                        >
                                            {isGeneratingSnippet ? <Loader size={16} className="animate-spin"/> : <MessageSquareQuote size={18} />}
                                            <span className="text-[9px] font-bold mt-1">AI</span>
                                        </button>
                                    </div>
                                </div>
                                {/* SEO */}
                                <div className="bg-white p-4 rounded-2xl border-2 border-clay-bg">
                                    <h5 className="font-bold text-clay-text mb-3 flex items-center text-xs uppercase tracking-wider"><Search size={14} className="mr-2 text-clay-purple" /> SEO</h5>
                                    <div className="space-y-3">
                                        <input type="text" value={editingArticle.seoTitle || ''} onChange={e => setEditingArticle({...editingArticle, seoTitle: e.target.value})} className="w-full p-2 rounded-lg border border-gray-100 bg-gray-50 text-sm" placeholder="SEO Title (Заголовок)" />
                                        <textarea rows={2} value={editingArticle.seoDescription || ''} onChange={e => setEditingArticle({...editingArticle, seoDescription: e.target.value})} className="w-full p-2 rounded-lg border border-gray-100 bg-gray-50 text-sm" placeholder="SEO Description (Описание)" />
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Ключевые слова</label>
                                            <input 
                                                type="text" 
                                                value={editingArticle.seoKeywords || ''} 
                                                onChange={e => setEditingArticle({...editingArticle, seoKeywords: e.target.value})} 
                                                className="w-full p-2 rounded-lg border border-gray-100 bg-gray-50 text-sm" 
                                                placeholder="дети, сон, питание, ..." 
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold text-gray-400">Контент (HTML)</label>
                                        <div className="flex gap-2">
                                             <button 
                                                onClick={handleAiImprove} 
                                                disabled={isAiImproving}
                                                className="text-[10px] bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-3 py-1 rounded-lg flex items-center hover:shadow-md transition-all disabled:opacity-50"
                                                title="Исправить ошибки и очистить HTML через ИИ"
                                            >
                                                {isAiImproving ? <Loader size={12} className="animate-spin mr-1"/> : <Sparkles size={12} className="mr-1"/>}
                                                AI Редактура
                                            </button>
                                            <button onClick={() => setShowAdGenerator(!showAdGenerator)} className="text-[10px] bg-clay-pink text-white px-2 py-1 rounded flex items-center hover:bg-red-500"><Gem size={10} className="mr-1"/> Вставить рекламу</button>
                                        </div>
                                    </div>
                                    <textarea rows={8} value={editingArticle.content || ''} onChange={e => setEditingArticle({...editingArticle, content: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:border-clay-purple outline-none text-sm font-mono" />
                                </div>
                            </div>
                            <button onClick={handleSaveArticle} disabled={saveStatus === 'saving' || !isSupabaseConfigured() || isUploading} className={`mt-2 w-full py-3 rounded-xl font-bold text-white flex items-center justify-center shadow-plastic transition-all ${saveStatus === 'saving' || isUploading ? 'bg-gray-300' : 'bg-clay-purple hover:shadow-clay-hover'}`}>
                                {saveStatus === 'saving' ? '...' : <><Save size={18} className="mr-2" /> Сохранить</>}
                            </button>
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-t border-gray-200 shrink-0">
             <div className="text-xs text-gray-400 font-bold">
               {activeTab === 'subscribers' ? `Подписчиков: ${subscribers.length}` : activeTab === 'articles' ? `Статей: ${articles.length}` : 'Настройки сайта'}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminModal;
