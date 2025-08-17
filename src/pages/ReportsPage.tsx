// --- ReportsPage.tsx (Single Player Report View) ---

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar } from 'recharts';
import Header from "../components/Header";

const ReportsPage = () => {
    const { playerId } = useParams();
    const navigate = useNavigate();
    const [playerData, setPlayerData] = useState<any[]>([]);
    const [playerStats, setPlayerStats] = useState<any>(null);
    const [playerSplits, setPlayerSplits] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [splitsLoading, setSplitsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [playerType, setPlayerType] = useState<'hitter' | 'pitcher' | null>(null);
    const [activeTab, setActiveTab] = useState<'hitters' | 'pitchers'>('hitters');
    const [viewMode, setViewMode] = useState<'charts' | 'stats' | 'splits'>('stats');
    const [selectedSplit, setSelectedSplit] = useState<string>('counts');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [selectedStats, setSelectedStats] = useState<string[]>([]);
    const [showStatSelector, setShowStatSelector] = useState(false);
    const [selectedHeatMapStat, setSelectedHeatMapStat] = useState<string>('Contact Rate');
    const [selectedPitcherHeatMapStat, setSelectedPitcherHeatMapStat] = useState<string>('Strike Rate');
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

    // Initialize selectedStats based on player type
    useEffect(() => {
        if (playerType === 'hitter') {
            setSelectedStats(['ExitVel', 'xWOBA', 'xSLG', 'LaunchAng']);
            setSelectedSplit('counts');
        } else if (playerType === 'pitcher') {
            setSelectedStats(['Vel', 'Spin', 'xWOBA', 'HorzBrk', 'IndVertBrk']);
            setSelectedSplit('pitch_types');
        }
    }, [playerType]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await fetch(`http://localhost:8000/reports/${playerId}`);
                if (!res.ok) {
                    throw new Error(`Failed to fetch data: ${res.status}`);
                }
                const json = await res.json();
                console.log('Player data:', json); // Debug log

                // Handle new response structure
                if (json.player_type && json.player_stats) {
                    setPlayerType(json.player_type);
                    setPlayerStats(json.player_stats);
                    setPlayerData(json.chart_data || []);
                    // Set the correct tab based on player type
                    setActiveTab(json.player_type === 'hitter' ? 'hitters' : 'pitchers');
                } else {
                    // Handle old format for backward compatibility
                    setPlayerData(json);
                    if (json.length > 0) {
                        if (json[0].wOBA !== undefined || json[0].ExitSpeed !== undefined) {
                            setPlayerType('hitter');
                            setActiveTab('hitters');
                        } else {
                            setPlayerType('pitcher');
                            setActiveTab('pitchers');
                        }
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch data');
                console.error('Error fetching player data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (playerId) {
            fetchData();
        }
    }, [playerId]);

    // Fetch splits data
    const fetchSplits = async () => {
        if (!playerId) return;

        try {
            setSplitsLoading(true);
            const res = await fetch(`http://localhost:8000/splits/${playerId}`);
            if (!res.ok) {
                throw new Error(`Failed to fetch splits data: ${res.status}`);
            }
            const json = await res.json();
            setPlayerSplits(json);
        } catch (err) {
            console.error('Error fetching splits data:', err);
        } finally {
            setSplitsLoading(false);
        }
    };

    // Fetch splits when switching to splits view
    useEffect(() => {
        if (viewMode === 'splits' && !playerSplits) {
            fetchSplits();
        }
    }, [viewMode, playerId]);

    // Function to format player statistics for display
    const formatStatValue = (key: string, value: any) => {
        if (value === null || value === undefined || value === '' || value === 0) return '-';

        // Handle percentage fields
        if (key.includes('%') || ['BB%', 'K%', 'CSW%', 'FPStk%', 'HardHit%', 'Barrel%', 'InZone%', 'Chase%', 'Miss% vs CH', 'Miss% vs Spin', 'Miss% vs FB', 'ChangeMiss%', 'RISPPull%', 'FastMiss%', 'Swing%', 'HOppFld%', 'HPull%', 'K%-BB%'].includes(key)) {
            // Check if value already has % sign
            if (typeof value === 'string' && value.includes('%')) {
                // Parse the number and reformat to 1 decimal
                const numValue = parseFloat(value.replace('%', ''));
                return isNaN(numValue) ? value : `${numValue.toFixed(1)}%`;
            }
            return typeof value === 'number' ? `${value.toFixed(1)}%` : `${value}%`;
        }

        // Handle advanced metrics (3 decimals)
        if (['wOBA', 'xWOBA', 'BA', 'OBP', 'SLG', 'OPS', 'xSLG', 'xISO', 'xAVG'].includes(key)) {
            return typeof value === 'number' ? value.toFixed(3) : value;
        }

        // Handle ERA and similar metrics (2 decimals)
        if (['ERA', 'RA9-ERA', 'RA/9', 'GB/FB', 'FIP', 'xFIP_TM', 'WHIP'].includes(key)) {
            return typeof value === 'number' ? value.toFixed(2) : value;
        }

        // Handle exit velocity and similar metrics (1 decimal with units)
        if (['AvgEV', 'MaxEV', 'ExitVel'].includes(key)) {
            return typeof value === 'number' ? `${value.toFixed(1)} mph` : value;
        }

        // Handle launch angle (1 decimal with units)
        if (key === 'LaunchAng') {
            return typeof value === 'number' ? `${value.toFixed(1)}°` : value;
        }

        // Handle innings pitched (1 decimal)
        if (key === 'IP') {
            return typeof value === 'number' ? value.toFixed(1) : value;
        }

        // Handle counting stats (no decimals)
        if (['PA', 'AB', 'H', '1B', '2B', '3B', 'HR', 'Rank'].includes(key)) {
            return typeof value === 'number' ? Math.round(value) : value;
        }

        // Default: return as-is for strings, 3 decimals for numbers
        return typeof value === 'number' ? value.toFixed(3) : value;
    };

    // Helper function to generate heat map data based on selected stat
    const generateHeatMapData = (stat: string, isStrikeZone: boolean) => {
        const statData: { [key: string]: { min: number; max: number; isPercentage: boolean; unit?: string } } = {
            'Contact Rate': { min: isStrikeZone ? 0.6 : 0.2, max: isStrikeZone ? 0.9 : 0.6, isPercentage: true },
            'Exit Velocity': { min: isStrikeZone ? 85 : 75, max: isStrikeZone ? 105 : 95, isPercentage: false, unit: 'mph' },
            'Launch Angle': { min: isStrikeZone ? 10 : 5, max: isStrikeZone ? 25 : 20, isPercentage: false, unit: '°' },
            'wOBA': { min: isStrikeZone ? 0.350 : 0.250, max: isStrikeZone ? 0.450 : 0.350, isPercentage: false },
            'Hard Hit Rate': { min: isStrikeZone ? 0.4 : 0.2, max: isStrikeZone ? 0.7 : 0.5, isPercentage: true },
            'Strike Rate': { min: isStrikeZone ? 0.7 : 0.3, max: isStrikeZone ? 0.95 : 0.7, isPercentage: true },
            'Whiff Rate': { min: isStrikeZone ? 0.15 : 0.25, max: isStrikeZone ? 0.35 : 0.45, isPercentage: true },
            'CSW%': { min: isStrikeZone ? 0.25 : 0.15, max: isStrikeZone ? 0.40 : 0.30, isPercentage: true },
            'Chase Rate': { min: isStrikeZone ? 0.05 : 0.25, max: isStrikeZone ? 0.15 : 0.45, isPercentage: true }
        };

        const config = statData[stat] || { min: 0.3, max: 0.7, isPercentage: true };
        const value = config.min + Math.random() * (config.max - config.min);

        const opacity = Math.min(Math.max(value / (config.isPercentage ? 1 : config.max), 0.2), 1);
        const opacityClass = opacity >= 0.8 ? 'opacity-100' :
            opacity >= 0.6 ? 'opacity-75' :
                opacity >= 0.4 ? 'opacity-50' : 'opacity-25';

        return {
            value,
            displayValue: config.isPercentage
                ? `${Math.round(value * 100)}%`
                : `${value.toFixed(1)}${config.unit || ''}`,
            opacityClass
        };
    };

    const renderPlayerStats = () => {
        if (!playerStats) return null;

        // Complete list of hitter statistics
        const hitterStats = [
            'Miss% vs CH', 'Miss% vs Spin', 'Miss% vs FB', 'ChangeMiss%', 'RISPPull%', 'FastMiss%',
            'Swing%', 'HOppFld%', 'HPull%', 'LaunchAng', 'AvgEV', 'MaxEV', 'HardHit%', 'Barrel%',
            'BB%', 'K%', 'xSLG', 'xWOBA', 'wOBA', 'PA', 'AB', 'BA', 'OBP', 'SLG', 'OPS',
            'H', '1B', '2B', '3B', 'HR'
        ];

        // Complete list of pitcher statistics
        const pitcherStats = [
            'IP', 'RA9-ERA', 'ERA', 'RA/9', 'WHIP', 'FIP', 'xFIP_TM', 'wOBA', 'xWOBA',
            'K%', 'BB%', 'K%-BB%', 'CSW%', 'FPStk%', 'InZone%', 'Chase%', 'HardHit%',
            'Barrel%', 'GB/FB'
        ];

        const statsToShow = playerType === 'hitter' ? hitterStats : pitcherStats;

        return (
            <div className="mb-8 p-3 md:p-6 bg-gray-800 rounded-lg">
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-4 text-white`}>
                    {playerType === 'hitter' ? 'Complete Season Hitting Statistics' : 'Complete Season Pitching Statistics'}
                </h2>
                <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'}`}>
                    {statsToShow.map((stat) => (
                        <div key={stat} className={`text-center ${isMobile ? 'p-2' : 'p-2'} bg-gray-700 rounded`}>
                            <div className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-xs'} font-medium mb-1`}>{stat}</div>
                            <div className={`text-white ${isMobile ? 'text-sm' : 'text-sm'} font-bold`}>
                                {formatStatValue(stat, playerStats[stat])}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderSplits = () => {
        if (splitsLoading) {
            return (
                <div className="text-center py-8">
                    <p className="text-lg text-white">Loading splits data...</p>
                </div>
            );
        }

        if (!playerSplits || !playerSplits.splits) {
            return (
                <div className="text-center py-8">
                    <p className="text-lg text-white">No splits data available for {playerId}</p>
                </div>
            );
        }

        const formatSplitValue = (value: any, stat: string) => {
            if (value === null || value === undefined) return '-';

            // Handle specific stats with units
            if (stat === 'ExitVel' || stat === 'Vel') {
                return `${(typeof value === 'number' ? value.toFixed(1) : value)} mph`;
            }
            if (stat === 'LaunchAng') {
                return `${(typeof value === 'number' ? value.toFixed(1) : value)}°`;
            }
            if (stat === 'Spin') {
                return `${(typeof value === 'number' ? Math.round(value) : value)} rpm`;
            }
            if (stat === 'HorzBrk' || stat === 'IndVertBrk') {
                return `${(typeof value === 'number' ? value.toFixed(1) : value)} in`;
            }

            // Handle percentage stats
            if (stat.includes('%')) {
                // Check if value already has % sign
                if (typeof value === 'string' && value.includes('%')) {
                    const numValue = parseFloat(value.replace('%', ''));
                    return isNaN(numValue) ? value : `${numValue.toFixed(1)}%`;
                }
                // Check if it's a valid number (not NaN)
                if (typeof value === 'number' && !isNaN(value)) {
                    return `${value.toFixed(1)}%`;
                }
                return value; // Return as-is if can't parse
            }

            // Check for NaN after percentage handling
            if (typeof value === 'number' && isNaN(value)) return '-';

            // Handle advanced metrics (3 decimals)
            if (['xWOBA', 'xSLG', 'xISO', 'xAVG', 'wOBA', 'BA', 'OBP', 'SLG', 'OPS'].includes(stat)) {
                return typeof value === 'number' ? value.toFixed(3) : value;
            }

            // Handle ERA-type stats (2 decimals)
            if (['ERA', 'WHIP', 'FIP', 'RA9-ERA', 'RA/9', 'GB/FB', 'xFIP_TM'].includes(stat)) {
                return typeof value === 'number' ? value.toFixed(2) : value;
            }

            // Handle innings pitched (1 decimal)
            if (stat === 'IP') {
                return typeof value === 'number' ? value.toFixed(1) : value;
            }

            // Handle counting stats (no decimals)
            if (['PA', 'AB', 'H', 'HR', 'RBI', 'R', '1B', '2B', '3B'].includes(stat)) {
                return typeof value === 'number' ? Math.round(value) : value;
            }

            // Default: 3 decimals for other numeric stats
            return typeof value === 'number' ? value.toFixed(3) : value;
        };

        // Define comprehensive available stats for selection
        const availableStats = [
            // Hitter Stats
            { key: 'Miss% vs CH', label: 'Miss% vs CH', unit: '%', hitterOnly: true },
            { key: 'Miss% vs Spin', label: 'Miss% vs Spin', unit: '%', hitterOnly: true },
            { key: 'Miss% vs FB', label: 'Miss% vs FB', unit: '%', hitterOnly: true },
            { key: 'ChangeMiss%', label: 'Change Miss%', unit: '%', hitterOnly: true },
            { key: 'RISPPull%', label: 'RISP Pull%', unit: '%', hitterOnly: true },
            { key: 'FastMiss%', label: 'Fast Miss%', unit: '%', hitterOnly: true },
            { key: 'Swing%', label: 'Swing%', unit: '%', hitterOnly: true },
            { key: 'HOppFld%', label: 'Hard Opp Fld%', unit: '%', hitterOnly: true },
            { key: 'HPull%', label: 'Hard Pull%', unit: '%', hitterOnly: true },
            { key: 'LaunchAng', label: 'Launch Angle', unit: '°', hitterOnly: true },
            { key: 'AvgEV', label: 'Avg Exit Velocity', unit: 'mph', hitterOnly: true },
            { key: 'MaxEV', label: 'Max Exit Velocity', unit: 'mph', hitterOnly: true },
            { key: 'ExitVel', label: 'Exit Velocity', unit: 'mph', hitterOnly: true },
            { key: 'HardHit%', label: 'Hard Hit%', unit: '%' },
            { key: 'Barrel%', label: 'Barrel%', unit: '%' },
            { key: 'BB%', label: 'BB%', unit: '%' },
            { key: 'K%', label: 'K%', unit: '%' },
            { key: 'xSLG', label: 'xSLG', unit: '', hitterOnly: true },
            { key: 'xWOBA', label: 'xWOBA', unit: '' },
            { key: 'wOBA', label: 'wOBA', unit: '' },
            { key: 'PA', label: 'PA', unit: '', hitterOnly: true },
            { key: 'AB', label: 'AB', unit: '', hitterOnly: true },
            { key: 'BA', label: 'BA', unit: '', hitterOnly: true },
            { key: 'OBP', label: 'OBP', unit: '', hitterOnly: true },
            { key: 'SLG', label: 'SLG', unit: '', hitterOnly: true },
            { key: 'OPS', label: 'OPS', unit: '', hitterOnly: true },
            { key: 'H', label: 'H', unit: '', hitterOnly: true },
            { key: '1B', label: '1B', unit: '', hitterOnly: true },
            { key: '2B', label: '2B', unit: '', hitterOnly: true },
            { key: '3B', label: '3B', unit: '', hitterOnly: true },
            { key: 'HR', label: 'HR', unit: '', hitterOnly: true },

            // Pitcher Stats
            { key: 'IP', label: 'IP', unit: '', pitcherOnly: true },
            { key: 'RA9-ERA', label: 'RA9-ERA', unit: '', pitcherOnly: true },
            { key: 'ERA', label: 'ERA', unit: '', pitcherOnly: true },
            { key: 'RA/9', label: 'RA/9', unit: '', pitcherOnly: true },
            { key: 'WHIP', label: 'WHIP', unit: '', pitcherOnly: true },
            { key: 'FIP', label: 'FIP', unit: '', pitcherOnly: true },
            { key: 'xFIP_TM', label: 'xFIP_TM', unit: '', pitcherOnly: true },
            { key: 'K%-BB%', label: 'K%-BB%', unit: '%', pitcherOnly: true },
            { key: 'CSW%', label: 'CSW%', unit: '%', pitcherOnly: true },
            { key: 'FPStk%', label: 'FP Strike%', unit: '%', pitcherOnly: true },
            { key: 'InZone%', label: 'In Zone%', unit: '%', pitcherOnly: true },
            { key: 'Chase%', label: 'Chase%', unit: '%', pitcherOnly: true },
            { key: 'GB/FB', label: 'GB/FB', unit: '', pitcherOnly: true },
            { key: 'Vel', label: 'Pitch Velocity', unit: 'mph', pitcherOnly: true },
            { key: 'Extension', label: 'Extension', unit: 'ft', pitcherOnly: true },
            { key: 'pCallStrk%', label: 'Called Strike%', unit: '%', pitcherOnly: true },

            // Advanced Stats (available in splits)
            { key: 'xISO', label: 'xISO', unit: '' },
            { key: 'xAVG', label: 'xAVG', unit: '' },
            { key: 'Spin', label: 'Spin Rate', unit: 'rpm' },
            { key: 'HorzBrk', label: 'Horizontal Break', unit: 'in' },
            { key: 'IndVertBrk', label: 'Induced Vert Break', unit: 'in' }
        ];

        // Filter stats based on player type
        const filteredStats = availableStats.filter(stat => {
            if (playerType === 'hitter') {
                return !stat.pitcherOnly;
            } else if (playerType === 'pitcher') {
                return !stat.hitterOnly;
            }
            return true;
        });

        // Define available split types
        const splitOptions = [
            { value: 'counts', label: 'By Count', key: 'counts' },
            { value: 'velocity', label: 'By Velocity Range', key: 'velocity' },
            { value: 'base_situations', label: 'By Base Situation', key: 'base_situations' },
            { value: 'outs', label: 'By Outs', key: 'outs' },
        ];

        // Add pitcher-specific split types
        if (playerType === 'pitcher') {
            splitOptions.splice(1, 0, { value: 'pitch_types', label: 'By Pitch Type', key: 'pitch_types' });
        }

        // Add handedness split options based on player type
        if (playerType === 'hitter' && playerSplits.splits.vs_pitcher_hand) {
            splitOptions.push({ value: 'vs_pitcher_hand', label: 'vs Pitcher Handedness', key: 'vs_pitcher_hand' });
        }
        if (playerType === 'pitcher' && playerSplits.splits.vs_batter_hand) {
            splitOptions.push({ value: 'vs_batter_hand', label: 'vs Batter Handedness', key: 'vs_batter_hand' });
        }

        // Handle sorting
        const handleSort = (key: string) => {
            let direction: 'asc' | 'desc' = 'desc';
            if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
                direction = 'asc';
            }
            setSortConfig({ key, direction });
        };

        // Handle stat selection
        const handleStatToggle = (statKey: string) => {
            setSelectedStats(prev => {
                if (prev.includes(statKey)) {
                    return prev.filter(s => s !== statKey);
                } else {
                    return [...prev, statKey];
                }
            });
        };

        const renderSplitSection = (data: any) => {
            if (!data || Object.keys(data).length === 0) {
                return (
                    <div className="p-6 bg-gray-800 rounded-lg">
                        <p className="text-white text-center">No data available for this split type.</p>
                    </div>
                );
            }

            // Convert data to array for sorting
            let dataArray = Object.entries(data).map(([key, values]: [string, any]) => ({
                split: key,
                ...values
            }));

            // Apply sorting
            if (sortConfig) {
                dataArray.sort((a, b) => {
                    const aVal = a[sortConfig.key];
                    const bVal = b[sortConfig.key];

                    // Handle null/undefined values
                    if (aVal === null || aVal === undefined) return 1;
                    if (bVal === null || bVal === undefined) return -1;

                    const aNum = typeof aVal === 'number' ? aVal : parseFloat(aVal);
                    const bNum = typeof bVal === 'number' ? bVal : parseFloat(bVal);

                    if (sortConfig.direction === 'asc') {
                        return aNum - bNum;
                    } else {
                        return bNum - aNum;
                    }
                });
            }

            const getSortIcon = (key: string) => {
                if (!sortConfig || sortConfig.key !== key) {
                    return <span className="ml-1 text-gray-400">↕</span>;
                }
                return sortConfig.direction === 'asc' ?
                    <span className="ml-1 text-yellow-400">↑</span> :
                    <span className="ml-1 text-yellow-400">↓</span>;
            };

            return (
                <div className="p-6 bg-gray-800 rounded-lg">
                    {/* Stat Selection Controls */}
                    <div className="mb-4 pb-4 border-b border-gray-600">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-white font-semibold">Display Statistics:</h4>
                            <button
                                onClick={() => setShowStatSelector(!showStatSelector)}
                                className="px-3 py-1 bg-yellow-400 text-black rounded text-sm hover:bg-yellow-300 transition-colors"
                            >
                                {showStatSelector ? 'Hide' : 'Show'} Options
                            </button>
                        </div>

                        {showStatSelector && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {filteredStats.map(stat => (
                                    <label key={stat.key} className="flex items-center text-white text-sm">
                                        <input
                                            type="checkbox"
                                            checked={selectedStats.includes(stat.key)}
                                            onChange={() => handleStatToggle(stat.key)}
                                            className="mr-2 accent-yellow-400"
                                        />
                                        {stat.label}
                                    </label>
                                ))}
                            </div>
                        )}

                        <div className="mt-2 text-gray-400 text-xs">
                            Selected: {selectedStats.map(s => filteredStats.find(f => f.key === s)?.label).join(', ')}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-white">
                            <thead>
                                <tr className="border-b border-gray-600">
                                    <th className="text-left py-3 px-4 font-semibold">Split</th>
                                    {selectedStats.map(statKey => {
                                        const stat = filteredStats.find(s => s.key === statKey);
                                        return (
                                            <th
                                                key={statKey}
                                                className="text-center py-3 px-4 font-semibold cursor-pointer hover:bg-gray-700 transition-colors"
                                                onClick={() => handleSort(statKey)}
                                                title={`Click to sort by ${stat?.label}`}
                                            >
                                                {stat?.label}
                                                {getSortIcon(statKey)}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {dataArray.map((row) => (
                                    <tr key={row.split} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                                        <td className="py-3 px-4 font-medium">{row.split}</td>
                                        {selectedStats.map(statKey => (
                                            <td key={statKey} className="py-3 px-4 text-center">
                                                {formatSplitValue(row[statKey], statKey)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Sort Help */}
                    <div className="mt-4 text-xs text-gray-400">
                        Click column headers to sort •
                        {sortConfig ? ` Currently sorted by ${filteredStats.find(s => s.key === sortConfig.key)?.label} (${sortConfig.direction === 'asc' ? 'ascending' : 'descending'})` : ' No sorting applied'}
                    </div>
                </div>
            );
        };

        const selectedSplitOption = splitOptions.find(opt => opt.value === selectedSplit);
        const currentSplitData = playerSplits.splits[selectedSplit];

        return (
            <div className="space-y-6">
                {/* Split Type Selector */}
                <div className="bg-gray-800 p-4 rounded-lg">
                    <label htmlFor="split-selector" className="block text-white font-semibold mb-2">Select Split Type:</label>
                    <select
                        id="split-selector"
                        value={selectedSplit}
                        onChange={(e) => setSelectedSplit(e.target.value)}
                        className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-400 focus:outline-none"
                        title="Select a split type to analyze"
                    >
                        {splitOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Player Handedness Info */}
                {playerSplits.splits.player_handedness && (
                    <div className="bg-blue-900 p-4 rounded-lg">
                        <p className="text-white">
                            <span className="font-semibold">Player Handedness:</span> {' '}
                            {playerSplits.splits.player_handedness.hand === 'L' ? 'Left-handed' : 'Right-handed'} {' '}
                            {playerSplits.splits.player_handedness.type}
                        </p>
                    </div>
                )}

                {/* Selected Split Data */}
                <div>
                    <h3 className="text-xl font-bold text-white mb-4">
                        {selectedSplitOption?.label || 'Split Analysis'}
                    </h3>
                    {renderSplitSection(currentSplitData)}
                </div>

                {/* Summary Stats */}
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-white mb-2">Split Summary</h4>
                    <p className="text-gray-300 text-sm">
                        Showing {currentSplitData ? Object.keys(currentSplitData).length : 0} different situations for {selectedSplitOption?.label.toLowerCase()}
                        {sortConfig && ` • Sorted by ${filteredStats.find(s => s.key === sortConfig.key)?.label}`}
                    </p>
                </div>
            </div>
        );
    }; return (
        <div className="p-3 md:p-6 min-h-screen bg-gray-700">
            <div className="mb-6">
                <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-white mb-4`}>
                    Report: {playerId}
                </h1>

                {/* Hitters/Pitchers Toggle */}
                <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-4'} mt-4`}>
                    <button
                        onClick={() => {
                            navigate('/reports?tab=hitters');
                        }}
                        className={`${isMobile ? 'w-full' : ''} px-6 py-2 rounded font-semibold ${playerType === 'hitter'
                            ? 'bg-yellow-400 text-black'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        Hitters
                    </button>
                    <button
                        onClick={() => {
                            navigate('/reports?tab=pitchers');
                        }}
                        className={`${isMobile ? 'w-full' : ''} px-6 py-2 rounded font-semibold ${playerType === 'pitcher'
                            ? 'bg-yellow-400 text-black'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        Pitchers
                    </button>
                </div>

                {playerType && (
                    <div className="mt-4">
                        <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold text-gray-300`}>
                            {playerType === 'hitter' ? 'Hitter Analytics' : 'Pitcher Analytics'}
                        </h2>
                    </div>
                )}

                {/* View Mode Toggle */}
                <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'} mt-6`}>
                    <button
                        onClick={() => setViewMode('stats')}
                        className={`${isMobile ? 'w-full' : ''} px-4 py-2 rounded text-sm font-medium ${viewMode === 'stats'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                    >
                        Season Stats
                    </button>
                    <button
                        onClick={() => setViewMode('charts')}
                        className={`px-4 py-2 rounded text-sm font-medium ${viewMode === 'charts'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                    >
                        Performance Charts
                    </button>
                    <button
                        onClick={() => setViewMode('splits')}
                        className={`px-4 py-2 rounded text-sm font-medium ${viewMode === 'splits'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                    >
                        Splits Analysis
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <p className="text-lg text-white">Loading player data...</p>
                </div>
            ) : error ? (
                <div className="text-center py-8">
                    <p className="text-red-400 text-lg">Error: {error}</p>
                    <p className="text-gray-400 mt-2">Please check if the player name is correct and try again.</p>
                </div>
            ) : playerData.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-lg text-white">No data found for {playerId}</p>
                    <p className="text-gray-400 mt-2">This player might not have any recorded at-bats with exit velocity data.</p>
                </div>
            ) : (
                <>
                    {/* Render based on view mode */}
                    {viewMode === 'stats' && (
                        <>
                            {/* Player Statistics Section */}
                            {renderPlayerStats()}

                            <div className="mb-4 p-4 bg-gray-100 rounded">
                                <h3 className="font-semibold mb-2">
                                    {playerType === 'hitter' ? 'Hitting Summary' : 'Pitching Summary'}
                                </h3>
                                <p><strong>Total {playerType === 'hitter' ? 'At-Bats' : 'Outings'} with Data:</strong> {playerData.length}</p>
                                {playerData.length > 0 && playerType === 'hitter' && (
                                    <>
                                        <p><strong>Avg wOBA:</strong> {(playerData.reduce((sum, d) => sum + (d.wOBA || 0), 0) / playerData.length).toFixed(3)}</p>
                                        <p><strong>Avg Exit Velocity:</strong> {(playerData.reduce((sum, d) => sum + (d.ExitSpeed || 0), 0) / playerData.length).toFixed(1)} mph</p>
                                    </>
                                )}
                                {playerData.length > 0 && playerType === 'pitcher' && (
                                    <>
                                        <p><strong>Avg ERA:</strong> {playerData[0]?.ERA || 'N/A'}</p>
                                        <p><strong>Avg WHIP:</strong> {playerData[0]?.WHIP || 'N/A'}</p>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {viewMode === 'splits' && renderSplits()}

                    {viewMode === 'charts' && (
                        <>
                            {playerType === 'hitter' && (
                                <>
                                    {/* Spray Chart */}
                                    <div className="mb-8">
                                        <h2 className="text-lg font-semibold mb-4 text-white">Spray Chart - Batted Ball Location</h2>
                                        <div className="bg-white rounded-lg p-6">
                                            <div className="relative w-full flex justify-center">
                                                <img
                                                    src="/spray-chart.jpg"
                                                    alt="Player Spray Chart"
                                                    className="w-1/4 h-auto rounded-lg shadow-lg"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Strike Zone Heat Map */}
                                    <div className="mb-8">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-lg font-semibold text-white">Strike Zone Heat Map</h2>
                                            <div className="flex items-center space-x-2">
                                                <label htmlFor="hitter-heatmap-stat" className="text-white text-sm">Stat:</label>
                                                <select
                                                    id="hitter-heatmap-stat"
                                                    value={selectedHeatMapStat}
                                                    onChange={(e) => setSelectedHeatMapStat(e.target.value)}
                                                    className="px-3 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-400 focus:outline-none text-sm"
                                                >
                                                    <option value="Contact Rate">Contact Rate</option>
                                                    <option value="Exit Velocity">Exit Velocity</option>
                                                    <option value="Launch Angle">Launch Angle</option>
                                                    <option value="wOBA">wOBA</option>
                                                    <option value="Hard Hit Rate">Hard Hit Rate</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-6">
                                            <div className="flex justify-center">
                                                <div className="grid grid-cols-5 gap-1 p-4 border-2 border-black w-80 h-96">
                                                    {Array.from({ length: 25 }, (_, i) => {
                                                        const row = Math.floor(i / 5);
                                                        const col = i % 5;
                                                        const isStrikeZone = row >= 1 && row <= 3 && col >= 1 && col <= 3;
                                                        const heatData = generateHeatMapData(selectedHeatMapStat, isStrikeZone);
                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`aspect-square border border-gray-300 flex items-center justify-center text-xs font-bold ${heatData.value > 0.5 ? 'text-white' : 'text-black'} ${isStrikeZone ? 'bg-red-400' : 'bg-teal-400'} ${heatData.opacityClass}`}
                                                            >
                                                                {heatData.displayValue}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="mt-4 text-center text-sm">
                                                <p className="text-gray-600">Heat map shows {selectedHeatMapStat.toLowerCase()} by zone. Strike zone (center 3x3) highlighted in red.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Exit Velocity vs Launch Angle */}
                                    <div className="mb-8">
                                        <h2 className="text-lg font-semibold mb-2 text-white">Exit Velocity vs Launch Angle</h2>
                                        <ResponsiveContainer width="100%" height={400}>
                                            <ScatterChart>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="launchAngle"
                                                    domain={[-30, 60]}
                                                    label={{ value: 'Launch Angle (degrees)', position: 'insideBottom', offset: -5 }}
                                                />
                                                <YAxis
                                                    dataKey="exitVelocity"
                                                    domain={[70, 120]}
                                                    label={{ value: 'Exit Velocity (mph)', angle: -90, position: 'insideLeft' }}
                                                />
                                                <Tooltip
                                                    formatter={(value, name) => [
                                                        name === 'exitVelocity' ? `${value} mph` : `${value}°`,
                                                        name === 'exitVelocity' ? 'Exit Velocity' : 'Launch Angle'
                                                    ]}
                                                />
                                                <Scatter
                                                    data={Array.from({ length: 30 }, (_, i) => ({
                                                        launchAngle: -20 + Math.random() * 70,
                                                        exitVelocity: 75 + Math.random() * 35
                                                    }))}
                                                    fill="#F1B82D"
                                                />
                                            </ScatterChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Performance Trends */}
                                    <div className="mb-8">
                                        <h2 className="text-lg font-semibold mb-2 text-white">wOBA by Game</h2>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={playerData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 12 }}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={60}
                                                />
                                                <YAxis
                                                    domain={[0, 0.720]}
                                                    label={{ value: 'wOBA', angle: -90, position: 'insideLeft' }}
                                                />
                                                <Tooltip
                                                    formatter={(value, name) => [`${Number(value).toFixed(3)}`, 'wOBA']}
                                                    labelFormatter={(label) => `Game: ${label}`}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="wOBA"
                                                    stroke="#F1B82D"
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                    connectNulls={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>
                            )}

                            {playerType === 'pitcher' && (
                                <>
                                    {/* Pitch Location Heat Map */}
                                    <div className="mb-8">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-lg font-semibold text-white">Pitch Location Heat Map</h2>
                                            <div className="flex items-center space-x-2">
                                                <label htmlFor="pitcher-heatmap-stat" className="text-white text-sm">Stat:</label>
                                                <select
                                                    id="pitcher-heatmap-stat"
                                                    value={selectedPitcherHeatMapStat}
                                                    onChange={(e) => setSelectedPitcherHeatMapStat(e.target.value)}
                                                    className="px-3 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-400 focus:outline-none text-sm"
                                                >
                                                    <option value="Strike Rate">Strike Rate</option>
                                                    <option value="Whiff Rate">Whiff Rate</option>
                                                    <option value="CSW%">CSW%</option>
                                                    <option value="Chase Rate">Chase Rate</option>
                                                    <option value="Contact Rate">Contact Rate</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-6">
                                            <div className="flex justify-center">
                                                <div className="grid grid-cols-5 gap-1 p-4 border-2 border-black w-80 h-96">
                                                    {Array.from({ length: 25 }, (_, i) => {
                                                        const row = Math.floor(i / 5);
                                                        const col = i % 5;
                                                        const isStrikeZone = row >= 1 && row <= 3 && col >= 1 && col <= 3;
                                                        const heatData = generateHeatMapData(selectedPitcherHeatMapStat, isStrikeZone);
                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`aspect-square border border-gray-300 flex items-center justify-center text-xs font-bold ${heatData.value > 0.5 ? 'text-white' : 'text-black'} ${isStrikeZone ? 'bg-teal-400' : 'bg-red-400'} ${heatData.opacityClass}`}
                                                            >
                                                                {heatData.displayValue}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="mt-4 text-center text-sm">
                                                <p className="text-gray-600">Heat map shows {selectedPitcherHeatMapStat.toLowerCase()} by location. Strike zone (center 3x3) highlighted.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pitch Movement Profile */}
                                    <div className="mb-8">
                                        <h2 className="text-lg font-semibold mb-4 text-white">Pitch Movement Profile</h2>
                                        <div className="bg-white rounded-lg p-6">
                                            <ResponsiveContainer width="100%" height={500}>
                                                <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                                                    <CartesianGrid strokeDasharray="2 2" stroke="#e0e0e0" />
                                                    <XAxis
                                                        type="number"
                                                        dataKey="horizontalBreak"
                                                        domain={[-25, 25]}
                                                        ticks={[-25, -12.5, 0, 12.5, 25]}
                                                        label={{ value: 'Horizontal Break (inches)', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#333' } }}
                                                    />
                                                    <YAxis
                                                        type="number"
                                                        dataKey="verticalBreak"
                                                        domain={[-25, 25]}
                                                        ticks={[-25, -12.5, 0, 12.5, 25]}
                                                        label={{ value: 'Vertical Break (inches)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#333' } }}
                                                    />
                                                    <Tooltip
                                                        formatter={(value, name) => [
                                                            `${Number(value).toFixed(1)} in`,
                                                            name === 'horizontalBreak' ? 'Horizontal Break' : 'Vertical Break'
                                                        ]}
                                                    />
                                                    <Scatter
                                                        name="Fastball"
                                                        data={Array.from({ length: 25 }, () => ({
                                                            horizontalBreak: -8 + Math.random() * 6,
                                                            verticalBreak: 15 + Math.random() * 8,
                                                            pitchType: 'Fastball'
                                                        }))}
                                                        fill="#4A90E2"
                                                    />
                                                    <Scatter
                                                        name="Slider"
                                                        data={Array.from({ length: 20 }, () => ({
                                                            horizontalBreak: 8 + Math.random() * 8,
                                                            verticalBreak: -8 + Math.random() * 6,
                                                            pitchType: 'Slider'
                                                        }))}
                                                        fill="#7ED321"
                                                    />
                                                </ScatterChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Performance Trends */}
                                    <div className="mb-8">
                                        <h2 className="text-lg font-semibold mb-2 text-white">ERA Progression</h2>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={playerData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 12 }}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={60}
                                                />
                                                <YAxis
                                                    domain={['dataMin - 1', 'dataMax + 1']}
                                                    label={{ value: 'ERA', angle: -90, position: 'insideLeft' }}
                                                />
                                                <Tooltip
                                                    formatter={(value, name) => [`${Number(value).toFixed(2)}`, 'ERA']}
                                                    labelFormatter={(label) => `Date: ${label}`}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="ERA"
                                                    stroke="#ff6b6b"
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                    connectNulls={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>
                            )}

                            {playerType === 'pitcher' && (
                                <>
                                    {/* Pitch Location Heat Map */}
                                    <div className="mb-8">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-lg font-semibold text-white">Pitch Location Heat Map</h2>
                                            <div className="flex items-center space-x-2">
                                                <label htmlFor="pitcher-heatmap-stat" className="text-white text-sm">Stat:</label>
                                                <select
                                                    id="pitcher-heatmap-stat"
                                                    value={selectedPitcherHeatMapStat}
                                                    onChange={(e) => setSelectedPitcherHeatMapStat(e.target.value)}
                                                    className="px-3 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-400 focus:outline-none text-sm"
                                                >
                                                    <option value="Strike Rate">Strike Rate</option>
                                                    <option value="Whiff Rate">Whiff Rate</option>
                                                    <option value="CSW%">CSW%</option>
                                                    <option value="Chase Rate">Chase Rate</option>
                                                    <option value="Contact Rate">Contact Rate</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-6">
                                            <div className="flex justify-center">
                                                <div className="grid grid-cols-5 gap-1 p-4 border-2 border-black w-80 h-96">
                                                    {Array.from({ length: 25 }, (_, i) => {
                                                        const row = Math.floor(i / 5);
                                                        const col = i % 5;
                                                        const isStrikeZone = row >= 1 && row <= 3 && col >= 1 && col <= 3;
                                                        const heatData = generateHeatMapData(selectedPitcherHeatMapStat, isStrikeZone);
                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`aspect-square border border-gray-300 flex items-center justify-center text-xs font-bold ${heatData.value > 0.5 ? 'text-white' : 'text-black'} ${isStrikeZone ? 'bg-teal-400' : 'bg-red-400'} ${heatData.opacityClass}`}
                                                            >
                                                                {heatData.displayValue}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="mt-4 text-center text-sm">
                                                <p className="text-gray-600">Heat map shows {selectedPitcherHeatMapStat.toLowerCase()} by location. Strike zone (center 3x3) highlighted.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pitch Movement Profile */}
                                    <div className="mb-8">
                                        <h2 className="text-lg font-semibold mb-4 text-white">Pitch Movement Profile</h2>
                                        <div className="bg-white rounded-lg p-6">
                                            <ResponsiveContainer width="100%" height={500}>
                                                <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                                                    <CartesianGrid strokeDasharray="2 2" stroke="#e0e0e0" />
                                                    <XAxis
                                                        type="number"
                                                        dataKey="horizontalBreak"
                                                        domain={[-25, 25]}
                                                        ticks={[-25, -12.5, 0, 12.5, 25]}
                                                        label={{ value: 'Horizontal Break (inches)', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#333' } }}
                                                    />
                                                    <YAxis
                                                        type="number"
                                                        dataKey="verticalBreak"
                                                        domain={[-25, 25]}
                                                        ticks={[-25, -12.5, 0, 12.5, 25]}
                                                        label={{ value: 'Vertical Break (inches)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#333' } }}
                                                    />
                                                    <Tooltip
                                                        formatter={(value, name) => [
                                                            `${Number(value).toFixed(1)} in`,
                                                            name === 'horizontalBreak' ? 'Horizontal Break' : 'Vertical Break'
                                                        ]}
                                                    />
                                                    <Scatter
                                                        name="Fastball"
                                                        data={Array.from({ length: 25 }, () => ({
                                                            horizontalBreak: -8 + Math.random() * 6,
                                                            verticalBreak: 15 + Math.random() * 8,
                                                            pitchType: 'Fastball'
                                                        }))}
                                                        fill="#4A90E2"
                                                    />
                                                    <Scatter
                                                        name="Slider"
                                                        data={Array.from({ length: 20 }, () => ({
                                                            horizontalBreak: 8 + Math.random() * 8,
                                                            verticalBreak: -8 + Math.random() * 6,
                                                            pitchType: 'Slider'
                                                        }))}
                                                        fill="#7ED321"
                                                    />
                                                </ScatterChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Performance Trends */}
                                    <div className="mb-8">
                                        <h2 className="text-lg font-semibold mb-2 text-white">ERA Progression</h2>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={playerData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 12 }}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={60}
                                                />
                                                <YAxis
                                                    domain={['dataMin - 1', 'dataMax + 1']}
                                                    label={{ value: 'ERA', angle: -90, position: 'insideLeft' }}
                                                />
                                                <Tooltip
                                                    formatter={(value, name) => [`${Number(value).toFixed(2)}`, 'ERA']}
                                                    labelFormatter={(label) => `Date: ${label}`}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="ERA"
                                                    stroke="#ff6b6b"
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                    connectNulls={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default ReportsPage;
