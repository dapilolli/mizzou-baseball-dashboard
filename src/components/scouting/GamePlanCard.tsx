import React from 'react';
import { ScoutingData, FilterState } from '../../types/scouting';

interface GamePlanCardProps {
    data: ScoutingData;
    filters: FilterState;
    isPrintMode?: boolean;
    isCompact?: boolean;
}

const GamePlanCard: React.FC<GamePlanCardProps> = ({ data, filters, isPrintMode = false, isCompact = false }) => {
    // Generate AI-like tactical narratives based on data
    const generateGamePlanSummary = () => {
        const threats = data.hitters.filter(h => h.chaseRate < 25 || h.hotColdZones.filter(z => z > 0.1).length > 3);
        const weaknesses = data.hitters.filter(h => h.chaseRate > 35 || h.whiff > 30);
        const runningThreats = data.hitters.filter(h => h.sbTendencies.attempts > 5 && h.sbTendencies.successRate > 75);
        const fatiguedBullpen = data.bullpen.filter(p => p.fatigueLevel > 6);

        const summaryPoints: string[] = [];

        // Threat assessment
        if (threats.length > 3) {
            summaryPoints.push(`HIGH-POWERED LINEUP: ${threats.length} dangerous hitters require precision execution. Cannot afford mistakes in leverage spots.`);
        } else {
            summaryPoints.push(`MANAGEABLE LINEUP: Limited elite threats allow for more aggressive approach. Focus on ${threats.map(h => h.name).join(', ')}.`);
        }

        // Exploitable weaknesses
        if (weaknesses.length > 0) {
            summaryPoints.push(`EXPLOIT CHASE RATES: ${weaknesses.length} hitters show poor plate discipline (${weaknesses.map(h => `${h.name}: ${h.chaseRate}%`).join(', ')}). Attack with breaking balls off the plate.`);
        }

        // Baserunning threats
        if (runningThreats.length > 0) {
            summaryPoints.push(`BASERUNNING ALERT: ${runningThreats.map(h => h.name).join(', ')} are elite steal threats. Quick delivery essential with runners on base.`);
        }

        // Bullpen considerations
        if (fatiguedBullpen.length > 2) {
            summaryPoints.push(`BULLPEN FATIGUE: Multiple relievers showing high fatigue. Plan to extend starter if possible. Fresh arms: ${data.bullpen.filter(p => p.fatigueLevel <= 4).map(p => p.pitcher.split(' ')[1]).join(', ')}.`);
        }

        // Weather/environmental factors
        if (data.gameContext.wind.includes('out')) {
            summaryPoints.push(`WIND FACTOR: Wind blowing out favors hitters. Keep ball down in zone, avoid elevation against power threats.`);
        }

        return summaryPoints;
    };

    const generateDefensiveAlignment = () => {
        const pullHitters = data.hitters.filter(h => h.sprayChart.pull > 40);
        const gbHitters = data.hitters.filter(h => h.batProfile.gb > 50);
        const buntThreats = data.hitters.filter(h => h.buntFreq > 5);

        const alignments: string[] = [];

        if (pullHitters.length > 0) {
            alignments.push(`SHIFT CANDIDATES: ${pullHitters.map(h => `${h.name} (${h.sprayChart.pull}% pull)`).join(', ')}. Consider infield shift.`);
        }

        if (gbHitters.length > 0) {
            alignments.push(`GROUND BALL TARGETS: ${gbHitters.map(h => h.name).join(', ')}. Keep middle infield ready for double plays.`);
        }

        if (buntThreats.length > 0) {
            alignments.push(`BUNT DEFENSE: ${buntThreats.map(h => h.name).join(', ')} show bunt frequency. Corners play in with runners on base.`);
        }

        return alignments;
    };

    const generatePitchingApproach = () => {
        const approaches: string[] = [];

        // Primary pitchers analysis
        const primaryPitcher = data.pitchers[0];
        if (primaryPitcher) {
            const outPitch = primaryPitcher.pitchTypes.sort((a, b) => b.whiffRate - a.whiffRate)[0];
            approaches.push(`PRIMARY WEAPON: ${primaryPitcher.name}'s ${outPitch.type} shows ${outPitch.whiffRate}% whiff rate. Use as putaway pitch with 2 strikes.`);

            if (primaryPitcher.timesThruOrderSplits.third.fip > primaryPitcher.timesThruOrderSplits.first.fip + 1.0) {
                approaches.push(`TIMES THROUGH ORDER: ${primaryPitcher.name} shows significant decline third time through (${primaryPitcher.timesThruOrderSplits.third.fip} FIP vs ${primaryPitcher.timesThruOrderSplits.first.fip}). Plan early bullpen usage.`);
            }
        }

        // Count-specific strategies
        const disciplinedHitters = data.hitters.filter(h => h.chaseRate < 25);
        if (disciplinedHitters.length > 0) {
            approaches.push(`ATTACK EARLY: ${disciplinedHitters.map(h => h.name).join(', ')} rarely chase. Challenge in zone early in counts, avoid falling behind.`);
        }

        return approaches;
    };

    const summaryPoints = generateGamePlanSummary();
    const defensiveAlignments = generateDefensiveAlignment();
    const pitchingApproaches = generatePitchingApproach();

    return (
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 border border-blue-600">
            <div className="flex items-center justify-between mb-6">
                <h2 className={`font-bold text-white flex items-center ${isCompact ? 'text-xl' : 'text-2xl'}`}>
                    🧠 AI Game Plan Summary
                </h2>
                <div className="text-right">
                    <div className="text-sm text-blue-300">Generated from {data.hitters.length + data.pitchers.length} player profiles</div>
                    <div className="text-xs text-gray-400">Confidence: High</div>
                </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-blue-800 bg-opacity-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
                    📋 Executive Summary
                </h3>
                <div className="space-y-3">
                    {summaryPoints.slice(0, isCompact ? 2 : undefined).map((point, index) => (
                        <div key={index} className="text-sm text-gray-200 leading-relaxed">
                            <span className="text-blue-400 font-bold">•</span> {point}
                        </div>
                    ))}
                </div>
            </div>

            {!isCompact && (
                <>
                    {/* Pitching Approach */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="bg-green-800 bg-opacity-30 rounded-lg p-4 border border-green-600">
                            <h3 className="text-lg font-semibold text-green-300 mb-3 flex items-center">
                                ⚾ Pitching Approach
                            </h3>
                            <div className="space-y-2">
                                {pitchingApproaches.map((approach, index) => (
                                    <div key={index} className="text-sm text-gray-200">
                                        <span className="text-green-400 font-bold">•</span> {approach}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-purple-800 bg-opacity-30 rounded-lg p-4 border border-purple-600">
                            <h3 className="text-lg font-semibold text-purple-300 mb-3 flex items-center">
                                🛡️ Defensive Alignment
                            </h3>
                            <div className="space-y-2">
                                {defensiveAlignments.map((alignment, index) => (
                                    <div key={index} className="text-sm text-gray-200">
                                        <span className="text-purple-400 font-bold">•</span> {alignment}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Situational Priorities */}
                    <div className="bg-red-800 bg-opacity-30 rounded-lg p-4 border border-red-600">
                        <h3 className="text-lg font-semibold text-red-300 mb-3 flex items-center">
                            🎯 High-Leverage Priorities
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-red-400 mb-2">Must Execute</h4>
                                <div className="space-y-1 text-sm text-gray-300">
                                    <div>• Challenge zone vs disciplined hitters</div>
                                    <div>• Quick delivery vs steal threats</div>
                                    <div>• Avoid power zones in leverage spots</div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-yellow-400 mb-2">Opportunities</h4>
                                <div className="space-y-1 text-sm text-gray-300">
                                    <div>• Attack chase-happy hitters off plate</div>
                                    <div>• Exploit weak contact hitters</div>
                                    <div>• Use shifts against pull hitters</div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-blue-400 mb-2">Watch For</h4>
                                <div className="space-y-1 text-sm text-gray-300">
                                    <div>• Bunt situations with speed</div>
                                    <div>• Bullpen fatigue escalation</div>
                                    <div>• Weather impact on fly balls</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Bottom Line */}
            <div className="mt-6 bg-yellow-600 bg-opacity-20 border border-yellow-500 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2 flex items-center">
                    💡 Bottom Line
                </h3>
                <p className="text-sm text-gray-200 leading-relaxed">
                    {data.hitters.filter(h => h.chaseRate < 25).length > 3
                        ? `Disciplined lineup demands precision. Attack early in counts, avoid walks, and use our best stuff in leverage spots. Cannot afford to fall behind quality hitters.`
                        : `Aggressive lineup with exploitable weaknesses. Attack with conviction, use breaking balls off the plate, and force them to beat our best pitches.`
                    }
                    {data.bullpen.filter(p => p.fatigueLevel > 6).length > 2
                        ? ` Bullpen fatigue requires extended starter usage and strategic fresh arm deployment.`
                        : ` Fresh bullpen provides flexibility for aggressive pitching changes.`
                    }
                </p>
            </div>
        </div>
    );
};

export default GamePlanCard;
