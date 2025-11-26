import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border-4 border-red-100 text-center">
                <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce">
                    🍪
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2 font-serif">Ой, всё сломалось!</h1>
                <p className="text-gray-500 mb-6 font-medium">
                    Мисс Эклерчик уронила поднос с печеньем на сервер. Мы уже убираем крошки.
                </p>
                <div className="bg-gray-100 p-3 rounded-xl text-left text-xs font-mono overflow-auto max-h-32 mb-6 text-gray-600 border border-gray-200">
                    {this.state.error?.message || 'Неизвестная ошибка'}
                </div>
                <button 
                    onClick={() => window.location.reload()} 
                    className="bg-red-400 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-red-500 transition-all hover:-translate-y-1 w-full"
                >
                    Попробовать снова
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;