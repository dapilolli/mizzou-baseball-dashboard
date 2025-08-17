import React from 'react';
import { FilterState } from '../../types/scouting';

interface FiltersBarProps {
    filters: FilterState;
    onFilterChange: (filters: Partial<FilterState>) => void;
    className?: string;
}

const FiltersBar: React.FC<FiltersBarProps> = ({ filters, onFilterChange, className = '' }) => {
    const filterOptions = {
        inning: [
            { value: 'all', label: 'All Innings' },
            { value: '1-3', label: 'Early (1-3)' },
            { value: '4-6', label: 'Middle (4-6)' },
            { value: '7-9', label: 'Late (7-9)' },
            { value: 'extras', label: 'Extras' }
        ],
        count: [
            { value: 'all', label: 'All Counts' },
            { value: 'even', label: 'Even (0-0, 1-1, 2-2)' },
            { value: 'ahead', label: 'Ahead (1-0, 2-0, 2-1, 3-1)' },
            { value: 'behind', label: 'Behind (0-1, 0-2, 1-2)' },
            { value: '2-strike', label: '2-Strike' },
            { value: '3-ball', label: '3-Ball' }
        ],
        handedness: [
            { value: 'all', label: 'All' },
            { value: 'same', label: 'Same (RvR, LvL)' },
            { value: 'opposite', label: 'Opposite (RvL, LvR)' }
        ],
        baseState: [
            { value: 'all', label: 'All Situations' },
            { value: 'empty', label: 'Bases Empty' },
            { value: 'runner-on', label: 'Runner On' },
            { value: 'scoring', label: 'Scoring Position' },
            { value: 'loaded', label: 'Bases Loaded' }
        ],
        leverage: [
            { value: 'all', label: 'All Leverage' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' }
        ],
        weather: [
            { value: 'normal', label: 'Normal' },
            { value: 'wind-in', label: 'Wind In (Pitcher Friendly)' },
            { value: 'wind-out', label: 'Wind Out (Hitter Friendly)' },
            { value: 'cold', label: 'Cold (<60°F)' },
            { value: 'hot', label: 'Hot (>85°F)' }
        ],
        scoreDiff: [
            { value: 'all', label: 'All Scores' },
            { value: 'close', label: 'Close Game (±2)' },
            { value: 'ahead', label: 'Leading' },
            { value: 'behind', label: 'Trailing' },
            { value: 'blowout', label: 'Blowout (±5)' }
        ]
    };

    return (
        <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                    🔧 Filters & Scenarios
                </h3>
                <button
                    onClick={() => onFilterChange({
                        inning: 'all',
                        count: 'all',
                        handedness: 'all',
                        baseState: 'all',
                        leverage: 'all',
                        weather: 'normal',
                        scoreDiff: 'all'
                    })}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                    Reset All
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {Object.entries(filterOptions).map(([filterKey, options]) => (
                    <div key={filterKey} className="space-y-1">
                        <label className="text-sm font-medium text-gray-300 capitalize">
                            {filterKey === 'baseState' ? 'Base State' :
                                filterKey === 'scoreDiff' ? 'Score Diff' : filterKey}
                        </label>
                        <select
                            value={filters[filterKey as keyof FilterState]}
                            onChange={(e) => onFilterChange({ [filterKey]: e.target.value })}
                            title={`Filter by ${filterKey === 'baseState' ? 'Base State' :
                                filterKey === 'scoreDiff' ? 'Score Diff' : filterKey}`}
                            className="w-full px-2 py-1.5 text-sm bg-gray-700 text-white border border-gray-600 rounded focus:border-yellow-400 focus:outline-none"
                        >
                            {options.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>

            {/* Active Filters Display */}
            <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                    if (value === 'all' || value === 'normal') return null;

                    const filterLabel = filterOptions[key as keyof typeof filterOptions]
                        ?.find(opt => opt.value === value)?.label || value;

                    return (
                        <span
                            key={key}
                            className="inline-flex items-center px-2 py-1 text-xs bg-yellow-400 text-black rounded-full"
                        >
                            {key}: {filterLabel}
                            <button
                                onClick={() => onFilterChange({ [key]: key === 'weather' ? 'normal' : 'all' })}
                                className="ml-1 hover:bg-yellow-500 rounded-full"
                            >
                                ×
                            </button>
                        </span>
                    );
                })}
            </div>

            {/* Quick Scenarios */}
            <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400 mb-2">Quick Scenarios:</div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => onFilterChange({
                            count: '2-strike',
                            leverage: 'high',
                            baseState: 'scoring'
                        })}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                        🔥 Clutch Situations
                    </button>
                    <button
                        onClick={() => onFilterChange({
                            count: 'ahead',
                            baseState: 'empty',
                            leverage: 'low'
                        })}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                    >
                        ✅ Attack Mode
                    </button>
                    <button
                        onClick={() => onFilterChange({
                            handedness: 'same',
                            count: 'even'
                        })}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >
                        ⚖️ Platoon Advantage
                    </button>
                    <button
                        onClick={() => onFilterChange({
                            weather: 'wind-out',
                            leverage: 'medium'
                        })}
                        className="px-3 py-1 text-xs bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                    >
                        🌪️ Wind Conditions
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FiltersBar;
