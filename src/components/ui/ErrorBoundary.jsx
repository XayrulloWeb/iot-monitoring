// src/components/ui/ErrorBoundary.jsx
import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        // Обновляем состояние, чтобы показать fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Логируем ошибку
        console.error('Error caught by ErrorBoundary:', error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });

        // Здесь можно отправить ошибку в сервис мониторинга (Sentry, LogRocket и т.д.)
        // Example: Sentry.captureException(error, { extra: errorInfo });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full flex items-center justify-center bg-[#02040a] p-6">
                    <div className="max-w-2xl w-full">
                        <div className="glass-panel p-8 rounded-2xl text-center">
                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="text-red-500 w-10 h-10" />
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl font-bold text-white mb-3 font-mono">
                                Что-то пошло не так
                            </h1>

                            {/* Description */}
                            <p className="text-slate-400 mb-6">
                                Произошла непредвиденная ошибка. Мы уже работаем над её устранением.
                            </p>

                            {/* Error details (только в dev режиме) */}
                            {import.meta.env.DEV && this.state.error && (
                                <div className="bg-black/40 border border-red-500/20 rounded-xl p-4 mb-6 text-left">
                                    <p className="text-xs font-mono text-red-400 mb-2">
                                        <strong>Error:</strong> {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <details className="text-xs font-mono text-slate-500">
                                            <summary className="cursor-pointer hover:text-slate-400 transition-colors">
                                                Stack trace
                                            </summary>
                                            <pre className="mt-2 overflow-x-auto">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={this.handleReset}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/50"
                                >
                                    <RefreshCw size={18} />
                                    Попробовать снова
                                </button>

                                <button
                                    onClick={this.handleGoHome}
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all flex items-center gap-2 border border-white/10"
                                >
                                    <Home size={18} />
                                    На главную
                                </button>
                            </div>
                        </div>

                        {/* Help text */}
                        <p className="text-center text-slate-600 text-sm mt-6">
                            Если проблема повторяется, обратитесь в службу поддержки
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
