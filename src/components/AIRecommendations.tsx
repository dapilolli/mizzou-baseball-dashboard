import React, { useState } from 'react';
import { API_BASE } from '@/utils/api';

interface Recommendation {
    pitch: string;
    reasoning: string;
    confidence: 'High' | 'Medium' | 'Low';
}

interface PlayerAnalysis {
    name: string;
    strengths: string[];
    weaknesses: string[];
}

interface RecommendationData {
    recommendations: Recommendation[];
    pitcher_analysis: PlayerAnalysis;
    batter_analysis: PlayerAnalysis;
}

interface AIRecommendationsProps {
    currentPitcher?: string;
    currentBatter?: string;
    count?: string;
    inning?: number;
    runners?: {
        first: boolean;
        second: boolean;
        third: boolean;
    };
    isMissouriPitching?: boolean;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({
    currentPitcher = "Ben Kudrna",
    currentBatter = "Lebron",
    count = "0-0",
    inning = 1,
    runners = { first: false, second: false, third: false },
    isMissouriPitching = true
}) => {
    const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get dynamic title and description based on game state
    const getReportTitle = () => {
        if (isMissouriPitching) {
            return "AI Pitcher Report";
        } else {
            return "AI Hitter Report";
        }
    };

    const getReportDescription = () => {
        if (isMissouriPitching) {
            return "Pitch recommendations and Alabama batter analysis";
        } else {
            return "Hitting approach and Alabama pitcher analysis";
        }
    };

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);

        try {
            // Use different endpoint based on game state
            const endpoint = isMissouriPitching
                ? `${API_BASE || ''}/api/pitch-recommendation`
                : `${API_BASE || ''}/api/hitting-recommendation`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pitcher: currentPitcher,
                    batter: currentBatter,
                    count: count,
                    runners: runners,
                    inning: inning,
                    isMissouriPitching: isMissouriPitching
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch recommendations');
            }

