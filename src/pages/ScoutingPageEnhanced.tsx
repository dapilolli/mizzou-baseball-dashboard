import React, { useState, useEffect } from 'react';
import VisualModePanel from '../components/scouting/VisualModePanel';
import NarrativeModePanel from '../components/scouting/NarrativeModePanel';
import FiltersBar from '../components/scouting/FiltersBar';
import { generateMockScoutingData } from '../data/mockData';
import { ScoutingData, FilterState } from '../types/scouting';

type ViewMode = 'visual' | 'narrative' | 'split';

const ScoutingPageEnhanced: React.FC = () => {
    const [scoutingData, setScoutingData] = useState<ScoutingData | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('visual');
    const [filters, setFilters] = useState<FilterState>({
        inning: 'all',
        count: 'all',
        handedness: 'all',
        baseState: 'all',
        leverage: 'all',
        weather: 'normal',
        scoreDiff: 'all'
    });
    const [opponent, setOpponent] = useState('Alabama');
    const [loading, setLoading] = useState(false);
    const [isPrintMode, setIsPrintMode] = useState(false);

    // Load mock data on component mount
    useEffect(() => {
        loadScoutingData();
    }, []);

    const loadScoutingData = () => {
        setLoading(true);
        // Simulate API call delay
        setTimeout(() => {
            const mockData = generateMockScoutingData(opponent);
            setScoutingData(mockData);
            setLoading(false);
        }, 500);
    };

    const handleOpponentChange = (newOpponent: string) => {
        setOpponent(newOpponent);
        setScoutingData(null);
    };

    const handleFilterChange = (newFilters: Partial<FilterState>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleExportPDF = () => {
        setIsPrintMode(true);
        setTimeout(() => {
            window.print();
            setIsPrintMode(false);
        }, 100);
    };

    const getViewModeIcon = (mode: ViewMode): string => {
        switch (mode) {
            case 'visual': return '📊';
            case 'narrative': return '📝';
            case 'split': return '🔀';
            default: return '📊';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                    <p className="text-white text-xl">Loading scouting report...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gray-900 ${isPrintMode ? 'print-mode' : ''}`}>
            {/* Print Styles */}
            <style>
                {`
          @media print {
            .print-mode {
              background: white !important;
            }
            .print-mode * {
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
            .print-break {
              page-break-before: always;
            }
          }
        `}
            </style>

            <div className="container mx-auto px-4 py-6">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                                🎯 Advanced Scouting Hub
                            </h1>
                            <p className="text-gray-300 text-lg">
                                Dual-mode analytics & tactical intelligence
                            </p>
                        </div>

                        {/* Opponent Input */}
                        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <label className="text-white font-medium">Opponent:</label>
                                <input
                                    type="text"
                                    value={opponent}
                                    onChange={(e) => handleOpponentChange(e.target.value)}
                                    className="px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:border-yellow-400 focus:outline-none"
                                    placeholder="Team name"
                                />
                                <button
                                    onClick={loadScoutingData}
                                    className="px-4 py-2 bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 transition-colors"
                                >
                                    Load Report
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* View Mode Toggle */}
                    {!isPrintMode && (
                        <div className="flex flex-wrap items-center justify-between gap-4 no-print">
                            <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
                                {(['visual', 'narrative', 'split'] as ViewMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`px-4 py-2 rounded-md font-medium transition-all ${viewMode === mode
                                            ? 'bg-yellow-400 text-black'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                            }`}
                                    >
                                        {getViewModeIcon(mode)} {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={handleExportPDF}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                >
                                    <span>🖨️</span>
                                    <span>Export PDF</span>
                                </button>
                                <div className="text-gray-400 text-sm">
                                    Last updated: {new Date().toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Filters Bar */}
                {!isPrintMode && scoutingData && (
                    <FiltersBar
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        className="mb-6 no-print"
                    />
                )}

                {/* Main Content */}
                {scoutingData ? (
                    <div className="space-y-6">
                        {/* Game Context Banner */}
                        <div className="bg-gradient-to-r from-blue-800 to-purple-800 rounded-lg p-4 text-white">
                            <div className="flex flex-wrap items-center justify-between">
                                <div className="flex items-center space-x-6">
                                    <h2 className="text-xl font-bold">{scoutingData.opponent} Scouting Report</h2>
                                    <div className="text-sm opacity-90">
                                        🌤️ {scoutingData.gameContext.weather} |
                                        🌪️ {scoutingData.gameContext.wind} |
                                        🌡️ {scoutingData.gameContext.temperature}°F
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 text-sm">
                                    <span>👥 {scoutingData.hitters.length} Hitters</span>
                                    <span>⚾ {scoutingData.pitchers.length} Pitchers</span>
                                    <span>🔥 {scoutingData.matchups.length} Key Matchups</span>
                                </div>
                            </div>
                        </div>

                        {/* View Mode Content */}
                        {viewMode === 'visual' && (
                            <VisualModePanel
                                data={scoutingData}
                                filters={filters}
                                isPrintMode={isPrintMode}
                            />
                        )}

                        {viewMode === 'narrative' && (
                            <NarrativeModePanel
                                data={scoutingData}
                                filters={filters}
                                isPrintMode={isPrintMode}
                            />
                        )}

                        {viewMode === 'split' && (
                            <div className="grid lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-white border-b border-gray-600 pb-2">
                                        📊 Visual Analysis
                                    </h3>
                                    <VisualModePanel
                                        data={scoutingData}
                                        filters={filters}
                                        isPrintMode={isPrintMode}
                                        isCompact={true}
                                    />
                                </div>
                                <div className="space-y-4 print-break">
                                    <h3 className="text-xl font-bold text-white border-b border-gray-600 pb-2">
                                        📝 Tactical Narrative
                                    </h3>
                                    <NarrativeModePanel
                                        data={scoutingData}
                                        filters={filters}
                                        isPrintMode={isPrintMode}
                                        isCompact={true}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎯</div>
                        <h2 className="text-2xl font-bold text-white mb-4">Ready to Scout</h2>
                        <p className="text-gray-400 mb-6">
                            Enter an opponent team name and click "Load Report" to generate comprehensive scouting intelligence.
                        </p>
                        <div className="text-gray-500 text-sm">
                            • Visual analytics with charts and heatmaps<br />
                            • AI-generated tactical narratives<br />
                            • Matchup analysis and recommendations<br />
                            • Exportable PDF reports
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScoutingPageEnhanced;
