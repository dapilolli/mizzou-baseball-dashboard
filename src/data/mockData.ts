import { ScoutingData, Pitcher, Hitter, Matchup, TeamSituational, BullpenInfo, PitchTypeDetail, HitterVsPitchType } from '../types/scouting';

// Utility function for consistent random generation
const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

/*
 * UNIQUE PITCHER ARSENAL SYSTEM
 * 
 * Creates 5 distinct pitcher archetypes with realistic movement profiles:
 * 
 * 1. POWER (20%): 3-pitch mix, high velocity (93-97 mph), simplified repertoire
 *    - 4S/SL/CH with 65-75% fastball usage
 * 
 * 2. FINESSE (20%): 5-pitch mix, command-oriented (45-60% fastball)
 *    - 4S/SL/CH/CB/CT with varied secondary options
 * 
 * 3. MODERN (20%): Sinker-based with cutting action
 *    - SI/SL/CH/CT focusing on weak contact
 * 
 * 4. TRADITIONAL (20%): Classic curveball-heavy approach
 *    - 4S/CB/CH/SL with 12-6 breaking balls
 * 
 * 5. SPECIALTY (20%): Unique combinations
 *    - 4S/SFF/SL/SW with split-finger or sweeper elements
 * 
 * Each pitch includes realistic TrackMan-style metrics:
 * - Velocity (vAvg/vStd)
 * - Movement (IVB/HB) 
 * - Release metrics (Extension/Height)
 * - Spin Rate
 * - Effectiveness (Whiff/Putaway rates)
 * - Situational usage by count
 */

// Generate realistic pitch type data with varied pitch mix and unique arsenals
const generatePitchTypes = (pitcherSeed: number, throws: 'L' | 'R'): PitchTypeDetail[] => {
    const pitchTypes: PitchTypeDetail[] = [];

    // Determine pitcher archetype for unique arsenals
    const archetypeRandom = seededRandom(pitcherSeed);
    let arsenalTypes: string[];
    let fastballUsage: number;
    let arsenalProfile: string;

    if (archetypeRandom < 0.2) {
        // Power pitcher - High velo, simplified mix
        arsenalTypes = ['4S', 'SL', 'CH'];
        fastballUsage = Math.round(65 + seededRandom(pitcherSeed + 1) * 10); // 65-75%
        arsenalProfile = 'power';
    } else if (archetypeRandom < 0.4) {
        // Finesse pitcher - More pitches, lower velo
        arsenalTypes = ['4S', 'SL', 'CH', 'CB', 'CT'];
        fastballUsage = Math.round(45 + seededRandom(pitcherSeed + 1) * 15); // 45-60%
        arsenalProfile = 'finesse';
    } else if (archetypeRandom < 0.6) {
        // Modern pitcher - Sinker/cutter heavy
        arsenalTypes = ['SI', 'SL', 'CH', 'CT'];
        fastballUsage = Math.round(50 + seededRandom(pitcherSeed + 1) * 20); // 50-70%
        arsenalProfile = 'modern';
    } else if (archetypeRandom < 0.8) {
        // Traditional pitcher - Classic mix with curveball
        arsenalTypes = ['4S', 'CB', 'CH', 'SL'];
        fastballUsage = Math.round(55 + seededRandom(pitcherSeed + 1) * 15); // 55-70%
        arsenalProfile = 'traditional';
    } else {
        // Specialty pitcher - Unique mix
        arsenalTypes = ['4S', 'SFF', 'SL', 'SW'];
        fastballUsage = Math.round(48 + seededRandom(pitcherSeed + 1) * 22); // 48-70%
        arsenalProfile = 'specialty';
    }

    // Calculate secondary pitch distribution
    const remainingUsage = 100 - fastballUsage;
    const numSecondary = arsenalTypes.length - 1;
    let secondaryUsages: number[] = [];

    if (numSecondary === 2) {
        // 3-pitch mix
        const split = 0.6 + seededRandom(pitcherSeed + 10) * 0.2; // 60-80% to primary secondary
        secondaryUsages = [
            Math.round(remainingUsage * split),
            Math.round(remainingUsage * (1 - split))
        ];
    } else if (numSecondary === 3) {
        // 4-pitch mix
        const primary = 0.4 + seededRandom(pitcherSeed + 10) * 0.2; // 40-60%
        const secondary = 0.3 + seededRandom(pitcherSeed + 11) * 0.15; // 30-45%
        const tertiary = 1 - primary - secondary;
        secondaryUsages = [
            Math.round(remainingUsage * primary),
            Math.round(remainingUsage * secondary),
            Math.round(remainingUsage * tertiary)
        ];
    } else {
        // 5-pitch mix
        secondaryUsages = [
            Math.round(remainingUsage * 0.35),
            Math.round(remainingUsage * 0.25),
            Math.round(remainingUsage * 0.25),
            Math.round(remainingUsage * 0.15)
        ];
    }

    // Adjust to ensure total = 100%
    const totalSecondary = secondaryUsages.reduce((sum, usage) => sum + usage, 0);
    if (totalSecondary !== remainingUsage) {
        secondaryUsages[0] += remainingUsage - totalSecondary;
    }

    const usageValues = [fastballUsage, ...secondaryUsages];

    arsenalTypes.forEach((type, index) => {
        const seed = pitcherSeed + index * 100;

        // Define realistic ranges for each pitch type
        const pitchProfiles = getPitchProfile(type, arsenalProfile, throws, seed);

        pitchTypes.push({
            type,
            vAvg: pitchProfiles.vAvg,
            vStd: pitchProfiles.vStd,
            spinAvg: pitchProfiles.spinAvg,
            ivb: pitchProfiles.ivb,
            hb: pitchProfiles.hb,
            tilt: pitchProfiles.tilt,
            extension: pitchProfiles.extension,
            relHeight: pitchProfiles.relHeight,
            usageOverall: usageValues[index],
            usageByCount: generateCountUsage(type, seed),
            whiffRate: pitchProfiles.whiffRate,
            putAwayRate: pitchProfiles.putAwayRate,
            locHeatmap: Array.from({ length: 13 }, (_, i) =>
                Math.round((5 + seededRandom(seed + 20 + i) * 10))
            ),
            spray: {
                gb: pitchProfiles.spray.gb,
                fb: pitchProfiles.spray.fb,
                ld: pitchProfiles.spray.ld,
            }
        });
    });

    return pitchTypes;
};