            const data = await response.json();
            setRecommendations(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const getConfidenceColor = (confidence: string) => {
        switch (confidence) {
            case 'High': return 'bg-green-100 text-green-800 border-green-200';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Low': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{getReportTitle()}</h3>
                    <p className="text-sm text-gray-600">{getReportDescription()}</p>
                </div>
                <button
                    onClick={fetchRecommendations}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isMissouriPitching
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        }`}
                >
                    {loading ? 'Analyzing...' : 'Get AI Tips'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium text-gray-600">Matchup:</span>
                    <div className="text-gray-900">{currentPitcher} vs {currentBatter}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium text-gray-600">Count:</span>
                    <div className="text-gray-900 font-mono text-lg">{count}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium text-gray-600">Runners:</span>
                    <div className="text-gray-900">
                        {runners.first && '1st '}
                        {runners.second && '2nd '}
                        {runners.third && '3rd '}
                        {!runners.first && !runners.second && !runners.third && 'Bases empty'}
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {recommendations && (
                <div className="space-y-6">
                    {/* Pitch Recommendations */}
                    <div>
                        <div className="space-y-4">
                            {recommendations.recommendations.map((rec, index) => (
                                <div
                                    key={index}
                                    className="flex items-start justify-between p-5 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-lg font-bold text-gray-900">
                                                {index + 1}. {isMissouriPitching ? rec.pitch : rec.pitch}
                                            </span>
                                            <span className={`px-3 py-1 text-sm font-bold rounded border ${getConfidenceColor(rec.confidence)}`}>
                                                {rec.confidence}
                                            </span>
                                        </div>
                                        <p className="text-base font-medium text-gray-800">{rec.reasoning}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Player Analysis - Dynamic based on game state */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {isMissouriPitching ? (
                            <>
                                {/* Missouri Pitcher Analysis */}
                                <div>
                                    <h4 className="text-xl font-bold text-yellow-600 mb-4">
                                        Missouri: {recommendations.pitcher_analysis.name}
                                    </h4>

                                    {recommendations.pitcher_analysis.strengths.length > 0 && (
                                        <div className="mb-4">
                                            <h5 className="text-lg font-bold text-green-700 mb-3">Your Strengths</h5>
                                            <ul className="space-y-2">
                                                {recommendations.pitcher_analysis.strengths.map((strength, index) => (
                                                    <li key={index} className="text-base font-medium text-gray-800 flex items-start">
                                                        <span className="text-green-500 mr-2 text-lg">•</span>
                                                        {strength}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Alabama Batter Analysis */}
                                <div>
                                    <h4 className="text-xl font-bold text-red-600 mb-4">
                                        Alabama: {recommendations.batter_analysis.name}
                                    </h4>

                                    {recommendations.batter_analysis.weaknesses.length > 0 && (
                                        <div className="mb-4">
                                            <h5 className="text-lg font-bold text-red-700 mb-3">Attack These Weaknesses</h5>
                                            <ul className="space-y-2">
                                                {recommendations.batter_analysis.weaknesses.map((weakness, index) => (
                                                    <li key={index} className="text-base font-medium text-gray-800 flex items-start">
                                                        <span className="text-red-500 mr-2 text-lg">•</span>
                                                        {weakness}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Missouri Batter Analysis */}
                                <div>
                                    <h4 className="text-xl font-bold text-yellow-600 mb-4">
                                        Missouri: {recommendations.batter_analysis.name}
                                    </h4>

                                    {recommendations.batter_analysis.strengths.length > 0 && (
                                        <div className="mb-4">
                                            <h5 className="text-lg font-bold text-green-700 mb-3">Use Your Strengths</h5>
                                            <ul className="space-y-2">
                                                {recommendations.batter_analysis.strengths.map((strength, index) => (
                                                    <li key={index} className="text-base font-medium text-gray-800 flex items-start">
                                                        <span className="text-green-500 mr-2 text-lg">•</span>
                                                        {strength}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {recommendations.batter_analysis.weaknesses.length > 0 && (
                                        <div>
                                            <h5 className="text-lg font-bold text-blue-700 mb-3">Your Approach & Plan</h5>
                                            <ul className="space-y-2">
                                                {recommendations.batter_analysis.weaknesses.map((weakness, index) => (
                                                    <li key={index} className="text-base font-medium text-gray-800 flex items-start">
                                                        <span className="text-blue-500 mr-2 text-lg">•</span>
                                                        {weakness}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Alabama Pitcher Analysis */}
                                <div>
                                    <h4 className="text-xl font-bold text-red-600 mb-4">
                                        Alabama: {recommendations.pitcher_analysis.name}
                                    </h4>

                                    {recommendations.pitcher_analysis.weaknesses.length > 0 && (
                                        <div className="mb-4">
                                            <h5 className="text-lg font-bold text-red-700 mb-3">Exploit These Weaknesses</h5>
                                            <ul className="space-y-2">
                                                {recommendations.pitcher_analysis.weaknesses.map((weakness, index) => (
                                                    <li key={index} className="text-base font-medium text-gray-800 flex items-start">
                                                        <span className="text-red-500 mr-2 text-lg">•</span>
                                                        {weakness}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {recommendations.pitcher_analysis.strengths.length > 0 && (
                                        <div>
                                            <h5 className="text-lg font-bold text-orange-700 mb-3">Be Ready For</h5>
                                            <ul className="space-y-2">
                                                {recommendations.pitcher_analysis.strengths.map((strength, index) => (
                                                    <li key={index} className="text-base font-medium text-gray-800 flex items-start">
                                                        <span className="text-orange-500 mr-2 text-lg">•</span>
                                                        {strength}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {!recommendations && !loading && (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-lg mb-2">
                        {isMissouriPitching
                            ? 'Ready to analyze pitching matchup'
                            : 'Ready to analyze hitting matchup'
                        }
                    </p>
                    <p className="text-sm">
                        {isMissouriPitching
                            ? 'Get pitch recommendations and Alabama batter analysis'
                            : 'Get hitting approach and Alabama pitcher analysis'
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export default AIRecommendations;
