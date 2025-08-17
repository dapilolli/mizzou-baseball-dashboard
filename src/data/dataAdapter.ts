// Data adapter for mapping TrackMan/TruMedia fields to our interfaces
// This shows how real baseball data would be transformed to our schema

import { Pitcher, Hitter, PitchTypeDetail, HitterVsPitchType } from '../types/scouting';

// Example TrackMan pitch data structure (commented for reference)
interface TrackManPitch {
    // pitcher_id: string;
    // pitch_type: string;
    // release_speed: number;
    // spin_rate: number;
    // horizontal_break: number;
    // induced_vert_break: number;
    // release_pos_x: number;
    // release_pos_z: number;
    // balls: number;
    // strikes: number;
    // zone: number;
    // play_outcome: string;
}

// Example TruMedia aggregated data structure (commented for reference)
interface TruMediaHitter {
    // player_id: string;
    // bat_side: 'L' | 'R' | 'S';
    // position: string;
    // zone_1_woba: number;
    // zone_2_woba: number;
    // ... (zones 3-13)
    // chase_rate: number;
    // z_contact_pct: number;
    // o_contact_pct: number;
    // whiff_pct: number;
    // pull_pct: number;
    // cent_pct: number;
    // oppo_pct: number;
}

// Data transformation functions (would be implemented when connecting to real data)

export const adaptTrackManToPitchType = (pitchData: any[]): PitchTypeDetail => {
    // Example transformation logic (commented implementation)
    /*
    const pitchType = pitchData[0]?.pitch_type || 'Unknown';
    
    const velocities = pitchData.map(p => p.release_speed).filter(v => v > 0);
    const vAvg = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    const vStd = Math.sqrt(velocities.reduce((sum, v) => sum + Math.pow(v - vAvg, 2), 0) / velocities.length);
    
    const spinRates = pitchData.map(p => p.spin_rate).filter(s => s > 0);
    const spinAvg = spinRates.reduce((sum, s) => sum + s, 0) / spinRates.length;
    
    // Calculate usage by count
    const countUsage = {
      '0-0': 0, '0-2': 0, '1-0': 0, '2-2': 0, '3-2': 0
    };
    
    pitchData.forEach(pitch => {
      const count = `${pitch.balls}-${pitch.strikes}`;
      if (count in countUsage) {
        countUsage[count as keyof typeof countUsage]++;
      }
    });
    
    const totalPitches = pitchData.length;
    Object.keys(countUsage).forEach(count => {
      countUsage[count as keyof typeof countUsage] = 
        (countUsage[count as keyof typeof countUsage] / totalPitches) * 100;
    });
    
    // Calculate whiff rate
    const swings = pitchData.filter(p => ['swinging_strike', 'foul', 'in_play'].includes(p.play_outcome));
    const whiffs = pitchData.filter(p => p.play_outcome === 'swinging_strike');
    const whiffRate = swings.length > 0 ? (whiffs.length / swings.length) * 100 : 0;
    
    // Build location heatmap (13-zone grid)
    const locHeatmap = new Array(13).fill(0);
    pitchData.forEach(pitch => {
      if (pitch.zone >= 1 && pitch.zone <= 13) {
        locHeatmap[pitch.zone - 1]++;
      }
    });
    
    return {
      type: pitchType,
      vAvg: Math.round(vAvg * 10) / 10,
      vStd: Math.round(vStd * 100) / 100,
      spinAvg: Math.round(spinAvg),
      ivb: Math.round((pitchData[0]?.induced_vert_break || 0) * 10) / 10,
      hb: Math.round((pitchData[0]?.horizontal_break || 0) * 10) / 10,
      usageOverall: Math.round((totalPitches / totalPitches) * 100), // Would be calculated against all pitches
      usageByCount: countUsage,
      whiffRate: Math.round(whiffRate),
      putAwayRate: 0, // Calculate from 2-strike scenarios
      locHeatmap,
      spray: {
        gb: 0, // Calculate from batted ball data
        fb: 0,
        ld: 0
      }
    };
    */

    // Return empty object for now - would implement above logic with real data
    return {} as PitchTypeDetail;
};

