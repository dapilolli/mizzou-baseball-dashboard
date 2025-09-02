import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, PieChart, Pie, ReferenceArea, ReferenceLine } from 'recharts';
import AIRecommendations from '../components/AIRecommendations';
import AlabamaScouting from '../components/AlabamaScouting';
import './GamedayPage.css';


// API Response Interfaces - matching your backend exactly
import { api } from '@/utils/api';
interface ApiPitchData {
    id: number;
    type: string | null;
    velocity: number | null;
    spinRate: number | null;
    x: number | null;
    y: number | null;
    result: string;
    pitch_result: string;
    ab_result: string | null;
    play_description: string | null;
    is_ball_in_play: boolean;
    is_plate_appearance_end: boolean;
    exit_velocity: number | null;
    launch_angle: number | null;
    horizontalBreak: number | null;
    verticalBreak: number | null;
    extension: number | null;
    isStrike: boolean;
    inning: string | null;
    count: string | null;
    outs: number | null;
    runners_on_base: {
        first: boolean;
        second: boolean;
        third: boolean;
    };
    pitcher: string | null;
    batter: string | null;
    pitcher_handedness: string | null;
    batter_handedness: string | null;
    is_missouri_pitching: boolean;
    is_missouri_hitting: boolean;
    team_pitching: string;
    team_hitting: string;
}

interface ApiTrackManData {
    release_spin: number | null;
    spin_axis: number | null;
    induced_vertical_break: number | null;
    horizontal_break: number | null;
    release_height: number | null;
    release_side: number | null;
    velocity: number | null;
    tilt: string | null;
    strike_zone_location: number | null;
    extension: number | null;
    horizontal_approach_angle: number | null;
    vertical_approach_angle: number | null;
    horizontal_release_angle: number | null;
    vertical_release_angle: number | null;
}

interface ApiPlayerStats {
    // Batter stats
    avg?: number;
    obp?: number;
    slg?: number;
    ops?: number;
    woba?: number;
    xwoba?: number;
    avg_exit_velocity?: number;
    max_exit_velocity?: number;
    launch_angle?: number;
    hard_hit_percent?: number;
    barrel_percent?: number;
    k_percent?: number;
    bb_percent?: number;
    pa?: number;
    hits?: number;
    home_runs?: number;
    // Pitcher stats
    era?: number;
    whip?: number;
    fip?: number;
    woba_against?: number;
    k_bb_percent?: number;
    csw_percent?: number;
    chase_percent?: number;
    first_pitch_strike_percent?: number;
}

interface ApiGameInfo {
    total_pitches: number;
    current_pitch_number: number;
    game: string;
}

interface GamedayApiResponse {
    pitch: ApiPitchData;
    trackman: ApiTrackManData;
    pitcher_stats: ApiPlayerStats;
    batter_stats: ApiPlayerStats;
    game_info: ApiGameInfo;
}

