// TypeScript interfaces for baseball scouting data

export interface PitchTypeDetail {
    type: string; // '4S', 'SL', 'CH', 'CB', 'CT', 'SFF', etc.
    vAvg: number; // Average velocity
    vStd: number; // Velocity standard deviation
    spinAvg: number; // Spin rate average
    ivb: number; // Induced vertical break
    hb: number; // Horizontal break
    tilt: number; // Tilt angle in degrees (0-360)
    extension: number; // Release extension (feet)
    relHeight: number; // Release height (feet)
    usageOverall: number; // Overall usage percentage
    usageByCount: {
        '0-0': number;
        '0-1': number;
        '0-2': number;
        '1-0': number;
        '2-0': number;
        '2-1': number;
        '2-2': number;
        '3-2': number;
    };
    whiffRate: number;
    putAwayRate: number;
    locHeatmap: number[]; // 13-zone grid (0-12)
    spray: {
        gb: number; // Ground ball percentage
        fb: number; // Fly ball percentage
        ld: number; // Line drive percentage
    };
}

export interface Pitcher {
    id: string;
    name: string;
    throws: 'L' | 'R';
    pitchTypes: PitchTypeDetail[];
    sequenceTendencies: string[];
    timesThruOrderSplits: {
        first: { fip: number; whip: number; };
        second: { fip: number; whip: number; };
        third: { fip: number; whip: number; };
    };
}

export interface HitterVsPitchType {
    pitchType: string;
    xwOBA: number;
    whiffRate: number;
    chaseRate: number;
}

export interface Hitter {
    id: string;
    name: string;
    bats: 'L' | 'R' | 'S';
    position: string;
    hotColdZones: number[]; // 13-zone run value or xwOBA
    sprayChart: {
        pull: number;
        oppo: number;
        cent: number;
    };
    chaseRate: number;
    zContact: number; // Contact rate in zone
    zzContact: number; // Contact rate out of zone
    whiff: number;
    batProfile: {
        gb: number;
        fb: number;
        ld: number;
    };
    vsPitchType: HitterVsPitchType[];
    approachByCount: {
        ahead: string; // Approach when ahead in count
        behind: string; // Approach when behind in count
        even: string; // Approach on even counts
    };
    sbTendencies: {
        attempts: number;
        successRate: number;
        preferredCounts: string[];
    };
    buntFreq: number;
}

export interface Matchup {
    id: string;
    ourPitcher: string;
    theirHitter: string;
    plateAppearances: number;
    hitRate: number;
    whiffRate: number;
    recommendedApproach: string;
    notes: string;
}

export interface TeamSituational {
    baserunningAggression: number; // 1-10 scale
    stealSuccessRate: number;
    buntFrequency: number;
    doublePlayRate: number;
    extraBaseHitRisk: number[];
}

export interface BullpenInfo {
    pitcher: string;
    role: 'closer' | 'setup' | 'middle' | 'long';
    throws: 'L' | 'R';
    backToBackUsage: boolean;
    fatigueLevel: number; // 1-10 scale
    recentWorkload: number; // pitches in last 3 days
}

export interface ScoutingData {
    opponent: string;
    pitchers: Pitcher[];
    hitters: Hitter[];
    matchups: Matchup[];
    situational: TeamSituational;
    bullpen: BullpenInfo[];
    gameContext: {
        weather: string;
        wind: string;
        temperature: number;
    };
}

export interface FilterState {
    inning: string;
    count: string;
    handedness: string;
    baseState: string;
    leverage: string;
    weather: string;
    scoreDiff: string;
}
