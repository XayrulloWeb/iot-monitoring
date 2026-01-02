// src/pages/LoginPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, Flame, ShieldCheck } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import api from '../api';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const isLoggedIn = useUIStore(state => state.isLoggedIn);
    const login = useUIStore(state => state.login);
    const navigate = useNavigate();

    // Перенаправляем, если уже вошел
    useEffect(() => {
        if (isLoggedIn) {
            navigate('/', { replace: true });
        }
    }, [isLoggedIn, navigate]);

    // Автозаполнение для разработки из переменных окружения
    useEffect(() => {
        if (import.meta.env.DEV) {
            // Используем переменные окружения вместо хардкода
            const devUsername = import.meta.env.VITE_DEV_USERNAME || '';
            const devPassword = import.meta.env.VITE_DEV_PASSWORD || '';

            if (devUsername) setUsername(devUsername);
            if (devPassword) setPassword(devPassword);
        }
    }, []);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();

        setIsLoading(true);
        setError('');

        try {
            console.log("Logging in...");
            const response = await api.post('/auth/login', { username, password });

            // API: { success: true, data: { user: {...}, token: "..." } }
            const loginData = response.data.data || response.data;

            if (loginData.token) {
                login(loginData);
                // Навигация сработает через useEffect выше
            } else {
                throw new Error("No token received");
            }

        } catch (err) {
            console.error("Login Error:", err);

            // Используем user-friendly сообщение
            const message = getUserFriendlyErrorMessage(err);
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleLogin(e);
        }
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-[#02040a] relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>

            <div className="relative z-10 w-full max-w-md p-8">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.3)] mb-4">
                        <Flame className="text-white w-8 h-8" fill="currentColor" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-widest font-mono">HEAT<span className="text-orange-500">OS</span></h1>
                </div>

                <form
                    onSubmit={handleLogin}
                    className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6 backdrop-blur-xl bg-black/40"
                >

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Username</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all font-mono"
                                placeholder="Enter username..."
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all font-mono"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs font-bold animate-shake">
                            <ShieldCheck size={14} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                AUTHENTICATE <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}