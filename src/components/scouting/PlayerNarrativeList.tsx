import React, { useState } from 'react';
import { ScoutingData, FilterState, Hitter, Pitcher } from '../../types/scouting';

interface PlayerNarrativeListProps {
    data: ScoutingData;
    filters: FilterState;
    isPrintMode?: boolean;
    isCompact?: boolean;
}

const PlayerNarrativeList: React.FC<PlayerNarrativeListProps> = ({
    data,
    filters,
    isPrintMode = false,
    isCompact = false
}) => {
    const [activePlayerType, setActivePlayerType] = useState<'hitters' | 'pitchers'>('hitters');

    // Generate narrative for hitters
    const generateHitterNarrative = (hitter: Hitter): string => {
        const narrativeParts: string[] = [];

        // Threat level assessment
        const hotZones = hitter.hotColdZones.filter(z => z > 0.1).length;
        const discipline = 100 - hitter.chaseRate;

        if (discipline > 75 && hotZones > 3) {
            narrativeParts.push(`ELITE THREAT: ${hitter.name} combines excellent plate discipline (${hitter.chaseRate}% chase) with multiple hot zones.`);
        } else if (discipline > 65 || hotZones > 2) {
            narrativeParts.push(`DANGEROUS HITTER: ${hitter.name} poses significant threat with ${discipline > 65 ? 'good discipline' : 'power zones'}.`);
        } else {
            narrativeParts.push(`MANAGEABLE: ${hitter.name} shows exploitable weaknesses in approach.`);
        }

        // Approach description
        if (hitter.chaseRate > 35) {
            narrativeParts.push(`Aggressive swinger who chases (${hitter.chaseRate}% chase rate) - attack with breaking balls off the plate.`);
        } else if (hitter.chaseRate < 20) {
            narrativeParts.push(`Patient hitter with elite discipline - must challenge in zone early, avoid falling behind.`);
        } else {
            narrativeParts.push(`Balanced approach - mix locations and keep him guessing.`);
        }

        // Spray chart intel
        if (hitter.sprayChart.pull > 45) {
            narrativeParts.push(`Strong pull tendency (${hitter.sprayChart.pull}%) - consider defensive shift and work away.`);
        } else if (hitter.sprayChart.oppo > 35) {
            narrativeParts.push(`Uses opposite field well (${hitter.sprayChart.oppo}%) - can handle outside pitch.`);
        }

        // Power assessment
        const flyBallRate = hitter.batProfile.fb + hitter.batProfile.ld;
        if (flyBallRate > 45) {
            narrativeParts.push(`POWER THREAT: High fly ball/line drive rate (${flyBallRate}%) - keep ball down in zone.`);
        } else if (hitter.batProfile.gb > 55) {
            narrativeParts.push(`Ground ball hitter (${hitter.batProfile.gb}%) - good double play candidate.`);
        }

        // Baserunning
        if (hitter.sbTendencies.attempts > 5 && hitter.sbTendencies.successRate > 75) {
            narrativeParts.push(`STEAL THREAT: ${hitter.sbTendencies.attempts} attempts at ${hitter.sbTendencies.successRate}% success - quick delivery essential.`);
        }

        // Specific weaknesses
        const weakPitchTypes = hitter.vsPitchType.filter(vpt => vpt.xwOBA < 0.280);
        if (weakPitchTypes.length > 0) {
            narrativeParts.push(`Struggles vs ${weakPitchTypes.map(vpt => vpt.pitchType).join(', ')} - exploit these pitch types.`);
        }

        return narrativeParts.join(' ');
    };

    // Generate narrative for pitchers
    const generatePitcherNarrative = (pitcher: Pitcher): string => {
        const narrativeParts: string[] = [];

        // Overall assessment
        const avgWhiff = pitcher.pitchTypes.reduce((sum, pt) => sum + pt.whiffRate, 0) / pitcher.pitchTypes.length;
        const primaryPitch = pitcher.pitchTypes.sort((a, b) => b.usageOverall - a.usageOverall)[0];
        const outPitch = pitcher.pitchTypes.sort((a, b) => b.whiffRate - a.whiffRate)[0];

        if (avgWhiff > 30) {
            narrativeParts.push(`DOMINANT PITCHER: ${pitcher.name} shows elite stuff with ${avgWhiff.toFixed(1)}% average whiff rate.`);
        } else if (avgWhiff > 25) {
            narrativeParts.push(`QUALITY PITCHER: ${pitcher.name} has solid stuff and command.`);
        } else {
            narrativeParts.push(`HITTABLE PITCHER: ${pitcher.name} can be attacked with patience and good approach.`);
        }

        // Arsenal breakdown
        narrativeParts.push(`Primary weapon is ${primaryPitch.type} (${primaryPitch.usageOverall}% usage, ${primaryPitch.vAvg.toFixed(1)} mph).`);

        if (outPitch.whiffRate > 30) {
            narrativeParts.push(`Out pitch is ${outPitch.type} with ${outPitch.whiffRate}% whiff rate - dangerous with 2 strikes.`);
        }

        // Times through order
        const firstTimeFIP = pitcher.timesThruOrderSplits.first.fip;
        const thirdTimeFIP = pitcher.timesThruOrderSplits.third.fip;

        if (thirdTimeFIP > firstTimeFIP + 1.5) {
            narrativeParts.push(`SIGNIFICANT DECLINE third time through order (${thirdTimeFIP} vs ${firstTimeFIP} FIP) - vulnerable to lineup turnover.`);
        } else if (thirdTimeFIP > firstTimeFIP + 0.75) {
            narrativeParts.push(`Shows some fatigue patterns third time through order - be patient and work counts.`);
        }

        // Tendencies
        if (pitcher.sequenceTendencies.length > 0) {
            narrativeParts.push(`Key tendency: ${pitcher.sequenceTendencies[0].toLowerCase()}.`);
        }

        // Attack strategy
        if (avgWhiff < 25) {
            narrativeParts.push(`ATTACK APPROACH: Be aggressive early in counts, look for strikes to hit.`);
        } else {
            narrativeParts.push(`PATIENT APPROACH: Make him throw strikes, work deep counts when possible.`);
        }

        return narrativeParts.join(' ');
    };

    const getPlayerIcon = (player: Hitter | Pitcher): string => {
        if ('position' in player) {
            // It's a hitter
            const hitter = player as Hitter;
            const hotZones = hitter.hotColdZones.filter(z => z > 0.1).length;
            const discipline = 100 - hitter.chaseRate;

            if (discipline > 65 || hotZones > 2) return '⚠️'; // Dangerous
            if (hitter.chaseRate > 35) return '🎯'; // Exploitable
            return '👤'; // Standard
        } else {
            // It's a pitcher
            const pitcher = player as Pitcher;
            const avgWhiff = pitcher.pitchTypes.reduce((sum, pt) => sum + pt.whiffRate, 0) / pitcher.pitchTypes.length;

            if (avgWhiff > 30) return '🔥'; // Dominant
            if (avgWhiff > 25) return '⚡'; // Quality
        }
    };

    const getPriorityLevel = (player: Hitter | Pitcher): { level: string; color: string } => {
        if ('position' in player) {
            const hitter = player as Hitter;
            const hotZones = hitter.hotColdZones.filter(z => z > 0.1).length;
            const discipline = 100 - hitter.chaseRate;

            if (discipline > 75 && hotZones > 3) return { level: 'CRITICAL', color: 'text-red-500 bg-red-500 bg-opacity-20' };
            if (discipline > 65 || hotZones > 2) return { level: 'HIGH', color: 'text-orange-500 bg-orange-500 bg-opacity-20' };
            if (hitter.chaseRate > 35) return { level: 'OPPORTUNITY', color: 'text-green-500 bg-green-500 bg-opacity-20' };
            return { level: 'STANDARD', color: 'text-gray-500 bg-gray-500 bg-opacity-20' };
        } else {
            const pitcher = player as Pitcher;
            const avgWhiff = pitcher.pitchTypes.reduce((sum, pt) => sum + pt.whiffRate, 0) / pitcher.pitchTypes.length;

            if (avgWhiff > 30) return { level: 'DOMINANT', color: 'text-red-500 bg-red-500 bg-opacity-20' };
            if (avgWhiff > 25) return { level: 'QUALITY', color: 'text-yellow-500 bg-yellow-500 bg-opacity-20' };
            return { level: 'HITTABLE', color: 'text-green-500 bg-green-500 bg-opacity-20' };
        }
    };

    return (
        <div className="space-y-6">
            {/* Player Type Toggle */}
            {!isPrintMode && !isCompact && (
                <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
                    <button
                        onClick={() => setActivePlayerType('hitters')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${activePlayerType === 'hitters'
                            ? 'bg-yellow-400 text-black'
                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        <span>🏏</span>
                        <span>Hitter Intel</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${activePlayerType === 'hitters' ? 'bg-black text-yellow-400' : 'bg-gray-700 text-gray-400'
                            }`}>
                            {data.hitters.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActivePlayerType('pitchers')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${activePlayerType === 'pitchers'
                            ? 'bg-yellow-400 text-black'
                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        <span>⚾</span>
                        <span>Pitcher Intel</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${activePlayerType === 'pitchers' ? 'bg-black text-yellow-400' : 'bg-gray-700 text-gray-400'
                            }`}>
                            {data.pitchers.length}
                        </span>
                    </button>
                </div>
            )}

            {/* Player Narratives */}
            <div className="space-y-4">
                {activePlayerType === 'hitters' && (
                    <>
                        <h3 className="text-xl font-bold text-white flex items-center">
                            Hitter Intelligence Cards
                        </h3>
                        {data.hitters.slice(0, isCompact ? 3 : undefined).map((hitter) => {
                            const priority = getPriorityLevel(hitter);
                            const narrative = generateHitterNarrative(hitter);

                            return (
                                <div key={hitter.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{getPlayerIcon(hitter)}</span>
                                            <div>
                                                <h4 className="text-lg font-bold text-white">
                                                    {hitter.name}
                                                </h4>
                                                <div className="text-sm text-gray-400">
                                                    {hitter.bats}/{hitter.position} • Lineup Position: #{hitter.id.slice(-1)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${priority.color}`}>
                                            {priority.level}
                                        </div>
                                    </div>

                                    <div className="bg-blue-900 bg-opacity-30 rounded p-3 mb-3">
                                        <p className="text-sm text-gray-200 leading-relaxed">
                                            {narrative}
                                        </p>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                        <div className="text-center">
                                            <div className="text-white font-bold">{hitter.chaseRate}%</div>
                                            <div className="text-gray-400">Chase</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-white font-bold">{hitter.whiff}%</div>
                                            <div className="text-gray-400">Whiff</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-white font-bold">{hitter.sprayChart.pull}%</div>
                                            <div className="text-gray-400">Pull</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-white font-bold">{hitter.sbTendencies.successRate}%</div>
                                            <div className="text-gray-400">SB Rate</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}

                {activePlayerType === 'pitchers' && (
                    <>
                        <h3 className="text-xl font-bold text-white flex items-center">
                            Pitcher Intelligence Cards
                        </h3>
                        {data.pitchers.slice(0, isCompact ? 2 : undefined).map((pitcher) => {
                            const priority = getPriorityLevel(pitcher);
                            const narrative = generatePitcherNarrative(pitcher);

                            return (
                                <div key={pitcher.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{getPlayerIcon(pitcher)}</span>
                                            <div>
                                                <h4 className="text-lg font-bold text-white">
                                                    {pitcher.name}
                                                </h4>
                                                <div className="text-sm text-gray-400">
                                                    {pitcher.throws}HP • {pitcher.pitchTypes.length} Pitch Arsenal
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${priority.color}`}>
                                            {priority.level}
                                        </div>
                                    </div>

                                    <div className="bg-green-900 bg-opacity-30 rounded p-3 mb-3">
                                        <p className="text-sm text-gray-200 leading-relaxed">
                                            {narrative}
                                        </p>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                        <div className="text-center">
                                            <div className="text-white font-bold">
                                                {Math.round(pitcher.pitchTypes.reduce((sum, pt) => sum + pt.whiffRate, 0) / pitcher.pitchTypes.length)}%
                                            </div>
                                            <div className="text-gray-400">Avg Whiff</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-white font-bold">{pitcher.timesThruOrderSplits.first.fip}</div>
                                            <div className="text-gray-400">1st FIP</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-white font-bold">{pitcher.timesThruOrderSplits.third.fip}</div>
                                            <div className="text-gray-400">3rd FIP</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-white font-bold">{pitcher.pitchTypes[0]?.type || 'N/A'}</div>
                                            <div className="text-gray-400">Primary</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Print Mode: Show both types */}
            {isPrintMode && (
                <div className="space-y-8 print-break">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4">🏏 Hitter Intelligence</h3>
                        {data.hitters.map((hitter) => {
                            const narrative = generateHitterNarrative(hitter);
                            return (
                                <div key={hitter.id} className="mb-4 p-3 bg-gray-800 rounded">
                                    <h4 className="font-bold text-white">{hitter.name} ({hitter.position})</h4>
                                    <p className="text-sm text-gray-300 mt-1">{narrative}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-white mb-4"> Pitcher Intelligence</h3>
                        {data.pitchers.map((pitcher) => {
                            const narrative = generatePitcherNarrative(pitcher);
                            return (
                                <div key={pitcher.id} className="mb-4 p-3 bg-gray-800 rounded">
                                    <h4 className="font-bold text-white">{pitcher.name} ({pitcher.throws}HP)</h4>
                                    <p className="text-sm text-gray-300 mt-1">{narrative}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerNarrativeList;