// Helper function to get realistic pitch profiles
const getPitchProfile = (pitchType: string, arsenalProfile: string, throws: 'L' | 'R', seed: number) => {
    const handnessMultiplier = throws === 'L' ? -1 : 1;

    const profiles: Record<string, any> = {
        '4S': { // 4-seam fastball
            vAvg: arsenalProfile === 'power' ? 93 + seededRandom(seed) * 4 : 90 + seededRandom(seed) * 5,
            vStd: 1.2 + seededRandom(seed + 1) * 1.5,
            spinAvg: Math.round(2200 + seededRandom(seed + 2) * 400),
            ivb: Math.round((12 + seededRandom(seed + 3) * 8) * 10) / 10, // 12-20 inches rise
            hb: Math.round((seededRandom(seed + 4) - 0.5) * 6 * handnessMultiplier * 10) / 10,
            extension: Math.round((6.0 + seededRandom(seed + 5) * 1.2) * 10) / 10,
            relHeight: Math.round((5.8 + seededRandom(seed + 6) * 0.8) * 10) / 10,
            tilt: Math.round((350 + seededRandom(seed + 11) * 40) % 360), // 12:30-1:30 clock
            whiffRate: Math.round((20 + seededRandom(seed + 7) * 15)),
            putAwayRate: Math.round((25 + seededRandom(seed + 8) * 20)),
            spray: { gb: 35 + Math.round(seededRandom(seed + 9) * 15), fb: 40 + Math.round(seededRandom(seed + 10) * 15), ld: 22 }
        },
        'SI': { // Sinker
            vAvg: 90 + seededRandom(seed) * 4,
            vStd: 1.0 + seededRandom(seed + 1) * 1.2,
            spinAvg: Math.round(2000 + seededRandom(seed + 2) * 300),
            ivb: Math.round((3 + seededRandom(seed + 3) * 8) * 10) / 10, // Low ride
            hb: Math.round((8 + seededRandom(seed + 4) * 6) * handnessMultiplier * 10) / 10,
            extension: Math.round((6.1 + seededRandom(seed + 5) * 1.0) * 10) / 10,
            relHeight: Math.round((5.9 + seededRandom(seed + 6) * 0.6) * 10) / 10,
            tilt: Math.round((135 + seededRandom(seed + 11) * 60) % 360), // 2:00-4:00 clock
            whiffRate: Math.round((15 + seededRandom(seed + 7) * 12)),
            putAwayRate: Math.round((18 + seededRandom(seed + 8) * 15)),
            spray: { gb: 55 + Math.round(seededRandom(seed + 9) * 15), fb: 25 + Math.round(seededRandom(seed + 10) * 10), ld: 20 }
        },
        'SL': { // Slider
            vAvg: 84 + seededRandom(seed) * 5,
            vStd: 1.5 + seededRandom(seed + 1) * 1.8,
            spinAvg: Math.round(2400 + seededRandom(seed + 2) * 600),
            ivb: Math.round((seededRandom(seed + 3) * 8 - 4) * 10) / 10, // -4 to +4
            hb: Math.round((8 + seededRandom(seed + 4) * 12) * handnessMultiplier * 10) / 10,
            extension: Math.round((5.9 + seededRandom(seed + 5) * 1.0) * 10) / 10,
            relHeight: Math.round((5.7 + seededRandom(seed + 6) * 0.8) * 10) / 10,
            tilt: Math.round((90 + seededRandom(seed + 11) * 60) % 360), // 3:00-5:00 clock
            whiffRate: Math.round((30 + seededRandom(seed + 7) * 25)),
            putAwayRate: Math.round((35 + seededRandom(seed + 8) * 25)),
            spray: { gb: 40 + Math.round(seededRandom(seed + 9) * 15), fb: 35 + Math.round(seededRandom(seed + 10) * 15), ld: 18 }
        },
        'CH': { // Changeup
            vAvg: 82 + seededRandom(seed) * 5,
            vStd: 1.8 + seededRandom(seed + 1) * 2.0,
            spinAvg: Math.round(1600 + seededRandom(seed + 2) * 500),
            ivb: Math.round((5 + seededRandom(seed + 3) * 10) * 10) / 10,
            hb: Math.round((6 + seededRandom(seed + 4) * 8) * handnessMultiplier * 10) / 10,
            extension: Math.round((6.0 + seededRandom(seed + 5) * 1.1) * 10) / 10,
            relHeight: Math.round((5.8 + seededRandom(seed + 6) * 0.7) * 10) / 10,
            tilt: Math.round((330 + seededRandom(seed + 11) * 60) % 360), // 11:00-1:00 clock
            whiffRate: Math.round((25 + seededRandom(seed + 7) * 20)),
            putAwayRate: Math.round((30 + seededRandom(seed + 8) * 25)),
            spray: { gb: 45 + Math.round(seededRandom(seed + 9) * 15), fb: 30 + Math.round(seededRandom(seed + 10) * 15), ld: 20 }
        },
        'CB': { // Curveball
            vAvg: 77 + seededRandom(seed) * 5,
            vStd: 2.0 + seededRandom(seed + 1) * 2.2,
            spinAvg: Math.round(2800 + seededRandom(seed + 2) * 400),
            ivb: Math.round((-12 + seededRandom(seed + 3) * 8) * 10) / 10, // -12 to -4
            hb: Math.round((seededRandom(seed + 4) - 0.5) * 8 * handnessMultiplier * 10) / 10,
            extension: Math.round((5.8 + seededRandom(seed + 5) * 1.0) * 10) / 10,
            relHeight: Math.round((5.6 + seededRandom(seed + 6) * 0.8) * 10) / 10,
            tilt: Math.round((150 + seededRandom(seed + 11) * 60) % 360), // 5:00-7:00 clock
            whiffRate: Math.round((35 + seededRandom(seed + 7) * 25)),
            putAwayRate: Math.round((40 + seededRandom(seed + 8) * 25)),
            spray: { gb: 50 + Math.round(seededRandom(seed + 9) * 15), fb: 28 + Math.round(seededRandom(seed + 10) * 12), ld: 15 }
        },
        'CT': { // Cutter
            vAvg: 88 + seededRandom(seed) * 4,
            vStd: 1.3 + seededRandom(seed + 1) * 1.5,
            spinAvg: Math.round(2300 + seededRandom(seed + 2) * 400),
            ivb: Math.round((8 + seededRandom(seed + 3) * 8) * 10) / 10,
            hb: Math.round((4 + seededRandom(seed + 4) * 8) * handnessMultiplier * 10) / 10,
            extension: Math.round((6.0 + seededRandom(seed + 5) * 1.0) * 10) / 10,
            relHeight: Math.round((5.8 + seededRandom(seed + 6) * 0.7) * 10) / 10,
            tilt: Math.round((60 + seededRandom(seed + 11) * 60) % 360), // 2:00-4:00 clock
            whiffRate: Math.round((22 + seededRandom(seed + 7) * 18)),
            putAwayRate: Math.round((28 + seededRandom(seed + 8) * 20)),
            spray: { gb: 42 + Math.round(seededRandom(seed + 9) * 15), fb: 35 + Math.round(seededRandom(seed + 10) * 15), ld: 20 }
        },
        'SFF': { // Split-finger fastball
            vAvg: 85 + seededRandom(seed) * 4,
            vStd: 1.6 + seededRandom(seed + 1) * 1.8,
            spinAvg: Math.round(1400 + seededRandom(seed + 2) * 600),
            ivb: Math.round((-2 + seededRandom(seed + 3) * 8) * 10) / 10,
            hb: Math.round((seededRandom(seed + 4) - 0.5) * 6 * handnessMultiplier * 10) / 10,
            extension: Math.round((6.1 + seededRandom(seed + 5) * 1.0) * 10) / 10,
            relHeight: Math.round((5.9 + seededRandom(seed + 6) * 0.6) * 10) / 10,
            tilt: Math.round((210 + seededRandom(seed + 11) * 60) % 360), // 7:00-9:00 clock
            whiffRate: Math.round((40 + seededRandom(seed + 7) * 25)),
            putAwayRate: Math.round((45 + seededRandom(seed + 8) * 25)),
            spray: { gb: 48 + Math.round(seededRandom(seed + 9) * 15), fb: 30 + Math.round(seededRandom(seed + 10) * 12), ld: 18 }
        },
        'SW': { // Sweeper
            vAvg: 82 + seededRandom(seed) * 6,
            vStd: 1.8 + seededRandom(seed + 1) * 2.0,
            spinAvg: Math.round(2600 + seededRandom(seed + 2) * 500),
            ivb: Math.round((seededRandom(seed + 3) * 6 - 2) * 10) / 10,
            hb: Math.round((15 + seededRandom(seed + 4) * 10) * handnessMultiplier * 10) / 10,
            extension: Math.round((5.8 + seededRandom(seed + 5) * 1.1) * 10) / 10,
            relHeight: Math.round((5.6 + seededRandom(seed + 6) * 0.8) * 10) / 10,
            tilt: Math.round((75 + seededRandom(seed + 11) * 60) % 360), // 2:30-4:30 clock
            whiffRate: Math.round((35 + seededRandom(seed + 7) * 25)),
            putAwayRate: Math.round((40 + seededRandom(seed + 8) * 25)),
            spray: { gb: 38 + Math.round(seededRandom(seed + 9) * 15), fb: 38 + Math.round(seededRandom(seed + 10) * 15), ld: 18 }
        }
    };

    const profile = profiles[pitchType] || profiles['4S'];

    // Round velocity properly
    profile.vAvg = Math.round(profile.vAvg * 10) / 10;

    return profile;
};

