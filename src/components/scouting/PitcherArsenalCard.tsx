import React, { useState } from 'react';
import { Pitcher, FilterState } from '../../types/scouting';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import PitchMovementChart from './PitchMovementChart';
import TiltRadialChart from './TiltRadialChart';

interface PitcherArsenalCardProps {
    pitcher: Pitcher;
    filters: FilterState;
    isCompact?: boolean;
}

const PitcherArsenalCard: React.FC<PitcherArsenalCardProps> = ({ pitcher, filters, isCompact = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    // Prepare data for charts
    const pitchUsageData = pitcher.pitchTypes.map(pt => ({
        type: pt.type,
        usage: pt.usageOverall,
        whiff: pt.whiffRate,
        velocity: pt.vAvg
    }));

    const radarData = pitcher.pitchTypes.map(pt => ({
        pitch: pt.type,
        velocity: (pt.vAvg / 100) * 100, // Normalize to 0-100
        whiff: pt.whiffRate,
        usage: pt.usageOverall,
        putaway: pt.putAwayRate
    }));

    const heatmapZones = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [9, 10, 11],
        [12]
    ];

    const getZoneColor = (value: number) => {
        if (value > 15) return 'bg-red-500';
        if (value > 10) return 'bg-orange-500';
        if (value > 5) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getAttackRecommendations = () => {
        const primaryPitch = pitcher.pitchTypes.sort((a, b) => b.usageOverall - a.usageOverall)[0];
        const outPitch = pitcher.pitchTypes.sort((a, b) => b.whiffRate - a.whiffRate)[0];

        return [
            `Primary weapon: ${primaryPitch.type} (${primaryPitch.usageOverall}% usage)`,
            `Out pitch: ${outPitch.type} (${outPitch.whiffRate}% whiff rate)`,
            `Attack approach: ${pitcher.sequenceTendencies[0]}`,
            `Weakness: Third time through order (${pitcher.timesThruOrderSplits.third.fip} FIP)`
        ];
    };

    return (
        <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${isCompact ? 'text-sm' : ''} transition-all duration-300`}>
            {/* Clickable Header */}
            <div
                className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-750 rounded p-2 -m-2 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div>
                    <h3 className={`font-bold text-white ${isCompact ? 'text-lg' : 'text-xl'} flex items-center`}>
                        {pitcher.name}
                        <span className="ml-2 text-sm text-gray-400">
                            {isExpanded ? '▼' : '▶'}
                        </span>
                    </h3>
                    <div className="flex items-center space-x-4 text-gray-400 text-sm">
                        <span>{pitcher.throws}HP</span>
                        <span>{pitcher.pitchTypes.length} Pitch Types</span>
                        <span className="text-yellow-400">
                            {Math.round(pitcher.pitchTypes.reduce((sum, pt) => sum + pt.whiffRate, 0) / pitcher.pitchTypes.length)}% Avg Whiff
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl">⚾</div>
                    <div className="text-xs text-gray-500">#{pitcher.id}</div>
                </div>
            </div>

            {/* Arsenal Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                {pitcher.pitchTypes.map((pt) => (
                    <div key={pt.type} className="bg-gray-700 rounded p-2 text-center">
                        <div className="font-bold text-white">{pt.type}</div>
                        <div className="text-yellow-400 text-sm">{pt.vAvg.toFixed(1)} mph</div>
                        <div className="text-gray-400 text-xs">{pt.usageOverall}% usage</div>
                    </div>
                ))}
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="space-y-4">
                    {/* Movement Breakdown */}
                    {!isCompact && (
                        <div className="bg-gray-900 rounded p-3">
                            <h4 className="text-sm font-medium text-gray-300 mb-3">Pitch Movement Profile</h4>
                            <div className="space-y-3">
                                {pitcher.pitchTypes.map((pt) => (
                                    <div key={pt.type} className="border border-gray-700 rounded p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-white">{pt.type}</span>
                                            <span className="text-yellow-400 font-medium">{pt.vAvg.toFixed(1)} mph</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                            <div className="text-center">
                                                <div className="text-blue-400 font-bold">{pt.ivb > 0 ? '+' : ''}{pt.ivb}"</div>
                                                <div className="text-gray-500">IVB</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-green-400 font-bold">{pt.hb > 0 ? '+' : ''}{pt.hb}"</div>
                                                <div className="text-gray-500">HB</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-purple-400 font-bold">{pt.extension}"</div>
                                                <div className="text-gray-500">Ext</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-orange-400 font-bold">{pt.relHeight}"</div>
                                                <div className="text-gray-500">Rel H</div>
                                            </div>
                                        </div>
                                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                                            <div className="text-center">
                                                <div className="text-red-400 font-bold">{pt.whiffRate}%</div>
                                                <div className="text-gray-500">Whiff</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-yellow-400 font-bold">{pt.putAwayRate}%</div>
                                                <div className="text-gray-500">K Rate</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-cyan-400 font-bold">{pt.spinAvg}</div>
                                                <div className="text-gray-500">Spin RPM</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Charts Section */}
                    {!isCompact && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                            {/* Pitch Usage Chart */}
                            <div className="bg-gray-900 rounded p-3">
                                <h4 className="text-sm font-medium text-gray-300 mb-2">Pitch Usage & Effectiveness</h4>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={pitchUsageData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="type" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', color: '#F3F4F6' }}
                                        />
                                        <Bar dataKey="usage" fill="#F59E0B" name="Usage %" />
                                        <Bar dataKey="whiff" fill="#10B981" name="Whiff %" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Radar Chart */}
                            <div className="bg-gray-900 rounded p-3">
                                <h4 className="text-sm font-medium text-gray-300 mb-2">Arsenal Radar</h4>
                                <ResponsiveContainer width="100%" height={200}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="#4B5563" />
                                        <PolarAngleAxis dataKey="pitch" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                                        <PolarRadiusAxis
                                            angle={90}
                                            domain={[0, 100]}
                                            tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                        />
                                        <Radar
                                            name="Whiff Rate"
                                            dataKey="whiff"
                                            stroke="#F59E0B"
                                            fill="#F59E0B"
                                            fillOpacity={0.3}
                                        />
                                        <Radar
                                            name="Usage"
                                            dataKey="usage"
                                            stroke="#10B981"
                                            fill="#10B981"
                                            fillOpacity={0.2}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', color: '#F3F4F6' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Movement and Tilt Charts */}
                    {!isCompact && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                            <PitchMovementChart
                                pitchData={pitcher.pitchTypes.reduce((acc, pt) => {
                                    acc[pt.type] = pt;
                                    return acc;
                                }, {} as Record<string, any>)}
                            />
                            <TiltRadialChart
                                pitchData={pitcher.pitchTypes.reduce((acc, pt) => {
                                    acc[pt.type] = pt;
                                    return acc;
                                }, {} as Record<string, any>)}
                            />
                        </div>
                    )}

                    {/* Location Heatmap */}
                    {!isCompact && (
                        <div className="bg-gray-900 rounded p-3 mb-4">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Location Tendencies (Primary Pitch)</h4>
                            <div className="flex justify-center">
                                <div className="grid grid-cols-3 gap-1 w-48 h-32">
                                    {heatmapZones.flat().map((zoneIndex, i) => {
                                        const value = pitcher.pitchTypes[0]?.locHeatmap[zoneIndex] || 0;
                                        return (
                                            <div
                                                key={i}
                                                className={`rounded border border-gray-600 flex items-center justify-center text-xs font-bold text-white ${getZoneColor(value)}`}
                                            >
                                                {value}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Attack Recommendations */}
                    <div className="bg-yellow-400 bg-opacity-10 border border-yellow-400 rounded p-3 mb-4">
                        <h4 className="text-sm font-medium text-yellow-400 mb-2 flex items-center">
                            🎯 Attack Recommendations
                        </h4>
                        <ul className="space-y-1">
                            {getAttackRecommendations().slice(0, isCompact ? 2 : 4).map((rec, index) => (
                                <li key={index} className="text-xs text-gray-300 flex items-start">
                                    <span className="text-yellow-400 mr-1">•</span>
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Times Through Order */}
                    {!isCompact && (
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="bg-gray-700 rounded p-2">
                                <div className="text-green-400 font-bold">{pitcher.timesThruOrderSplits.first.fip}</div>
                                <div className="text-gray-400">1st Time FIP</div>
                            </div>
                            <div className="bg-gray-700 rounded p-2">
                                <div className="text-yellow-400 font-bold">{pitcher.timesThruOrderSplits.second.fip}</div>
                                <div className="text-gray-400">2nd Time FIP</div>
                            </div>
                            <div className="bg-gray-700 rounded p-2">
                                <div className="text-red-400 font-bold">{pitcher.timesThruOrderSplits.third.fip}</div>
                                <div className="text-gray-400">3rd Time FIP</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PitcherArsenalCard;
