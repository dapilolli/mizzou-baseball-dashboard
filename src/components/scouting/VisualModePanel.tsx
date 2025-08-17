import React, { useState } from 'react';
import { ScoutingData, FilterState } from '../../types/scouting';
import PitcherArsenalCard from './PitcherArsenalCard';
import HitterProfileCard from './HitterProfileCard';
import MatchupMatrix from './MatchupMatrix';
import SituationalBox from './SituationalBox';

interface VisualModePanelProps {
    data: ScoutingData;
    filters: FilterState;
    isPrintMode?: boolean;
    isCompact?: boolean;
}

const VisualModePanel: React.FC<VisualModePanelProps> = ({
    data,
    filters,
    isPrintMode = false,
    isCompact = false
}) => {
    const [activeTab, setActiveTab] = useState<'pitchers' | 'hitters' | 'matchups' | 'situations'>('pitchers');

    const tabs = [
        { id: 'pitchers', label: 'Pitcher Arsenal', icon: '⚾', count: data.pitchers.length },
        { id: 'hitters', label: 'Hitter Profiles', icon: '🏏', count: data.hitters.length },
        { id: 'matchups', label: 'Key Matchups', icon: '⚔️', count: data.matchups.length },
        { id: 'situations', label: 'Situational', icon: '📊', count: 1 }
    ] as const;

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            {!isPrintMode && !isCompact && (
                <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-yellow-400 text-black'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-black text-yellow-400' : 'bg-gray-700 text-gray-400'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Content Sections */}
            <div className="space-y-8">
                {/* Pitchers Section */}
                {(activeTab === 'pitchers' || isPrintMode || isCompact) && (
                    <div className="space-y-4">
                        {(!isCompact && !isPrintMode) && (
                            <h2 className="text-2xl font-bold text-white flex items-center">
                                ⚾ Pitcher Arsenal Analysis
                            </h2>
                        )}
                        <div className={`grid gap-6 ${isCompact
                                ? 'grid-cols-1'
                                : isPrintMode
                                    ? 'grid-cols-1'
                                    : 'grid-cols-1 xl:grid-cols-2'
                            }`}>
                            {data.pitchers.slice(0, isCompact ? 2 : undefined).map((pitcher) => (
                                <PitcherArsenalCard
                                    key={pitcher.id}
                                    pitcher={pitcher}
                                    filters={filters}
                                    isCompact={isCompact}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Hitters Section */}
                {(activeTab === 'hitters' || isPrintMode) && !isCompact && (
                    <div className="space-y-4">
                        {!isPrintMode && (
                            <h2 className="text-2xl font-bold text-white flex items-center">
                                🏏 Hitter Profile Analysis
                            </h2>
                        )}
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {data.hitters.map((hitter) => (
                                <HitterProfileCard
                                    key={hitter.id}
                                    hitter={hitter}
                                    filters={filters}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Compact Hitters Section */}
                {isCompact && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            {data.hitters.slice(0, 2).map((hitter) => (
                                <HitterProfileCard
                                    key={hitter.id}
                                    hitter={hitter}
                                    filters={filters}
                                    isCompact={true}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Matchups Section */}
                {(activeTab === 'matchups' || isPrintMode) && (
                    <div className="space-y-4">
                        {(!isCompact && !isPrintMode) && (
                            <h2 className="text-2xl font-bold text-white flex items-center">
                                ⚔️ Key Matchup Analysis
                            </h2>
                        )}
                        <MatchupMatrix
                            matchups={data.matchups}
                            pitchers={data.pitchers}
                            hitters={data.hitters}
                            filters={filters}
                            isCompact={isCompact}
                        />
                    </div>
                )}

                {/* Situational Section */}
                {(activeTab === 'situations' || isPrintMode) && !isCompact && (
                    <div className="space-y-4">
                        {!isPrintMode && (
                            <h2 className="text-2xl font-bold text-white flex items-center">
                                📊 Situational Intelligence
                            </h2>
                        )}
                        <SituationalBox
                            situational={data.situational}
                            bullpen={data.bullpen}
                            filters={filters}
                        />
                    </div>
                )}
            </div>

            {/* Summary Stats Bar */}
            {!isPrintMode && (
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-4 mt-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-yellow-400">
                                {data.pitchers.reduce((sum, p) => sum + p.pitchTypes.length, 0)}
                            </div>
                            <div className="text-sm text-gray-400">Total Pitch Types</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-400">
                                {Math.round(data.hitters.reduce((sum, h) => sum + h.chaseRate, 0) / data.hitters.length)}%
                            </div>
                            <div className="text-sm text-gray-400">Avg Chase Rate</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-400">
                                {data.situational.stealSuccessRate}%
                            </div>
                            <div className="text-sm text-gray-400">SB Success Rate</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-400">
                                {data.bullpen.filter(p => p.fatigueLevel > 6).length}
                            </div>
                            <div className="text-sm text-gray-400">Fatigued Relievers</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisualModePanel;
