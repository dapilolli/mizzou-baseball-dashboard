import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PitchTypeDetail } from '../../types/scouting';

interface PitchMovementChartProps {
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

const PitchMovementChart: React.FC<PitchMovementChartProps> = ({ pitchData, className = '' }) => {
    // Transform pitch data into scatter plot format
    const scatterData = Object.entries(pitchData).map(([pitchType, data]) => ({
        pitchType,
        ivb: data.ivb,
        hb: data.hb,
        velocity: data.vAvg,
        color: PITCH_COLORS[pitchType] || '#666'
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-600">
                    <p className="font-semibold text-lg">{data.pitchType}</p>
                    <p className="text-sm">IVB: {data.ivb}"</p>
                    <p className="text-sm">HB: {data.hb}"</p>
                    <p className="text-sm">Velocity: {data.velocity.toFixed(1)} mph</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
            <h4 className="text-lg font-semibold text-white mb-4">Pitch Movement Profile</h4>
            <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                        type="number"
                        dataKey="hb"
                        domain={['dataMin - 2', 'dataMax + 2']}
                        stroke="#9CA3AF"
                        label={{
                            value: 'Horizontal Break (inches)',
                            position: 'insideBottom',
                            offset: -10,
                            style: { textAnchor: 'middle', fill: '#9CA3AF' }
                        }}
                    />
                    <YAxis
                        type="number"
                        dataKey="ivb"
                        domain={['dataMin - 2', 'dataMax + 2']}
                        stroke="#9CA3AF"
                        label={{
                            value: 'Induced Vertical Break (inches)',
                            angle: -90,
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: '#9CA3AF' }
                        }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Scatter data={scatterData}>
                        {scatterData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {Object.entries(pitchData).map(([pitchType, _]) => (
                    <div key={pitchType} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: PITCH_COLORS[pitchType] || '#666' }}
                        />
                        <span className="text-sm text-gray-300">{pitchType}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PitchMovementChart;
