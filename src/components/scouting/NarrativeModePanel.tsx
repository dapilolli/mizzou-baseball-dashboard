import React from 'react';
import { ScoutingData, FilterState } from '../../types/scouting';
import GamePlanCard from './GamePlanCard';
import PlayerNarrativeList from './PlayerNarrativeList';

interface NarrativeModePanelProps {
    data: ScoutingData;
    filters: FilterState;
    isPrintMode?: boolean;
    isCompact?: boolean;
}

const NarrativeModePanel: React.FC<NarrativeModePanelProps> = ({
    data,
    filters,
    isPrintMode = false,
    isCompact = false
}) => {
    return (
        <div className="space-y-6">
            {/* Game Plan Summary */}
            <GamePlanCard
                data={data}
                filters={filters}
                isPrintMode={isPrintMode}
                isCompact={isCompact}
            />

            {/* Player Narratives */}
            <PlayerNarrativeList
                data={data}
                filters={filters}
                isPrintMode={isPrintMode}
                isCompact={isCompact}
            />

            {/* Quick Reference Card */}
            {!isCompact && (
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-4 border border-gray-600">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        ⚡ Quick Reference Card
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <h4 className="text-sm font-medium text-yellow-400 mb-2">Key Threats</h4>
                            <div className="space-y-1 text-sm text-gray-300">
                                {data.hitters
                                    .filter(h => h.chaseRate < 25 || h.hotColdZones.filter(z => z > 0.1).length > 3)
                                    .slice(0, 3)
                                    .map((hitter, i) => (
                                        <div key={i}>• {hitter.name} ({hitter.position})</div>
                                    ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-green-400 mb-2">Exploitable Weaknesses</h4>
                            <div className="space-y-1 text-sm text-gray-300">
                                {data.hitters
                                    .filter(h => h.chaseRate > 35 || h.whiff > 30)
                                    .slice(0, 3)
                                    .map((hitter, i) => (
                                        <div key={i}>• {hitter.name} (Chase: {hitter.chaseRate}%)</div>
                                    ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-blue-400 mb-2">Bullpen Alerts</h4>
                            <div className="space-y-1 text-sm text-gray-300">
                                {data.bullpen
                                    .filter(p => p.fatigueLevel > 6)
                                    .slice(0, 3)
                                    .map((pitcher, i) => (
                                        <div key={i}>• {pitcher.pitcher} (Fatigued)</div>
                                    ))}
                                {data.bullpen.filter(p => p.fatigueLevel > 6).length === 0 && (
                                    <div>• Bullpen well-rested</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* If-Then Tactical Rules */}
            {!isCompact && !isPrintMode && (
                <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center">
                        🚨 If-Then Tactical Rules
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="bg-red-800 bg-opacity-40 rounded p-3">
                                <div className="text-sm font-medium text-red-300 mb-1">
                                    IF: Behind in count vs top hitters
                                </div>
                                <div className="text-sm text-gray-300">
                                    THEN: Challenge with best pitch, avoid nibbling
                                </div>
                            </div>

                            <div className="bg-red-800 bg-opacity-40 rounded p-3">
                                <div className="text-sm font-medium text-red-300 mb-1">
                                    IF: Runner on 1B vs aggressive steal threats
                                </div>
                                <div className="text-sm text-gray-300">
                                    THEN: Quick delivery, vary timing, slide-step if needed
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-red-800 bg-opacity-40 rounded p-3">
                                <div className="text-sm font-medium text-red-300 mb-1">
                                    IF: High-leverage situation with fatigued bullpen
                                </div>
                                <div className="text-sm text-gray-300">
                                    THEN: Extend starter, use fresh arms only
                                </div>
                            </div>

                            <div className="bg-red-800 bg-opacity-40 rounded p-3">
                                <div className="text-sm font-medium text-red-300 mb-1">
                                    IF: Wind blowing out, power hitters up
                                </div>
                                <div className="text-sm text-gray-300">
                                    THEN: Attack low in zone, avoid elevation
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NarrativeModePanel;
