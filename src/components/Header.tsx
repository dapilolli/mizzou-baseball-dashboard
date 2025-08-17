import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
    const navigate = useNavigate();
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userRole = localStorage.getItem('userRole') || '';

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    // Don't show header if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    return (
        <header className="bg-black text-[#F1B82D] px-6 py-16 flex items-center justify-between sticky top-0 z-50 shadow-md">
            <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-[#F1B82D] rounded-full flex items-center justify-center p-1">
                    <img
                        src="/tiger.png"
                        alt="Missouri Tigers"
                        className="h-12 w-12 object-contain"
                    />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-[#F1B82D]">MISSOURI BASEBALL</h1>
                    <p className="text-sm text-gray-300">Analytics Dashboard</p>
                </div>
                {userRole && (
                    <div className="ml-4 px-3 py-1 bg-[#F1B82D] text-black rounded-full text-sm font-semibold">
                        {userRole.toUpperCase()}
                    </div>
                )}
            </div>
            <nav className="flex space-x-6 items-center">
                <Link
                    to="/"
                    className="bg-[#F1B82D] text-black px-6 py-3 rounded-lg font-semibold text-lg hover:bg-yellow-400 transition-colors shadow-lg"
                >
                    Team
                </Link>
                <Link
                    to="/reports"
                    className="bg-[#F1B82D] text-black px-6 py-3 rounded-lg font-semibold text-lg hover:bg-yellow-400 transition-colors shadow-lg"
                >
                    Reports
                </Link>
                <Link
                    to="/scouting"
                    className="bg-[#F1B82D] text-black px-6 py-3 rounded-lg font-semibold text-lg hover:bg-yellow-400 transition-colors shadow-lg"
                >
                    Scouting
                </Link>
                <Link
                    to="/pdp"
                    className="bg-[#F1B82D] text-black px-6 py-3 rounded-lg font-semibold text-lg hover:bg-yellow-400 transition-colors shadow-lg"
                >
                    PDP
                </Link>
                <Link
                    to="/gameday"
                    className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-red-700 transition-colors shadow-lg border-2 border-red-400"
                >
                    🔴 GAMEDAY
                </Link>
                <button
                    onClick={handleLogout}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                    Logout
                </button>
            </nav>
        </header>
    );
}