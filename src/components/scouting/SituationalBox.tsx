import React from 'react';
import { TeamSituational, BullpenInfo, FilterState } from '../../types/scouting';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SituationalBoxProps {
    situational: TeamSituational;
    bullpen: BullpenInfo[];
    filters: FilterState;
}

const SituationalBox: React.FC<SituationalBoxProps> = ({ situational, bullpen, filters }) => {
    // Prepare bullpen data for chart
    const bullpenData = bullpen.map(pitcher => ({
        name: pitcher.pitcher.split(' ').map(n => n[0]).join('.'), // Initials for chart
        fatigue: pitcher.fatigueLevel,
        workload: pitcher.recentWorkload,
        role: pitcher.role
    }));

    const getBullpenStatus = (): { status: string; color: string; description: string } => {
        const fatigued = bullpen.filter(p => p.fatigueLevel > 6).length;
        const totalWorkload = bullpen.reduce((sum, p) => sum + p.recentWorkload, 0);

        if (fatigued > 2 || totalWorkload > 150) {
            return {
                status: 'HIGH FATIGUE',
                color: 'text-red-500 bg-red-500 bg-opacity-20',
                description: 'Multiple relievers showing fatigue signs'
            };
        } else if (fatigued > 1 || totalWorkload > 100) {
            return {
                status: 'MODERATE FATIGUE',
                color: 'text-yellow-500 bg-yellow-500 bg-opacity-20',
                description: 'Some bullpen fatigue present'
            };
        } else {
            return {
                status: 'FRESH',
                color: 'text-green-500 bg-green-500 bg-opacity-20',
                description: 'Bullpen well-rested and available'
            };
        }
    };

    const getBaserunningThreat = (): string => {
        if (situational.baserunningAggression > 7 && situational.stealSuccessRate > 80) {
            return 'ELITE RUNNING GAME';
        } else if (situational.baserunningAggression > 5 && situational.stealSuccessRate > 70) {
            return 'AGGRESSIVE RUNNERS';
        } else if (situational.baserunningAggression > 3) {
            return 'OPPORTUNISTIC';
        } else {
            return 'CONSERVATIVE';
        }
    };

    const getRunningThreatColor = (): string => {
        const threat = getBaserunningThreat();
        switch (threat) {
            case 'ELITE RUNNING GAME': return 'text-red-500';
            case 'AGGRESSIVE RUNNERS': return 'text-orange-500';
            case 'OPPORTUNISTIC': return 'text-yellow-500';
            default: return 'text-green-500';
        }
    };

    const getHotZoneCount = (): number => {
        return situational.extraBaseHitRisk.filter(zone => zone > 12).length;
    };

    const bullpenStatus = getBullpenStatus();

    return (
        <div className="space-y-6">
            {/* Team Situational Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Baserunning */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-white">🏃 Baserunning</h4>
                        <span className={`text-sm font-bold ${getRunningThreatColor()}`}>
                            {getBaserunningThreat()}
                        </span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Aggression Level:</span>
                            <span className="text-white">{situational.baserunningAggression}/10</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">SB Success Rate:</span>
                            <span className="text-white">{situational.stealSuccessRate}%</span>
                        </div>
                        <div className="mt-3 p-2 bg-blue-400 bg-opacity-10 border border-blue-400 rounded">
                            <div className="text-xs text-blue-400 font-medium">Pitcher Holds</div>
                            <div className="text-xs text-gray-300">
                                {situational.stealSuccessRate > 75 ? 'Vary timing, quick to plate' : 'Standard timing acceptable'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Small Ball */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-white">⚾ Small Ball</h4>
                        <span className={`text-sm font-bold ${situational.buntFrequency > 5 ? 'text-red-500' : 'text-green-500'
                            }`}>
                            {situational.buntFrequency > 5 ? 'ACTIVE' : 'MINIMAL'}
                        </span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Bunt Frequency:</span>
                            <span className="text-white">{situational.buntFrequency}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">DP Rate:</span>
                            <span className="text-white">{situational.doublePlayRate}%</span>
                        </div>
                        <div className="mt-3 p-2 bg-purple-400 bg-opacity-10 border border-purple-400 rounded">
                            <div className="text-xs text-purple-400 font-medium">Defensive Adjust</div>
                            <div className="text-xs text-gray-300">
                                {situational.buntFrequency > 5 ? 'Corners play in w/ runner on 1B' : 'Standard positioning'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Power Zones */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-white">💥 Power Zones</h4>
                        <span className={`text-sm font-bold ${getHotZoneCount() > 4 ? 'text-red-500' :
                                getHotZoneCount() > 2 ? 'text-yellow-500' : 'text-green-500'
                            }`}>
                            {getHotZoneCount()} HOT ZONES
                        </span>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm text-gray-400 mb-2">Extra Base Hit Risk by Zone:</div>
                        <div className="grid grid-cols-3 gap-1">
                            {situational.extraBaseHitRisk.slice(0, 9).map((risk, i) => (
                                <div
                                    key={i}
                                    className={`text-xs text-center p-1 rounded ${risk > 12 ? 'bg-red-500 text-white' :
                                            risk > 8 ? 'bg-yellow-500 text-black' :
                                                'bg-gray-600 text-gray-300'
                                        }`}
                                >
                                    {risk}%
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                            Red zones: avoid mistakes here
                        </div>
                    </div>
                </div>

                {/* Bullpen Status */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-white">🔥 Bullpen Status</h4>
                        <span className={`text-sm font-bold px-2 py-1 rounded-full ${bullpenStatus.color}`}>
                            {bullpenStatus.status}
                        </span>
                    </div>
                    <div className="space-y-2">
                        <div className="text-xs text-gray-400">{bullpenStatus.description}</div>
                        <div className="space-y-1">
                            {bullpen.filter(p => p.fatigueLevel > 6).map((pitcher, i) => (
                                <div key={i} className="text-xs text-red-400">
                                    ⚠️ {pitcher.pitcher} ({pitcher.fatigueLevel}/10 fatigue)
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 p-2 bg-green-400 bg-opacity-10 border border-green-400 rounded">
                            <div className="text-xs text-green-400 font-medium">Fresh Arms</div>
                            <div className="text-xs text-gray-300">
                                {bullpen.filter(p => p.fatigueLevel <= 4).map(p => p.pitcher.split(' ')[1]).join(', ')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bullpen Depth Chart */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                    📊 Bullpen Fatigue & Workload
                </h4>

                <div className="mb-4">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={bullpenData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', color: '#F3F4F6' }}
                                formatter={(value, name) => {
                                    if (name === 'fatigue') return [`${value}/10`, 'Fatigue Level'];
                                    if (name === 'workload') return [`${value} pitches`, 'Recent Workload'];
                                    return [value, name];
                                }}
                            />
                            <Bar dataKey="fatigue" fill="#F59E0B" name="Fatigue Level" />
                            <Bar dataKey="workload" fill="#10B981" name="Recent Workload" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Bullpen Roles */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {['closer', 'setup', 'middle', 'long'].map(role => {
                        const rolePitchers = bullpen.filter(p => p.role === role);
                        return (
                            <div key={role} className="bg-gray-700 rounded p-3">
                                <h5 className="text-sm font-medium text-gray-300 capitalize mb-2">
                                    {role} ({rolePitchers.length})
                                </h5>
                                <div className="space-y-1">
                                    {rolePitchers.map((pitcher, i) => (
                                        <div key={i} className="text-xs">
                                            <div className="text-white">{pitcher.pitcher} ({pitcher.throws})</div>
                                            <div className={`${pitcher.fatigueLevel > 6 ? 'text-red-400' :
                                                    pitcher.fatigueLevel > 4 ? 'text-yellow-400' : 'text-green-400'
                                                }`}>
                                                Fatigue: {pitcher.fatigueLevel}/10
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Situational Recommendations */}
            <div className="bg-gradient-to-r from-purple-800 to-blue-800 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                    🧠 Situational Game Plan
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h5 className="text-sm font-medium text-purple-300 mb-2">Baserunning Counters</h5>
                        <ul className="space-y-1 text-sm text-gray-300">
                            <li>• {situational.stealSuccessRate > 75 ? 'Quick delivery, vary timing' : 'Standard timing acceptable'}</li>
                            <li>• {situational.baserunningAggression > 6 ? 'Watch for delayed steals' : 'Conservative runners, standard holds'}</li>
                            <li>• Catcher must be aware of jump/read patterns</li>
                        </ul>
                    </div>

                    <div>
                        <h5 className="text-sm font-medium text-blue-300 mb-2">Power Management</h5>
                        <ul className="space-y-1 text-sm text-gray-300">
                            <li>• Avoid red zones with 2+ baserunners</li>
                            <li>• {getHotZoneCount() > 3 ? 'Multiple danger zones - precision crucial' : 'Limited power zones'}</li>
                            <li>• Double play opportunities at {situational.doublePlayRate}% rate</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SituationalBox;
