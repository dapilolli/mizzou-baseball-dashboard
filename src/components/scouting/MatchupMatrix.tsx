import React from 'react';
import { Matchup, Pitcher, Hitter, FilterState } from '../../types/scouting';

interface MatchupMatrixProps {
    matchups: Matchup[];
    pitchers: Pitcher[];
    hitters: Hitter[];
    filters: FilterState;
    isCompact?: boolean;
}

const MatchupMatrix: React.FC<MatchupMatrixProps> = ({
    matchups,
    pitchers,
    hitters,
    filters,
    isCompact = false
}) => {
    const getMatchupAdvantage = (matchup: Matchup): string => {
        if (matchup.whiffRate > 35) return 'STRONG PITCHER ADV';
        if (matchup.whiffRate > 25) return 'PITCHER ADV';
        if (matchup.hitRate > 30) return 'HITTER ADV';
        if (matchup.hitRate > 20) return 'SLIGHT HITTER ADV';
        return 'NEUTRAL';
    };

    const getAdvantageColor = (advantage: string): string => {
        switch (advantage) {
            case 'STRONG PITCHER ADV': return 'text-green-500 bg-green-500 bg-opacity-20';
            case 'PITCHER ADV': return 'text-green-400 bg-green-400 bg-opacity-20';
            case 'HITTER ADV': return 'text-red-400 bg-red-400 bg-opacity-20';
            case 'SLIGHT HITTER ADV': return 'text-orange-400 bg-orange-400 bg-opacity-20';
            default: return 'text-gray-400 bg-gray-400 bg-opacity-20';
        }
    };

    const getPriorityMatchups = () => {
        return matchups
            .sort((a, b) => {
                // Prioritize by sample size and extreme results
                const aScore = a.plateAppearances * (Math.abs(a.hitRate - 25) + Math.abs(a.whiffRate - 25));
                const bScore = b.plateAppearances * (Math.abs(b.hitRate - 25) + Math.abs(b.whiffRate - 25));
                return bScore - aScore;
            })
            .slice(0, isCompact ? 4 : 8);
    };

    const getRecommendationIcon = (approach: string): string => {
        if (approach.toLowerCase().includes('avoid')) return '⚠️';
        return '';
    };

    return (
        <div className="space-y-6">
            {/* Priority Matchups Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {getPriorityMatchups().map((matchup) => {
                    const advantage = getMatchupAdvantage(matchup);
                    const colorClass = getAdvantageColor(advantage);

                    return (
                        <div key={matchup.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <span className="text-lg">⚔️</span>
                                    <div>
                                        <div className="font-medium text-white text-sm">
                                            {matchup.ourPitcher} vs {matchup.theirHitter}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {matchup.plateAppearances} PA sample
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                                    {advantage}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <div className="text-center">
                                    <div className={`text-lg font-bold ${matchup.hitRate > 25 ? 'text-red-400' : 'text-green-400'}`}>
                                        {matchup.hitRate}%
                                    </div>
                                    <div className="text-xs text-gray-400">Hit Rate</div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-lg font-bold ${matchup.whiffRate > 25 ? 'text-green-400' : 'text-red-400'}`}>
                                        {matchup.whiffRate}%
                                    </div>
                                    <div className="text-xs text-gray-400">Whiff Rate</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-yellow-400">
                                        {matchup.plateAppearances}
                                    </div>
                                    <div className="text-xs text-gray-400">PA</div>
                                </div>
                            </div>

                            {/* Recommendation */}
                            <div className="bg-yellow-400 bg-opacity-10 border border-yellow-400 rounded p-2">
                                <div className="text-xs font-medium text-yellow-400 mb-1 flex items-center">
                                    {getRecommendationIcon(matchup.recommendedApproach)} Recommended Approach
                                </div>
                                <div className="text-xs text-gray-300">{matchup.recommendedApproach}</div>
                                {matchup.notes && (
                                    <div className="text-xs text-gray-400 mt-1 italic">
                                        Note: {matchup.notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Matchup Trends Summary */}
            {!isCompact && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                        📊 Matchup Trends Analysis
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Pitcher Advantages */}
                        <div className="bg-green-400 bg-opacity-10 border border-green-400 rounded p-3">
                            <h5 className="text-sm font-medium text-green-400 mb-2">Strong Pitcher Advantages</h5>
                            <div className="space-y-1">
                                {matchups
                                    .filter(m => getMatchupAdvantage(m).includes('PITCHER ADV'))
                                    .slice(0, 3)
                                    .map((m, i) => (
                                        <div key={i} className="text-xs text-gray-300">
                                            • {m.ourPitcher} vs {m.theirHitter} ({m.whiffRate}% whiff)
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Hitter Advantages */}
                        <div className="bg-red-400 bg-opacity-10 border border-red-400 rounded p-3">
                            <h5 className="text-sm font-medium text-red-400 mb-2">Hitter Advantages (Avoid)</h5>
                            <div className="space-y-1">
                                {matchups
                                    .filter(m => getMatchupAdvantage(m).includes('HITTER ADV'))
                                    .slice(0, 3)
                                    .map((m, i) => (
                                        <div key={i} className="text-xs text-gray-300">
                                            • {m.ourPitcher} vs {m.theirHitter} ({m.hitRate}% hit rate)
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Key Tactical Notes */}
                        <div className="bg-blue-400 bg-opacity-10 border border-blue-400 rounded p-3">
                            <h5 className="text-sm font-medium text-blue-400 mb-2">Key Tactical Notes</h5>
                            <div className="space-y-1">
                                {matchups
                                    .filter(m => m.notes)
                                    .slice(0, 3)
                                    .map((m, i) => (
                                        <div key={i} className="text-xs text-gray-300">
                                            • {m.theirHitter}: {m.notes}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Handedness Matrix */}
            {!isCompact && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h4 className="text-lg font-medium text-white mb-4">Handedness Matchup Matrix</h4>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-600">
                                    <th className="text-left text-gray-400 py-2 px-3">Our Pitcher</th>
                                    <th className="text-left text-gray-400 py-2 px-3">vs RH Hitters</th>
                                    <th className="text-left text-gray-400 py-2 px-3">vs LH Hitters</th>
                                    <th className="text-left text-gray-400 py-2 px-3">vs Switch</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pitchers.slice(0, 4).map((pitcher) => {
                                    const rhMatchups = matchups.filter(m =>
                                        m.ourPitcher === pitcher.name &&
                                        hitters.find(h => h.name === m.theirHitter)?.bats === 'R'
                                    );
                                    const lhMatchups = matchups.filter(m =>
                                        m.ourPitcher === pitcher.name &&
                                        hitters.find(h => h.name === m.theirHitter)?.bats === 'L'
                                    );
                                    const switchMatchups = matchups.filter(m =>
                                        m.ourPitcher === pitcher.name &&
                                        hitters.find(h => h.name === m.theirHitter)?.bats === 'S'
                                    );

                                    return (
                                        <tr key={pitcher.id} className="border-b border-gray-700">
                                            <td className="py-2 px-3 text-white font-medium">
                                                {pitcher.name} ({pitcher.throws}HP)
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className={
                                                    pitcher.throws === 'R'
                                                        ? 'text-yellow-400'
                                                        : 'text-green-400'
                                                }>
                                                    {rhMatchups.length > 0
                                                        ? `${Math.round(rhMatchups.reduce((sum, m) => sum + m.whiffRate, 0) / rhMatchups.length)}% whiff`
                                                        : 'No data'}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className={
                                                    pitcher.throws === 'L'
                                                        ? 'text-yellow-400'
                                                        : 'text-green-400'
                                                }>
                                                    {lhMatchups.length > 0
                                                        ? `${Math.round(lhMatchups.reduce((sum, m) => sum + m.whiffRate, 0) / lhMatchups.length)}% whiff`
                                                        : 'No data'}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className="text-gray-400">
                                                    {switchMatchups.length > 0
                                                        ? `${Math.round(switchMatchups.reduce((sum, m) => sum + m.whiffRate, 0) / switchMatchups.length)}% whiff`
                                                        : 'No data'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatchupMatrix;
