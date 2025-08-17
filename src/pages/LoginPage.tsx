import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const navigate = useNavigate();

    // Handle window resize for responsive design
    React.useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simple demo authentication - in a real app, this would be an API call
        if (username.toLowerCase() === 'coach' && password === 'mizzou2026') {
            // Store login state (in a real app, you'd use proper token management)
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userRole', 'coach');
            navigate('/team');
        } else if (username.toLowerCase() === 'player' && password === 'tigers') {
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userRole', 'player');
            navigate('/team');
        } else {
            setError('Invalid username or password');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen relative missouri-background flex flex-col">
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-60"></div>

            {/* Content */}
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header without navigation */}
                <header className={`bg-black bg-opacity-80 text-[#F1B82D] px-3 md:px-6 ${isMobile ? 'py-8' : 'py-16'} flex items-center justify-center shadow-md`}>
                    <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'space-x-4'}`}>
                        <div className={`${isMobile ? 'h-18 w-18' : 'h-24 w-24'} bg-[#F1B82D] rounded-full flex items-center justify-center p-1`}>
                            <img
                                src="/tiger.png"
                                alt="Missouri Tigers"
                                className={`${isMobile ? 'h-12 w-12' : 'h-18 w-18'} object-contain`}
                                onError={(e) => {
                                    console.log('Image failed to load:', e);
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                        <h1 className={`${isMobile ? 'text-2xl text-center' : 'text-3xl ml-4'} font-bold text-[#F1B82D] missouri-header-font`}>
                            MISSOURI BASEBALL
                        </h1>
                    </div>
                </header>

                {/* Login Form */}
                <div className={`${isMobile ? 'px-3 py-10' : 'px-6'} pt-36`}>
                    <div className="flex justify-center">
                        <div className={`bg-white bg-opacity-95 rounded-lg shadow-xl ${isMobile ? 'p-6' : 'p-8'} w-full max-w-md`}>
                            <div className="text-center mb-8">
                                <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 mb-2`}>
                                    Welcome Back
                                </h2>
                                <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
                                    Sign in to access Missouri Baseball Analytics
                                </p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-6">
                                <div>
                                    <label htmlFor="username" className="block text-sm font-bold text-gray-700 mb-2">
                                        Username
                                    </label>
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F1B82D] focus:border-transparent transition-colors"
                                        placeholder="Enter your username"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F1B82D] focus:border-transparent transition-colors"
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-3 px-4 rounded-lg font-semibold text-lg transition-colors shadow-lg ${loading
                                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                        : 'bg-[#F1B82D] text-black hover:bg-yellow-400'
                                        }`}
                                >
                                    {loading ? 'Signing In...' : 'Sign In'}
                                </button>
                            </form>

                            {/* Demo Credentials */}
                            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-sm font-bold text-gray-700 mb-2">Demo Credentials:</h3>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div><strong>Coach:</strong> username: <code>Coach</code>, password: <code>mizzou2026</code></div>
                                    <div><strong>Player:</strong> username: <code>player</code>, password: <code>tigers</code></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-auto text-center py-8 text-white">
                    <p className="text-lg">© 2025 University of Missouri Baseball</p>
                    <p className="text-sm text-gray-300 mt-2">Analytics Dashboard | M-I-Z-Z-O-U</p>
                </footer>
            </div>
        </div>
    );
};

export default LoginPage;