const GamedayPage: React.FC = () => {
    const [currentPitch, setCurrentPitch] = useState<GamedayApiResponse | null>(null);
    const [pitchHistory, setPitchHistory] = useState<GamedayApiResponse[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'live' | 'hitting' | 'pitching' | 'defense' | 'alabama'>('live');
    const [currentAtBatPitches, setCurrentAtBatPitches] = useState<GamedayApiResponse[]>([]);
    const [dueUpHitters, setDueUpHitters] = useState<{ hitting_team: string, due_up: string[] }>({ hitting_team: '', due_up: [] });
    const [lineup, setLineup] = useState<any[]>([]);
    const [expandedHitter, setExpandedHitter] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Handle window resize for responsive design
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch due up hitters
    const fetchDueUpHitters = async () => {
        try {
            const response = await api('/gameday/due-up');
            if (response.ok) {
                const data = await response.json();
                setDueUpHitters(data);
            }
        } catch (err) {
            console.error('Error fetching due up hitters:', err);
        }
    };

    // Fetch lineup
    const fetchLineup = async () => {
        try {
            const response = await api('/team/hitters');
            if (response.ok) {
                const data = await response.json();
                setLineup(data);
            }
        } catch (err) {
            console.error('Error fetching lineup:', err);
        }
    };

    // Fetch the next pitch from your real API
    const fetchNextPitch = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api('/gameday/next-pitch');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: GamedayApiResponse = await response.json();

            setCurrentPitch(data);
            setPitchHistory(prev => [...prev, data]);

            // Add to current at-bat pitches
            setCurrentAtBatPitches(prev => {
                // If this is the start of a new at-bat, reset the array
                if (data.pitch.count === '0-0' || (prev.length > 0 && prev[prev.length - 1].pitch.is_plate_appearance_end)) {
                    return [data];
                }
                return [...prev, data];
            });

            // Fetch updated due up hitters
            fetchDueUpHitters();

        } catch (err) {
            console.error('Error fetching pitch data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch pitch data');
        } finally {
            setLoading(false);
        }
    };

    // Fetch the previous pitch from your real API
    const fetchPreviousPitch = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api('/gameday/previous-pitch');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: GamedayApiResponse = await response.json();

            setCurrentPitch(data);
            // Remove the last pitch from history if going backwards
            setPitchHistory(prev => prev.length > 0 ? prev.slice(0, -1) : prev);

            // Update current at-bat pitches for previous pitch
            setCurrentAtBatPitches(prev => {
                const newPitches = prev.slice(0, -1);
                if (newPitches.length === 0) {
                    return [data];
                }
                return newPitches;
            });

        } catch (err) {
            console.error('Error fetching previous pitch data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch previous pitch data');
        } finally {
            setLoading(false);
        }
    };

    // Reset game to beginning
    const resetGame = async () => {
        try {
            await api('/gameday/reset-demo', { method: 'POST' });
            setCurrentPitch(null);
            setPitchHistory([]);
            setCurrentAtBatPitches([]);
            setDueUpHitters({ hitting_team: '', due_up: [] });
            setError(null);
        } catch (err) {
            console.error('Error resetting game:', err);
            setError('Failed to reset game');
        }
    };

    // Auto-advance pitches when playing
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && !loading) {
            interval = setInterval(() => {
                fetchNextPitch();
            }, 8000); // 8 seconds between pitches
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isPlaying, loading]);

    // Initial fetch for current game state
    useEffect(() => {
        fetchDueUpHitters();
        fetchLineup();
    }, []);

    // Load initial pitch on mount
    useEffect(() => {
        fetchNextPitch();
    }, []);

    // Parse count string to balls/strikes
    const parseCount = (count: string | null): { balls: number; strikes: number } => {
        if (!count) return { balls: 0, strikes: 0 };
        const parts = count.split('-');
        return {
            balls: parseInt(parts[0]) || 0,
            strikes: parseInt(parts[1]) || 0
        };
    };

    // Get inning display
    const getInningDisplay = (inning: string | null): string => {
        if (!inning) return 'Unknown';
        return inning;
    };

    // Get team color based on Missouri vs Alabama
    const getTeamColor = (team: string): string => {
        if (team.toLowerCase().includes('missouri') || team.toLowerCase().includes('mizzou')) {
            return '#F1B82D'; // Missouri Gold
        }
        return '#A50000'; // Alabama Crimson
    };

    // Format player stats for display
    const formatStat = (value: number | null | undefined, decimals: number = 3): string => {
        if (value === null || value === undefined) return '--';
        return value.toFixed(decimals);
    };

    // Custom dot component for larger pitch dots
    const CustomDot = (props: any) => {
        const { cx, cy, payload } = props;
        if (!payload || payload.type === 'shadow-boundary' || payload.type === 'strike-boundary') {
            return <g></g>; // Return empty group instead of null
        }

        // Color by pitch type
        const getPitchTypeColor = (pitchType: string) => {
            const type = pitchType.toLowerCase();
            if (type.includes('fastball') || type.includes('fb')) return '#FF6B6B'; // Red
            if (type.includes('slider') || type.includes('sl')) return '#4ECDC4'; // Teal
            if (type.includes('changeup') || type.includes('ch')) return '#45B7D1'; // Blue
            if (type.includes('curveball') || type.includes('cb')) return '#96CEB4'; // Green
            if (type.includes('sinker') || type.includes('si')) return '#FFEAA7'; // Yellow
            if (type.includes('cutter') || type.includes('fc')) return '#DDA0DD'; // Plum
            return '#95A5A6'; // Gray for unknown
        };

        return (
            <circle
                cx={cx}
                cy={cy}
                r={10}
                fill={getPitchTypeColor(payload.type)}
                stroke="#000"
                strokeWidth={1}
            />
        );
    };

    // Get strike zone visualization data with current at-bat pitches
    const getStrikeZoneData = () => {
        return currentAtBatPitches
            .filter(pitch => pitch.pitch.x !== null && pitch.pitch.y !== null)
            .map((pitch, index) => ({
                x: pitch.pitch.x!,
                y: pitch.pitch.y!,
                isStrike: pitch.pitch.isStrike,
                type: pitch.pitch.type || 'Unknown',
                velocity: pitch.pitch.velocity || 0,
                result: pitch.pitch.pitch_result,
                pitchNumber: index + 1
            }));
    };

    // Get strike zone boundary data for visualization
    const getStrikeZoneBoundaryData = (): Array<{ x: number, y: number, type: string }> => {
        // Strike zone corners and grid lines as data points
        const strikeZonePoints: Array<{ x: number, y: number, type: string }> = [];

        // Strike zone boundaries
        const leftX = -0.708;
        const rightX = 0.708;
        const bottomZ = 1.5;
        const topZ = 3.6;

        // Shadow zone boundaries (1 ball width = ~0.24 feet)
        const shadowExtension = 0.24;
        const shadowLeftX = leftX - shadowExtension;
        const shadowRightX = rightX + shadowExtension;
        const shadowBottomZ = bottomZ - shadowExtension;
        const shadowTopZ = topZ + shadowExtension;

        // Add boundary outline points (invisible, just for domain)
        strikeZonePoints.push(
            { x: shadowLeftX, y: shadowBottomZ, type: 'shadow-boundary' },
            { x: shadowRightX, y: shadowBottomZ, type: 'shadow-boundary' },
            { x: shadowRightX, y: shadowTopZ, type: 'shadow-boundary' },
            { x: shadowLeftX, y: shadowTopZ, type: 'shadow-boundary' },
            { x: leftX, y: bottomZ, type: 'strike-boundary' },
            { x: rightX, y: bottomZ, type: 'strike-boundary' },
            { x: rightX, y: topZ, type: 'strike-boundary' },
            { x: leftX, y: topZ, type: 'strike-boundary' }
        );

        return strikeZonePoints;
    };

    // Get velocity history for chart (fastballs/sinkers only)
    const getVelocityHistory = () => {
        return pitchHistory
            .filter(pitch => {
                const type = pitch.pitch.type?.toLowerCase() || '';
                return type.includes('fastball') || type.includes('sinker') || type.includes('fb') || type.includes('si');
            })
            .map((pitch, index) => ({
                pitch: index + 1,
                velocity: pitch.pitch.velocity || 0,
                type: pitch.pitch.type || 'Unknown'
            }));
    };

    // Get pitch type breakdown
    const getPitchTypeBreakdown = () => {
        const breakdown: { [key: string]: number } = {};

        pitchHistory.forEach(pitch => {
            const type = pitch.pitch.type || 'Unknown';
            breakdown[type] = (breakdown[type] || 0) + 1;
        });

        return Object.entries(breakdown).map(([type, count]) => ({
            type,
            count,
            percentage: parseFloat(((count / pitchHistory.length) * 100).toFixed(1))
        }));
    };

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <strong>Error:</strong> {error}
                    <button
                        onClick={resetGame}
                        className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                        Reset Game
                    </button>
                </div>
            </div>
        );
    }

    if (!currentPitch) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500 mx-auto"></div>
                    <p className="mt-4 text-lg">Loading Missouri vs Alabama game data...</p>
                </div>
            </div>
        );
    }

    const { balls, strikes } = parseCount(currentPitch.pitch.count);
    const strikeZoneData = getStrikeZoneData();
    const velocityHistory = getVelocityHistory();
    const pitchBreakdown = getPitchTypeBreakdown();

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Game Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black p-6 rounded-lg mb-8 shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 missouri-font">{currentPitch.game_info.game}</h1>
                        <div className="text-xl">
                            <span className="font-semibold">Pitch {currentPitch.game_info.current_pitch_number}</span>
                            <span className="mx-2">•</span>
                            <span>{getInningDisplay(currentPitch.pitch.inning)}</span>
                            <span className="mx-2">•</span>
                            <span>{currentPitch.pitch.outs || 0} outs</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-lg opacity-75">
                            Total Pitches: {currentPitch.game_info.total_pitches}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={loading}
                        className={`px-6 py-2 rounded-lg font-semibold ${isPlaying
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                            } disabled:opacity-50`}
                    >
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button
                        onClick={fetchPreviousPitch}
                        disabled={loading}
                        className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Previous Pitch'}
                    </button>
                    <button
                        onClick={fetchNextPitch}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Next Pitch'}
                    </button>
                    <button
                        onClick={resetGame}
                        className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold"
                    >
                        Reset Game
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-lg mb-6">
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`flex-1 px-6 py-4 text-xl font-bold missouri-font transition-colors ${activeTab === 'live'
                            ? 'bg-yellow-500 text-black border-b-2 border-yellow-600'
                            : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                            }`}
                    >
                        LIVE
                    </button>
                    <button
                        onClick={() => setActiveTab('hitting')}
                        className={`flex-1 px-6 py-4 text-xl font-bold missouri-font transition-colors ${activeTab === 'hitting'
                            ? 'bg-yellow-500 text-black border-b-2 border-yellow-600'
                            : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                            }`}
                    >
                        HITTING
                    </button>
                    <button
                        onClick={() => setActiveTab('pitching')}
                        className={`flex-1 px-6 py-4 text-xl font-bold missouri-font transition-colors ${activeTab === 'pitching'
                            ? 'bg-yellow-500 text-black border-b-2 border-yellow-600'
                            : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                            }`}
                    >
                        PITCHING
                    </button>
                    <button
                        onClick={() => setActiveTab('defense')}
                        className={`flex-1 px-6 py-4 text-xl font-bold missouri-font transition-colors ${activeTab === 'defense'
                            ? 'bg-yellow-500 text-black border-b-2 border-yellow-600'
                            : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                            }`}
                    >
                        DEFENSE
                    </button>
                    <button
                        onClick={() => setActiveTab('alabama')}
                        className={`flex-1 px-6 py-4 text-xl font-bold missouri-font transition-colors ${activeTab === 'alabama'
                            ? 'bg-red-500 text-white border-b-2 border-red-600'
                            : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                            }`}
                    >
                        ALABAMA
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {/* LIVE TAB - Real-time game focus */}
                {activeTab === 'live' && (
                    <div className="space-y-6">
                        {/* Current Pitch & Game Situation */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Current Pitch */}
                            <div className="bg-white p-6 rounded-lg shadow-lg">
                                <h2 className="text-3xl font-bold mb-4 text-center missouri-font">Current Pitch</h2>
                                <div className="text-center mb-4">
                                    <div className="text-5xl font-bold text-blue-600 mb-2">
                                        {currentPitch.pitch.type || 'Unknown'}
                                    </div>
                                    <div className="text-4xl font-semibold text-gray-700">
                                        {formatStat(currentPitch.pitch.velocity, 1)} mph
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xl">
                                    <div>
                                        <strong>Result:</strong> {currentPitch.pitch.pitch_result}
                                    </div>
                                    <div>
                                        <strong>Spin Rate:</strong> {formatStat(currentPitch.pitch.spinRate, 0)} rpm
                                    </div>
                                    <div>
                                        <strong>IVB:</strong> {formatStat(currentPitch.trackman.induced_vertical_break, 1)}"
                                    </div>
                                    <div>
                                        <strong>HB:</strong> {formatStat(currentPitch.trackman.horizontal_break, 1)}"
                                    </div>
                                    <div>
                                        <strong>VAA:</strong> {formatStat(currentPitch.trackman.vertical_approach_angle, 1)}°
                                    </div>
                                    <div>
                                        <strong>Extension:</strong> {formatStat(currentPitch.trackman.extension, 1)} ft
                                    </div>
                                </div>

                                {currentPitch.pitch.exit_velocity && (
                                    <div className="mt-4 p-3 bg-yellow-50 rounded">
                                        <div className="text-center">
                                            <div className="text-xl font-semibold">Ball in Play</div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {formatStat(currentPitch.pitch.exit_velocity, 1)} mph exit velocity
                                            </div>
                                            {currentPitch.pitch.launch_angle && (
                                                <div className="text-lg text-gray-600">
                                                    {formatStat(currentPitch.pitch.launch_angle, 1)}° launch angle
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Game Situation */}
                            <div className="bg-white p-6 rounded-lg shadow-lg">
                                <h2 className="text-3xl font-bold mb-4 text-center missouri-font">Game Situation</h2>

                                {/* Count */}
                                <div className="text-center mb-6">
                                    <div className="text-xl font-semibold mb-2">Count</div>
                                    <div className="flex justify-center space-x-4">
                                        <div className="bg-green-100 px-6 py-3 rounded">
                                            <div className="text-lg text-gray-600">Balls</div>
                                            <div className="text-4xl font-bold">{balls}</div>
                                        </div>
                                        <div className="bg-red-100 px-6 py-3 rounded">
                                            <div className="text-lg text-gray-600">Strikes</div>
                                            <div className="text-4xl font-bold">{strikes}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Baserunners */}
                                <div className="text-center mb-4">
                                    <div className="text-xl font-semibold mb-2">Baserunners</div>
                                    <div className="flex justify-center space-x-2">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${currentPitch.pitch.runners_on_base.first ? 'bg-yellow-400 text-black' : 'bg-gray-200'
                                            }`}>
                                            1B
                                        </div>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${currentPitch.pitch.runners_on_base.second ? 'bg-yellow-400 text-black' : 'bg-gray-200'
                                            }`}>
                                            2B
                                        </div>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${currentPitch.pitch.runners_on_base.third ? 'bg-yellow-400 text-black' : 'bg-gray-200'
                                            }`}>
                                            3B
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Due Up Hitters */}
                        {dueUpHitters.hitting_team && (
                            <div className="bg-white p-6 rounded-lg shadow-lg">
                                <h3 className="text-2xl font-bold mb-4 text-center missouri-font">
                                    Due Up - {dueUpHitters.hitting_team}
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {dueUpHitters.due_up.map((hitter, index) => (
                                        <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                                            <div className="text-sm text-gray-600">
                                                {index === 0 ? 'Up Now' : index === 1 ? 'On Deck' : 'In Hole'}
                                            </div>
                                            <div className="text-lg font-semibold">{hitter}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strike Zone with At-Bat Pitches */}
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h3 className="text-2xl font-bold mb-4 text-center missouri-font">Strike Zone - This At-Bat</h3>
                            <div className="w-full max-w-lg mx-auto strike-zone-container">
                                <ResponsiveContainer width="100%" height={500}>
                                    <ScatterChart
                                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                        data={[...strikeZoneData, ...getStrikeZoneBoundaryData()]}
                                        className="strike-zone-scatter"
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            type="number"
                                            dataKey="x"
                                            domain={[-1.2, 1.2]}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={false}
                                        />
                                        <YAxis
                                            type="number"
                                            dataKey="y"
                                            domain={[1.0, 4.0]}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={false}
                                        />
                                        <Tooltip
                                            formatter={(value, name, props) => {
                                                if (props.payload.type === 'shadow-boundary' || props.payload.type === 'strike-boundary') {
                                                    return null;
                                                }
                                                return [
                                                    `Pitch ${props.payload.pitchNumber}: ${props.payload.type} - ${props.payload.velocity} mph`,
                                                    props.payload.result
                                                ];
                                            }}
                                        />

                                        {/* Shadow Zone */}
                                        <ReferenceArea
                                            x1={-0.948} y1={1.26} x2={0.948} y2={3.84}
                                            fill="rgba(255, 165, 0, 0.1)"
                                            stroke="rgba(255, 165, 0, 0.3)"
                                            strokeWidth={1}
                                            strokeDasharray="3 3"
                                        />

                                        {/* Strike Zone Rectangle */}
                                        <ReferenceArea
                                            x1={-0.708} y1={1.5} x2={0.708} y2={3.6}
                                            fill="rgba(0, 0, 255, 0.05)"
                                            stroke="#000000"
                                            strokeWidth={2}
                                        />

                                        {/* Strike Zone Grid Lines */}
                                        <ReferenceLine x={-0.236} stroke="#ccc" strokeWidth={1} />
                                        <ReferenceLine x={0.236} stroke="#ccc" strokeWidth={1} />
                                        <ReferenceLine y={2.2} stroke="#ccc" strokeWidth={1} />
                                        <ReferenceLine y={2.9} stroke="#ccc" strokeWidth={1} />

                                        {/* Pitch locations */}
                                        <Scatter
                                            dataKey="y"
                                            fill="#8884d8"
                                            shape={CustomDot}
                                        />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="text-center mt-4 space-y-2">
                                <div className="text-lg text-gray-700 font-semibold">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-3xl mx-auto">
                                        <div className="flex items-center">
                                            <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#FF6B6B' }}></span>
                                            Fastball
                                        </div>
                                        <div className="flex items-center">
                                            <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#4ECDC4' }}></span>
                                            Slider
                                        </div>
                                        <div className="flex items-center">
                                            <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#45B7D1' }}></span>
                                            Changeup
                                        </div>
                                        <div className="flex items-center">
                                            <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#96CEB4' }}></span>
                                            Curveball
                                        </div>
                                        <div className="flex items-center">
                                            <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#FFEAA7' }}></span>
                                            Sinker
                                        </div>
                                        <div className="flex items-center">
                                            <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#DDA0DD' }}></span>
                                            Cutter
                                        </div>
                                        <div className="flex items-center">
                                            <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#95A5A6' }}></span>
                                            Other
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pitcher and Batter Essential Stats */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Pitcher Essential Stats */}
                            <div className="bg-white p-6 rounded-lg shadow-lg">
                                <h2 className={`text-2xl font-bold mb-4 missouri-font ${currentPitch.pitch.team_pitching.toLowerCase().includes('missouri') ||
                                    currentPitch.pitch.team_pitching.toLowerCase().includes('mizzou')
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                    }`}>
                                    {currentPitch.pitch.pitcher || 'Unknown'} ({currentPitch.pitch.pitcher_handedness || '?'})
                                </h2>
                                <div className="grid grid-cols-2 gap-4 text-xl">
                                    <div>
                                        <strong>ERA:</strong> {formatStat(currentPitch.pitcher_stats.era)}
                                    </div>
                                    <div>
                                        <strong>FIP:</strong> {formatStat(currentPitch.pitcher_stats.fip)}
                                    </div>
                                    <div>
                                        <strong>FP Strike%:</strong> {formatStat(currentPitch.pitcher_stats.first_pitch_strike_percent, 1)}%
                                    </div>
                                    <div>
                                        <strong>CSW%:</strong> {formatStat(currentPitch.pitcher_stats.csw_percent, 1)}%
                                    </div>
                                    <div>
                                        <strong>K-BB%:</strong> {formatStat(currentPitch.pitcher_stats.k_bb_percent, 1)}%
                                    </div>
                                    <div>
                                        <strong>WHIP:</strong> {formatStat(currentPitch.pitcher_stats.whip)}
                                    </div>
                                </div>
                            </div>

                            {/* Batter Essential Stats */}
                            <div className="bg-white p-6 rounded-lg shadow-lg">
                                <h2 className={`text-2xl font-bold mb-4 missouri-font ${currentPitch.pitch.team_hitting.toLowerCase().includes('missouri') ||
                                    currentPitch.pitch.team_hitting.toLowerCase().includes('mizzou')
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                    }`}>
                                    {currentPitch.pitch.batter || 'Unknown'} ({currentPitch.pitch.batter_handedness || '?'})
                                </h2>
                                <div className="grid grid-cols-2 gap-4 text-xl">
                                    <div>
                                        <strong>xwOBA:</strong> {formatStat(currentPitch.batter_stats.xwoba)}
                                    </div>
                                    <div>
                                        <strong>BB%:</strong> {formatStat(currentPitch.batter_stats.bb_percent, 1)}%
                                    </div>
                                    <div>
                                        <strong>K%:</strong> {formatStat(currentPitch.batter_stats.k_percent, 1)}%
                                    </div>
                                    <div>
                                        <strong>xSLG:</strong> {formatStat(currentPitch.batter_stats.slg)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Recommendations - Real-time coaching advice */}
                        <AIRecommendations
                            currentPitcher={currentPitch.pitch.pitcher || undefined}
                            currentBatter={currentPitch.pitch.batter || undefined}
                            count={currentPitch.pitch.count || undefined}
                            inning={typeof currentPitch.pitch.inning === 'string' ? parseInt(currentPitch.pitch.inning.split(' ')[1]) : 1}
                            runners={currentPitch.pitch.runners_on_base}
                            isMissouriPitching={currentPitch.pitch.is_missouri_pitching}
                        />
                    </div>
                )}

                {/* HITTING TAB */}
                {activeTab === 'hitting' && (
                    <div className="space-y-6">
                        {/* Missouri Lineup */}
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h2 className="text-2xl font-bold mb-6 text-yellow-600 missouri-font">
                                Missouri Tigers Lineup
                            </h2>

                            <div className="space-y-2">
                                {lineup.map((hitter, index) => (
                                    <div key={hitter.Player} className="border rounded-lg overflow-hidden">
                                        {/* Lineup Row - Always Visible */}
                                        <div
                                            className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${expandedHitter === hitter.Player ? 'bg-yellow-50 border-yellow-200' : 'bg-white'
                                                }`}
                                            onClick={() => setExpandedHitter(expandedHitter === hitter.Player ? null : hitter.Player)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="text-lg font-bold text-yellow-600 w-8">
                                                        {index + 1}.
                                                    </div>
                                                    <div>
                                                        <div className="text-lg font-bold text-gray-900">
                                                            {hitter.Player}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            {hitter.Position || 'Unknown Position'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-6">
                                                    <div className="text-right">
                                                        <div className="text-sm text-gray-600">AVG</div>
                                                        <div className="font-semibold">{formatStat(hitter.BA)}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm text-gray-600">OBP</div>
                                                        <div className="font-semibold">{formatStat(hitter.OBP)}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm text-gray-600">SLG</div>
                                                        <div className="font-semibold">{formatStat(hitter.SLG)}</div>
                                                    </div>
                                                    <div className="text-yellow-600">
                                                        {expandedHitter === hitter.Player ? '▼' : '▶'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Stats - Only show when selected */}
                                        {expandedHitter === hitter.Player && (
                                            <div className="bg-gray-50 p-6 border-t">
                                                <h3 className="text-xl font-bold mb-4 text-yellow-600">
                                                    {hitter.Player} - Detailed Stats
                                                </h3>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <strong>AVG:</strong> {formatStat(hitter.BA)}
                                                    </div>
                                                    <div>
                                                        <strong>OBP:</strong> {formatStat(hitter.OBP)}
                                                    </div>
                                                    <div>
                                                        <strong>SLG:</strong> {formatStat(hitter.SLG)}
                                                    </div>
                                                    <div>
                                                        <strong>OPS:</strong> {formatStat(hitter.OPS)}
                                                    </div>
                                                    <div>
                                                        <strong>wOBA:</strong> {formatStat(hitter.wOBA)}
                                                    </div>
                                                    <div>
                                                        <strong>xwOBA:</strong> {formatStat(hitter.xWOBA)}
                                                    </div>
                                                    <div>
                                                        <strong>K%:</strong> {formatStat(hitter['K%'], 1)}%
                                                    </div>
                                                    <div>
                                                        <strong>BB%:</strong> {formatStat(hitter['BB%'], 1)}%
                                                    </div>
                                                    <div>
                                                        <strong>Avg EV:</strong> {formatStat(hitter.AvgEV, 1)} mph
                                                    </div>
                                                    <div>
                                                        <strong>Max EV:</strong> {formatStat(hitter.MaxEV, 1)} mph
                                                    </div>
                                                    <div>
                                                        <strong>Hard Hit%:</strong> {formatStat(hitter['HardHit%'], 1)}%
                                                    </div>
                                                    <div>
                                                        <strong>Barrel%:</strong> {formatStat(hitter['Barrel%'], 1)}%
                                                    </div>
                                                    <div>
                                                        <strong>Launch Angle:</strong> {formatStat(hitter.LaunchAng, 1)}°
                                                    </div>
                                                    <div>
                                                        <strong>PA:</strong> {hitter.PA || 0}
                                                    </div>
                                                    <div>
                                                        <strong>Hits:</strong> {hitter.H || 0}
                                                    </div>
                                                    <div>
                                                        <strong>Home Runs:</strong> {hitter.HR || 0}
                                                    </div>
                                                </div>

                                                {/* Additional advanced stats if available */}
                                                {hitter['Miss% vs CH'] && (
                                                    <div className="mt-6">
                                                        <h4 className="text-lg font-semibold mb-3 text-gray-800">
                                                            Pitch Type Performance
                                                        </h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                            <div>
                                                                <strong>Miss% vs Changeup:</strong> {formatStat(hitter['Miss% vs CH'], 1)}%
                                                            </div>
                                                            <div>
                                                                <strong>Miss% vs Spin:</strong> {formatStat(hitter['Miss% vs Spin'], 1)}%
                                                            </div>
                                                            <div>
                                                                <strong>Miss% vs Fastball:</strong> {formatStat(hitter['Miss% vs FB'], 1)}%
                                                            </div>
                                                            <div>
                                                                <strong>Swing%:</strong> {formatStat(hitter['Swing%'], 1)}%
                                                            </div>
                                                            <div>
                                                                <strong>Pull%:</strong> {formatStat(hitter['HPull%'], 1)}%
                                                            </div>
                                                            <div>
                                                                <strong>Oppo Field%:</strong> {formatStat(hitter['HOppFld%'], 1)}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {lineup.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <p>Loading lineup...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* PITCHING TAB */}
                {activeTab === 'pitching' && (
                    <div className="space-y-6">
                        {/* AI Pitcher Report */}
                        <AIRecommendations
                            currentPitcher={currentPitch.pitch.pitcher || undefined}
                            currentBatter={currentPitch.pitch.batter || undefined}
                            count={currentPitch.pitch.count || undefined}
                            inning={typeof currentPitch.pitch.inning === 'string' ? parseInt(currentPitch.pitch.inning.split(' ')[1]) : 1}
                            runners={currentPitch.pitch.runners_on_base}
                            isMissouriPitching={currentPitch.pitch.is_missouri_pitching}
                        />

                        {/* Comprehensive Pitcher Stats */}
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h2 className={`text-2xl font-bold mb-4 missouri-font ${currentPitch.pitch.team_pitching.toLowerCase().includes('missouri') ||
                                currentPitch.pitch.team_pitching.toLowerCase().includes('mizzou')
                                ? 'text-yellow-600'
                                : 'text-red-600'
                                }`}>
                                Pitcher: {currentPitch.pitch.pitcher || 'Unknown'} ({currentPitch.pitch.pitcher_handedness || '?'})
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-lg">
                                <div>
                                    <strong>ERA:</strong> {formatStat(currentPitch.pitcher_stats.era)}
                                </div>
                                <div>
                                    <strong>WHIP:</strong> {formatStat(currentPitch.pitcher_stats.whip)}
                                </div>
                                <div>
                                    <strong>FIP:</strong> {formatStat(currentPitch.pitcher_stats.fip)}
                                </div>
                                <div>
                                    <strong>WOBA Against:</strong> {formatStat(currentPitch.pitcher_stats.woba_against)}
                                </div>
                                <div>
                                    <strong>K-BB%:</strong> {formatStat(currentPitch.pitcher_stats.k_bb_percent, 1)}%
                                </div>
                                <div>
                                    <strong>CSW%:</strong> {formatStat(currentPitch.pitcher_stats.csw_percent, 1)}%
                                </div>
                                <div>
                                    <strong>Chase%:</strong> {formatStat(currentPitch.pitcher_stats.chase_percent, 1)}%
                                </div>
                                <div>
                                    <strong>FP Strike%:</strong> {formatStat(currentPitch.pitcher_stats.first_pitch_strike_percent, 1)}%
                                </div>
                            </div>
                        </div>

                        {/* Detailed Pitch Information */}
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h2 className="text-2xl font-bold mb-4 text-center missouri-font">Pitch Analysis</h2>
                            <div className="text-center mb-4">
                                <div className="text-4xl font-bold text-blue-600 mb-2">
                                    {currentPitch.pitch.type || 'Unknown'}
                                </div>
                                <div className="text-3xl font-semibold text-gray-700">
                                    {formatStat(currentPitch.pitch.velocity, 1)} mph
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-lg">
                                <div>
                                    <strong>Result:</strong> {currentPitch.pitch.pitch_result}
                                </div>
                                <div>
                                    <strong>Outcome:</strong> {currentPitch.pitch.result}
                                </div>
                                <div>
                                    <strong>Spin Rate:</strong> {formatStat(currentPitch.pitch.spinRate, 0)} rpm
                                </div>
                                <div>
                                    <strong>H. Break:</strong> {formatStat(currentPitch.pitch.horizontalBreak, 1)}"
                                </div>
                                <div>
                                    <strong>V. Break:</strong> {formatStat(currentPitch.pitch.verticalBreak, 1)}"
                                </div>
                                <div>
                                    <strong>Extension:</strong> {formatStat(currentPitch.pitch.extension, 1)} ft
                                </div>
                            </div>
                        </div>

                        {/* Velocity History Chart */}
                        {velocityHistory.length > 1 && (
                            <div className="bg-white p-6 rounded-lg shadow-lg">
                                <h3 className="text-2xl font-bold mb-4 missouri-font">Fastball Velocity Trend</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={velocityHistory}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="pitch" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="velocity" stroke="#8884d8" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Pitch Type Breakdown */}
                        {pitchBreakdown.length > 1 && (
                            <div className="bg-white p-6 rounded-lg shadow-lg">
                                <h3 className="text-2xl font-bold mb-4 missouri-font">Pitch Type Usage</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie
                                                    data={pitchBreakdown}
                                                    dataKey="count"
                                                    nameKey="type"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                >
                                                    {pitchBreakdown.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-2">
                                        {pitchBreakdown.map((item, index) => (
                                            <div key={item.type} className="flex justify-between">
                                                <span className="font-semibold">{item.type}:</span>
                                                <span>{item.count} ({item.percentage}%)</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* DEFENSE TAB */}
                {activeTab === 'defense' && (
                    <div className="space-y-6">
                        {/* Alabama Scouting - Dynamic based on game state */}
                        <AlabamaScouting
                            isMissouriPitching={currentPitch.pitch.is_missouri_pitching}
                            currentPitcher={currentPitch.pitch.pitcher || undefined}
                            currentBatter={currentPitch.pitch.batter || undefined}
                        />

                        {/* Defense Placeholder - Can be expanded later */}
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h2 className="text-3xl font-bold mb-4 text-center missouri-font">Defensive Analysis</h2>
                            <div className="text-center text-gray-600">
                                <p className="mb-4 text-xl">Defensive positioning and analysis will be displayed here.</p>
                                <p className="text-lg">Features to be added:</p>
                                <ul className="text-left max-w-md mx-auto mt-4 space-y-2 text-lg">
                                    <li>• Fielding alignment visualization</li>
                                    <li>• Defensive shifts</li>
                                    <li>• Fielder positioning recommendations</li>
                                    <li>• Play outcome analysis</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* ALABAMA TAB */}
                {activeTab === 'alabama' && (
                    <div className="space-y-6">
                        <AlabamaScouting
                            isMissouriPitching={currentPitch.pitch.is_missouri_pitching}
                            currentPitcher={currentPitch.pitch.pitcher || undefined}
                            currentBatter={currentPitch.pitch.batter || undefined}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default GamedayPage;
