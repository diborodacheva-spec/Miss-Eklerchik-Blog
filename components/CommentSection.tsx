
import React, { useState, useEffect } from 'react';
import { Send, User, MessageSquare } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface Comment {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
  article_id: string;
}

interface CommentSectionProps {
  articleId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ articleId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchComments = async () => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('article_id', articleId)
          .order('created_at', { ascending: false });
        
        if (data) setComments(data as Comment[]);
      } else {
        const storedRaw = localStorage.getItem(`comments_${articleId}`);
        let stored: Comment[] = [];
        try {
            const parsed = storedRaw ? JSON.parse(storedRaw) : [];
            stored = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            stored = [];
        }
        // Localstorage usually pushes to end, so reverse for newest first
        setComments([...stored].reverse());
      }
    } catch (e) {
      console.error("Error fetching comments", e);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !name.trim()) return;

    setIsLoading(true);
    
    const tempId = Date.now().toString();
    const commentObj = {
      user_name: name,
      content: newComment,
      article_id: articleId,
      created_at: new Date().toISOString()
    };

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('comments').insert([commentObj]);
        if (error) throw error;
        await fetchComments();
      } else {
        // LocalStorage Fallback
        const storedRaw = localStorage.getItem(`comments_${articleId}`);
        let existing: Comment[] = [];
        try {
             const parsed = storedRaw ? JSON.parse(storedRaw) : [];
             existing = Array.isArray(parsed) ? parsed : [];
        } catch(e) {
            existing = [];
        }

        const newEntry = { ...commentObj, id: tempId };
        const updated = [...existing, newEntry];
        localStorage.setItem(`comments_${articleId}`, JSON.stringify(updated));
        
        // Update state manually for immediate feedback
        setComments(prev => [newEntry as Comment, ...prev]);
      }
      setNewComment('');
    } catch (error) {
      console.error("Error posting comment", error);
      alert("Не удалось отправить комментарий");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-100">
      <h3 className="text-2xl font-serif font-bold text-clay-text mb-6 flex items-center">
        <MessageSquare className="mr-3 text-clay-purple" strokeWidth={2.5} />
        Комментарии <span className="ml-2 text-gray-400 text-lg font-medium">({comments.length})</span>
      </h3>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-clay-bg p-6 rounded-[2rem] mb-10 shadow-inner border border-white">
        <div className="grid grid-cols-1 gap-4">
            <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase ml-3">Ваше имя</label>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Представьтесь..."
                className="w-full p-4 rounded-2xl border-2 border-transparent bg-white focus:border-clay-purple outline-none font-bold text-clay-text shadow-sm transition-all"
                required
            />
            </div>
            <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase ml-3">Сообщение</label>
            <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Поделитесь мыслями..."
                className="w-full p-4 rounded-2xl border-2 border-transparent bg-white focus:border-clay-purple outline-none text-clay-text shadow-sm transition-all min-h-[100px] font-medium"
                required
            />
            </div>
        </div>
        <div className="mt-4 flex justify-end">
            <button
            type="submit"
            disabled={isLoading}
            className={`px-8 py-3 rounded-2xl font-bold text-white flex items-center justify-center shadow-plastic transition-all ${
                isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-clay-purple hover:bg-clay-purple-dark hover:-translate-y-1'
            }`}
            >
            {isLoading ? 'Отправка...' : <><Send size={18} className="mr-2" strokeWidth={3} /> Отправить</>}
            </button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
             <p className="text-gray-400 font-bold">Пока никого... Будьте первой!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 animate-fade-in group">
               <div className="shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-clay-yellow to-orange-200 rounded-2xl flex items-center justify-center text-white shadow-sm border-2 border-white transform group-hover:rotate-6 transition-transform">
                    <User size={20} strokeWidth={3} />
                  </div>
               </div>
               <div className="bg-white p-5 rounded-[1.5rem] rounded-tl-none shadow-clay border border-white flex-1 hover:shadow-clay-hover transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-clay-text text-base">{comment.user_name}</span>
                    <span className="text-[10px] font-bold text-gray-300 bg-gray-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                        {new Date(comment.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed font-medium whitespace-pre-wrap">{comment.content}</p>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
