import React, { useState, useEffect } from 'react';
import { api } from '@/utils/api';

interface AlabamaPitcher {
    Player: string;
    IP: number;
    ERA: number;
    WHIP: number;
    FIP: number;
    "K%": number;
    "BB%": number;
    "K%-BB%": number;
    "CSW%": number;
    "FPStk%": number;
    "InZone%": number;
    "Chase%": number;
    "HardHit%": number;
    "Barrel%": number;
    "GB/FB": number;
    wOBA: number;
    xWOBA: number;
}

interface AlabamaHitter {
    Player: string;
    PA: number;
    AB: number;
    BA: number;
    OBP: number;
    SLG: number;
    OPS: number;
    wOBA: number;
    xWOBA: number;
    "Miss% vs CH": number;
    "Miss% vs Spin": number;
    "Miss% vs FB": number;
    "ChangeMiss%": number;
    "RISPPull%": number;
    "FastMiss%": number;
    "Swing%": number;
    "HOppFld%": number;
    "HPull%": number;
    "HardHit%": number;
    "Barrel%": number;
    "BB%": number;
    "K%": number;
    LaunchAng: number;
    AvgEV: number;
    MaxEV: number;
    xSLG: number;
    H: number;
    "1B": number;
    "2B": number;
    "3B": number;
    HR: number;
}

interface AlabamaScoutingProps {
    isMissouriPitching: boolean;
    currentPitcher?: string;
    currentBatter?: string;
}

