import React from 'react';
import { PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, RadialBarChart, RadialBar, Tooltip } from 'recharts';
import { PitchTypeDetail } from '../../types/scouting';

interface TiltRadialChartProps {
    pitchData: Record<string, PitchTypeDetail>;
    className?: string;
}

const PITCH_COLORS: Record<string, string> = {
    '4S': '#FF6B6B', // Red for 4-seam
    'SI': '#4ECDC4', // Teal for sinker
    'SL': '#45B7D1', // Blue for slider
    'CH': '#96CEB4', // Green for changeup
    'CB': '#FFEAA7', // Yellow for curveball
    'CT': '#DDA0DD', // Plum for cutter
    'SFF': '#FFA07A', // Light salmon for splitter
    'SW': '#87CEEB'  // Sky blue for sweeper
};

// Convert degrees to clock position string
const degreesToClock = (degrees: number): string => {
    // Convert to 12-hour clock where 0° = 12:00
    const hours = Math.round((degrees / 30) % 12) || 12;
    const minutes = Math.round(((degrees % 30) / 30) * 60);

    if (minutes === 0) {
        return `${hours}:00`;
    } else if (minutes === 30) {
        return `${hours}:30`;
    } else {
        return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
};

const TiltRadialChart: React.FC<TiltRadialChartProps> = ({ pitchData, className = '' }) => {
    // Transform pitch data into radial chart format
    const radialData = Object.entries(pitchData).map(([pitchType, data], index) => ({
        pitchType,
        tilt: data.tilt,
        angle: data.tilt,
        value: 100, // Fixed value for visualization
        fill: PITCH_COLORS[pitchType] || '#666',
        clockTime: degreesToClock(data.tilt)
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-600">
                    <p className="font-semibold text-lg">{data.pitchType}</p>
                    <p className="text-sm">Tilt: {data.tilt}°</p>
                    <p className="text-sm">Clock: {data.clockTime}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
            <h4 className="text-lg font-semibold text-white mb-4">Pitch Tilt Distribution</h4>

            {/* Clock reference */}
            <div className="text-center mb-4">
                <div className="grid grid-cols-4 gap-2 text-xs text-gray-400 max-w-md mx-auto">
                    <div>12:00 (0°)</div>
                    <div>3:00 (90°)</div>
                    <div>6:00 (180°)</div>
                    <div>9:00 (270°)</div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="90%"
                    data={radialData}
                    startAngle={90}
                    endAngle={450}
                >
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis
                        tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        tickFormatter={(value) => `${value}°`}
                    />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                    />
                    <RadialBar
                        dataKey="value"
                        cornerRadius={2}
                    />
                    <Tooltip content={<CustomTooltip />} />
                </RadialBarChart>
            </ResponsiveContainer>

            {/* Pitch list with tilt info */}
            <div className="grid grid-cols-2 gap-2 mt-4">
                {Object.entries(pitchData).map(([pitchType, data]) => (
                    <div key={pitchType} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: PITCH_COLORS[pitchType] || '#666' }}
                            />
                            <span className="text-gray-300">{pitchType}</span>
                        </div>
                        <div className="text-gray-400">
                            {data.tilt}° ({degreesToClock(data.tilt)})
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TiltRadialChart;