// Helper function to generate count-specific usage
const generateCountUsage = (pitchType: string, seed: number) => {
    const isOffSpeed = ['CH', 'CB', 'SFF'].includes(pitchType);
    const isBreaking = ['SL', 'CB', 'SW'].includes(pitchType);

    return {
        '0-0': Math.round((isOffSpeed ? 15 : 25) + seededRandom(seed + 6) * 20),
        '0-1': Math.round((isOffSpeed ? 20 : 30) + seededRandom(seed + 7) * 15),
        '0-2': Math.round((isBreaking ? 35 : 15) + seededRandom(seed + 8) * 20),
        '1-0': Math.round((isOffSpeed ? 10 : 35) + seededRandom(seed + 9) * 20),
        '2-0': Math.round((isOffSpeed ? 5 : 40) + seededRandom(seed + 10) * 15),
        '2-1': Math.round((isOffSpeed ? 15 : 25) + seededRandom(seed + 11) * 20),
        '2-2': Math.round((isBreaking ? 30 : 20) + seededRandom(seed + 12) * 20),
        '3-2': Math.round((isBreaking ? 35 : 25) + seededRandom(seed + 13) * 20),
    };
};// Generate realistic hitter vs pitch type data
const generateVsPitchTypeData = (hitterSeed: number): HitterVsPitchType[] => {
    const pitchTypes = ['4S', 'SL', 'CH', 'CB', 'CT', 'SFF'];

    return pitchTypes.map((pitchType, index) => ({
        pitchType,
        xwOBA: Math.round((0.250 + seededRandom(hitterSeed + index) * 0.200) * 1000) / 1000,
        whiffRate: Math.round((0.15 + seededRandom(hitterSeed + index + 10) * 0.25) * 100),
        chaseRate: Math.round((0.20 + seededRandom(hitterSeed + index + 20) * 0.25) * 100),
    }));
};