const AlabamaScouting: React.FC<AlabamaScoutingProps> = ({
    isMissouriPitching,
    currentPitcher,
    currentBatter
}) => {
    const [alabamaPitchers, setAlabamaPitchers] = useState<AlabamaPitcher[]>([]);
    const [alabamaHitters, setAlabamaHitters] = useState<AlabamaHitter[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPitcher, setSelectedPitcher] = useState<AlabamaPitcher | null>(null);
    const [selectedHitter, setSelectedHitter] = useState<AlabamaHitter | null>(null);
    const [activeAlabamaTab, setActiveAlabamaTab] = useState<'hitters' | 'pitchers'>('hitters');

    // Load both Alabama hitters and pitchers regardless of game state
    useEffect(() => {
        fetchAlabamaHitters();
        fetchAlabamaPitchers();
    }, []);

    // Auto-select current players
    useEffect(() => {
        if (!isMissouriPitching && alabamaPitchers.length > 0) {
            let pitcherToSelect: AlabamaPitcher | null = null;

            // Try to find current pitcher first
            if (currentPitcher) {
                pitcherToSelect = alabamaPitchers.find(p =>
                    p.Player.toLowerCase().trim() === currentPitcher.toLowerCase().trim() ||
                    p.Player.toLowerCase().includes(currentPitcher.toLowerCase()) ||
                    currentPitcher.toLowerCase().includes(p.Player.toLowerCase())
                ) || null;
            }

            // Fallback to a main pitcher if no match
            if (!pitcherToSelect) {
                pitcherToSelect = alabamaPitchers.find(p => p.IP > 40) || alabamaPitchers[0];
            }

            setSelectedPitcher(pitcherToSelect);
        }
    }, [currentPitcher, alabamaPitchers, isMissouriPitching]);

    useEffect(() => {
        if (isMissouriPitching && currentBatter && alabamaHitters.length > 0) {
            const hitter = alabamaHitters.find(h =>
                h.Player.toLowerCase().includes(currentBatter.toLowerCase()) ||
                currentBatter.toLowerCase().includes(h.Player.toLowerCase())
            );
            if (hitter) setSelectedHitter(hitter);
        }
    }, [currentBatter, alabamaHitters, isMissouriPitching]);

    const fetchAlabamaPitchers = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api('/api/alabama-pitchers');
            if (!response.ok) {
                throw new Error('Failed to fetch Alabama pitchers');
            }

            const data: AlabamaPitcher[] = await response.json();
            setAlabamaPitchers(data);

            // Auto-select the first pitcher with significant innings if no current pitcher
            if (!currentPitcher) {
                const mainPitchers = data.filter(p => p.IP > 20).sort((a, b) => b.IP - a.IP);
                if (mainPitchers.length > 0) {
                    setSelectedPitcher(mainPitchers[0]);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAlabamaHitters = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api('/api/alabama-hitters');
            if (!response.ok) {
                throw new Error('Failed to fetch Alabama hitters');
            }

            const data: AlabamaHitter[] = await response.json();
            setAlabamaHitters(data);

            // Auto-select the first hitter with significant PAs if no current batter
            if (!currentBatter) {
                const mainHitters = data.filter(h => h.PA > 50).sort((a, b) => b.PA - a.PA);
                if (mainHitters.length > 0) {
                    setSelectedHitter(mainHitters[0]);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const formatStat = (value: any, decimals: number = 2): string => {
        if (value === null || value === undefined) return '--';

        // Convert to number if it's a string
        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        if (isNaN(numValue)) return '--';
        return numValue.toFixed(decimals);
    };

    const getPitcherStatColor = (stat: string, value: number): string => {
        switch (stat) {
            case 'ERA':
                if (value <= 3.0) return 'text-green-600';
                if (value >= 5.0) return 'text-red-600';
                return 'text-gray-700';
            case 'WHIP':
                if (value <= 1.2) return 'text-green-600';
                if (value >= 1.5) return 'text-red-600';
                return 'text-gray-700';
            case 'K%':
                if (value >= 25.0) return 'text-green-600';
                if (value <= 18.0) return 'text-red-600';
                return 'text-gray-700';
            case 'BB%':
                if (value <= 8.0) return 'text-green-600';
                if (value >= 12.0) return 'text-red-600';
                return 'text-gray-700';
            default:
                return 'text-gray-700';
        }
    };

    const getHitterStatColor = (stat: string, value: number): string => {
        switch (stat) {
            case 'OPS':
                if (value >= 0.900) return 'text-green-600';
                if (value <= 0.700) return 'text-red-600';
                return 'text-gray-700';
            case 'K%':
                if (value <= 15.0) return 'text-green-600';
                if (value >= 25.0) return 'text-red-600';
                return 'text-gray-700';
            case 'BB%':
                if (value >= 12.0) return 'text-green-600';
                if (value <= 6.0) return 'text-red-600';
                return 'text-gray-700';
            default:
                return 'text-gray-700';
        }
    };

    const getPitcherScoutingReport = (pitcher: AlabamaPitcher): { strengths: string[], weaknesses: string[] } => {
        const strengths: string[] = [];
        const weaknesses: string[] = [];

        if (pitcher["K%"] > 25) strengths.push(`High strikeout rate (${pitcher["K%"]}%)`);
        if (pitcher["BB%"] < 8) strengths.push(`Excellent control (${pitcher["BB%"]}% walk rate)`);
        if (pitcher["CSW%"] > 32) strengths.push(`Strong called strike + whiff rate (${pitcher["CSW%"]}%)`);
        if (pitcher["FPStk%"] > 65) strengths.push(`Throws first pitch strikes (${pitcher["FPStk%"]}%)`);
        if (pitcher.ERA < 3.50) strengths.push(`Low ERA (${pitcher.ERA})`);

        if (pitcher["BB%"] > 12) weaknesses.push(`High walk rate (${pitcher["BB%"]}%) - work counts`);
        if (pitcher["HardHit%"] > 45) weaknesses.push(`Allows hard contact (${pitcher["HardHit%"]}%) - be aggressive`);
        if (pitcher["FPStk%"] < 55) weaknesses.push(`Low first pitch strike rate (${pitcher["FPStk%"]}%) - take pitches`);
        if (pitcher.ERA > 5.0) weaknesses.push(`High ERA (${pitcher.ERA}) - attack early`);

        return { strengths, weaknesses };
    };

    const getHitterScoutingReport = (hitter: AlabamaHitter): { strengths: string[], weaknesses: string[] } => {
        const strengths: string[] = [];
        const weaknesses: string[] = [];

        if (hitter.OPS > 0.900) strengths.push(`Excellent overall hitting (${hitter.OPS.toFixed(3)} OPS)`);
        if (hitter["BB%"] > 12) strengths.push(`Good plate discipline (${hitter["BB%"]}% walk rate)`);
        if (hitter["HardHit%"] > 50) strengths.push(`Makes hard contact (${hitter["HardHit%"]}%)`);
        if (hitter["Barrel%"] > 15) strengths.push(`High barrel rate (${hitter["Barrel%"]}%)`);

        if (hitter["K%"] > 22) weaknesses.push(`High strikeout rate (${hitter["K%"]}%) - attack zone`);
        if (hitter["Miss% vs FB"] > 18) weaknesses.push(`Struggles vs fastballs (${hitter["Miss% vs FB"]}% miss rate)`);
        if (hitter["Miss% vs CH"] > 35) weaknesses.push(`Vulnerable to changeups (${hitter["Miss% vs CH"]}% miss rate)`);
        if (hitter["Miss% vs Spin"] > 28) weaknesses.push(`Struggles vs breaking balls (${hitter["Miss% vs Spin"]}% miss rate)`);

        return { strengths, weaknesses };
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading Alabama players...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    Error: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-red-600">Alabama Scouting</h3>
                <div className="text-sm text-gray-500">
                    Complete opponent analysis
                </div>
            </div>

            {/* Alabama Sub-tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveAlabamaTab('hitters')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeAlabamaTab === 'hitters'
                            ? 'border-red-500 text-red-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Alabama Hitters
                    </button>
                    <button
                        onClick={() => setActiveAlabamaTab('pitchers')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeAlabamaTab === 'pitchers'
                            ? 'border-red-500 text-red-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Alabama Pitchers
                    </button>
                </nav>
            </div>

            {/* Alabama Hitters Tab */}
            {activeAlabamaTab === 'hitters' && (
                <div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alabama Hitter:
                        </label>
                        <select
                            value={selectedHitter?.Player || ''}
                            onChange={(e) => {
                                const hitter = alabamaHitters.find(h => h.Player === e.target.value);
                                setSelectedHitter(hitter || null);
                            }}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                            title="Select Alabama hitter to scout"
                        >
                            <option value="">Choose a hitter...</option>
                            {alabamaHitters.filter(h => h.PA > 50).sort((a, b) => b.PA - a.PA).map((hitter) => (
                                <option key={hitter.Player} value={hitter.Player}>
                                    {hitter.Player} ({hitter.PA} PA, {hitter.OPS.toFixed(3)} OPS)
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedHitter && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-gray-50 p-3 rounded">
                                    <div className="text-xs text-gray-600 uppercase tracking-wide">OPS</div>
                                    <div className={`text-lg font-semibold ${getHitterStatColor('OPS', selectedHitter.OPS)}`}>
                                        {formatStat(selectedHitter.OPS, 3)}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <div className="text-xs text-gray-600 uppercase tracking-wide">wOBA</div>
                                    <div className={`text-lg font-semibold ${getHitterStatColor('wOBA', selectedHitter.wOBA)}`}>
                                        {formatStat(selectedHitter.wOBA, 3)}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <div className="text-xs text-gray-600 uppercase tracking-wide">K%</div>
                                    <div className={`text-lg font-semibold ${getHitterStatColor('K%', selectedHitter["K%"])}`}>
                                        {formatStat(selectedHitter["K%"], 1)}%
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <div className="text-xs text-gray-600 uppercase tracking-wide">HardHit%</div>
                                    <div className={`text-lg font-semibold ${getHitterStatColor('HardHit%', selectedHitter["HardHit%"])}`}>
                                        {formatStat(selectedHitter["HardHit%"], 1)}%
                                    </div>
                                </div>
                            </div>

                            {(() => {
                                const scoutingReport = selectedHitter ? getHitterScoutingReport(selectedHitter) : null;
                                return scoutingReport && (
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-red-800 mb-2">Scouting Report</h4>
                                        <div className="space-y-2">
                                            {scoutingReport.strengths.length > 0 && (
                                                <div>
                                                    <h5 className="font-medium text-red-700">Strengths:</h5>
                                                    <ul className="list-disc list-inside text-sm text-red-600 ml-2">
                                                        {scoutingReport.strengths.map((strength, index) => (
                                                            <li key={index}>{strength}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {scoutingReport.weaknesses.length > 0 && (
                                                <div>
                                                    <h5 className="font-medium text-green-700">Attack Plan:</h5>
                                                    <ul className="list-disc list-inside text-sm text-green-600 ml-2">
                                                        {scoutingReport.weaknesses.map((weakness, index) => (
                                                            <li key={index}>{weakness}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}

            {/* Alabama Pitchers Tab */}
            {activeAlabamaTab === 'pitchers' && (
                <div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alabama Pitcher:
                        </label>
                        <select
                            value={selectedPitcher?.Player || ''}
                            onChange={(e) => {
                                const pitcher = alabamaPitchers.find(p => p.Player === e.target.value);
                                setSelectedPitcher(pitcher || null);
                            }}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                            title="Select Alabama pitcher to scout"
                        >
                            <option value="">Choose a pitcher...</option>
                            {alabamaPitchers.filter(p => p.IP > 10).sort((a, b) => b.IP - a.IP).map((pitcher) => (
                                <option key={pitcher.Player} value={pitcher.Player}>
                                    {pitcher.Player} ({pitcher.IP.toFixed(1)} IP, {pitcher.ERA.toFixed(2)} ERA)
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedPitcher && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-gray-50 p-3 rounded">
                                    <div className="text-xs text-gray-600 uppercase tracking-wide">ERA</div>
                                    <div className={`text-lg font-semibold ${getPitcherStatColor('ERA', selectedPitcher.ERA)}`}>
                                        {formatStat(selectedPitcher.ERA, 2)}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <div className="text-xs text-gray-600 uppercase tracking-wide">K%</div>
                                    <div className={`text-lg font-semibold ${getPitcherStatColor('K%', selectedPitcher["K%"])}`}>
                                        {formatStat(selectedPitcher["K%"], 1)}%
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <div className="text-xs text-gray-600 uppercase tracking-wide">BB%</div>
                                    <div className={`text-lg font-semibold ${getPitcherStatColor('BB%', selectedPitcher["BB%"])}`}>
                                        {formatStat(selectedPitcher["BB%"], 1)}%
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <div className="text-xs text-gray-600 uppercase tracking-wide">CSW%</div>
                                    <div className={`text-lg font-semibold ${getPitcherStatColor('CSW%', selectedPitcher["CSW%"])}`}>
                                        {formatStat(selectedPitcher["CSW%"], 1)}%
                                    </div>
                                </div>
                            </div>

                            {(() => {
                                const scoutingReport = getPitcherScoutingReport(selectedPitcher);
                                return scoutingReport && (
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-red-800 mb-2">Scouting Report</h4>
                                        <div className="space-y-2">
                                            {scoutingReport.strengths.length > 0 && (
                                                <div>
                                                    <h5 className="font-medium text-red-700">Strengths:</h5>
                                                    <ul className="list-disc list-inside text-sm text-red-600 ml-2">
                                                        {scoutingReport.strengths.map((strength, index) => (
                                                            <li key={index}>{strength}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {scoutingReport.weaknesses.length > 0 && (
                                                <div>
                                                    <h5 className="font-medium text-green-700">Attack Plan:</h5>
                                                    <ul className="list-disc list-inside text-sm text-green-600 ml-2">
                                                        {scoutingReport.weaknesses.map((weakness, index) => (
                                                            <li key={index}>{weakness}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

};

export default AlabamaScouting;