export const adaptTruMediaToHitter = (hitterData: any): Hitter => {
    // Example transformation logic (commented implementation)
    /*
    const hotColdZones = [
      hitterData.zone_1_woba || 0,
      hitterData.zone_2_woba || 0,
      hitterData.zone_3_woba || 0,
      // ... continue for all 13 zones
    ];
    
    const vsPitchType: HitterVsPitchType[] = [
      {
        pitchType: '4S',
        xwOBA: hitterData.vs_fastball_xwoba || 0.300,
        whiffRate: hitterData.vs_fastball_whiff_pct || 20,
        chaseRate: hitterData.vs_fastball_chase_pct || 25
      },
      {
        pitchType: 'SL',
        xwOBA: hitterData.vs_slider_xwoba || 0.280,
        whiffRate: hitterData.vs_slider_whiff_pct || 35,
        chaseRate: hitterData.vs_slider_chase_pct || 40
      },
      // ... continue for other pitch types
    ];
    
    return {
      id: hitterData.player_id,
      name: `${hitterData.first_name} ${hitterData.last_name}`,
      bats: hitterData.bat_side,
      position: hitterData.position,
      hotColdZones,
      sprayChart: {
        pull: hitterData.pull_pct || 35,
        oppo: hitterData.oppo_pct || 25,
        cent: hitterData.cent_pct || 40
      },
      chaseRate: hitterData.chase_rate || 30,
      zContact: hitterData.z_contact_pct || 85,
      zzContact: hitterData.o_contact_pct || 65,
      whiff: hitterData.whiff_pct || 25,
      batProfile: {
        gb: hitterData.gb_pct || 45,
        fb: hitterData.fb_pct || 35,
        ld: hitterData.ld_pct || 20
      },
      vsPitchType,
      approachByCount: {
        ahead: hitterData.ahead_approach || 'Aggressive on strikes',
        behind: hitterData.behind_approach || 'Protect with 2 strikes',
        even: hitterData.even_approach || 'Zone discipline'
      },
      sbTendencies: {
        attempts: hitterData.sb_attempts || 0,
        successRate: hitterData.sb_success_pct || 75,
        preferredCounts: hitterData.sb_preferred_counts?.split(',') || []
      },
      buntFreq: hitterData.bunt_frequency_pct || 2
    };
    */

    // Return empty object for now - would implement above logic with real data
    return {} as Hitter;
};

// Utility functions for data validation and cleaning
export const validatePitchData = (pitch: PitchTypeDetail): boolean => {
    return (
        pitch.vAvg > 50 && pitch.vAvg < 110 &&
        pitch.spinAvg > 1000 && pitch.spinAvg < 4000 &&
        pitch.usageOverall >= 0 && pitch.usageOverall <= 100 &&
        pitch.whiffRate >= 0 && pitch.whiffRate <= 100
    );
};

export const validateHitterData = (hitter: Hitter): boolean => {
    return (
        hitter.chaseRate >= 0 && hitter.chaseRate <= 100 &&
        hitter.zContact >= 0 && hitter.zContact <= 100 &&
        hitter.zzContact >= 0 && hitter.zzContact <= 100 &&
        hitter.hotColdZones.length === 13
    );
};

// Data aggregation helpers
export const calculatePitcherDominance = (pitcher: Pitcher): number => {
    const avgWhiff = pitcher.pitchTypes.reduce((sum, pt) => sum + pt.whiffRate, 0) / pitcher.pitchTypes.length;
    const avgPutAway = pitcher.pitchTypes.reduce((sum, pt) => sum + pt.putAwayRate, 0) / pitcher.pitchTypes.length;
    return Math.round((avgWhiff + avgPutAway) / 2);
};

export const calculateHitterDanger = (hitter: Hitter): number => {
    const avgHotZone = hitter.hotColdZones.filter(zone => zone > 0).reduce((sum, zone) => sum + zone, 0) /
        hitter.hotColdZones.filter(zone => zone > 0).length || 0;
    const disciplineScore = 100 - hitter.chaseRate;
    return Math.round((avgHotZone * 100 + disciplineScore) / 2);
};

// Export all functions
export default {
    adaptTrackManToPitchType,
    adaptTruMediaToHitter,
    validatePitchData,
    validateHitterData,
    calculatePitcherDominance,
    calculateHitterDanger
};