// Generate realistic player names
const generatePlayerName = (seed: number): string => {
    const firstNames = [
        'Jake', 'Connor', 'Tyler', 'Luke', 'Ryan', 'Matt', 'Alex', 'Jordan',
        'Blake', 'Austin', 'Cole', 'Drew', 'Noah', 'Mason', 'Carter', 'Logan'
    ];
    const lastNames = [
        'Anderson', 'Johnson', 'Williams', 'Brown', 'Miller', 'Davis', 'Garcia',
        'Rodriguez', 'Wilson', 'Martinez', 'Taylor', 'Thomas', 'Jackson', 'White'
    ];

    const firstIndex = Math.floor(seededRandom(seed) * firstNames.length);
    const lastIndex = Math.floor(seededRandom(seed + 100) * lastNames.length);

    return `${firstNames[firstIndex]} ${lastNames[lastIndex]}`;
};

// Generate mock pitchers
const generateMockPitchers = (): Pitcher[] => {
    const pitchers: Pitcher[] = [];

    for (let i = 0; i < 4; i++) {
        const seed = 1000 + i * 1000;
        const throws = seededRandom(seed) > 0.7 ? 'L' : 'R';

        pitchers.push({
            id: `P${i + 1}`,
            name: generatePlayerName(seed),
            throws,
            pitchTypes: generatePitchTypes(seed, throws),
            sequenceTendencies: [
                seededRandom(seed + 500) > 0.5 ? 'Fastball first pitch 65%' : 'Slider heavy behind in count',
                seededRandom(seed + 501) > 0.5 ? 'Challenge zone early counts' : 'Nibble with 2 strikes',
                seededRandom(seed + 502) > 0.5 ? 'Backdoor slider favorite' : 'Elevated fastball putaway'
            ],
            timesThruOrderSplits: {
                first: {
                    fip: Math.round((3.20 + seededRandom(seed + 600) * 1.8) * 100) / 100,
                    whip: Math.round((1.10 + seededRandom(seed + 601) * 0.4) * 100) / 100
                },
                second: {
                    fip: Math.round((3.80 + seededRandom(seed + 602) * 2.0) * 100) / 100,
                    whip: Math.round((1.25 + seededRandom(seed + 603) * 0.5) * 100) / 100
                },
                third: {
                    fip: Math.round((4.40 + seededRandom(seed + 604) * 2.2) * 100) / 100,
                    whip: Math.round((1.40 + seededRandom(seed + 605) * 0.6) * 100) / 100
                }
            }
        });
    }

    return pitchers;
};

