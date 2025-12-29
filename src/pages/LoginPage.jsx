// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const login = useUIStore(state => state.login);
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();

        // Простая проверка (в реальном проекте тут запрос на сервер)
        if (username === 'admin' && password === 'admin') {
            login(username);
            navigate('/'); // Перекидываем на главную
        } else {
            setError('Неверный логин или пароль');
        }
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-[--bg-app] relative overflow-hidden">

            {/* Фон с красивыми пятнами */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-blue/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-green/20 rounded-full blur-[120px]"></div>

            <div className="glass-panel p-8 rounded-2xl w-full max-w-md shadow-2xl relative z-10 border border-[--border]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold font-mono mb-2">
                        <span className="text-brand-blue">V-</span>GOLD
                    </h1>
                    <p className="text-[--text-muted]">Система мониторинга безопасности</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs text-[--text-muted] mb-1 ml-1">Логин</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={18} />
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[--surface] border border-[--border] focus:border-brand-blue focus:outline-none transition-colors"
                                placeholder="admin"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-[--text-muted] mb-1 ml-1">Пароль</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[--surface] border border-[--border] focus:border-brand-blue focus:outline-none transition-colors"
                                placeholder="••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-brand-red text-sm text-center bg-brand-red/10 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-brand-blue text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 mt-4"
                    >
                        Войти в систему <ArrowRight size={18} />
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-[--text-muted]">
                    Protected by a1tech security systems
                </div>
            </div>
        </div>
    );
}