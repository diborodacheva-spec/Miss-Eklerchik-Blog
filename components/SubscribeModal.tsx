
import React, { useState } from 'react';
import { X, Mail, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscribeModal: React.FC<SubscribeModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');

    try {
      if (isSupabaseConfigured()) {
        // Real Database Insert
        const { error } = await supabase
          .from('subscribers')
          .insert([{ email: email, created_at: new Date().toISOString() }]);

        if (error) throw error;
      } else {
        // Fallback to LocalStorage if Supabase isn't configured yet (Development mode)
        console.warn("Supabase not configured. Saving to localStorage.");
        
        let currentSubscribers = [];
        try {
            const stored = localStorage.getItem('miss_eklerchik_subscribers');
            // Safer check to avoid JSON parse errors on "undefined" string
            const parsed = (stored && stored !== "undefined" && stored !== "null") ? JSON.parse(stored) : [];
            currentSubscribers = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            currentSubscribers = [];
        }
        
        currentSubscribers.push({
          email: email,
          date: new Date().toLocaleString('ru-RU'),
          id: Date.now().toString()
        });
        localStorage.setItem('miss_eklerchik_subscribers', JSON.stringify(currentSubscribers));
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      setStatus('success');
      setEmail('');
    } catch (error: any) {
      console.error("Error saving subscription", error);
      setStatus('error');
      setErrorMessage(error.message || 'Что-то пошло не так. Попробуйте позже.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 text-center sm:p-0">
        
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-clay-text/40 backdrop-blur-sm transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal Panel */}
        <div className="relative inline-block align-bottom bg-white rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border-4 border-white">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-clay-purple transition-colors z-10 bg-clay-bg p-2 rounded-full hover:rotate-90"
          >
            <X size={20} />
          </button>

          <div className="p-8 sm:p-10 bg-clay-bg/50">
            
            {status === 'success' ? (
              <div className="text-center py-8 animate-fade-in">
                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-plastic">
                  <Check size={40} strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-clay-text mb-2">Ура! Ты с нами!</h3>
                <p className="text-gray-500 font-medium mb-6">
                  Теперь ты официально в клубе выживших. Письма будут приходить редко, но метко.
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 bg-clay-purple text-white font-bold rounded-xl shadow-plastic hover:shadow-clay-hover hover:-translate-y-1 transition-all"
                >
                  Отлично
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-clay-yellow rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-plastic transform -rotate-6">
                  <Mail size={32} className="text-white" />
                </div>
                
                <h3 className="text-2xl font-serif font-bold text-clay-text mb-3 leading-tight">
                  Письма поддержки <br/>
                  <span className="text-clay-purple">по понедельникам</span>
                </h3>
                
                <p className="text-gray-500 font-medium mb-8 text-sm">
                  Оставь свой email, и я буду присылать тебе новые статьи, рецепты "пятиминутки" и напоминания о том, что ты супер-мама. Никакого спама, честно!
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="tvoya@pochta.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-5 py-4 bg-white border-2 border-transparent focus:border-clay-purple rounded-2xl text-clay-text placeholder-gray-400 outline-none transition-all shadow-inner font-bold"
                      disabled={status === 'loading'}
                    />
                  </div>

                  {status === 'error' && (
                    <div className="text-red-500 text-xs font-bold bg-red-100 p-2 rounded-lg flex items-center justify-center">
                        <AlertTriangle size={14} className="mr-1"/> {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center shadow-plastic transition-all ${
                      status === 'loading' 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-clay-pink text-white hover:shadow-clay-hover hover:-translate-y-1'
                    }`}
                  >
                    {status === 'loading' ? (
                      <span className="flex items-center">
                         Отправляю...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Подписаться <Sparkles size={18} className="ml-2" />
                      </span>
                    )}
                  </button>
                </form>
                <p className="mt-4 text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                    Отписка в один клик (если надоест)
                </p>
                {!isSupabaseConfigured() && (
                    <p className="mt-2 text-[9px] text-red-300 font-mono">
                        *Режим разработчика: сохранение в localStorage
                    </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscribeModal;