// Generate mock hitters
const generateMockHitters = (): Hitter[] => {
    const hitters: Hitter[] = [];
    const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

    for (let i = 0; i < 9; i++) {
        const seed = 2000 + i * 1000;
        const batsRandom = seededRandom(seed + 100);
        const bats = batsRandom > 0.7 ? 'L' : batsRandom > 0.1 ? 'R' : 'S';

        hitters.push({
            id: `H${i + 1}`,
            name: generatePlayerName(seed),
            bats,
            position: positions[i],
            hotColdZones: Array.from({ length: 13 }, (_, zoneIndex) =>
                Math.round((seededRandom(seed + 200 + zoneIndex) - 0.5) * 60) / 100 // -0.30 to +0.30 run value
            ),
            sprayChart: {
                pull: Math.round((0.25 + seededRandom(seed + 250) * 0.3) * 100),
                oppo: Math.round((0.20 + seededRandom(seed + 251) * 0.25) * 100),
                cent: Math.round((0.30 + seededRandom(seed + 252) * 0.2) * 100),
            },
            chaseRate: Math.round((0.20 + seededRandom(seed + 300) * 0.25) * 100),
            zContact: Math.round((0.75 + seededRandom(seed + 301) * 0.2) * 100),
            zzContact: Math.round((0.55 + seededRandom(seed + 302) * 0.25) * 100),
            whiff: Math.round((0.15 + seededRandom(seed + 303) * 0.2) * 100),
            batProfile: {
                gb: Math.round((0.35 + seededRandom(seed + 350) * 0.25) * 100),
                fb: Math.round((0.30 + seededRandom(seed + 351) * 0.25) * 100),
                ld: Math.round((0.18 + seededRandom(seed + 352) * 0.12) * 100),
            },
            vsPitchType: generateVsPitchTypeData(seed + 400),
            approachByCount: {
                ahead: seededRandom(seed + 450) > 0.5 ? 'Aggressive on strikes' : 'Patient, work counts',
                behind: seededRandom(seed + 451) > 0.5 ? 'Protect, shorten swing' : 'Still hunting fastball',
                even: seededRandom(seed + 452) > 0.5 ? 'Zone discipline focus' : 'Attack early strikes'
            },
            sbTendencies: {
                attempts: Math.round(seededRandom(seed + 500) * 15),
                successRate: Math.round((0.65 + seededRandom(seed + 501) * 0.25) * 100),
                preferredCounts: ['1-0', '2-1', '3-1'].filter(() => seededRandom(seed + 502) > 0.4)
            },
            buntFreq: Math.round(seededRandom(seed + 550) * 8)
        });
    }

    return hitters;
};

