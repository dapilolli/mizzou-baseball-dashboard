import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';

interface DrillProgress {
    date: string;
    reps?: number;
    swings?: number;
    pitches?: number;
    successRate: number;
    notes?: string;
}

interface DrillTarget {
    id: string;
    title: string;
    description: string;
    detailed_instructions?: string;
    category: string;
    developmentArea: string;
    tier: 'Development' | 'Solid' | 'Elite' | 'All';
    player_type?: 'hitter' | 'pitcher' | 'both';
    equipment_needed?: string;
    duration_minutes?: number;
    weeklyTarget: {
        reps?: number;
        swings?: number;
        pitches?: number;
        minSuccessRate: number;
        frequency: number; // days per week
    };
    metrics_tracked?: string;
    progressHistory: DrillProgress[];
}

interface RoutineItem {
    id: string;
    title: string;
    description: string;
    category: 'pre-practice' | 'practice' | 'post-practice' | 'recovery';
    duration: number; // minutes
    completed: boolean;
    completedDate?: string;
    priority: 'high' | 'medium' | 'low';
}

interface PersonalizedTrainingPlan {
    playerName: string;
    playerType: 'hitter' | 'pitcher';
    tier: 'Development' | 'Solid' | 'Elite';
    primaryDevelopmentAreas: string[];
    drills: DrillTarget[];
    dailyRoutines: RoutineItem[];
    weeklyGoals: string[];
}

interface PlayerProfile {
    name: string;
    position: string;
    year: string;
    status: string;
    identity: string;
    type: 'hitter' | 'pitcher';
}

interface MetricTarget {
    name: string;
    current: number;
    target: number;
    tier: 'Development' | 'Solid' | 'Elite';
    trend: number[]; // Simple trend data
    unit?: string;
}

interface Goal {
    id: string;
    description: string;
    current: number;
    target: number;
    progress: number;
    lastUpdated: string;
    completed: boolean;
}

interface PDPDashboardProps {
    playerName: string;
    playerType: 'hitter' | 'pitcher';
}

