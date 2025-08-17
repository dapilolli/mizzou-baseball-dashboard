import React, { useState } from 'react';
import { Hitter, FilterState } from '../../types/scouting';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface HitterProfileCardProps {
    hitter: Hitter;
    filters: FilterState;
    isCompact?: boolean;
}

const HitterProfileCard: React.FC<HitterProfileCardProps> = ({ hitter, filters, isCompact = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    // Prepare data for charts
    const vsPitchTypeData = hitter.vsPitchType.map(vpt => ({
        pitch: vpt.pitchType,
        xwOBA: vpt.xwOBA,
        whiff: vpt.whiffRate,
        chase: vpt.chaseRate
    }));

    const sprayData = [
        { name: 'Pull', value: hitter.sprayChart.pull, color: '#F59E0B' },
        { name: 'Center', value: hitter.sprayChart.cent, color: '#10B981' },
        { name: 'Opposite', value: hitter.sprayChart.oppo, color: '#3B82F6' }
    ];

    const batProfileData = [
        { name: 'GB', value: hitter.batProfile.gb, color: '#8B5CF6' },
        { name: 'FB', value: hitter.batProfile.fb, color: '#F59E0B' },
        { name: 'LD', value: hitter.batProfile.ld, color: '#10B981' }
    ];

    // Hot/Cold zones visualization
    const getZoneColor = (value: number) => {
        if (value > 0.1) return 'bg-red-500';
        if (value > 0.05) return 'bg-orange-500';
        if (value > 0) return 'bg-yellow-500';
        if (value > -0.05) return 'bg-blue-500';
        return 'bg-blue-700';
    };

    const getZoneText = (value: number) => {
        const display = Math.abs(value).toFixed(2);
        return value >= 0 ? `+${display}` : `-${display}`;
    };

    const getHitterThreat = () => {
        const avgHotZone = hitter.hotColdZones.filter(z => z > 0).reduce((sum, z) => sum + z, 0);
        const disciplineScore = 100 - hitter.chaseRate;
        const powerIndicator = hitter.batProfile.fb + hitter.batProfile.ld;

        if (avgHotZone > 0.15 && disciplineScore > 75) return 'ELITE THREAT';
        if (avgHotZone > 0.1 || disciplineScore > 70) return 'HIGH THREAT';
        if (avgHotZone > 0.05 || disciplineScore > 60) return 'MEDIUM THREAT';
        return 'MANAGEABLE';
    };

    const getThreatColor = () => {
        const threat = getHitterThreat();
        switch (threat) {
            case 'ELITE THREAT': return 'text-red-500';
            case 'HIGH THREAT': return 'text-orange-500';
            case 'MEDIUM THREAT': return 'text-yellow-500';
            default: return 'text-green-500';
        }
    };

    const getDefensiveRecommendations = (): string[] => {
        const recommendations: string[] = [];

        if (hitter.sprayChart.pull > 40) {
            recommendations.push('Shift infield toward pull side');
        }
        if (hitter.chaseRate < 25) {
            recommendations.push('Challenge in zone early - disciplined hitter');
        }
        if (hitter.batProfile.gb > 50) {
            recommendations.push('Ground ball pitcher - keep ball down');
        }
        if (hitter.buntFreq > 5) {
            recommendations.push('Bunt alert - corners play in');
        }

        return recommendations;
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
                        {hitter.name}
                        <span className="ml-2 text-sm text-gray-400">
                            {isExpanded ? '▼' : '▶'}
                        </span>
                    </h3>
                    <div className="flex items-center space-x-4 text-gray-400 text-sm">
                        <span>{hitter.bats}/{hitter.position}</span>
                        <span className={`font-bold ${getThreatColor()}`}>
                            {getHitterThreat()}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl">🏏</div>
                    <div className="text-xs text-gray-500">#{hitter.id}</div>
                </div>
            </div>

            {/* Key Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                <div className="bg-gray-700 rounded p-2 text-center">
                    <div className="font-bold text-white">{hitter.chaseRate}%</div>
                    <div className="text-gray-400 text-xs">Chase Rate</div>
                </div>
                <div className="bg-gray-700 rounded p-2 text-center">
                    <div className="font-bold text-white">{hitter.zContact}%</div>
                    <div className="text-gray-400 text-xs">Zone Contact</div>
                </div>
                <div className="bg-gray-700 rounded p-2 text-center">
                    <div className="font-bold text-white">{hitter.whiff}%</div>
                    <div className="text-gray-400 text-xs">Whiff Rate</div>
                </div>
                <div className="bg-gray-700 rounded p-2 text-center">
                    <div className="font-bold text-white">{hitter.sbTendencies.successRate}%</div>
                    <div className="text-gray-400 text-xs">SB Success</div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="space-y-4">
                    {/* Hot/Cold Zones */}
                    {!isCompact && (
                        <div className="bg-gray-900 rounded p-3">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Hot/Cold Zones (Run Value)</h4>
                            <div className="flex justify-center">
                                <div className="grid grid-cols-3 gap-1 w-48 h-32">
                                    {hitter.hotColdZones.slice(0, 13).map((zone, i) => (
                                        <div
                                            key={i}
                                            className={`rounded border border-gray-600 flex items-center justify-center text-xs font-bold text-white ${getZoneColor(zone)}`}
                                        >
                                            {getZoneText(zone)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-center mt-2 text-xs text-gray-400">
                                <span className="mr-4">🔥 Hot: +0.10+</span>
                                <span className="mr-4">❄️ Cold: -0.05-</span>
                            </div>
                        </div>
                    )}

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                        {/* vs Pitch Type */}
                        <div className="bg-gray-900 rounded p-3">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">vs Pitch Type (xwOBA)</h4>
                            <ResponsiveContainer width="100%" height={150}>
                                <BarChart data={vsPitchTypeData} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                                    <YAxis type="category" dataKey="pitch" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', color: '#F3F4F6' }}
                                    />
                                    <Bar dataKey="xwOBA" fill="#F59E0B" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Spray Chart */}
                        <div className="bg-gray-900 rounded p-3">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Spray Chart</h4>
                            <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie
                                        data={sprayData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={50}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}%`}
                                    >
                                        {sprayData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', color: '#F3F4F6' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Batted Ball Profile */}
                        <div className="bg-gray-900 rounded p-3">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Batted Ball Profile</h4>
                            <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie
                                        data={batProfileData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={50}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}%`}
                                    >
                                        {batProfileData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', color: '#F3F4F6' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Approach by Count */}
                    <div className="bg-blue-400 bg-opacity-10 border border-blue-400 rounded p-3 mb-3">
                        <h4 className="text-sm font-medium text-blue-400 mb-2">Count-Specific Approach</h4>
                        <div className="grid grid-cols-1 gap-1 text-xs">
                            <div><span className="text-green-400">Ahead:</span> {hitter.approachByCount.ahead}</div>
                            <div><span className="text-red-400">Behind:</span> {hitter.approachByCount.behind}</div>
                            <div><span className="text-yellow-400">Even:</span> {hitter.approachByCount.even}</div>
                        </div>
                    </div>

                    {/* Defensive Recommendations */}
                    <div className="bg-purple-400 bg-opacity-10 border border-purple-400 rounded p-3">
                        <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center">
                            🛡️ Defensive Strategy
                        </h4>
                        <ul className="space-y-1">
                            {getDefensiveRecommendations().slice(0, isCompact ? 2 : 4).map((rec, index) => (
                                <li key={index} className="text-xs text-gray-300 flex items-start">
                                    <span className="text-purple-400 mr-1">•</span>
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Baserunning Info */}
                    {!isCompact && hitter.sbTendencies.attempts > 0 && (
                        <div className="bg-gray-700 rounded p-2">
                            <div className="text-xs text-gray-400 mb-1">Baserunning Intel:</div>
                            <div className="text-xs text-white">
                                {hitter.sbTendencies.attempts} SB attempts, {hitter.sbTendencies.successRate}% success
                                {hitter.sbTendencies.preferredCounts.length > 0 && (
                                    <span className="text-yellow-400 ml-2">
                                        Prefers: {hitter.sbTendencies.preferredCounts.join(', ')}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HitterProfileCard;