// Generate mock matchups
const generateMockMatchups = (pitchers: Pitcher[], hitters: Hitter[]): Matchup[] => {
    const matchups: Matchup[] = [];

    // Generate 6-8 key matchups
    for (let i = 0; i < Math.min(8, pitchers.length * 2); i++) {
        const seed = 3000 + i * 100;
        const pitcher = pitchers[Math.floor(seededRandom(seed) * pitchers.length)];
        const hitter = hitters[Math.floor(seededRandom(seed + 1) * hitters.length)];

        const approaches = [
            'Attack with fastball up in zone',
            'Slider down and away',
            'Challenge with breaking balls',
            'Avoid hitter\'s hot zone (middle-in)',
            'Changeup heavy sequence',
            'Backdoor breaking ball',
            'Elevate fastball, finish with slider'
        ];

        matchups.push({
            id: `M${i + 1}`,
            ourPitcher: pitcher.name,
            theirHitter: hitter.name,
            plateAppearances: Math.round(3 + seededRandom(seed + 10) * 8),
            hitRate: Math.round((0.15 + seededRandom(seed + 11) * 0.4) * 100),
            whiffRate: Math.round((0.20 + seededRandom(seed + 12) * 0.3) * 100),
            recommendedApproach: approaches[Math.floor(seededRandom(seed + 20) * approaches.length)],
            notes: seededRandom(seed + 30) > 0.5 ?
                'Struggles with off-speed low in zone' :
                'Can turn on elevated fastballs'
        });
    }

    return matchups;
};

// Generate mock team situational data
const generateMockSituational = (): TeamSituational => {
    const seed = 4000;

    return {
        baserunningAggression: Math.round(4 + seededRandom(seed) * 4), // 4-8 scale
        stealSuccessRate: Math.round((0.65 + seededRandom(seed + 1) * 0.25) * 100),
        buntFrequency: Math.round((0.03 + seededRandom(seed + 2) * 0.05) * 100),
        doublePlayRate: Math.round((0.12 + seededRandom(seed + 3) * 0.08) * 100),
        extraBaseHitRisk: Array.from({ length: 13 }, (_, i) =>
            Math.round((0.08 + seededRandom(seed + 10 + i) * 0.12) * 100)
        )
    };
};

// Generate mock bullpen data
const generateMockBullpen = (): BullpenInfo[] => {
    const roles: Array<'closer' | 'setup' | 'middle' | 'long'> = ['closer', 'setup', 'setup', 'middle', 'middle', 'long'];

    return roles.map((role, index) => {
        const seed = 5000 + index * 100;

        return {
            pitcher: generatePlayerName(seed),
            role,
            throws: seededRandom(seed + 10) > 0.7 ? 'L' : 'R',
            backToBackUsage: seededRandom(seed + 20) > 0.3,
            fatigueLevel: Math.round(1 + seededRandom(seed + 30) * 7), // 1-8 scale
            recentWorkload: Math.round(seededRandom(seed + 40) * 45) // pitches in last 3 days
        };
    });
};

// Main function to generate complete mock scouting data
export const generateMockScoutingData = (opponent: string = 'Alabama'): ScoutingData => {
    const pitchers = generateMockPitchers();
    const hitters = generateMockHitters();

    return {
        opponent,
        pitchers,
        hitters,
        matchups: generateMockMatchups(pitchers, hitters),
        situational: generateMockSituational(),
        bullpen: generateMockBullpen(),
        gameContext: {
            weather: 'Clear',
            wind: 'Calm, 5 mph from CF',
            temperature: 72
        }
    };
};

// Export for use in components
export default generateMockScoutingData;
