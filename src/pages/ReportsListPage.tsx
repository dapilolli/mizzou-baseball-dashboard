import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ReportsListPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'hitters' | 'pitchers'>('hitters');
    const [hitters, setHitters] = useState<any[]>([]);
    const [pitchers, setPitchers] = useState<any[]>([]);

    // Check URL params for tab on component mount
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'pitchers') {
            setActiveTab('pitchers');
        } else {
            setActiveTab('hitters');
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                setLoading(true);
                setError(null);
                // Fetch both hitters and pitchers
                const [hittersRes, pitchersRes] = await Promise.all([
                    fetch('http://localhost:8000/team/hitters'),
                    fetch('http://localhost:8000/team/pitchers')
                ]);

                if (!hittersRes.ok || !pitchersRes.ok) {
                    throw new Error('Failed to fetch player data');
                }

                const [hittersData, pitchersData] = await Promise.all([
                    hittersRes.json(),
                    pitchersRes.json()
                ]);

                // Store separate lists
                const hitterNames = hittersData.map((p: any) => p.Name || p.Player).sort();
                const pitcherNames = pitchersData.map((p: any) => p.Name || p.Player).sort();

                setHitters(hitterNames);
                setPitchers(pitcherNames);

                // Set initial display based on active tab
                setPlayers(hitterNames);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch players');
                console.error('Error fetching players:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlayers();
    }, []);

    // Update displayed players when tab changes
    useEffect(() => {
        if (activeTab === 'hitters') {
            setPlayers(hitters);
        } else {
            setPlayers(pitchers);
        }
    }, [activeTab, hitters, pitchers]);

    const handlePlayerClick = (playerName: string) => {
        navigate(`/reports/${encodeURIComponent(playerName)}`);
    };

    return (
        <div className="p-6 min-h-screen" style={{ backgroundColor: '#373A36' }}>
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-4 text-white">Player Reports</h1>
                <p className="text-gray-300 font-semibold mb-6">Select a player to view their detailed performance report</p>

                {/* Hitters/Pitchers Toggle */}
                <div className="flex gap-4 justify-center mb-6">
                    <button
                        onClick={() => {
                            setActiveTab('hitters');
                            navigate('/reports?tab=hitters');
                        }}
                        className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${activeTab === 'hitters'
                            ? 'bg-[#F1B82D] text-black'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        Hitters
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('pitchers');
                            navigate('/reports?tab=pitchers');
                        }}
                        className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${activeTab === 'pitchers'
                            ? 'bg-[#F1B82D] text-black'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        Pitchers
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <p className="text-lg text-white">Loading players...</p>
                </div>
            ) : error ? (
                <div className="text-center py-8">
                    <p className="text-red-400 text-lg">Error: {error}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                    {players.map((playerName, index) => (
                        <button
                            key={playerName}
                            onClick={() => handlePlayerClick(playerName)}
                            className={`p-6 border-2 border-gray-200 rounded-lg hover:border-[#F1B82D] transition-colors text-left font-bold ${index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            <div className="font-bold text-xl text-gray-900">{playerName}</div>
                            <div className="text-gray-600 text-sm font-semibold mt-2">Click to view report</div>
                        </button>
                    ))}
                </div>
            )}

            {!loading && !error && players.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-400">No players found</p>
                </div>
            )}
        </div>
    );
};

export default ReportsListPage;