const PDPDashboard: React.FC<PDPDashboardProps> = ({ playerName, playerType }) => {
    console.log('=== PDPDashboard Component Rendering ===');
    console.log('Player Name:', playerName);
    console.log('Player Type:', playerType);

    const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
    const [metrics, setMetrics] = useState<MetricTarget[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [coachNotes, setCoachNotes] = useState({ strengths: '', weaknesses: '', lastUpdated: '' });
    const [activeTab, setActiveTab] = useState('overview');

    const [loading, setLoading] = useState(true);
    const [selectedDrill, setSelectedDrill] = useState<any>(null);
    const [drillLogData, setDrillLogData] = useState<{ [key: string]: any }>({});
    const [drillTargets, setDrillTargets] = useState<{ [key: string]: DrillTarget }>({});
    const [showProgressChart, setShowProgressChart] = useState<string | null>(null);
    const [dailyRoutines, setDailyRoutines] = useState<RoutineItem[]>([]);
    const [playerTier, setPlayerTier] = useState<'Development' | 'Solid' | 'Elite'>('Development');

    // Debug activeTab changes
    useEffect(() => {
        console.log('Active tab changed to:', activeTab);
        if (activeTab === 'training') {
            console.log('Training tab selected - checking data...');
            console.log('drillTargets:', drillTargets);
            console.log('dailyRoutines:', dailyRoutines);
        }
    }, [activeTab, drillTargets, dailyRoutines]);

    // Progress Chart Component
    const renderDrillProgressChart = (drillId: string, drillTitle: string) => {
        const target = drillTargets[drillId];
        if (!target || !target.progressHistory.length) {
            return (
                <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-center">No progress data available yet</p>
                </div>
            );
        }

        const last7Days = target.progressHistory.slice(-7);

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">{drillTitle} - Progress Tracking</h3>
                        <button
                            onClick={() => setShowProgressChart(null)}
                            className="text-gray-400 hover:text-gray-600 text-xl"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Weekly Target vs Actual */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-3">Weekly Targets</h4>
                            <div className="space-y-2 text-sm">
                                {target.weeklyTarget.reps && (
                                    <div className="flex justify-between">
                                        <span>Reps per session:</span>
                                        <span className="font-medium">{target.weeklyTarget.reps}</span>
                                    </div>
                                )}
                                {target.weeklyTarget.swings && (
                                    <div className="flex justify-between">
                                        <span>Swings per session:</span>
                                        <span className="font-medium">{target.weeklyTarget.swings}</span>
                                    </div>
                                )}
                                {target.weeklyTarget.pitches && (
                                    <div className="flex justify-between">
                                        <span>Pitches per session:</span>
                                        <span className="font-medium">{target.weeklyTarget.pitches}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Min Success Rate:</span>
                                    <span className="font-medium">{target.weeklyTarget.minSuccessRate}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Frequency:</span>
                                    <span className="font-medium">{target.weeklyTarget.frequency}x per week</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-3">This Week's Progress</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Sessions completed:</span>
                                    <span className="font-medium">{last7Days.length} / {target.weeklyTarget.frequency}</span>
                                </div>
                                {last7Days.length > 0 && (
                                    <>
                                        <div className="flex justify-between">
                                            <span>Avg Success Rate:</span>
                                            <span className="font-medium">
                                                {(last7Days.reduce((sum, day) => sum + day.successRate, 0) / last7Days.length).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Total Volume:</span>
                                            <span className="font-medium">
                                                {last7Days.reduce((sum, day) => sum + (day.reps || day.swings || day.pitches || 0), 0)}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Success Rate Trend */}
                    <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 mb-3">Success Rate Trend (Last 7 Sessions)</h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={last7Days}>
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    formatter={(value: any) => [`${value}%`, 'Success Rate']}
                                    labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="successRate"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    dot={{ r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey={() => target.weeklyTarget.minSuccessRate}
                                    stroke="#EF4444"
                                    strokeDasharray="5 5"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Target"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Volume Tracking */}
                    {(target.weeklyTarget.reps || target.weeklyTarget.swings || target.weeklyTarget.pitches) && (
                        <div className="mb-6">
                            <h4 className="font-semibold text-gray-800 mb-3">Volume Tracking</h4>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={last7Days}>
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: any, name: string) => [value, name]}
                                        labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                                    />
                                    {target.weeklyTarget.reps && (
                                        <Bar dataKey="reps" fill="#3B82F6" name="Reps" />
                                    )}
                                    {target.weeklyTarget.swings && (
                                        <Bar dataKey="swings" fill="#10B981" name="Swings" />
                                    )}
                                    {target.weeklyTarget.pitches && (
                                        <Bar dataKey="pitches" fill="#F59E0B" name="Pitches" />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Recent Notes */}
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Recent Session Notes</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {last7Days.filter(day => day.notes).map((day, idx) => (
                                <div key={idx} className="bg-gray-50 p-3 rounded text-sm">
                                    <div className="font-medium text-gray-700">
                                        {new Date(day.date).toLocaleDateString()}
                                    </div>
                                    <div className="text-gray-600">{day.notes}</div>
                                </div>
                            ))}
                            {!last7Days.some(day => day.notes) && (
                                <p className="text-gray-500 text-center py-4">No notes recorded yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Fetch personalized drills from backend
    const fetchPersonalizedDrills = async (playerName: string) => {
        try {
            console.log('Fetching personalized drills for:', playerName);
            const response = await fetch(`http://localhost:8000/pdp/${playerName}/personalized-drills`);
            console.log('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Drills data received:', data);
                return data.drills;
            } else {
                console.error('Failed to fetch personalized drills, status:', response.status);
                return {};
            }
        } catch (error) {
            console.error('Error fetching personalized drills:', error);
            return {};
        }
    };

    // Generate personalized training plan based on player tier and weaknesses
    const generatePersonalizedTrainingPlan = (playerType: 'hitter' | 'pitcher', tier: 'Development' | 'Solid' | 'Elite', playerName: string) => {
        if (playerType === 'pitcher') {
            const pitcherPlans = {
                'Development': {
                    'fastball-command': {
                        id: 'fastball-command',
                        title: 'Fastball Command Development',
                        description: 'Focus on hitting corners consistently with fastball',
                        category: 'Command',
                        developmentArea: 'Strike Zone Command',
                        tier: 'Development' as const,
                        weeklyTarget: { pitches: 30, minSuccessRate: 65, frequency: 5 },
                        progressHistory: []
                    },
                    'basic-mechanics': {
                        id: 'basic-mechanics',
                        title: 'Basic Delivery Mechanics',
                        description: 'Establish consistent delivery patterns and balance',
                        category: 'Mechanics',
                        developmentArea: 'Delivery Consistency',
                        tier: 'Development' as const,
                        weeklyTarget: { reps: 50, minSuccessRate: 80, frequency: 5 },
                        progressHistory: []
                    },
                    'secondary-development': {
                        id: 'secondary-development',
                        title: 'Secondary Pitch Introduction',
                        description: 'Develop basic changeup or breaking ball feel',
                        category: 'Pitch Development',
                        developmentArea: 'Pitch Arsenal',
                        tier: 'Development' as const,
                        weeklyTarget: { pitches: 20, minSuccessRate: 50, frequency: 3 },
                        progressHistory: []
                    }
                },
                'Solid': {
                    'command-refinement': {
                        id: 'command-refinement',
                        title: 'Advanced Strike Zone Command',
                        description: 'Refine ability to hit specific zones under pressure',
                        category: 'Command',
                        developmentArea: 'Situational Pitching',
                        tier: 'Solid' as const,
                        weeklyTarget: { pitches: 25, minSuccessRate: 75, frequency: 4 },
                        progressHistory: []
                    },
                    'secondary-mastery': {
                        id: 'secondary-mastery',
                        title: 'Secondary Pitch Mastery',
                        description: 'Develop plus changeup/breaking ball with consistent command',
                        category: 'Pitch Development',
                        developmentArea: 'Pitch Quality',
                        tier: 'Solid' as const,
                        weeklyTarget: { pitches: 30, minSuccessRate: 70, frequency: 4 },
                        progressHistory: []
                    },
                    'game-situation': {
                        id: 'game-situation',
                        title: 'Game Situation Training',
                        description: 'Practice pitching with runners on base and pressure situations',
                        category: 'Mental',
                        developmentArea: 'Situational Awareness',
                        tier: 'Solid' as const,
                        weeklyTarget: { reps: 15, minSuccessRate: 80, frequency: 3 },
                        progressHistory: []
                    }
                },
                'Elite': {
                    'pitch-sequencing': {
                        id: 'pitch-sequencing',
                        title: 'Advanced Pitch Sequencing',
                        description: 'Master the art of setting up hitters and changing eye levels',
                        category: 'Strategy',
                        developmentArea: 'Pitch Sequencing',
                        tier: 'Elite' as const,
                        weeklyTarget: { reps: 20, minSuccessRate: 85, frequency: 4 },
                        progressHistory: []
                    },
                    'elite-command': {
                        id: 'elite-command',
                        title: 'Elite Level Command',
                        description: 'Paint corners consistently in high-leverage situations',
                        category: 'Command',
                        developmentArea: 'Precision Control',
                        tier: 'Elite' as const,
                        weeklyTarget: { pitches: 20, minSuccessRate: 85, frequency: 4 },
                        progressHistory: []
                    },
                    'velocity-development': {
                        id: 'velocity-development',
                        title: 'Velocity Enhancement',
                        description: 'Increase fastball velocity while maintaining command',
                        category: 'Physical',
                        developmentArea: 'Power Development',
                        tier: 'Elite' as const,
                        weeklyTarget: { reps: 25, minSuccessRate: 80, frequency: 3 },
                        progressHistory: []
                    }
                }
            };
            return pitcherPlans[tier];
        } else {
            const hitterPlans = {
                'Development': {
                    'contact-development': {
                        id: 'contact-development',
                        title: 'Basic Contact Development',
                        description: 'Focus on making consistent contact and barrel awareness',
                        category: 'Contact',
                        developmentArea: 'Contact Quality',
                        tier: 'Development' as const,
                        weeklyTarget: { swings: 75, minSuccessRate: 70, frequency: 5 },
                        progressHistory: []
                    },
                    'pitch-recognition': {
                        id: 'pitch-recognition',
                        title: 'Basic Pitch Recognition',
                        description: 'Learn to identify fastball vs off-speed early',
                        category: 'Recognition',
                        developmentArea: 'Pitch Recognition',
                        tier: 'Development' as const,
                        weeklyTarget: { reps: 50, minSuccessRate: 65, frequency: 4 },
                        progressHistory: []
                    },
                    'mechanics-foundation': {
                        id: 'mechanics-foundation',
                        title: 'Swing Mechanics Foundation',
                        description: 'Establish proper swing path and timing',
                        category: 'Mechanics',
                        developmentArea: 'Swing Mechanics',
                        tier: 'Development' as const,
                        weeklyTarget: { swings: 60, minSuccessRate: 75, frequency: 5 },
                        progressHistory: []
                    }
                },
                'Solid': {
                    'power-development': {
                        id: 'power-development',
                        title: 'Power Development Training',
                        description: 'Increase exit velocity and launch angle optimization',
                        category: 'Power',
                        developmentArea: 'Power Development',
                        tier: 'Solid' as const,
                        weeklyTarget: { swings: 50, minSuccessRate: 75, frequency: 4 },
                        progressHistory: []
                    },
                    'advanced-recognition': {
                        id: 'advanced-recognition',
                        title: 'Advanced Pitch Recognition',
                        description: 'Identify spin, location, and sequencing patterns',
                        category: 'Recognition',
                        developmentArea: 'Advanced Recognition',
                        tier: 'Solid' as const,
                        weeklyTarget: { reps: 40, minSuccessRate: 80, frequency: 4 },
                        progressHistory: []
                    },
                    'situational-hitting': {
                        id: 'situational-hitting',
                        title: 'Situational Hitting',
                        description: 'Two-strike approach, RISP situations, and clutch hitting',
                        category: 'Situational',
                        developmentArea: 'Game Situations',
                        tier: 'Solid' as const,
                        weeklyTarget: { reps: 30, minSuccessRate: 75, frequency: 3 },
                        progressHistory: []
                    }
                },
                'Elite': {
                    'elite-power': {
                        id: 'elite-power',
                        title: 'Elite Power Training',
                        description: 'Maximize exit velocity and optimize launch angle for home runs',
                        category: 'Power',
                        developmentArea: 'Elite Power',
                        tier: 'Elite' as const,
                        weeklyTarget: { swings: 40, minSuccessRate: 85, frequency: 4 },
                        progressHistory: []
                    },
                    'advanced-approach': {
                        id: 'advanced-approach',
                        title: 'Advanced Hitting Approach',
                        description: 'Master count leveraging and pitcher pattern recognition',
                        category: 'Mental',
                        developmentArea: 'Advanced Approach',
                        tier: 'Elite' as const,
                        weeklyTarget: { reps: 25, minSuccessRate: 85, frequency: 3 },
                        progressHistory: []
                    },
                    'velocity-adjustment': {
                        id: 'velocity-adjustment',
                        title: 'Elite Velocity Adjustment',
                        description: 'Handle high velocity and maintain timing vs elite pitching',
                        category: 'Timing',
                        developmentArea: 'Velocity Adjustment',
                        tier: 'Elite' as const,
                        weeklyTarget: { swings: 35, minSuccessRate: 80, frequency: 4 },
                        progressHistory: []
                    }
                }
            };
            return hitterPlans[tier];
        }
    };

    // Generate personalized daily routines
    const generateDailyRoutines = (playerType: 'hitter' | 'pitcher', tier: 'Development' | 'Solid' | 'Elite') => {
        const baseRoutines = playerType === 'pitcher' ? [
            {
                id: 'arm-care',
                title: 'Arm Care Routine',
                description: 'Band work, stretching, and strengthening exercises',
                category: 'pre-practice' as const,
                duration: 15,
                completed: false,
                priority: 'high' as const
            },
            {
                id: 'long-toss',
                title: 'Progressive Long Toss',
                description: 'Build arm strength and prepare for throwing',
                category: 'pre-practice' as const,
                duration: 20,
                completed: false,
                priority: 'high' as const
            },
            {
                id: 'bullpen-prep',
                title: 'Bullpen Preparation',
                description: 'Mental preparation and visualization before throwing',
                category: 'practice' as const,
                duration: 10,
                completed: false,
                priority: 'medium' as const
            },
            {
                id: 'recovery-routine',
                title: 'Post-Throw Recovery',
                description: 'Ice, stretching, and recovery protocols',
                category: 'post-practice' as const,
                duration: 15,
                completed: false,
                priority: 'high' as const
            }
        ] : [
            {
                id: 'dynamic-warmup',
                title: 'Dynamic Warm-up',
                description: 'Movement prep and activation exercises',
                category: 'pre-practice' as const,
                duration: 10,
                completed: false,
                priority: 'high' as const
            },
            {
                id: 'tee-work',
                title: 'Daily Hitting Routine',
                description: 'Fundamental swing mechanics and timing',
                category: 'practice' as const,
                duration: 15,
                completed: false,
                priority: 'high' as const
            },
            {
                id: 'vision-training',
                title: 'Vision/Tracking Drills',
                description: 'Eye tracking and pitch recognition work',
                category: 'practice' as const,
                duration: 10,
                completed: false,
                priority: 'medium' as const
            },
            {
                id: 'recovery-routine',
                title: 'Recovery and Mobility',
                description: 'Stretching and recovery protocols',
                category: 'post-practice' as const,
                duration: 10,
                completed: false,
                priority: 'medium' as const
            }
        ];

        // Add tier-specific routines
        if (tier === 'Elite') {
            baseRoutines.push({
                id: 'mental-prep',
                title: 'Mental Preparation',
                description: 'Visualization and mental game exercises',
                category: 'pre-practice' as const,
                duration: 10,
                completed: false,
                priority: 'high' as const
            });
        }

        return baseRoutines;
    };

    // Initialize drill targets and load existing logs
    useEffect(() => {
        if (playerType && playerName) {
            // First, fetch player's tier from the backend and personalized drills
            Promise.all([
                fetch(`http://localhost:8000/pdp/${playerName}/dashboard`),
                fetchPersonalizedDrills(playerName)
            ])
                .then(([dashboardResponse, personalizedDrills]) => {
                    return Promise.all([
                        dashboardResponse.json(),
                        Promise.resolve(personalizedDrills)
                    ]);
                })
                .then(([dashboardData, personalizedDrills]) => {
                    // Extract tier from dashboard data or default to Development
                    const playerTier = dashboardData.profile?.tier || 'Development';
                    setPlayerTier(playerTier);

                    // Use personalized drills from backend
                    setDrillTargets(personalizedDrills);

                    // Generate personalized daily routines
                    const routines = generateDailyRoutines(playerType, playerTier);
                    setDailyRoutines(routines);

                    // Load existing drill logs from backend
                    return fetch(`http://localhost:8000/pdp/${playerName}/drill-logs`);
                })
                .then(response => response.json())
                .then(data => {
                    if (data.drill_logs) {
                        // Update drill targets with historical data
                        setDrillTargets(prev => {
                            const updatedTargets = { ...prev };
                            Object.keys(data.drill_logs).forEach(drillId => {
                                if (updatedTargets[drillId]) {
                                    updatedTargets[drillId].progressHistory = data.drill_logs[drillId].sessions.map((session: any) => ({
                                        date: session.date,
                                        reps: session.reps,
                                        swings: session.swings,
                                        pitches: session.pitches,
                                        successRate: session.successRate,
                                        notes: session.notes
                                    }));
                                }
                            });
                            return updatedTargets;
                        });

                        // Update most recent drill log data for display
                        const recentLogs: { [key: string]: any } = {};
                        Object.keys(data.drill_logs).forEach(drillId => {
                            const sessions = data.drill_logs[drillId].sessions;
                            if (sessions.length > 0) {
                                recentLogs[drillId] = sessions[sessions.length - 1];
                            }
                        });
                        setDrillLogData(recentLogs);
                    }
                })
                .catch(async error => {
                    console.log('No existing drill logs found or error loading:', error);
                    // Still set up basic personalized plan even if no historical data
                    const defaultTier = 'Development';
                    setPlayerTier(defaultTier);

                    // Try to fetch personalized drills even if dashboard failed
                    const personalizedDrills = await fetchPersonalizedDrills(playerName);
                    if (Object.keys(personalizedDrills).length > 0) {
                        setDrillTargets(personalizedDrills);
                    } else {
                        // Fallback to hardcoded drills if backend fails
                        const fallbackDrills = generatePersonalizedTrainingPlan(playerType, defaultTier, playerName);
                        setDrillTargets(fallbackDrills);
                    }

                    const routines = generateDailyRoutines(playerType, defaultTier);
                    setDailyRoutines(routines);
                });
        }
    }, [playerType, playerName]);

    // Routine completion handlers
    const handleRoutineToggle = (routineId: string) => {
        setDailyRoutines(prev => prev.map(routine =>
            routine.id === routineId
                ? {
                    ...routine,
                    completed: !routine.completed,
                    completedDate: !routine.completed ? new Date().toISOString().split('T')[0] : undefined
                }
                : routine
        ));
    };

    const resetDailyRoutines = () => {
        setDailyRoutines(prev => prev.map(routine => ({
            ...routine,
            completed: false,
            completedDate: undefined
        })));
    };

    // Drill logging functions
    const handleDrillClick = (drill: any) => {
        setSelectedDrill(drill);
    };

    const handleDrillLogSubmit = async (drillId: string, logData: any) => {
        try {
            // Save to backend
            const response = await fetch(`http://localhost:8000/pdp/${playerName}/drill-log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    drill_id: drillId,
                    player_name: playerName,
                    player_type: playerType,
                    ...logData
                })
            });

            if (response.ok) {
                // Update local state
                setDrillLogData(prev => ({
                    ...prev,
                    [drillId]: logData
                }));

                // Update drill progress history
                setDrillTargets(prev => ({
                    ...prev,
                    [drillId]: {
                        ...prev[drillId],
                        progressHistory: [
                            ...prev[drillId].progressHistory,
                            {
                                date: logData.date,
                                reps: logData.reps,
                                swings: logData.swings,
                                pitches: logData.pitches,
                                successRate: logData.successRate,
                                notes: logData.notes
                            }
                        ]
                    }
                }));

                setSelectedDrill(null);
                console.log('Drill log saved successfully:', { drillId, logData });
            } else {
                console.error('Failed to save drill log');
                // Still update local state as fallback
                setDrillLogData(prev => ({
                    ...prev,
                    [drillId]: logData
                }));
                setSelectedDrill(null);
            }
        } catch (error) {
            console.error('Error saving drill log:', error);
            // Fallback to local storage
            setDrillLogData(prev => ({
                ...prev,
                [drillId]: logData
            }));
            setSelectedDrill(null);
        }
    };

    const renderDrillLogModal = () => {
        if (!selectedDrill) return null;

        const currentLog = drillLogData[selectedDrill.id] || {};

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{selectedDrill.title}</h3>
                        <button
                            onClick={() => setSelectedDrill(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{selectedDrill.description}</p>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target as HTMLFormElement);
                        const logData = {
                            reps: parseInt(formData.get('reps') as string) || 0,
                            swings: parseInt(formData.get('swings') as string) || 0,
                            pitches: parseInt(formData.get('pitches') as string) || 0,
                            successRate: parseFloat(formData.get('successRate') as string) || 0,
                            notes: formData.get('notes') as string || '',
                            date: new Date().toISOString().split('T')[0]
                        };
                        handleDrillLogSubmit(selectedDrill.id, logData);
                    }}>
                        <div className="space-y-4">
                            {selectedDrill.metrics.includes('reps') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reps Completed
                                    </label>
                                    <input
                                        type="number"
                                        name="reps"
                                        defaultValue={currentLog.reps || ''}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., 50"
                                    />
                                </div>
                            )}

                            {selectedDrill.metrics.includes('swings') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Swings Taken
                                    </label>
                                    <input
                                        type="number"
                                        name="swings"
                                        defaultValue={currentLog.swings || ''}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., 50"
                                    />
                                </div>
                            )}

                            {selectedDrill.metrics.includes('pitches') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pitches Thrown
                                    </label>
                                    <input
                                        type="number"
                                        name="pitches"
                                        defaultValue={currentLog.pitches || ''}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., 25"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Success Rate (%)
                                </label>
                                <input
                                    type="number"
                                    name="successRate"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    defaultValue={currentLog.successRate || ''}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., 85.5"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    name="notes"
                                    defaultValue={currentLog.notes || ''}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="How did it feel? Any observations..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setSelectedDrill(null)}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Save Log
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // Helper functions
    const determinePosition = (name: string): string => {
        // Could be enhanced with real position data
        return 'RHP';
    };

    const getPlayerStatus = (name: string, type: 'hitter' | 'pitcher'): string => {
        if (type === 'pitcher') {
            return 'Working on command consistency, cleared to pitch at 100%';
        }
        return 'Healthy, cleared for full activity';
    };

    const getPlayerIdentity = (name: string, type: 'hitter' | 'pitcher'): string => {
        if (type === 'pitcher') {
            return 'Command-first pitcher';
        }
        return 'Contact-first hitter';
    };

    const loadPlayerMetrics = async (name: string, type: 'hitter' | 'pitcher'): Promise<MetricTarget[]> => {
        // Enhanced pitcher metrics
        if (type === 'pitcher') {
            return [
                { name: 'ERA', current: 4.50, target: 3.50, tier: 'Development', trend: [5.2, 4.8, 4.6, 4.5] },
                { name: 'K%-BB%', current: 15.2, target: 18.0, tier: 'Solid', trend: [12, 13.5, 14.8, 15.2], unit: '%' },
                { name: 'CSW%', current: 28.5, target: 32.0, tier: 'Development', trend: [26, 27, 28, 28.5], unit: '%' },
                { name: 'FPStk%', current: 58.2, target: 65.0, tier: 'Development', trend: [55, 56.5, 57.8, 58.2], unit: '%' },
                { name: 'Chase%', current: 31.2, target: 35.0, tier: 'Solid', trend: [29, 30, 30.5, 31.2], unit: '%' },
                { name: 'HardHit%', current: 42.0, target: 35.0, tier: 'Development', trend: [45, 44, 43, 42], unit: '%' },
                { name: 'Barrel%', current: 8.5, target: 6.0, tier: 'Development', trend: [10, 9.5, 9, 8.5], unit: '%' }
            ];
        }

        // Enhanced hitter metrics
        return [
            { name: 'Miss% vs FB', current: 26.4, target: 20.0, tier: 'Development', trend: [28, 27, 26.5, 26.4], unit: '%' },
            { name: 'Miss% vs Spin', current: 24.6, target: 20.0, tier: 'Elite', trend: [26, 25.5, 25, 24.6], unit: '%' },
            { name: 'Miss% vs CH', current: 35.7, target: 35.0, tier: 'Development', trend: [40, 38, 36, 35.7], unit: '%' },
            { name: 'HardHit%', current: 33.0, target: 35.0, tier: 'Development', trend: [30, 31, 32, 33], unit: '%' },
            { name: 'Barrel%', current: 21.3, target: 25.0, tier: 'Elite', trend: [19, 20, 21, 21.3], unit: '%' },
            { name: 'OPS', current: 0.750, target: 0.850, tier: 'Solid', trend: [0.720, 0.735, 0.745, 0.750] }
        ];
    };

    // Load real data from backend
    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);

            try {
                // Fetch dashboard data from backend
                const dashboardRes = await fetch(`http://localhost:8000/pdp/${playerName}/dashboard`);

                if (dashboardRes.ok) {
                    const dashboardData = await dashboardRes.json();

                    setPlayerProfile(dashboardData.profile);
                    setMetrics(dashboardData.metrics);
                    setGoals(dashboardData.goals);
                    setCoachNotes(dashboardData.coach_notes);
                } else {
                    // Fallback to mock data if backend fails
                    await loadMockData();
                }

            } catch (error) {
                console.error('Error loading dashboard data:', error);
                // Fallback to mock data
                await loadMockData();
            }

            setLoading(false);
        };

        const loadMockData = async () => {
            // Function to randomly assign player identity based on type
            const getPlayerIdentity = (type: 'hitter' | 'pitcher', name: string) => {
                // Use player name to create consistent but varied identities
                const nameHash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

                if (type === 'hitter') {
                    const hitterTypes = [
                        'Contact-first hitter',
                        'Power-first hitter',
                        'Speed-first hitter',
                        'Gap-to-gap hitter',
                        'Table-setter'
                    ];
                    return hitterTypes[nameHash % hitterTypes.length];
                } else {
                    const pitcherTypes = [
                        'Command-first pitcher',
                        'Velocity-first pitcher',
                        'Movement-first pitcher',
                        'Strike-thrower',
                        'Power pitcher'
                    ];
                    return pitcherTypes[nameHash % pitcherTypes.length];
                }
            };

            // Enhanced mock data based on player type
            const mockProfile: PlayerProfile = {
                name: playerName,
                position: playerType === 'hitter' ? 'INF/OF' : 'RHP',
                year: 'Jr.',
                status: playerType === 'hitter' ? 'Healthy, cleared for full activity' : 'Working on command, cleared to pitch at 100%',
                identity: getPlayerIdentity(playerType, playerName),
                type: playerType
            };

            // Generate metrics based on player identity
            const generateMetrics = (identity: string, type: 'hitter' | 'pitcher') => {
                const nameHash = playerName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

                if (type === 'hitter') {
                    const baseMetrics = [
                        { name: 'Miss% vs FB', base: 26, range: 8, target: 20.0, tier: 'Development', unit: '%' },
                        { name: 'Miss% vs CH', base: 35, range: 10, target: 35.0, tier: 'Development', unit: '%' },
                        { name: 'HardHit%', base: 33, range: 8, target: 35.0, tier: 'Development', unit: '%' },
                        { name: 'Barrel%', base: 21, range: 6, target: 25.0, tier: 'Elite', unit: '%' },
                        { name: 'OPS', base: 0.750, range: 0.200, target: 0.850, tier: 'Solid', unit: '' }
                    ];

                    // Adjust metrics based on identity
                    if (identity.includes('Power-first')) {
                        baseMetrics[2].base += 5; // Higher HardHit%
                        baseMetrics[3].base += 3; // Higher Barrel%
                        baseMetrics[0].base += 3; // Slightly more misses vs FB
                    } else if (identity.includes('Contact-first')) {
                        baseMetrics[0].base -= 4; // Lower miss rates
                        baseMetrics[1].base -= 3;
                        baseMetrics[2].base -= 2; // Lower HardHit%
                    } else if (identity.includes('Speed-first')) {
                        baseMetrics[4].base -= 0.050; // Lower OPS
                        baseMetrics[0].base -= 2; // Better contact
                    }

                    return baseMetrics.map(metric => {
                        const variance = (nameHash % 100) / 100 - 0.5; // -0.5 to 0.5
                        const current = metric.base + (variance * metric.range);
                        const trend = [current * 1.1, current * 1.05, current * 1.02, current];

                        return {
                            name: metric.name,
                            current: parseFloat(current.toFixed(metric.unit === '%' ? 1 : 3)),
                            target: metric.target,
                            tier: metric.tier as 'Development' | 'Elite' | 'Solid',
                            trend: trend.map(t => parseFloat(t.toFixed(metric.unit === '%' ? 1 : 3))),
                            unit: metric.unit
                        };
                    });
                } else {
                    const baseMetrics = [
                        { name: 'ERA', base: 4.5, range: 2.0, target: 3.50, tier: 'Development', unit: '' },
                        { name: 'K%-BB%', base: 15, range: 8, target: 18.0, tier: 'Solid', unit: '%' },
                        { name: 'CSW%', base: 28, range: 6, target: 32.0, tier: 'Development', unit: '%' },
                        { name: 'Chase%', base: 31, range: 8, target: 35.0, tier: 'Solid', unit: '%' },
                        { name: 'HardHit%', base: 42, range: 10, target: 35.0, tier: 'Development', unit: '%' }
                    ];

                    // Adjust metrics based on identity
                    if (identity.includes('Command-first')) {
                        baseMetrics[0].base -= 0.5; // Better ERA
                        baseMetrics[1].base += 2; // Better K%-BB%
                        baseMetrics[2].base += 2; // Better CSW%
                    } else if (identity.includes('Velocity-first')) {
                        baseMetrics[1].base += 3; // Higher strikeout differential
                        baseMetrics[4].base += 3; // More hard contact allowed
                    } else if (identity.includes('Movement-first')) {
                        baseMetrics[3].base += 3; // Better chase rate
                        baseMetrics[4].base -= 3; // Less hard contact
                    }

                    return baseMetrics.map(metric => {
                        const variance = (nameHash % 100) / 100 - 0.5;
                        const current = metric.base + (variance * metric.range);
                        const trend = [current * 1.1, current * 1.05, current * 1.02, current];

                        return {
                            name: metric.name,
                            current: parseFloat(current.toFixed(metric.name === 'ERA' ? 2 : 1)),
                            target: metric.target,
                            tier: metric.tier as 'Development' | 'Elite' | 'Solid',
                            trend: trend.map(t => parseFloat(t.toFixed(metric.name === 'ERA' ? 2 : 1))),
                            unit: metric.unit
                        };
                    });
                }
            };

            const mockMetrics: MetricTarget[] = generateMetrics(mockProfile.identity, playerType);

            const mockGoals: Goal[] = playerType === 'pitcher' ? [
                {
                    id: '1',
                    description: 'ERA: lower from 4.50 to ≤ 3.50',
                    current: 4.50,
                    target: 3.50,
                    progress: 35,
                    lastUpdated: '2025-08-08',
                    completed: false
                },
                {
                    id: '2',
                    description: 'CSW%: increase from 28.5% to ≥ 32.0%',
                    current: 28.5,
                    target: 32.0,
                    progress: 65,
                    lastUpdated: '2025-08-08',
                    completed: false
                },
                {
                    id: '3',
                    description: 'HardHit%: reduce from 42.0% to ≤ 35.0%',
                    current: 42.0,
                    target: 35.0,
                    progress: 45,
                    lastUpdated: '2025-08-08',
                    completed: false
                }
            ] : [
                {
                    id: '1',
                    description: 'Miss% vs FB: move from 26.4% to ≤ 20.0%',
                    current: 26.4,
                    target: 20.0,
                    progress: 45,
                    lastUpdated: '2025-08-08',
                    completed: false
                },
                {
                    id: '2',
                    description: 'HardHit%: move from 33.0% to ≥ 35.0%',
                    current: 33.0,
                    target: 35.0,
                    progress: 75,
                    lastUpdated: '2025-08-08',
                    completed: false
                },
                {
                    id: '3',
                    description: 'Miss% vs CH: move from 35.7% to ≤ 35.0%',
                    current: 35.7,
                    target: 35.0,
                    progress: 85,
                    lastUpdated: '2025-08-08',
                    completed: false
                }
            ];

            setPlayerProfile(mockProfile);
            const metrics = await loadPlayerMetrics(playerName, playerType);
            setMetrics(metrics);
            setGoals(mockGoals);
            setCoachNotes({
                strengths: playerType === 'pitcher'
                    ? 'Good fastball command, consistent delivery, improved stamina'
                    : 'Excellent plate discipline, consistent contact, good base running instincts',
                weaknesses: playerType === 'pitcher'
                    ? 'Needs to develop secondary pitches, struggles with command in high-stress situations'
                    : 'Struggles with velocity, needs to improve lower half engagement',
                lastUpdated: '2025-08-08'
            });
            setLoading(false);
        };

        loadDashboardData();
    }, [playerName, playerType]);

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'Elite': return 'bg-green-500';
            case 'Solid': return 'bg-yellow-500';
            case 'Development': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'bg-green-500';
        if (progress >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    // Early return for loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-white text-lg">Loading dashboard...</div>
            </div>
        );
    }

    const MetricCard = ({ metric }: { metric: MetricTarget }) => (
        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">{metric.name}</h4>
                <div className={`w-3 h-3 rounded-full ${getTierColor(metric.tier)}`} title={metric.tier}></div>
            </div>

            <div className="flex items-center justify-between mb-3">
                <div>
                    <span className="text-2xl font-bold text-gray-900">
                        {metric.current}
                        {metric.unit}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                        / {metric.target}{metric.unit}
                    </span>
                </div>
            </div>

            {/* Mini trend chart */}
            <div className="h-12 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metric.trend.map((val, idx) => ({ value: val, index: idx }))}>
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    const GoalCard = ({ goal }: { goal: Goal }) => (
        <div className="bg-white rounded-lg shadow-md p-4 mb-3">
            <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium text-gray-800">{goal.description}</p>
                <span className="text-xs text-gray-500">{goal.lastUpdated}</span>
            </div>

            <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full ${getProgressColor(goal.progress)}`}
                        style={{ width: `${goal.progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                    Current: {goal.current} → Target: {goal.target}
                </span>
                {!goal.completed && (
                    <button className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                        Mark Complete
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header with Player Overview */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-600">
                                {playerProfile?.name.split(' ').map(n => n[0]).join('')}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{playerProfile?.name}</h1>
                            <p className="text-gray-600">{playerProfile?.position} • {playerProfile?.year}</p>
                            <p className="text-sm text-gray-500">{playerProfile?.status}</p>
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                                {playerProfile?.identity}
                            </span>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-sm text-gray-500">Next PDP Review</p>
                        <p className="text-lg font-semibold text-gray-900">14 days</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow-md mb-6">
                <div className="flex border-b">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'goals', label: 'Goals & Progress' },
                        { id: 'training', label: 'Training Plan' },
                        { id: 'logs', label: 'Session Logs' },
                        { id: 'communication', label: 'Communication' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 font-medium ${activeTab === tab.id
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Metrics Snapshot */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Objective Metrics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {metrics.map((metric, idx) => (
                                    <MetricCard key={idx} metric={metric} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Coach Notes & Quick Goals */}
                    <div className="space-y-6">
                        {/* Coach Evaluation */}
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">Coach Evaluation</h3>
                                <button className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                                    Edit
                                </button>
                            </div>

                            <div className="mb-3">
                                <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                                <p className="text-sm text-gray-700">{coachNotes.strengths}</p>
                            </div>

                            <div className="mb-3">
                                <h4 className="font-medium text-red-700 mb-2">Areas for Improvement</h4>
                                <p className="text-sm text-gray-700">{coachNotes.weaknesses}</p>
                            </div>

                            <p className="text-xs text-gray-500">Last updated: {coachNotes.lastUpdated}</p>
                        </div>

                        {/* Quick Goals Preview */}
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Goals</h3>
                            {goals.slice(0, 2).map(goal => (
                                <GoalCard key={goal.id} goal={goal} />
                            ))}
                            <button className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-2">
                                View All Goals →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'goals' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Development Goals & Progress</h2>
                        <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                            + New Goal
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {goals.map(goal => (
                            <GoalCard key={goal.id} goal={goal} />
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'training' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Training Plan</h2>
                            <p className="text-sm text-gray-600">
                                {playerName} - {playerTier} Level {playerType === 'hitter' ? 'Hitter' : 'Pitcher'}
                            </p>
                        </div>
                        <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                            Week {new Date().toISOString().slice(0, 10)}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Today's Pre-Practice Drills */}
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-3">Today's Pre-Practice Drills</h3>
                            <div className="space-y-2">
                                {dailyRoutines.length === 0 ? (
                                    <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
                                        <p>No pre-practice drills scheduled for today</p>
                                        <p className="text-xs mt-1">Check back tomorrow or customize your routine</p>
                                    </div>
                                ) : (
                                    dailyRoutines.map(routine => (
                                        <div
                                            key={routine.id}
                                            className={`p-3 rounded-lg border transition-colors ${routine.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-xs px-2 py-1 rounded-full ${routine.category === 'pre-practice' ? 'bg-blue-100 text-blue-800' :
                                                    routine.category === 'practice' ? 'bg-yellow-100 text-yellow-800' :
                                                        routine.category === 'post-practice' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {routine.category.replace('-', ' ')}
                                                </span>
                                                <button
                                                    onClick={() => handleRoutineToggle(routine.id)}
                                                    className={`text-lg ${routine.completed ? 'text-green-600' : 'text-gray-400'}`}
                                                >
                                                    {routine.completed ? '✅' : '⚪'}
                                                </button>
                                            </div>
                                            <h4 className="font-medium text-sm mb-1">{routine.title}</h4>
                                            <p className="text-xs text-gray-600 mb-2">{routine.description}</p>
                                            <div className="flex justify-between items-center text-xs text-gray-500">
                                                <span>{routine.duration} min</span>
                                                {routine.completed && routine.completedDate && (
                                                    <span className="text-green-600">✓ {routine.completedDate}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {dailyRoutines.length > 0 && (
                                <div className="mt-3 text-xs text-gray-600">
                                    Completed: {dailyRoutines.filter(r => r.completed).length} / {dailyRoutines.length} drills
                                </div>
                            )}
                        </div>

                        {/* Weekly Progress Summary */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-3">This Week's Progress Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Object.keys(drillTargets).length === 0 ? (
                                    <div className="col-span-3 text-center text-gray-600 py-4">
                                        <p>Loading drill data...</p>
                                        <p className="text-xs mt-2">Connecting to training database</p>
                                    </div>
                                ) : (
                                    Object.values(drillTargets).map(target => {
                                        // Safety checks for backend data structure
                                        const progressHistory = target.progressHistory || [];
                                        const weeklyTarget = target.weeklyTarget || { frequency: 1, minSuccessRate: 70 };

                                        const thisWeekSessions = progressHistory.filter(session => {
                                            const sessionDate = new Date(session.date);
                                            const weekAgo = new Date();
                                            weekAgo.setDate(weekAgo.getDate() - 7);
                                            return sessionDate >= weekAgo;
                                        });

                                        const completionRate = (thisWeekSessions.length / weeklyTarget.frequency) * 100;
                                        const avgSuccessRate = thisWeekSessions.length > 0
                                            ? thisWeekSessions.reduce((sum, session) => sum + session.successRate, 0) / thisWeekSessions.length
                                            : 0;

                                        return (
                                            <div key={target.id} className="bg-white p-3 rounded border">
                                                <h4 className="font-medium text-sm text-gray-800 mb-1">{target.title}</h4>
                                                <div className="text-xs text-gray-600 space-y-1">
                                                    <div className="flex justify-between">
                                                        <span>Sessions:</span>
                                                        <span className={completionRate >= 100 ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                                                            {thisWeekSessions.length}/{weeklyTarget.frequency}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Avg Success:</span>
                                                        <span className={avgSuccessRate >= weeklyTarget.minSuccessRate ? 'text-green-600 font-medium' : 'text-red-600'}>
                                                            {avgSuccessRate.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                                        <div
                                                            className={`h-2 rounded-full ${completionRate >= 100 ? 'bg-green-500' : completionRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                            style={{ width: `${Math.min(completionRate, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Current Week Training Drills */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-800">
                                    Current Week Training Drills
                                    <span className="text-sm text-blue-600 ml-2">{playerTier} Level Focus Areas</span>
                                </h3>
                                <div className="flex items-center space-x-2 text-xs text-gray-600">
                                    <span>Drill Levels:</span>
                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">Development</span>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Solid</span>
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">Elite</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {Object.keys(drillTargets).length === 0 ? (
                                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <p className="text-yellow-800">Loading personalized drills...</p>
                                        <p className="text-sm text-yellow-600 mt-1">
                                            If this persists, there may be an issue loading drill data from the backend.
                                        </p>
                                    </div>
                                ) : (
                                    Object.values(drillTargets).map(drill => (
                                        <div
                                            key={drill.id}
                                            onClick={() => handleDrillClick({
                                                id: drill.id,
                                                title: drill.title,
                                                description: drill.description,
                                                category: drill.category,
                                                metrics: drill.metrics_tracked ? drill.metrics_tracked.split(',').map((m: string) => m.trim()) : [],
                                                tier: drill.tier,
                                                equipment: drill.equipment_needed ? drill.equipment_needed.split(',').map((e: string) => e.trim()) : [],
                                                duration: drill.duration_minutes || 0,
                                                instructions: drill.detailed_instructions || '',
                                                success_criteria: '',
                                                progression: ''
                                            })}
                                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <h4 className="font-medium text-gray-800">{drill.title}</h4>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${drill.category === 'hitting' ? 'bg-orange-100 text-orange-800' :
                                                            drill.category === 'fielding' ? 'bg-blue-100 text-blue-800' :
                                                                drill.category === 'base-running' ? 'bg-green-100 text-green-800' :
                                                                    drill.category === 'throwing' ? 'bg-red-100 text-red-800' :
                                                                        drill.category === 'catching' ? 'bg-purple-100 text-purple-800' :
                                                                            'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {drill.category}
                                                        </span>
                                                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                            {drill.tier}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">{drill.description}</p>
                                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                        <span>🎯 Weekly target</span>
                                                        <span>⏱️ {drill.duration_minutes || 0} min</span>
                                                        {drill.equipment_needed && (
                                                            <span>🛠️ {drill.equipment_needed.split(',').slice(0, 2).join(', ')}{drill.equipment_needed.split(',').length > 2 ? '...' : ''}</span>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 flex space-x-2">
                                                        {drill.metrics_tracked && drill.metrics_tracked.split(',').slice(0, 3).map((metric: string, index: number) => (
                                                            <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                                {metric.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="ml-4 flex flex-col items-end">
                                                    <span className="text-xs text-gray-400 mb-2">Click for details</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            alert(`Progress tracking for ${drill.title} - Feature coming soon!`);
                                                        }}
                                                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                                                    >
                                                        View Progress
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Personalized Insights */}
                        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="font-semibold text-gray-800 mb-2">Personalized Insights</h3>
                            <div className="text-sm text-gray-700 space-y-1">
                                <p>• Focus Areas: Based on your {playerTier} level and position ({playerProfile?.position || 'Unknown'})</p>
                                <p>• Weekly Goal: Complete {Object.values(drillTargets).reduce((total, target) => total + (target.weeklyTarget?.frequency || 0), 0)} drill sessions</p>
                                <p>• Key Metrics: {Object.values(drillTargets).flatMap(target =>
                                    target.metrics_tracked ? target.metrics_tracked.split(',') : []
                                ).slice(0, 3).join(', ')}</p>
                            </div>
                            <div className="mt-3 flex space-x-3">
                                <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
                                    View Detailed Analytics
                                </button>
                                <button className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors">
                                    Adjust Goals
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Session Logs & Journal</h2>
                    <div className="space-y-4">
                        {/* Filter and Search Bar */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b">
                            <div className="flex space-x-2">
                                <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                                    All Sessions
                                </button>
                                <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                                    This Week
                                </button>
                                <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                                    Drills Only
                                </button>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    placeholder="Search logs..."
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
                                />
                                <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
                                    + New Entry
                                </button>
                            </div>
                        </div>

                        {/* Recent Session Logs */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-800">Recent Training Sessions</h3>

                            {/* Sample log entries - Dynamic based on player type */}
                            {playerType === 'pitcher' ? (
                                <>
                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                    Bullpen Session
                                                </span>
                                                <span className="text-sm text-gray-600">August 9, 2025</span>
                                            </div>
                                            <span className="text-xs text-gray-500">2:30 PM</span>
                                        </div>
                                        <h4 className="font-medium text-gray-800 mb-1">Fastball Command Development</h4>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Focused on hitting spots with 4-seam fastball. Hit target zone 72% of the time with improved velocity consistency.
                                        </p>
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                            <span>📊 72% strike rate</span>
                                            <span>⏱️ 45 minutes</span>
                                            <span>🎯 35 total pitches</span>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                    Breaking Ball Work
                                                </span>
                                                <span className="text-sm text-gray-600">August 8, 2025</span>
                                            </div>
                                            <span className="text-xs text-gray-500">3:15 PM</span>
                                        </div>
                                        <h4 className="font-medium text-gray-800 mb-1">Slider Development Session</h4>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Worked on slider grip and release point. Improved break consistency and commanded the pitch better in the zone.
                                        </p>
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                            <span>📊 68% strike rate</span>
                                            <span>⏱️ 30 minutes</span>
                                            <span>🎯 25 total pitches</span>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                                    Mechanics
                                                </span>
                                                <span className="text-sm text-gray-600">August 7, 2025</span>
                                            </div>
                                            <span className="text-xs text-gray-500">4:00 PM</span>
                                        </div>
                                        <h4 className="font-medium text-gray-800 mb-1">Delivery Mechanics Work</h4>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Focused on maintaining consistent arm slot and stride length. Delivery felt more repeatable by the end.
                                        </p>
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                            <span>📊 75% consistency rate</span>
                                            <span>⏱️ 40 minutes</span>
                                            <span>🎯 30 total pitches</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                    Hitting Practice
                                                </span>
                                                <span className="text-sm text-gray-600">August 9, 2025</span>
                                            </div>
                                            <span className="text-xs text-gray-500">2:30 PM</span>
                                        </div>
                                        <h4 className="font-medium text-gray-800 mb-1">Contact Development Session</h4>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Focused on barrel awareness and timing. Made solid contact on 65% of swings during tee work.
                                        </p>
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                            <span>📊 65% success rate</span>
                                            <span>⏱️ 45 minutes</span>
                                            <span>🎯 75 total swings</span>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                    Pitch Recognition
                                                </span>
                                                <span className="text-sm text-gray-600">August 8, 2025</span>
                                            </div>
                                            <span className="text-xs text-gray-500">3:15 PM</span>
                                        </div>
                                        <h4 className="font-medium text-gray-800 mb-1">Fastball vs Changeup Recognition</h4>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Improved identification timing. Correctly identified 80% of pitches in the first 0.3 seconds.
                                        </p>
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                            <span>📊 80% success rate</span>
                                            <span>⏱️ 30 minutes</span>
                                            <span>🎯 50 total reps</span>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                                    Mechanics
                                                </span>
                                                <span className="text-sm text-gray-600">August 7, 2025</span>
                                            </div>
                                            <span className="text-xs text-gray-500">4:00 PM</span>
                                        </div>
                                        <h4 className="font-medium text-gray-800 mb-1">Swing Path Mechanics Work</h4>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Worked on maintaining proper swing path and launch angle. Felt more consistent by the end.
                                        </p>
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                            <span>📊 72% success rate</span>
                                            <span>⏱️ 40 minutes</span>
                                            <span>🎯 60 total swings</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Training Journal */}
                        <div className="border-t pt-4">
                            <h3 className="font-semibold text-gray-800 mb-3">Training Journal</h3>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-800 mb-2">Today's Reflection</h4>
                                <textarea
                                    placeholder="How did today's training feel? Any breakthroughs or areas to focus on..."
                                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                                    rows={4}
                                ></textarea>
                                <div className="flex justify-between items-center mt-3">
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <span>Mood:</span>
                                        <button className="text-lg hover:scale-110 transition-transform">😊</button>
                                        <button className="text-lg hover:scale-110 transition-transform">😐</button>
                                        <button className="text-lg hover:scale-110 transition-transform">😤</button>
                                        <button className="text-lg hover:scale-110 transition-transform">💪</button>
                                    </div>
                                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                                        Save Entry
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Progress Overview */}
                        <div className="border-t pt-4">
                            <h3 className="font-semibold text-gray-800 mb-3">This Week's Progress</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-lg border">
                                    <h4 className="font-medium text-gray-800 mb-2">Sessions Completed</h4>
                                    <div className="text-2xl font-bold text-green-600">5</div>
                                    <div className="text-sm text-gray-600">of 5 planned</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border">
                                    <h4 className="font-medium text-gray-800 mb-2">Avg Success Rate</h4>
                                    <div className="text-2xl font-bold text-blue-600">72%</div>
                                    <div className="text-sm text-gray-600">+5% from last week</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border">
                                    <h4 className="font-medium text-gray-800 mb-2">Total Training Time</h4>
                                    <div className="text-2xl font-bold text-purple-600">4.2h</div>
                                    <div className="text-sm text-gray-600">this week</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'communication' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Communication</h2>
                    <div className="space-y-6">
                        {/* Coach Messages */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-800">Messages from Coach</h3>
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">2 unread</span>
                            </div>

                            <div className="space-y-3">
                                {playerType === 'pitcher' ? (
                                    <>
                                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-sm font-bold">CT</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-800">Coach Thompson</span>
                                                        <span className="text-xs text-gray-500 ml-2">2 hours ago</span>
                                                    </div>
                                                </div>
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                Great improvement on your strike percentage this week! I noticed your fastball command has really developed.
                                                Let's focus on maintaining that delivery consistency in tomorrow's bullpen session.
                                            </p>
                                            <button className="text-xs text-blue-600 hover:text-blue-800 mt-2">Reply</button>
                                        </div>

                                        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-sm font-bold">CT</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-800">Coach Thompson</span>
                                                        <span className="text-xs text-gray-500 ml-2">1 day ago</span>
                                                    </div>
                                                </div>
                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                Updated your weekly goals based on our conversation. Focus on the breaking ball development drills -
                                                you're showing real progress with slider spin rate and command.
                                            </p>
                                            <button className="text-xs text-green-600 hover:text-green-800 mt-2">Reply</button>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-sm font-bold">CT</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-800">Coach Thompson</span>
                                                        <span className="text-xs text-gray-500 ml-2">3 days ago</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                Remember to log your bullpen sessions in the system. It helps me track your pitch development
                                                and adjust the training plan accordingly.
                                            </p>
                                            <div className="text-xs text-gray-500 mt-2">✓ Read</div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-sm font-bold">CT</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-800">Coach Thompson</span>
                                                        <span className="text-xs text-gray-500 ml-2">2 hours ago</span>
                                                    </div>
                                                </div>
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                Great improvement on your contact rate this week! I noticed your barrel awareness has really developed.
                                                Let's focus on maintaining that swing path consistency in tomorrow's practice.
                                            </p>
                                            <button className="text-xs text-blue-600 hover:text-blue-800 mt-2">Reply</button>
                                        </div>

                                        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-sm font-bold">CT</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-800">Coach Thompson</span>
                                                        <span className="text-xs text-gray-500 ml-2">1 day ago</span>
                                                    </div>
                                                </div>
                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                Updated your weekly goals based on our conversation. Focus on the pitch recognition drills -
                                                you're showing real progress with fastball identification timing.
                                            </p>
                                            <button className="text-xs text-green-600 hover:text-green-800 mt-2">Reply</button>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-sm font-bold">CT</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-800">Coach Thompson</span>
                                                        <span className="text-xs text-gray-500 ml-2">3 days ago</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                Remember to log your practice sessions in the system. It helps me track your progress
                                                and adjust the training plan accordingly.
                                            </p>
                                            <div className="text-xs text-gray-500 mt-2">✓ Read</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Send Message */}
                        <div className="border-t pt-6">
                            <h3 className="font-semibold text-gray-800 mb-4">Send Message to Coach</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Question about today's drill session"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                    <textarea
                                        placeholder="Type your message here..."
                                        className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                                        rows={4}
                                    ></textarea>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <input type="checkbox" className="rounded" aria-label="Mark message as important" />
                                        <span>Mark as important</span>
                                    </div>
                                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                                        Send Message
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Updates */}
                        <div className="border-t pt-6">
                            <h3 className="font-semibold text-gray-800 mb-4">Quick Updates</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                            <span className="text-yellow-600">⚠️</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-800">Report Injury/Issue</h4>
                                            <p className="text-sm text-gray-600">Let coach know about any concerns</p>
                                        </div>
                                    </div>
                                </button>

                                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <span className="text-green-600">📅</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-800">Schedule Meeting</h4>
                                            <p className="text-sm text-gray-600">Request one-on-one time</p>
                                        </div>
                                    </div>
                                </button>

                                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <span className="text-blue-600">🎯</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-800">Goal Check-in</h4>
                                            <p className="text-sm text-gray-600">Discuss progress and adjustments</p>
                                        </div>
                                    </div>
                                </button>

                                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <span className="text-purple-600">💡</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-800">Share Feedback</h4>
                                            <p className="text-sm text-gray-600">Ideas or suggestions</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="border-t pt-6">
                            <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3 text-sm">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-gray-600">Coach viewed your training log</span>
                                    <span className="text-gray-400">2 hours ago</span>
                                </div>
                                <div className="flex items-center space-x-3 text-sm">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-gray-600">Goals updated by Coach Thompson</span>
                                    <span className="text-gray-400">1 day ago</span>
                                </div>
                                <div className="flex items-center space-x-3 text-sm">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    <span className="text-gray-600">You completed drill logging session</span>
                                    <span className="text-gray-400">2 days ago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Render drill modal if selected */}
            {renderDrillLogModal()}
        </div>
    );
};

export default PDPDashboard;


