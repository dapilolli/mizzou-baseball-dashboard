from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import json
import os
import numpy as np

# Helper function for flexible name matching
def find_player_stats(player_name, stats_df):
    """
    Find player stats using flexible name matching.
    Handles cases like 'S. Horn' matching 'Horn' or 'J. Lovich' matching 'Lovich'
    """
    if pd.isna(player_name) or player_name == '':
        return pd.DataFrame()
    
    # Clean the player name
    clean_name = str(player_name).strip()
    
    # First try exact match
    exact_match = stats_df[stats_df['Player'].str.lower() == clean_name.lower()]
    if not exact_match.empty:
        return exact_match
    
    # If exact match fails, try partial matching
    # Split the name and try matching by last name
    name_parts = clean_name.split()
    
    for part in name_parts:
        # Skip single letters or initials
        if len(part) <= 2 and part.endswith('.'):
            continue
            
        # Try matching this part of the name
        partial_match = stats_df[stats_df['Player'].str.lower().str.contains(part.lower(), na=False)]
        if not partial_match.empty:
            return partial_match
    
    # Try reverse - see if any player name contains our search name
    contains_match = stats_df[stats_df['Player'].str.lower().str.contains(clean_name.lower(), na=False)]
    if not contains_match.empty:
        return contains_match
    
    return pd.DataFrame()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, use exact domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File paths
PDP_FILE = "../data/pdp_hitters.json"           # Hitters
PDP_PITCHERS_FILE = "../data/pdp_pitchers.json"

# ---------------------- Load Data Functions ----------------------

def load_hitters_summary():
    df = pd.read_csv("../data/Missouri - Hitting.csv")
    df = df[df['player'].notna()]
    
    # Handle missing values and convert ALL percentage columns to numeric
    percentage_cols = ['Miss% vs CH', 'Miss% vs Spin', 'Miss% vs FB', 'ChangeMiss%', 'RISPPull%', 
                       'FastMiss%', 'Swing%', 'HOppFld%', 'HPull%', 'HardHit%', 'Barrel%', 'BB%', 'K%']
    
    for col in percentage_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col].str.rstrip('%'), errors='coerce')
    
    # Handle missing values in ALL numeric columns
    numeric_cols = ['LaunchAng', 'AvgEV', 'MaxEV', 'xSLG', 'xWOBA', 'wOBA', 'PA', 'AB', 'BA', 'OBP', 'SLG', 'OPS', 'H', '1B', '2B', '3B', 'HR']
    
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Fill NaN values with 0 for display purposes
    df = df.fillna(0)
    
    # Return ALL columns (just rename player column for consistency)
    df = df.rename(columns={'player': 'Player'})
    
    return df

def load_pitchers_summary():
    df = pd.read_csv("../data/Missouri - Pitching.csv")
    df = df[df['player'].notna()]
    
    # Handle missing values and convert ALL percentage columns to numeric
    percentage_cols = ['K%', 'BB%', 'K%-BB%', 'CSW%', 'FPStk%', 'InZone%', 'Chase%', 'HardHit%', 'Barrel%']
    
    for col in percentage_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col].str.rstrip('%'), errors='coerce')
    
    # Handle missing values in ALL numeric columns
    numeric_cols = ['IP', 'RA9-ERA', 'ERA', 'RA/9', 'WHIP', 'FIP', 'xFIP_TM', 'wOBA', 'xWOBA', 'GB/FB']
    
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Fill NaN values with 0 for display purposes
    df = df.fillna(0)
    
    # Return ALL columns (just rename player column for consistency)
    df = df.rename(columns={'player': 'Player'})
    
    return df

def load_pdp_jsons():
    hitters = {}
    pitchers = {}
    if os.path.exists(PDP_FILE):
        with open(PDP_FILE) as f:
            hitters = json.load(f)
    if os.path.exists(PDP_PITCHERS_FILE):
        with open(PDP_PITCHERS_FILE) as f:
            pitchers = json.load(f)
    return hitters, pitchers

def load_pxp_data():
    """Load pitch-by-pitch data for splits analysis"""
    hitters_pxp = pd.read_csv("../data/Missouri Hitters - Pitch Level Data.csv")
    pitchers_pxp = pd.read_csv("../data/Missouri Pitchers - Pitch Level Data.csv")
    return hitters_pxp, pitchers_pxp

def load_training_drills():
    """Load training drills from CSV file"""
    try:
        df = pd.read_csv("../data/Training_Drills.csv")
        print(f"Successfully loaded {len(df)} drill records from CSV")
        drills = {}
        
        for _, row in df.iterrows():
            drill_data = {
                'id': row['drill_id'],
                'title': row['drill_name'],
                'description': row['description'],
                'detailed_instructions': row['detailed_instructions'],
                'category': row['category'],
                'development_area': row['development_area'],
                'tier': row['tier'],
                'player_type': row['player_type'],
                'equipment_needed': row['equipment_needed'],
                'duration_minutes': row['duration_minutes'],
                'weekly_target': {
                    'reps': row['weekly_target_reps'] if pd.notna(row['weekly_target_reps']) and row['weekly_target_reps'] > 0 else None,
                    'swings': row['weekly_target_swings'] if pd.notna(row['weekly_target_swings']) and row['weekly_target_swings'] > 0 else None,
                    'pitches': row['weekly_target_pitches'] if pd.notna(row['weekly_target_pitches']) and row['weekly_target_pitches'] > 0 else None,
                    'min_success_rate': row['min_success_rate'],
                    'frequency': row['frequency_per_week']
                },
                'metrics_tracked': row['metrics_tracked'],
                'progress_history': []
            }
            drills[row['drill_id']] = drill_data
        
        print(f"Successfully processed {len(drills)} drills")
        return drills
    except Exception as e:
        print(f"Error loading training drills: {e}")
        return {}

def load_alabama_hitters():
    """Load Alabama hitters season stats"""
    try:
        df = pd.read_csv("../data/Alabama - Hitting Stats.csv")
        df = df[df['player'].notna()]
        
        # Handle missing values and convert percentage columns to numeric
        percentage_cols = ['Miss% vs CH', 'Miss% vs Spin', 'Miss% vs FB', 'ChangeMiss%', 'RISPPull%', 
                          'FastMiss%', 'Swing%', 'HOppFld%', 'HPull%', 'HardHit%', 'Barrel%', 'BB%', 'K%']
        
        for col in percentage_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col].str.rstrip('%'), errors='coerce')
        
        # Handle missing values in numeric columns
        numeric_cols = ['LaunchAng', 'AvgEV', 'MaxEV', 'xSLG', 'xWOBA', 'wOBA', 'PA', 'AB', 'BA', 'OBP', 'SLG', 'OPS', 'H', '1B', '2B', '3B', 'HR']
        
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Fill NaN values with 0
        df = df.fillna(0)
        df = df.rename(columns={'player': 'Player'})
        
        return df
    except Exception as e:
        print(f"Error loading Alabama hitters: {e}")
        return pd.DataFrame()

def load_alabama_pitchers():
    """Load Alabama pitchers season stats"""
    try:
        df = pd.read_csv("../data/Alabama - Pitching.csv")
        df = df[df['player'].notna()]
        
        # Handle missing values and convert percentage columns to numeric
        percentage_cols = ['K%', 'BB%', 'K%-BB%', 'CSW%', 'FPStk%', 'InZone%', 'Chase%', 'HardHit%', 'Barrel%']
        
        for col in percentage_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col].str.rstrip('%'), errors='coerce')
        
        # Handle missing values in numeric columns
        numeric_cols = ['IP', 'RA9-ERA', 'ERA', 'RA/9', 'WHIP', 'FIP', 'xFIP_TM', 'wOBA', 'xWOBA', 'GB/FB']
        
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Fill NaN values with 0
        df = df.fillna(0)
        df = df.rename(columns={'player': 'Player'})
        
        return df
    except Exception as e:
        print(f"Error loading Alabama pitchers: {e}")
        return pd.DataFrame()

def generate_pitch_recommendation(missouri_pitcher, alabama_batter, count, runners_on_base, inning):
    """Generate AI-powered pitch recommendations based on stats and game situation"""
    
    # Load data
    missouri_pitchers = load_pitchers_summary()
    alabama_hitters = load_alabama_hitters()
    
    # Find pitcher and batter stats using flexible matching
    pitcher_stats = find_player_stats(missouri_pitcher, missouri_pitchers)
    batter_stats = find_player_stats(alabama_batter, alabama_hitters)
    
    recommendations = []
    
    if not pitcher_stats.empty and not batter_stats.empty:
        pitcher = pitcher_stats.iloc[0]
        batter = batter_stats.iloc[0]
        
        # Parse count
        balls, strikes = map(int, count.split('-'))
        
        # Analyze batter weaknesses
        if batter['Miss% vs FB'] > 20:
            recommendations.append({
                'pitch': 'Fastball',
                'reasoning': f"Batter has {batter['Miss% vs FB']:.1f}% miss rate vs fastballs",
                'confidence': 'High' if batter['Miss% vs FB'] > 25 else 'Medium'
            })
        
        if batter['Miss% vs CH'] > 30:
            recommendations.append({
                'pitch': 'Changeup',
                'reasoning': f"Batter struggles vs changeups ({batter['Miss% vs CH']:.1f}% miss rate)",
                'confidence': 'High' if batter['Miss% vs CH'] > 40 else 'Medium'
            })
        
        if batter['Miss% vs Spin'] > 25:
            recommendations.append({
                'pitch': 'Breaking Ball',
                'reasoning': f"Batter has {batter['Miss% vs Spin']:.1f}% miss rate vs spin pitches",
                'confidence': 'High' if batter['Miss% vs Spin'] > 30 else 'Medium'
            })
        
        # Count-specific recommendations
        if strikes == 2:
            recommendations.append({
                'pitch': 'Breaking Ball',
                'reasoning': f"Two-strike count - exploit {batter['K%']:.1f}% K rate",
                'confidence': 'High'
            })
        
        if balls >= 2:
            recommendations.append({
                'pitch': 'Fastball for Strike',
                'reasoning': f"Behind in count - attack with {pitcher['FPStk%']:.1f}% first pitch strike rate",
                'confidence': 'Medium'
            })
        
        # Situational recommendations
        if any(runners_on_base.values()):
            if batter['RISPPull%'] > 40:
                recommendations.append({
                    'pitch': 'Away',
                    'reasoning': f"Runners in scoring position - batter pulls {batter['RISPPull%']:.1f}% with RISP",
                    'confidence': 'Medium'
                })
    
    # Default recommendations if no specific data
    if not recommendations:
        recommendations.append({
            'pitch': 'Fastball',
            'reasoning': 'Challenge the hitter with your best pitch',
            'confidence': 'Low'
        })
    
    return {
        'recommendations': recommendations[:3],  # Top 3 recommendations
        'pitcher_analysis': {
            'name': missouri_pitcher,
            'strengths': _analyze_pitcher_strengths(pitcher_stats) if not pitcher_stats.empty else [],
            'weaknesses': _analyze_pitcher_weaknesses(pitcher_stats) if not pitcher_stats.empty else []
        },
        'batter_analysis': {
            'name': alabama_batter,
            'weaknesses': _analyze_batter_weaknesses(batter_stats) if not batter_stats.empty else [],
            'strengths': _analyze_batter_strengths(batter_stats) if not batter_stats.empty else []
        }
    }

def _analyze_pitcher_strengths(pitcher_stats):
    """Analyze pitcher's strengths based on stats"""
    if pitcher_stats.empty:
        return []
    
    pitcher = pitcher_stats.iloc[0]
    strengths = []
    
    if pitcher['K%'] > 25:
        strengths.append(f"High strikeout rate ({pitcher['K%']:.1f}%)")
    if pitcher['BB%'] < 8:
        strengths.append(f"Good control ({pitcher['BB%']:.1f}% walk rate)")
    if pitcher['CSW%'] > 32:
        strengths.append(f"Strong called strike + whiff rate ({pitcher['CSW%']:.1f}%)")
    if pitcher['Chase%'] > 28:
        strengths.append(f"Gets hitters to chase ({pitcher['Chase%']:.1f}%)")
    
    return strengths

def _analyze_pitcher_weaknesses(pitcher_stats):
    """Analyze pitcher's weaknesses based on stats"""
    if pitcher_stats.empty:
        return []
    
    pitcher = pitcher_stats.iloc[0]
    weaknesses = []
    
    if pitcher['BB%'] > 12:
        weaknesses.append(f"High walk rate ({pitcher['BB%']:.1f}%)")
    if pitcher['HardHit%'] > 45:
        weaknesses.append(f"Allows hard contact ({pitcher['HardHit%']:.1f}%)")
    if pitcher['FPStk%'] < 60:
        weaknesses.append(f"Low first pitch strike rate ({pitcher['FPStk%']:.1f}%)")
    if pitcher['CSW%'] < 30:
        weaknesses.append(f"Low called strike + whiff rate ({pitcher['CSW%']:.1f}%)")
    if pitcher['Chase%'] < 25:
        weaknesses.append(f"Doesn't get hitters to chase ({pitcher['Chase%']:.1f}%)")
    if pitcher['InZone%'] < 45:
        weaknesses.append(f"Low in-zone rate ({pitcher['InZone%']:.1f}%)")
    if pitcher['K%'] < 20:
        weaknesses.append(f"Low strikeout rate ({pitcher['K%']:.1f}%)")
    
    return weaknesses

def _analyze_batter_weaknesses(batter_stats):
    """Analyze batter's weaknesses based on stats"""
    if batter_stats.empty:
        return []
    
    batter = batter_stats.iloc[0]
    weaknesses = []
    
    if batter['K%'] > 22:
        weaknesses.append(f"High strikeout rate ({batter['K%']:.1f}%)")
    if batter['Miss% vs FB'] > 18:
        weaknesses.append(f"Struggles vs fastballs ({batter['Miss% vs FB']:.1f}% miss rate)")
    if batter['Miss% vs CH'] > 35:
        weaknesses.append(f"Vulnerable to changeups ({batter['Miss% vs CH']:.1f}% miss rate)")
    if batter['Miss% vs Spin'] > 28:
        weaknesses.append(f"Struggles vs breaking balls ({batter['Miss% vs Spin']:.1f}% miss rate)")
    
    return weaknesses

def _analyze_batter_strengths(batter_stats):
    """Analyze batter's strengths based on stats"""
    if batter_stats.empty:
        return []
    
    batter = batter_stats.iloc[0]
    strengths = []
    
    if batter['OPS'] > 0.900:
        strengths.append(f"Excellent overall hitting ({batter['OPS']:.3f} OPS)")
    elif batter['OPS'] > 0.800:
        strengths.append(f"Good overall hitting ({batter['OPS']:.3f} OPS)")
    
    if batter['BB%'] > 12:
        strengths.append(f"Good plate discipline ({batter['BB%']:.1f}% walk rate)")
    if batter['HardHit%'] > 50:
        strengths.append(f"Makes hard contact ({batter['HardHit%']:.1f}%)")
    if batter['Barrel%'] > 15:
        strengths.append(f"High barrel rate ({batter['Barrel%']:.1f}%)")
    
    return strengths

def calculate_player_splits(player_name, player_type="hitter"):
    """Calculate various splits for a player based on PxP data"""
    hitters_pxp, pitchers_pxp = load_pxp_data()
    
    if player_type == "hitter":
        df = hitters_pxp[hitters_pxp['batter'].str.lower() == player_name.lower()]
    else:
        df = pitchers_pxp[pitchers_pxp['pitcher'].str.lower() == player_name.lower()]
    
    if df.empty:
        return {}
    
    # Convert columns to numeric, handling non-numeric values
    numeric_cols = ['ExitVel', 'xWOBA', 'LaunchAng', 'Vel', 'xSLG', 'xISO', 'xAVG', 'Spin', 'HorzBrk', 'IndVertBrk', 'Extension', 'pCallStrk%']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Remove rows where all numeric columns are NaN
    df = df.dropna(subset=numeric_cols, how='all')
    
    if df.empty:
        return {}
    
    splits = {}
    
    # Count splits
    if not df['count'].isna().all():
        count_splits = df.groupby('count')[numeric_cols].mean().round(3)
        count_splits = count_splits.where(pd.notnull(count_splits), None)
        splits['counts'] = count_splits.to_dict('index')
    
    # Pitch type splits
    if not df['type'].isna().all():
        pitch_splits = df.groupby('type')[numeric_cols].mean().round(3)
        pitch_splits = pitch_splits.where(pd.notnull(pitch_splits), None)
        splits['pitch_types'] = pitch_splits.to_dict('index')
    
    # Velocity splits (create bins)
    if 'Vel' in df.columns and not df['Vel'].isna().all():
        df['vel_bin'] = pd.cut(df['Vel'], bins=[0, 80, 85, 90, 95, 100], labels=['<80', '80-85', '85-90', '90-95', '95+'])
        vel_splits = df.groupby('vel_bin')[['ExitVel', 'xWOBA', 'LaunchAng', 'xSLG', 'xISO', 'xAVG', 'Spin', 'HorzBrk', 'IndVertBrk']].mean().round(3)
        vel_splits = vel_splits.where(pd.notnull(vel_splits), None)
        splits['velocity'] = vel_splits.to_dict('index')
    
    # Base situation splits
    # Convert to numeric and handle missing values
    base_cols = ['ManOn1st', 'ManOn2nd', 'ManOn3rd']
    for col in base_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    df['base_situation'] = 'Empty'
    if all(col in df.columns for col in base_cols):
        df.loc[(df['ManOn1st'] == 1) & (df['ManOn2nd'] == 0) & (df['ManOn3rd'] == 0), 'base_situation'] = '1st Only'
        df.loc[(df['ManOn1st'] == 0) & (df['ManOn2nd'] == 1) & (df['ManOn3rd'] == 0), 'base_situation'] = '2nd Only'
        df.loc[(df['ManOn1st'] == 0) & (df['ManOn2nd'] == 0) & (df['ManOn3rd'] == 1), 'base_situation'] = '3rd Only'
        df.loc[(df['ManOn1st'] == 1) & (df['ManOn2nd'] == 1) & (df['ManOn3rd'] == 0), 'base_situation'] = '1st & 2nd'
        df.loc[(df['ManOn1st'] == 1) & (df['ManOn2nd'] == 0) & (df['ManOn3rd'] == 1), 'base_situation'] = '1st & 3rd'
        df.loc[(df['ManOn1st'] == 0) & (df['ManOn2nd'] == 1) & (df['ManOn3rd'] == 1), 'base_situation'] = '2nd & 3rd'
        df.loc[(df['ManOn1st'] == 1) & (df['ManOn2nd'] == 1) & (df['ManOn3rd'] == 1), 'base_situation'] = 'Loaded'
        
        base_splits = df.groupby('base_situation')[['ExitVel', 'xWOBA', 'LaunchAng', 'xSLG', 'xISO', 'xAVG', 'Spin', 'HorzBrk', 'IndVertBrk']].mean().round(3)
        base_splits = base_splits.where(pd.notnull(base_splits), None)
        splits['base_situations'] = base_splits.to_dict('index')
    
    # Outs splits
    if 'outs' in df.columns and not df['outs'].isna().all():
        df['outs'] = pd.to_numeric(df['outs'], errors='coerce')
        out_splits = df.groupby('outs')[['ExitVel', 'xWOBA', 'LaunchAng', 'xSLG', 'xISO', 'xAVG', 'Spin', 'HorzBrk', 'IndVertBrk']].mean().round(3)
        out_splits = out_splits.where(pd.notnull(out_splits), None)
        splits['outs'] = out_splits.to_dict('index')
    
    # Pitcher handedness splits (for hitters) / Batter handedness splits (for pitchers)
    if player_type == "hitter" and 'PitchHand' in df.columns and not df['PitchHand'].isna().all():
        pitch_hand_splits = df.groupby('PitchHand')[['ExitVel', 'xWOBA', 'LaunchAng', 'xSLG', 'xISO', 'xAVG', 'Spin', 'HorzBrk', 'IndVertBrk']].mean().round(3)
        pitch_hand_splits = pitch_hand_splits.where(pd.notnull(pitch_hand_splits), None)
        splits['vs_pitcher_hand'] = pitch_hand_splits.to_dict('index')
    elif player_type == "pitcher" and 'BatterHand' in df.columns and not df['BatterHand'].isna().all():
        batter_hand_splits = df.groupby('BatterHand')[['ExitVel', 'xWOBA', 'LaunchAng', 'xSLG', 'xISO', 'xAVG', 'Spin', 'HorzBrk', 'IndVertBrk', 'Vel']].mean().round(3)
        batter_hand_splits = batter_hand_splits.where(pd.notnull(batter_hand_splits), None)
        splits['vs_batter_hand'] = batter_hand_splits.to_dict('index')
    
    # Own handedness context (add player's handedness for reference)
    if player_type == "hitter" and 'BatterHand' in df.columns and not df['BatterHand'].isna().all():
        player_hand = df['BatterHand'].iloc[0] if len(df) > 0 else None
        splits['player_handedness'] = {'hand': player_hand, 'type': 'batter'}
    elif player_type == "pitcher" and 'PitchHand' in df.columns and not df['PitchHand'].isna().all():
        player_hand = df['PitchHand'].iloc[0] if len(df) > 0 else None
        splits['player_handedness'] = {'hand': player_hand, 'type': 'pitcher'}
    
    return splits

def generate_hitting_recommendation(missouri_batter, alabama_pitcher, count, runners_on_base, inning):
    """Generate AI-powered hitting recommendations based on stats and game situation"""
    
    # Load data
    missouri_hitters = load_hitters_summary()
    alabama_pitchers = load_alabama_pitchers()
    
    # Find batter and pitcher stats using flexible matching
    batter_stats = find_player_stats(missouri_batter, missouri_hitters)
    pitcher_stats = find_player_stats(alabama_pitcher, alabama_pitchers)
    
    recommendations = []
    
    if not batter_stats.empty and not pitcher_stats.empty:
        batter = batter_stats.iloc[0]
        pitcher = pitcher_stats.iloc[0]
        
        # Parse count
        balls, strikes = map(int, count.split('-'))
        
        # Analyze pitcher weaknesses for hitting strategy using coaching phrases
        if pitcher.get('BB%', 0) > 12:
            recommendations.append({
                'approach': 'Make him work',
                'reasoning': f"Pitcher walks {pitcher['BB%']:.1f}% of batters - force him to throw strikes",
                'confidence': 'High' if pitcher['BB%'] > 15 else 'Medium'
            })
        
        if pitcher.get('FPStk%', 0) < 60:
            recommendations.append({
                'approach': 'Yes until no',
                'reasoning': f"Pitcher only throws {pitcher['FPStk%']:.1f}% first pitch strikes - be aggressive early",
                'confidence': 'Medium'
            })
        
        if pitcher.get('HardHit%', 0) > 45:
            recommendations.append({
                'approach': 'Hunt the mistake — don\'t miss it',
                'reasoning': f"Pitcher allows {pitcher['HardHit%']:.1f}% hard contact - attack mistakes",
                'confidence': 'High' if pitcher['HardHit%'] > 50 else 'Medium'
            })
        
        # Count-specific hitting recommendations using coaching phrases
        if balls >= 2:
            recommendations.append({
                'approach': 'Sit one pitch',
                'reasoning': f"Pitcher behind in count - look for your pitch",
                'confidence': 'High'
            })
        
        if strikes == 2:
            recommendations.append({
                'approach': 'Shorten up, win the battle',
                'reasoning': f"Two strikes - focus on contact over power",
                'confidence': 'High'
            })
        
        if balls == 3 and strikes <= 1:
            recommendations.append({
                'approach': 'Know what you\'ll take, know what you\'ll hammer',
                'reasoning': f"Hitter's count - be selective but aggressive on your pitch",
                'confidence': 'High'
            })
        
        # Batter strengths using coaching phrases
        if batter.get('HardHit%', 0) > 45:
            recommendations.append({
                'approach': 'Get big on yours, small on theirs',
                'reasoning': f"You make {batter['HardHit%']:.1f}% hard contact - hunt your pitch",
                'confidence': 'Medium'
            })
        
        if batter.get('BB%', 0) > 12:
            recommendations.append({
                'approach': 'Shrink the plate',
                'reasoning': f"You walk {batter['BB%']:.1f}% - use your discipline",
                'confidence': 'Medium'
            })
        
        # Situational hitting recommendations using coaching phrases
        if any(runners_on_base.values()):
            if runners_on_base.get('third') or runners_on_base.get('second'):
                recommendations.append({
                    'approach': 'Win it before you\'re in it',
                    'reasoning': "Runner in scoring position - commit to your plan",
                    'confidence': 'Medium'
                })
    
    # Default recommendations if no specific data
    if not recommendations:
        recommendations.append({
            'approach': 'Win it before you\'re in it',
            'reasoning': 'Commit to your plan before stepping in the box',
            'confidence': 'Low'
        })
    
    return {
        'recommendations': recommendations[:3],  # Top 3 recommendations
        'batter_analysis': {
            'name': missouri_batter,
            'strengths': _analyze_batter_strengths(batter_stats) if not batter_stats.empty else [],
            'weaknesses': _convert_weaknesses_to_approaches(batter_stats, pitcher_stats, count, runners_on_base)
        },
        'pitcher_analysis': {
            'name': alabama_pitcher,
            'weaknesses': _analyze_pitcher_weaknesses(pitcher_stats) if not pitcher_stats.empty else [],
            'strengths': _analyze_pitcher_strengths(pitcher_stats) if not pitcher_stats.empty else []
        }
    }

def load_coaching_phrases():
    """Load coaching phrases from CSV"""
    try:
        df = pd.read_csv("../data/Baseball_Coach_Phrases_20.csv")
        return df
    except FileNotFoundError:
        return pd.DataFrame()

def _convert_weaknesses_to_approaches(batter_stats, pitcher_stats=None, count=None, runners_on_base=None):
    """Convert pitcher weaknesses and game situation into single actionable coaching approach"""
    
    # Parse count if provided
    balls, strikes = 0, 0
    if count:
        try:
            balls, strikes = map(int, count.split('-'))
        except:
            pass
    
    # If we have pitcher stats, base approach on pitcher's weaknesses
    if pitcher_stats is not None and not pitcher_stats.empty:
        pitcher = pitcher_stats.iloc[0]
        
        # Game situation takes priority
        if strikes == 2:
            return ["Shorten up, win the battle"]
        elif balls == 3 and strikes <= 1:
            return ["Know what you'll take, know what you'll hammer"]
        elif balls >= 2:
            return ["Sit one pitch"]
        
        # Base on pitcher's main weakness
        if pitcher.get('BB%', 0) > 12:
            return ["Make him work"]
        elif pitcher.get('FPStk%', 0) < 60:
            return ["Yes until no"]
        elif pitcher.get('HardHit%', 0) > 45:
            return ["Hunt the mistake — don't miss it"]
        elif pitcher.get('Chase%', 0) < 25:
            return ["Shrink the plate"]
        elif pitcher.get('CSW%', 0) < 30:
            return ["Get big on yours, small on theirs"]
        else:
            # Situational based on runners
            if runners_on_base and (runners_on_base.get('second') or runners_on_base.get('third')):
                return ["Win it before you're in it"]
            else:
                return ["Be early in the zone"]
    
    # Fallback to batter-based approach if no pitcher data
    if not batter_stats.empty:
        batter = batter_stats.iloc[0]
        
        if batter['K%'] > 22:
            return ["Slow the game down"]
        elif batter['Miss% vs FB'] > 18:
            return ["Be early in the zone"]
        elif batter.get('BB%', 0) < 8:
            return ["Make him work"]
        else:
            return ["See it up / See it down"]
    
    return ["Win it before you're in it"]

def _convert_weaknesses_to_approaches_fallback(batter_stats):
    """Fallback function if CSV is not available"""
    if batter_stats.empty:
        return []
    
    batter = batter_stats.iloc[0]
    approaches = []
    
    if batter['K%'] > 22:
        approaches.append("Stay Back and See the Ball")
    if batter['Miss% vs FB'] > 18:
        approaches.append("Zone Up - Attack Fastballs Early")
    if batter['Miss% vs CH'] > 35:
        approaches.append("Stay on Top of Off-Speed")
    if batter['Miss% vs Spin'] > 28:
        approaches.append("Hunt Your Pitch in Hitter's Counts")
    if batter.get('BB%', 0) < 8:
        approaches.append("Work the Count - Be More Patient")
    if batter.get('HardHit%', 0) < 40:
        approaches.append("Trust Your Swing - Be Aggressive")
    
    return approaches

# ---------------------- Static Load ----------------------

hitters_summary = load_hitters_summary()
pitchers_summary = load_pitchers_summary()

# ---------------------- Endpoints ----------------------

@app.get("/team/hitters")
def team_hitters():
    return JSONResponse(content=hitters_summary.to_dict(orient="records"))

@app.get("/team/pitchers")
def team_pitchers():
    return JSONResponse(content=pitchers_summary.to_dict(orient="records"))

@app.get("/reports/{player_id}")
def get_player_report(player_id: str):
    try:
        # First, try to find player in hitting data
        hitting_df = pd.read_csv("../data/Missouri - Hitting.csv")
        hitting_player = hitting_df[hitting_df['player'].str.lower() == player_id.lower()]
        
        # If not found in hitting, try pitching data
        pitching_df = pd.read_csv("../data/Missouri - Pitching.csv")
        pitching_player = pitching_df[pitching_df['player'].str.lower() == player_id.lower()]
        
        player_stats = None
        player_type = None
        
        if not hitting_player.empty:
            player_type = "hitter"
            player_stats = hitting_player.iloc[0].to_dict()
            true_season_woba = float(player_stats['wOBA']) if pd.notna(player_stats['wOBA']) else 0.0
            true_season_ev = float(player_stats['AvgEV']) if pd.notna(player_stats['AvgEV']) else 0.0
        elif not pitching_player.empty:
            player_type = "pitcher"
            player_stats = pitching_player.iloc[0].to_dict()
            
            # Helper function to parse percentage strings
            def parse_percentage(value):
                if pd.isna(value) or value == '':
                    return 0.0
                if isinstance(value, str) and value.endswith('%'):
                    return float(value.replace('%', ''))
                return float(value) if pd.notna(value) else 0.0
            
            # For pitchers, create a simple progression chart with their season stats
            true_season_era = float(player_stats['ERA']) if pd.notna(player_stats['ERA']) else 0.0
            true_season_whip = float(player_stats['WHIP']) if pd.notna(player_stats['WHIP']) else 0.0
            true_season_k_rate = parse_percentage(player_stats['K%'])
            
            # Create a basic progression chart for pitchers
            daily_stats = pd.DataFrame({
                'date': [pd.Timestamp('2025-03-01'), pd.Timestamp('2025-04-01'), pd.Timestamp('2025-05-20')],
                'ERA': [true_season_era + 1.0, true_season_era + 0.5, true_season_era],
                'WHIP': [true_season_whip + 0.2, true_season_whip + 0.1, true_season_whip],
                'K%': [max(0, true_season_k_rate - 5), true_season_k_rate - 2, true_season_k_rate]
            })
            
            # Convert date to string for JSON serialization
            daily_stats['date'] = daily_stats['date'].dt.strftime('%Y-%m-%d')
            
            return JSONResponse(content={
                "player_type": player_type,
                "player_stats": player_stats,
                "chart_data": daily_stats.to_dict(orient="records")
            })
        else:
            return JSONResponse(content={"error": f"Player {player_id} not found in team data"}, status_code=404)

        # For hitters, continue with chart data generation
        if player_type == "hitter":
            # For Lovich, use his game-by-game data
            if player_id.lower() == 'lovich':
                # Load the game-by-game hitting stats
                df = pd.read_csv("../data/J. Lovich - Hitting Stats.csv")
                
                # Clean and convert date column
                df['date'] = pd.to_datetime(df['date'], errors='coerce')
                
                # Remove rows with invalid dates
                df = df.dropna(subset=['date'])
                
                # Convert numeric columns
                df['wOBA'] = pd.to_numeric(df['wOBA'], errors='coerce')
                df['AvgEV'] = pd.to_numeric(df['AvgEV'], errors='coerce')
                
                # Sort by date (ascending - earliest games first for proper rolling calculation)
                df = df.sort_values('date')
                
                # Create rolling averages (cumulative from season start)
                df['rolling_wOBA'] = df['wOBA'].expanding().mean()
                df['rolling_AvgEV'] = df['AvgEV'].expanding().mean()
                
                # Adjust final rolling values to match team totals exactly
                final_game_woba = df['rolling_wOBA'].iloc[-1]
                final_game_ev = df['rolling_AvgEV'].iloc[-1]
                
                # Scale the rolling values so the final value matches the team total
                if final_game_woba != 0:
                    woba_scale_factor = true_season_woba / final_game_woba
                    df['rolling_wOBA'] = df['rolling_wOBA'] * woba_scale_factor
                
                if final_game_ev != 0:
                    ev_scale_factor = true_season_ev / final_game_ev
                    df['rolling_AvgEV'] = df['rolling_AvgEV'] * ev_scale_factor
                
                # Prepare final dataset
                daily_stats = df[['date', 'rolling_AvgEV', 'rolling_wOBA']].copy()
                
                # Fill NaN values with 0 and round for display
                daily_stats['rolling_AvgEV'] = daily_stats['rolling_AvgEV'].fillna(0).round(1)
                daily_stats['rolling_wOBA'] = daily_stats['rolling_wOBA'].fillna(0).round(3)
                
            else:
                # For other players, create a simple single-point chart with their season totals
                # Since we don't have game-by-game data for other players
                daily_stats = pd.DataFrame({
                    'date': [pd.Timestamp('2025-05-20')],  # Use season end date
                    'rolling_AvgEV': [true_season_ev],
                    'rolling_wOBA': [true_season_woba]
                })
            
            # Rename columns to match frontend expectations
            daily_stats = daily_stats.rename(columns={
                'rolling_wOBA': 'wOBA',
                'rolling_AvgEV': 'ExitSpeed'
            })
            
            # Add LaunchAng for compatibility (use 0 as placeholder)
            daily_stats['LaunchAng'] = 0.0
            
            # Convert date back to string for JSON serialization
            daily_stats['date'] = daily_stats['date'].dt.strftime('%Y-%m-%d')
            
            return JSONResponse(content={
                "player_type": player_type,
                "player_stats": player_stats,
                "chart_data": daily_stats.to_dict(orient="records")
            })
        
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/splits/{player_id}")
def get_player_splits(player_id: str):
    """Get detailed splits analysis for a player"""
    try:
        # First determine if player is hitter or pitcher
        hitting_df = pd.read_csv("../data/Missouri - Hitting.csv")
        hitting_player = hitting_df[hitting_df['player'].str.lower() == player_id.lower()]
        
        pitching_df = pd.read_csv("../data/Missouri - Pitching.csv")
        pitching_player = pitching_df[pitching_df['player'].str.lower() == player_id.lower()]
        
        if not hitting_player.empty:
            player_type = "hitter"
        elif not pitching_player.empty:
            player_type = "pitcher"
        else:
            return JSONResponse(content={"error": f"Player {player_id} not found"}, status_code=404)
        
        splits_data = calculate_player_splits(player_id, player_type)
        
        # Convert NaN values to None for JSON serialization
        def clean_nans(obj):
            if isinstance(obj, dict):
                return {k: clean_nans(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_nans(v) for v in obj]
            elif isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
                return None
            else:
                return obj
        
        cleaned_splits = clean_nans(splits_data)
        
        return JSONResponse(content={
            "player_type": player_type,
            "player_name": player_id,
            "splits": cleaned_splits
        })
        
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/scouting/{team_name}")
def scouting_report(team_name: str):
    df = pd.read_csv("../data/Other Team Aggregate Hitting Stats.csv")
    df = df[df["team"].str.lower() == team_name.lower()]
    df = df.sort_values(by="wOBA", ascending=False)
    return JSONResponse(content=df.to_dict(orient="records"))

@app.get("/pdp/list")
def list_all_pdp_players():
    hitters, pitchers = load_pdp_jsons()
    return {
        "hitters": sorted(hitters.keys()),
        "pitchers": sorted(pitchers.keys()),
        "all": sorted(set(hitters.keys()) | set(pitchers.keys()))
    }

@app.get("/pdp/drills")
def get_training_drills(player_type: str = None, tier: str = None):
    """Get training drills, optionally filtered by player type and tier"""
    try:
        all_drills = load_training_drills()
        
        # Filter drills based on parameters
        filtered_drills = {}
        for drill_id, drill_data in all_drills.items():
            # Check player type filter
            if player_type and drill_data['player_type'] != 'both' and drill_data['player_type'] != player_type:
                continue
                
            # Check tier filter
            if tier and drill_data['tier'] != 'All' and drill_data['tier'] != tier:
                continue
                
            filtered_drills[drill_id] = drill_data
        
        return JSONResponse(content={"drills": filtered_drills})
        
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/api/alabama-hitters")
def get_alabama_hitters():
    """Get Alabama hitters season stats"""
    try:
        hitters_df = load_alabama_hitters()
        return JSONResponse(content=hitters_df.to_dict('records'))
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/api/alabama-pitchers")
def get_alabama_pitchers():
    """Get Alabama pitchers season stats"""
    try:
        pitchers_df = load_alabama_pitchers()
        return JSONResponse(content=pitchers_df.to_dict('records'))
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/pitch-recommendation")
def get_pitch_recommendation(request: dict):
    """Generate AI-powered pitch recommendations"""
    try:
        missouri_pitcher = request.get('pitcher', '')
        alabama_batter = request.get('batter', '')
        count = request.get('count', '0-0')
        runners_on_base = request.get('runners', {'first': False, 'second': False, 'third': False})
        inning = request.get('inning', 1)
        
        recommendation = generate_pitch_recommendation(
            missouri_pitcher, alabama_batter, count, runners_on_base, inning
        )
        
        return JSONResponse(content=recommendation)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/hitting-recommendation")
def get_hitting_recommendation(request: dict):
    """Generate AI-powered hitting recommendations"""
    try:
        missouri_batter = request.get('batter', '')
        alabama_pitcher = request.get('pitcher', '')
        count = request.get('count', '0-0')
        runners_on_base = request.get('runners', {'first': False, 'second': False, 'third': False})
        inning = request.get('inning', 1)
        
        recommendation = generate_hitting_recommendation(
            missouri_batter, alabama_pitcher, count, runners_on_base, inning
        )
        
        return JSONResponse(content=recommendation)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/pdp/{player_name}")
def get_pdp(player_name: str):
    key = player_name.replace("-", " ").title()
    hitters, pitchers = load_pdp_jsons()
    if key in hitters:
        return hitters[key]
    elif key in pitchers:
        return pitchers[key]
    else:
        raise HTTPException(status_code=404, detail="Player not found")

@app.post("/pdp/{player_name}")
async def update_pdp(player_name: str, request: Request):
    key = player_name.replace("-", " ").title()
    body = await request.json()
    hitters, pitchers = load_pdp_jsons()

    updated = False

    if key in hitters:
        hitters[key].update({
            "goals": body.get("goals", []),
            "journal": body.get("journal", []),
            "routines": body.get("routines", [])
        })
        with open(PDP_FILE, "w") as f:
            json.dump(hitters, f, indent=2)
        updated = True
    elif key in pitchers:
        pitchers[key].update({
            "goals": body.get("goals", []),
            "journal": body.get("journal", []),
            "routines": body.get("routines", [])
        })
        with open(PDP_PITCHERS_FILE, "w") as f:
            json.dump(pitchers, f, indent=2)
        updated = True

    if not updated:
        raise HTTPException(status_code=404, detail="Player not found")
    
    return {"status": "success"}

@app.get("/pdp/{player_name}/dashboard")
def get_pdp_dashboard(player_name: str):
    """Get comprehensive dashboard data for a player's PDP"""
    try:
        # Determine player type first
        hitting_df = pd.read_csv("../data/Missouri - Hitting.csv")
        hitting_player = hitting_df[hitting_df['player'].str.lower() == player_name.lower()]
        
        pitching_df = pd.read_csv("../data/Missouri - Pitching.csv")
        pitching_player = pitching_df[pitching_df['player'].str.lower() == player_name.lower()]
        
        player_type = None
        current_stats = {}
        
        if not hitting_player.empty:
            player_type = "hitter"
            current_stats = hitting_player.iloc[0].to_dict()
        elif not pitching_player.empty:
            player_type = "pitcher"
            current_stats = pitching_player.iloc[0].to_dict()
        else:
            return JSONResponse(content={"error": f"Player {player_name} not found in team stats"}, status_code=404)
        
        # Load appropriate PDP goals and tier data based on player type
        if player_type == "hitter":
            goals_df = pd.read_csv("../data/Hitter_PDP_Goals.csv")
            tiers_df = pd.read_csv("../data/Hitter_Tier_Assignments.csv")
        else:
            goals_df = pd.read_csv("../data/Pitcher_PDP_Goals.csv")
            tiers_df = pd.read_csv("../data/Pitcher_Tier_Assignments.csv")
        
        # Find player in goals and tier data
        player_goals = goals_df[goals_df['Player'].str.lower() == player_name.lower()]
        player_tiers = tiers_df[tiers_df['Player'].str.lower() == player_name.lower()]
        
        if player_goals.empty:
            return JSONResponse(content={"error": f"Player {player_name} not found in PDP goals data"}, status_code=404)
        
        # Parse goals from the goals data
        goals_text = player_goals.iloc[0]['Goals (measurable)']
        parsed_goals = []
        
        if pd.notna(goals_text):
            # Split by | to get individual goals
            goal_parts = goals_text.split(' | ')
            for i, goal_part in enumerate(goal_parts):
                if ':' in goal_part:
                    metric_part, target_part = goal_part.split(':', 1)
                    metric_name = metric_part.strip()
                    
                    # Extract current and target values
                    if 'move from' in target_part:
                        # Format: "move from X to Y"
                        parts = target_part.strip().split(' to ')
                        if len(parts) == 2:
                            current_val_text = parts[0].replace('move from', '').strip()
                            target_val_text = parts[1].strip()
                            
                            # Extract numeric values
                            import re
                            current_match = re.search(r'[\d.]+', current_val_text)
                            target_match = re.search(r'[\d.]+', target_val_text)
                            
                            if current_match and target_match:
                                current_val = float(current_match.group())
                                target_val = float(target_match.group())
                                
                                # Calculate progress (simplified)
                                if '≤' in target_val_text:  # Goal is to reduce
                                    progress = max(0, min(100, (current_val - target_val) / current_val * 100))
                                else:  # Goal is to increase (≥)
                                    progress = min(100, (current_val / target_val) * 100)
                                
                                parsed_goals.append({
                                    "id": str(i + 1),
                                    "description": goal_part.strip(),
                                    "metric": metric_name,
                                    "current": current_val,
                                    "target": target_val,
                                    "progress": round(progress, 1),
                                    "lastUpdated": "2025-08-08",
                                    "completed": False
                                })
        
        # Build metrics with tiers
        metrics = []
        
        # Only use tier data if available
        if not player_tiers.empty:
            tier_row = player_tiers.iloc[0]
        else:
            tier_row = None
        
        if player_type == "hitter":
            metric_mapping = {
                'Miss% vs FB': 'Miss% vs FB',
                'Miss% vs Spin': 'Miss% vs Spin', 
                'Miss% vs CH': 'Miss% vs CH',
                'HardHit%': 'HardHit%',
                'Barrel%': 'Barrel%',
                'OPS': 'OPS'
            }
        else:  # pitcher
            metric_mapping = {
                'ERA': 'ERA',
                'K%-BB%': 'K%-BB%',
                'CSW%': 'CSW%',
                'FPStk%': 'FPStk%',
                'Chase%': 'Chase%',
                'HardHit%': 'HardHit%',
                'Barrel%': 'Barrel%'
            }
        
        for display_name, stat_key in metric_mapping.items():
            if stat_key in current_stats:
                # Get tier if available
                tier = 'Development'  # Default
                if tier_row is not None and stat_key in tier_row.index and pd.notna(tier_row[stat_key]):
                    tier = tier_row[stat_key]
                
                current_val = current_stats[stat_key]
                
                # Set targets based on metric type and current performance
                if player_type == "pitcher":
                    targets = {
                        'ERA': 3.50,
                        'K%-BB%': 18.0,
                        'CSW%': 32.0,
                        'FPStk%': 65.0,
                        'Chase%': 35.0,
                        'HardHit%': 35.0,
                        'Barrel%': 6.0
                    }
                else:  # hitter
                    targets = {
                        'Miss% vs FB': 20.0,
                        'Miss% vs Spin': 20.0,
                        'Miss% vs CH': 35.0,
                        'HardHit%': 35.0,
                        'Barrel%': 15.0,
                        'OPS': 0.850
                    }
                
                target = targets.get(stat_key, current_val * 1.1)
                
                # Generate simple trend data (mock)
                import random
                base_val = float(current_val) if pd.notna(current_val) else 0
                trend = [base_val + random.uniform(-0.5, 0.5) for _ in range(4)]
                trend[-1] = base_val  # Last value is current
                
                metrics.append({
                    "name": display_name,
                    "current": float(current_val) if pd.notna(current_val) else 0,
                    "target": target,
                    "tier": tier,
                    "trend": trend,
                    "unit": "%" if "%" in display_name else ""
                })
        
        # Player profile
        profile = {
            "name": player_name,
            "position": "INF/OF" if player_type == "hitter" else "RHP",
            "year": "Jr.",
            "status": "Healthy, cleared for full activity" if player_type == "hitter" else "Working on command consistency, cleared to pitch at 100%",
            "identity": "Contact-first hitter" if player_type == "hitter" else "Command-first pitcher",
            "type": player_type
        }
        
        # Player-specific coach notes
        if player_type == "pitcher":
            coach_notes = {
                "strengths": "Good fastball command, consistent delivery, improved stamina",
                "weaknesses": "Needs to develop secondary pitches, struggles with command in high-stress situations",
                "lastUpdated": "2025-08-08"
            }
        else:
            coach_notes = {
                "strengths": "Excellent plate discipline, consistent contact approach",
                "weaknesses": "Needs to improve against velocity, lower half engagement",
                "lastUpdated": "2025-08-08"
            }
        
        dashboard_data = {
            "profile": profile,
            "metrics": metrics,
            "goals": parsed_goals,
            "coach_notes": coach_notes
        }
        
        return JSONResponse(content=dashboard_data)
        
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/pdp/{player_name}/personalized-drills")
def get_personalized_drills(player_name: str):
    """Get personalized training drills for a specific player based on their tier and type"""
    try:
        # Determine player type first
        hitting_df = pd.read_csv("../data/Missouri - Hitting.csv")
        hitting_player = hitting_df[hitting_df['player'].str.lower() == player_name.lower()]
        
        pitching_df = pd.read_csv("../data/Missouri - Pitching.csv")
        pitching_player = pitching_df[pitching_df['player'].str.lower() == player_name.lower()]
        
        player_type = None
        if not hitting_player.empty:
            player_type = "hitter"
        elif not pitching_player.empty:
            player_type = "pitcher"
        else:
            return JSONResponse(content={"error": f"Player {player_name} not found"}, status_code=404)
        
        # Load tier data
        if player_type == "hitter":
            tiers_df = pd.read_csv("../data/Hitter_Tier_Assignments.csv")
        else:
            tiers_df = pd.read_csv("../data/Pitcher_Tier_Assignments.csv")
        
        player_tiers = tiers_df[tiers_df['Player'].str.lower() == player_name.lower()]
        
        # Determine overall tier (could be enhanced to use specific metric tiers)
        player_tier = 'Development'  # Default
        if not player_tiers.empty:
            # Use the most common tier or a specific logic
            tier_row = player_tiers.iloc[0]
            tier_counts = {}
            for col in tier_row.index:
                if col != 'Player' and pd.notna(tier_row[col]):
                    tier = tier_row[col]
                    tier_counts[tier] = tier_counts.get(tier, 0) + 1
            
            if tier_counts:
                player_tier = max(tier_counts, key=tier_counts.get)
        
        # Load all drills and filter for this player
        all_drills = load_training_drills()
        personalized_drills = {}
        
        for drill_id, drill_data in all_drills.items():
            # Include drills that match player type and tier, plus "All" drills
            if ((drill_data['player_type'] == player_type or drill_data['player_type'] == 'both') and
                (drill_data['tier'] == player_tier or drill_data['tier'] == 'All')):
                personalized_drills[drill_id] = drill_data
        
        return JSONResponse(content={
            "player_name": player_name,
            "player_type": player_type,
            "player_tier": player_tier,
            "drills": personalized_drills
        })
        
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/pdp/{player_name}/drill-log")
async def save_drill_log(player_name: str, request: Request):
    """Save drill log data for a player"""
    try:
        body = await request.json()
        
        # Create drill logs directory if it doesn't exist
        drill_logs_dir = "../data/drill_logs"
        os.makedirs(drill_logs_dir, exist_ok=True)
        
        # Create player-specific drill log file
        player_file = f"{drill_logs_dir}/{player_name.replace(' ', '_').lower()}_drill_logs.json"
        
        # Load existing logs or create new structure
        if os.path.exists(player_file):
            with open(player_file, 'r') as f:
                drill_logs = json.load(f)
        else:
            drill_logs = {
                "player_name": player_name,
                "player_type": body.get("player_type", "hitter"),
                "drill_logs": {}
            }
        
        # Initialize drill if it doesn't exist
        drill_id = body.get("drill_id")
        if drill_id not in drill_logs["drill_logs"]:
            drill_logs["drill_logs"][drill_id] = {
                "drill_title": body.get("drill_title", drill_id),
                "sessions": []
            }
        
        # Add new session data
        session_data = {
            "date": body.get("date"),
            "reps": body.get("reps"),
            "swings": body.get("swings"),
            "pitches": body.get("pitches"),
            "successRate": body.get("successRate"),
            "notes": body.get("notes", ""),
            "timestamp": pd.Timestamp.now().isoformat()
        }
        
        drill_logs["drill_logs"][drill_id]["sessions"].append(session_data)
        
        # Save updated logs
        with open(player_file, 'w') as f:
            json.dump(drill_logs, f, indent=2)
        
        return {"status": "success", "message": "Drill log saved successfully"}
        
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/pdp/{player_name}/drill-logs")
def get_drill_logs(player_name: str):
    """Get drill log history for a player"""
    try:
        drill_logs_dir = "../data/drill_logs"
        player_file = f"{drill_logs_dir}/{player_name.replace(' ', '_').lower()}_drill_logs.json"
        
        if not os.path.exists(player_file):
            return {"drill_logs": {}}
        
        with open(player_file, 'r') as f:
            drill_logs = json.load(f)
        
        return drill_logs
        
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# ---------------------- Gameday Demo Endpoints ----------------------

# Global variables for demo state
demo_data = None
current_pitch_index = 0

@app.get("/gameday/due-up")
def get_due_up_hitters():
    """Get the next 3 hitters due up for the batting team"""
    global demo_data, current_pitch_index
    
    try:
        if demo_data is None:
            load_combined_demo_data()
        
        if demo_data is None or current_pitch_index >= len(demo_data):
            return JSONResponse(content={"due_up": []})
        
        current_pitch = demo_data.iloc[current_pitch_index]
        current_inning = current_pitch['Inn']
        
        # Determine which team is hitting
        if 'Top' in str(current_inning):
            hitting_team = 'Missouri'
        else:
            hitting_team = 'Alabama'
        
        # Get all batters from the current point forward for the hitting team
        future_pitches = demo_data.iloc[current_pitch_index:]
        
        # Filter for the hitting team's at-bats
        if hitting_team == 'Missouri':
            team_at_bats = future_pitches[future_pitches['batter'].notna()]
        else:
            team_at_bats = future_pitches[future_pitches['batter'].notna()]
        
        # Get unique batters in order of appearance
        due_up = []
        seen_batters = set()
        
        for _, pitch in team_at_bats.iterrows():
            # Only include batters from the current hitting team's innings
            pitch_inning = pitch['Inn']
            if hitting_team == 'Missouri' and 'Top' not in str(pitch_inning):
                continue
            if hitting_team == 'Alabama' and 'Bot' not in str(pitch_inning):
                continue
                
            batter = pitch['batter']
            if batter and batter not in seen_batters:
                due_up.append(batter)
                seen_batters.add(batter)
                
            if len(due_up) >= 3:
                break
        
        # Pad with placeholders if we don't have 3 batters
        while len(due_up) < 3:
            due_up.append("TBD")
        
        return JSONResponse(content={
            "hitting_team": hitting_team,
            "due_up": due_up[:3]
        })
        
    except Exception as e:
        return JSONResponse(content={"error": str(e), "due_up": []}, status_code=500)

def load_combined_demo_data():
    """Load the MIZZOUVBAMA.csv data with proper inning ordering"""
    global demo_data
    try:
        # Load the new CSV file
        demo_data = pd.read_csv("../data/MIZZOUVBAMA.csv")
        
        # Map column names to match expected format
        column_mapping = {
            'inn': 'Inn',
            'Pitcher': 'pitcher', 
            'Batter': 'batter',
            'ABResult': 'PlayDesc'
        }
        
        # Rename columns to match the expected format
        for old_col, new_col in column_mapping.items():
            if old_col in demo_data.columns:
                demo_data = demo_data.rename(columns={old_col: new_col})
        
        # Add row number to preserve original chronological order within each inning
        demo_data['original_row'] = range(len(demo_data))
        
        # Create a proper inning ordering function
        def inning_sort_key(inning_str):
            if pd.isna(inning_str) or inning_str == 'Inn':
                return (99, 0)  # Put invalid entries at the end
            
            parts = str(inning_str).split(' ')
            if len(parts) != 2:
                return (99, 0)
            
            half = parts[0]  # 'Top' or 'Bot'
            try:
                inning_num = int(parts[1])
            except:
                return (99, 0)
            
            # Sort by inning number, then by half (Top=0, Bot=1)
            half_order = 0 if half == 'Top' else 1
            return (inning_num, half_order)
        
        # Sort the dataframe by proper inning order, then by original row to maintain chronological order within innings
        demo_data['sort_key'] = demo_data['Inn'].apply(inning_sort_key)
        demo_data = demo_data.sort_values(['sort_key', 'original_row']).drop(['sort_key', 'original_row'], axis=1).reset_index(drop=True)
        
        # Clean up the data - remove rows with missing critical data
        demo_data = demo_data.dropna(subset=['pitcher', 'batter', 'type', 'pitchResult'])
        
        print(f"Loaded {len(demo_data)} pitches from MIZZOUVBAMA.csv")
        inning_order = demo_data['Inn'].unique()[:10]  # Show first 10 innings
        print(f"Inning order: {list(inning_order)}")
        
        # Show first few pitches to verify chronological order
        first_pitches = demo_data[['Inn', 'count', 'pitcher', 'batter', 'pitchResult']].head(10)
        print("First 10 pitches:")
        for i, row in first_pitches.iterrows():
            print(f"  {i}: {row['Inn']} - {row['count']} - {row['pitcher']} vs {row['batter']} - {row['pitchResult']}")
        
        return demo_data
    except Exception as e:
        print(f"Error loading MIZZOUVBAMA.csv: {e}")
        return None

@app.post("/gameday/reset-demo")
def reset_demo():
    """Reset demo to beginning of Alabama game"""
    global current_pitch_index
    current_pitch_index = 0
    
    # Ensure demo data is loaded
    if demo_data is None:
        load_combined_demo_data()
    
    return JSONResponse(content={
        "message": "Demo reset to beginning of Alabama game", 
        "pitch_index": current_pitch_index,
        "next_pitch_will_be": current_pitch_index + 1
    })

@app.get("/gameday/demo-pitch")
def get_demo_pitch():
    """Get next pitch in demo mode using combined Missouri vs Alabama data"""
    global demo_data, current_pitch_index
    
    try:
        # Load demo data if not already loaded
        if demo_data is None:
            combined_df = load_combined_demo_data()
        else:
            combined_df = demo_data
            
        if combined_df is None or combined_df.empty:
            return JSONResponse(content={"error": "No pitch data available"}, status_code=404)
            
        print(f"Loaded {len(combined_df)} pitches from combined CSV")
        print(f"Current pitch index: {current_pitch_index}")
            
        # Get current pitch (don't advance index until after we get the pitch)
        if current_pitch_index >= len(combined_df):
            current_pitch_index = 0  # Loop back to beginning
            
        current_pitch = combined_df.iloc[current_pitch_index]
        print(f"Showing pitch {current_pitch_index + 1}: Inn={current_pitch.get('Inn')}, batter={current_pitch.get('batter')}, count={current_pitch.get('count')}")
        
        # Now advance index for next time
        current_pitch_index += 1
        
        # Correct team assignments based on inning (Alabama is HOME team)
        # Top of inning: Away team (Missouri) hits, Home team (Alabama) pitches
        # Bottom of inning: Home team (Alabama) hits, Away team (Missouri) pitches
        current_inning = current_pitch['Inn'] if pd.notna(current_pitch['Inn']) else "Top 1"
        
        if current_inning.startswith('Top'):
            # Top of inning: Missouri hitting, Alabama pitching
            is_missouri_hitting = True
            is_missouri_pitching = False
            team_hitting = "Missouri"
            team_pitching = "Alabama"
        else:
            # Bottom of inning: Alabama hitting, Missouri pitching  
            is_missouri_hitting = False
            is_missouri_pitching = True
            team_hitting = "Alabama"
            team_pitching = "Missouri"
        
        # Get season stats for current pitcher and batter
        pitcher_stats = {}
        batter_stats = {}
        
        # Load Missouri stats
        missouri_hitters_stats = load_hitters_summary()
        missouri_pitchers_stats = load_pitchers_summary()
        
        # Load Alabama stats
        alabama_hitters_stats = load_alabama_hitters()
        alabama_pitchers_stats = load_alabama_pitchers()
        
        if pd.notna(current_pitch['pitcher']):
            # First try Missouri pitchers
            pitcher_row = find_player_stats(current_pitch['pitcher'], missouri_pitchers_stats)
            if not pitcher_row.empty:
                pitcher_stats = pitcher_row.iloc[0].to_dict()
            else:
                # If not found in Missouri, try Alabama pitchers
                alabama_pitcher_row = find_player_stats(current_pitch['pitcher'], alabama_pitchers_stats)
                if not alabama_pitcher_row.empty:
                    alabama_pitcher = alabama_pitcher_row.iloc[0]
                    # Map Alabama pitcher stats to the expected format
                    pitcher_stats = {
                        'ERA': float(alabama_pitcher['ERA']),
                        'WHIP': float(alabama_pitcher['WHIP']),
                        'FIP': float(alabama_pitcher['FIP']),
                        'K%': float(alabama_pitcher['K%']),
                        'BB%': float(alabama_pitcher['BB%']),
                        'K%-BB%': float(alabama_pitcher['K%-BB%']),
                        'wOBA': float(alabama_pitcher['wOBA']),
                        'CSW%': float(alabama_pitcher['CSW%']),
                        'Chase%': float(alabama_pitcher['Chase%']),
                        'FPStk%': float(alabama_pitcher['FPStk%']),
                        'HardHit%': float(alabama_pitcher['HardHit%']),
                        'Barrel%': float(alabama_pitcher['Barrel%'])
                    }
        
        if pd.notna(current_pitch['batter']):
            # First try Missouri hitters
            batter_row = find_player_stats(current_pitch['batter'], missouri_hitters_stats)
            if not batter_row.empty:
                batter_stats = batter_row.iloc[0].to_dict()
            else:
                # If not found in Missouri, try Alabama hitters
                alabama_batter_row = find_player_stats(current_pitch['batter'], alabama_hitters_stats)
                if not alabama_batter_row.empty:
                    alabama_batter = alabama_batter_row.iloc[0]
                    # Map Alabama hitter stats to the expected format
                    batter_stats = {
                        'BA': float(alabama_batter['BA']),
                        'OBP': float(alabama_batter['OBP']),
                        'SLG': float(alabama_batter['SLG']),
                        'OPS': float(alabama_batter['OPS']),
                        'wOBA': float(alabama_batter['wOBA']),
                        'xWOBA': float(alabama_batter['xWOBA']),
                        'K%': float(alabama_batter['K%']),
                        'BB%': float(alabama_batter['BB%']),
                        'HardHit%': float(alabama_batter['HardHit%']),
                        'Barrel%': float(alabama_batter['Barrel%']),
                        'AvgEV': float(alabama_batter['AvgEV']),
                        'MaxEV': float(alabama_batter['MaxEV']),
                        'LaunchAng': float(alabama_batter['LaunchAng']),
                        'PA': int(alabama_batter['PA']),
                        'H': int(alabama_batter['H'])
                    }
        
        # Determine ball-in-play and at-bat results
        ab_result = current_pitch['PlayDesc'] if pd.notna(current_pitch['PlayDesc']) else None
        play_description = current_pitch['PlayDesc'] if pd.notna(current_pitch['PlayDesc']) else None
        pitch_result = current_pitch['pitchResult'] if pd.notna(current_pitch['pitchResult']) else "Strike Looking"
        
        # Create comprehensive result description
        result_summary = pitch_result
        if ab_result and ab_result not in ['-', '']:
            if play_description and play_description not in ['-', '']:
                result_summary = f"{ab_result}: {play_description}"
            else:
                result_summary = ab_result
        
        # Determine if this is the end of a plate appearance
        is_plate_appearance_end = ab_result and ab_result not in ['-', '']
        
        # Get base runner information - convert to regular bool
        runners_on_base = {
            "first": bool(current_pitch['ManOn1st'] == 1) if pd.notna(current_pitch['ManOn1st']) else False,
            "second": bool(current_pitch['ManOn2nd'] == 1) if pd.notna(current_pitch['ManOn2nd']) else False,
            "third": bool(current_pitch['ManOn3rd'] == 1) if pd.notna(current_pitch['ManOn3rd']) else False
        }
        
        # Extract exit velocity and launch angle for ball-in-play events
        def safe_float_convert(value):
            if pd.notna(value) and value != '-' and value != '':
                try:
                    return float(value)
                except (ValueError, TypeError):
                    return None
            return None
        
        exit_velocity = safe_float_convert(current_pitch['ExitVel'])
        launch_angle = safe_float_convert(current_pitch['LaunchAng'])
        
        # Extract pitch data in format expected by frontend - NO PLACEHOLDERS
        pitch_data = {
            "id": current_pitch_index,
            "type": current_pitch['type'] if pd.notna(current_pitch['type']) else None,
            "velocity": round(safe_float_convert(current_pitch['Vel']), 1) if pd.notna(current_pitch['Vel']) else None,
            "spinRate": round(safe_float_convert(current_pitch['Spin']), 0) if pd.notna(current_pitch['Spin']) else None,
            "x": safe_float_convert(current_pitch['PX']) if pd.notna(current_pitch['PX']) else None,
            "y": safe_float_convert(current_pitch['PZ']) if pd.notna(current_pitch['PZ']) else None,
            "result": result_summary,
            "pitch_result": pitch_result,
            "ab_result": ab_result,
            "play_description": play_description,
            "is_ball_in_play": bool(exit_velocity is not None),
            "is_plate_appearance_end": bool(is_plate_appearance_end),
            "exit_velocity": exit_velocity,
            "launch_angle": launch_angle,
            "horizontalBreak": round(safe_float_convert(current_pitch['HorzBrk']), 1) if pd.notna(current_pitch['HorzBrk']) else None,
            "verticalBreak": round(safe_float_convert(current_pitch['IndVertBrk']), 1) if pd.notna(current_pitch['IndVertBrk']) else None,
            "extension": round(safe_float_convert(current_pitch['Extension']), 1) if pd.notna(current_pitch['Extension']) else None,
            "isStrike": bool("Strike" in pitch_result),
            "inning": current_pitch['Inn'] if pd.notna(current_pitch['Inn']) else None,
            "count": current_pitch['count'] if pd.notna(current_pitch['count']) else None,
            "outs": int(current_pitch['outs']) if pd.notna(current_pitch['outs']) else None,
            "runners_on_base": runners_on_base,
            "pitcher": current_pitch['pitcher'] if pd.notna(current_pitch['pitcher']) else None,
            "batter": current_pitch['batter'] if pd.notna(current_pitch['batter']) else None,
            "pitcher_handedness": current_pitch['PitchHand'] if pd.notna(current_pitch['PitchHand']) else None,
            "batter_handedness": current_pitch['BatterHand'] if pd.notna(current_pitch['BatterHand']) else None,
            "is_missouri_pitching": bool(is_missouri_pitching),
            "is_missouri_hitting": bool(is_missouri_hitting),
            "team_pitching": team_pitching,
            "team_hitting": team_hitting
        }
        
        # Update TrackMan metrics for this pitch - USE ONLY AVAILABLE COLUMNS FROM NEW CSV
        trackman_metrics = {
            "release_spin": round(safe_float_convert(current_pitch.get('Spin')), 0) if pd.notna(current_pitch.get('Spin')) else None,
            "spin_axis": round(safe_float_convert(current_pitch.get('SpinDir')), 2) if pd.notna(current_pitch.get('SpinDir')) else None,
            "induced_vertical_break": round(safe_float_convert(current_pitch.get('IndVertBrk')), 1) if pd.notna(current_pitch.get('IndVertBrk')) else None,
            "horizontal_break": round(safe_float_convert(current_pitch.get('HorzBrk')), 1) if pd.notna(current_pitch.get('HorzBrk')) else None,
            "release_height": None,  # RelZ not available in new CSV
            "release_side": None,  # RelX not available in new CSV
            "velocity": round(safe_float_convert(current_pitch.get('Vel')), 1) if pd.notna(current_pitch.get('Vel')) else None,
            "tilt": current_pitch.get('Tilt') if pd.notna(current_pitch.get('Tilt')) else None,
            "strike_zone_location": round(safe_float_convert(current_pitch.get('PZ')), 2) if pd.notna(current_pitch.get('PZ')) else None,
            "extension": round(safe_float_convert(current_pitch.get('Extension')), 1) if pd.notna(current_pitch.get('Extension')) else None,
            "horizontal_approach_angle": round(safe_float_convert(current_pitch.get('HorzApprAngle')), 1) if pd.notna(current_pitch.get('HorzApprAngle')) else None,
            "vertical_approach_angle": round(safe_float_convert(current_pitch.get('VertApprAngle')), 1) if pd.notna(current_pitch.get('VertApprAngle')) else None,
            "horizontal_release_angle": None,  # HorzRelAngle not available in new CSV
            "vertical_release_angle": None  # VertRelAngle not available in new CSV
        }
        
        # Helper function to safely convert percentage strings and numeric values
        def safe_convert(value, is_percentage=False):
            if pd.isna(value) or value == '':
                return 0.0
            if isinstance(value, str):
                if is_percentage and value.endswith('%'):
                    return float(value.replace('%', ''))
                try:
                    return float(value)
                except:
                    return 0.0
            return float(value) if pd.notna(value) else 0.0
        
        # Format pitcher season stats
        pitcher_season_stats = {}
        if pitcher_stats:
            pitcher_season_stats = {
                "era": safe_convert(pitcher_stats.get('ERA', 0)),
                "whip": safe_convert(pitcher_stats.get('WHIP', 0)),
                "k_percent": safe_convert(pitcher_stats.get('K%', 0), True),
                "bb_percent": safe_convert(pitcher_stats.get('BB%', 0), True),
                "k_bb_percent": safe_convert(pitcher_stats.get('K%-BB%', 0), True),
                "fip": safe_convert(pitcher_stats.get('FIP', 0)),
                "woba_against": safe_convert(pitcher_stats.get('wOBA', 0)),
                "hard_hit_percent": safe_convert(pitcher_stats.get('HardHit%', 0), True),
                "barrel_percent": safe_convert(pitcher_stats.get('Barrel%', 0), True),
                "csw_percent": safe_convert(pitcher_stats.get('CSW%', 0), True),
                "chase_percent": safe_convert(pitcher_stats.get('Chase%', 0), True),
                "first_pitch_strike_percent": safe_convert(pitcher_stats.get('FPStk%', 0), True)
            }
        
        # Format batter season stats  
        batter_season_stats = {}
        if batter_stats:
            batter_season_stats = {
                "avg": safe_convert(batter_stats.get('BA', 0)),
                "obp": safe_convert(batter_stats.get('OBP', 0)),
                "slg": safe_convert(batter_stats.get('SLG', 0)),
                "ops": safe_convert(batter_stats.get('OPS', 0)),
                "woba": safe_convert(batter_stats.get('wOBA', 0)),
                "xwoba": safe_convert(batter_stats.get('xWOBA', 0)),
                "avg_exit_velocity": safe_convert(batter_stats.get('AvgEV', 0)),
                "max_exit_velocity": safe_convert(batter_stats.get('MaxEV', 0)),
                "launch_angle": safe_convert(batter_stats.get('LaunchAng', 0)),
                "hard_hit_percent": safe_convert(batter_stats.get('HardHit%', 0), True),
                "barrel_percent": safe_convert(batter_stats.get('Barrel%', 0), True),
                "k_percent": safe_convert(batter_stats.get('K%', 0), True),
                "bb_percent": safe_convert(batter_stats.get('BB%', 0), True),
                "pa": int(safe_convert(batter_stats.get('PA', 0))),
                "hits": int(safe_convert(batter_stats.get('H', 0))),
                "home_runs": int(safe_convert(batter_stats.get('HR', 0)))
            }
        
        return JSONResponse(content={
            "pitch": pitch_data, 
            "trackman": trackman_metrics,
            "pitcher_stats": pitcher_season_stats,
            "batter_stats": batter_season_stats,
            "game_info": {
                "total_pitches": len(combined_df),
                "current_pitch_number": current_pitch_index,
                "game": "Missouri vs Alabama"
            }
        })
        
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/gameday/demo-pitch-previous")
def get_previous_pitch():
    """Get previous pitch in demo mode"""
    global demo_data, current_pitch_index
    
    try:
        # Load demo data if not already loaded
        if demo_data is None:
            combined_df = load_combined_demo_data()
        else:
            combined_df = demo_data
            
        if combined_df is None or combined_df.empty:
            return JSONResponse(content={"error": "No pitch data available"}, status_code=404)
            
        # Move to previous pitch - go back 2 steps (one to undo the increment, one to go back)
        current_pitch_index = max(0, current_pitch_index - 2)
        
        # Get current pitch
        current_pitch = combined_df.iloc[current_pitch_index]
        print(f"Previous pitch: showing pitch {current_pitch_index + 1}, Inn={current_pitch.get('Inn')}, batter={current_pitch.get('batter')}, count={current_pitch.get('count')}")
        
        # Increment for next time (so next call will work correctly)
        current_pitch_index += 1
        
        # Correct team assignments based on inning (Alabama is HOME team)
        current_inning = current_pitch['Inn'] if pd.notna(current_pitch['Inn']) else "Top 1"
        
        if current_inning.startswith('Top'):
            # Top of inning: Missouri hitting, Alabama pitching
            is_missouri_hitting = True
            is_missouri_pitching = False
            team_hitting = "Missouri"
            team_pitching = "Alabama"
        else:
            # Bottom of inning: Alabama hitting, Missouri pitching  
            is_missouri_hitting = False
            is_missouri_pitching = True
            team_hitting = "Alabama"
            team_pitching = "Missouri"
        
        # Get season stats for current pitcher and batter
        pitcher_stats = {}
        batter_stats = {}
        
        # Load Missouri stats
        missouri_hitters_stats = load_hitters_summary()
        missouri_pitchers_stats = load_pitchers_summary()
        
        # Load Alabama stats
        alabama_hitters_stats = load_alabama_hitters()
        alabama_pitchers_stats = load_alabama_pitchers()
        
        if pd.notna(current_pitch['pitcher']):
            # First try Missouri pitchers
            pitcher_row = find_player_stats(current_pitch['pitcher'], missouri_pitchers_stats)
            if not pitcher_row.empty:
                pitcher_stats = pitcher_row.iloc[0].to_dict()
            else:
                # If not found in Missouri, try Alabama pitchers
                alabama_pitcher_row = find_player_stats(current_pitch['pitcher'], alabama_pitchers_stats)
                if not alabama_pitcher_row.empty:
                    alabama_pitcher = alabama_pitcher_row.iloc[0]
                    # Map Alabama pitcher stats to the expected format
                    pitcher_stats = {
                        'ERA': float(alabama_pitcher['ERA']),
                        'WHIP': float(alabama_pitcher['WHIP']),
                        'FIP': float(alabama_pitcher['FIP']),
                        'K%': float(alabama_pitcher['K%']),
                        'BB%': float(alabama_pitcher['BB%']),
                        'K%-BB%': float(alabama_pitcher['K%-BB%']),
                        'wOBA': float(alabama_pitcher['wOBA']),
                        'CSW%': float(alabama_pitcher['CSW%']),
                        'Chase%': float(alabama_pitcher['Chase%']),
                        'FPStk%': float(alabama_pitcher['FPStk%']),
                        'HardHit%': float(alabama_pitcher['HardHit%']),
                        'Barrel%': float(alabama_pitcher['Barrel%'])
                    }
        
        if pd.notna(current_pitch['batter']):
            # First try Missouri hitters
            batter_row = find_player_stats(current_pitch['batter'], missouri_hitters_stats)
            if not batter_row.empty:
                batter_stats = batter_row.iloc[0].to_dict()
            else:
                # If not found in Missouri, try Alabama hitters
                alabama_batter_row = find_player_stats(current_pitch['batter'], alabama_hitters_stats)
                if not alabama_batter_row.empty:
                    alabama_batter = alabama_batter_row.iloc[0]
                    # Map Alabama hitter stats to the expected format
                    batter_stats = {
                        'BA': float(alabama_batter['BA']),
                        'OBP': float(alabama_batter['OBP']),
                        'SLG': float(alabama_batter['SLG']),
                        'OPS': float(alabama_batter['OPS']),
                        'wOBA': float(alabama_batter['wOBA']),
                        'xWOBA': float(alabama_batter['xWOBA']),
                        'K%': float(alabama_batter['K%']),
                        'BB%': float(alabama_batter['BB%']),
                        'HardHit%': float(alabama_batter['HardHit%']),
                        'Barrel%': float(alabama_batter['Barrel%']),
                        'AvgEV': float(alabama_batter['AvgEV']),
                        'MaxEV': float(alabama_batter['MaxEV']),
                        'LaunchAng': float(alabama_batter['LaunchAng']),
                        'PA': int(alabama_batter['PA']),
                        'H': int(alabama_batter['H'])
                    }
        
        # Determine ball-in-play and at-bat results
        ab_result = current_pitch['PlayDesc'] if pd.notna(current_pitch['PlayDesc']) else None
        play_description = current_pitch['PlayDesc'] if pd.notna(current_pitch['PlayDesc']) else None
        pitch_result = current_pitch['pitchResult'] if pd.notna(current_pitch['pitchResult']) else "Strike Looking"
        
        # Create comprehensive result description
        result_summary = pitch_result
        if ab_result and ab_result not in ['-', '']:
            if play_description and play_description not in ['-', '']:
                result_summary = f"{ab_result}: {play_description}"
            else:
                result_summary = ab_result
        
        # Determine if this is the end of a plate appearance
        is_plate_appearance_end = ab_result and ab_result not in ['-', '']
        
        # Get base runner information - convert to regular bool
        runners_on_base = {
            "first": bool(current_pitch['ManOn1st'] == 1) if pd.notna(current_pitch['ManOn1st']) else False,
            "second": bool(current_pitch['ManOn2nd'] == 1) if pd.notna(current_pitch['ManOn2nd']) else False,
            "third": bool(current_pitch['ManOn3rd'] == 1) if pd.notna(current_pitch['ManOn3rd']) else False
        }
        
        # Extract exit velocity and launch angle for ball-in-play events
        def safe_float_convert(value):
            if pd.notna(value) and value != '-' and value != '':
                try:
                    return float(value)
                except (ValueError, TypeError):
                    return None
            return None
        
        exit_velocity = safe_float_convert(current_pitch['ExitVel'])
        launch_angle = safe_float_convert(current_pitch['LaunchAng'])
        
        # Extract pitch data in format expected by frontend - NO PLACEHOLDERS
        pitch_data = {
            "id": current_pitch_index,
            "type": current_pitch['type'] if pd.notna(current_pitch['type']) else None,
            "velocity": round(safe_float_convert(current_pitch['Vel']), 1) if pd.notna(current_pitch['Vel']) else None,
            "spinRate": round(safe_float_convert(current_pitch['Spin']), 0) if pd.notna(current_pitch['Spin']) else None,
            "x": safe_float_convert(current_pitch['PX']) if pd.notna(current_pitch['PX']) else None,
            "y": safe_float_convert(current_pitch['PZ']) if pd.notna(current_pitch['PZ']) else None,
            "result": result_summary,
            "pitch_result": pitch_result,
            "ab_result": ab_result,
            "play_description": play_description,
            "is_ball_in_play": bool(exit_velocity is not None),
            "is_plate_appearance_end": bool(is_plate_appearance_end),
            "exit_velocity": exit_velocity,
            "launch_angle": launch_angle,
            "horizontalBreak": round(safe_float_convert(current_pitch['HorzBrk']), 1) if pd.notna(current_pitch['HorzBrk']) else None,
            "verticalBreak": round(safe_float_convert(current_pitch['IndVertBrk']), 1) if pd.notna(current_pitch['IndVertBrk']) else None,
            "extension": round(safe_float_convert(current_pitch['Extension']), 1) if pd.notna(current_pitch['Extension']) else None,
            "isStrike": bool("Strike" in pitch_result),
            "inning": current_pitch['Inn'] if pd.notna(current_pitch['Inn']) else None,
            "count": current_pitch['count'] if pd.notna(current_pitch['count']) else None,
            "outs": int(current_pitch['outs']) if pd.notna(current_pitch['outs']) else None,
            "runners_on_base": runners_on_base,
            "pitcher": current_pitch['pitcher'] if pd.notna(current_pitch['pitcher']) else None,
            "batter": current_pitch['batter'] if pd.notna(current_pitch['batter']) else None,
            "pitcher_handedness": current_pitch['PitchHand'] if pd.notna(current_pitch['PitchHand']) else None,
            "batter_handedness": current_pitch['BatterHand'] if pd.notna(current_pitch['BatterHand']) else None,
            "is_missouri_pitching": bool(is_missouri_pitching),
            "is_missouri_hitting": bool(is_missouri_hitting),
            "team_pitching": team_pitching,
            "team_hitting": team_hitting
        }
        
        # Update TrackMan metrics for this pitch - USE ONLY REAL DATA, NO PLACEHOLDERS
        trackman_metrics = {
            "release_spin": round(safe_float_convert(current_pitch['Spin']), 0) if pd.notna(current_pitch['Spin']) else None,
            "spin_axis": round(safe_float_convert(current_pitch['SpinDir']), 2) if pd.notna(current_pitch['SpinDir']) else None,
            "induced_vertical_break": round(safe_float_convert(current_pitch['IndVertBrk']), 1) if pd.notna(current_pitch['IndVertBrk']) else None,
            "horizontal_break": round(safe_float_convert(current_pitch['HorzBrk']), 1) if pd.notna(current_pitch['HorzBrk']) else None,
            "release_height": round(safe_float_convert(current_pitch.get('RelZ', None)) / 12, 1) if pd.notna(current_pitch.get('RelZ', None)) else None,
            "release_side": round(abs(safe_float_convert(current_pitch.get('RelX', None))) / 12, 1) if pd.notna(current_pitch.get('RelX', None)) else None,
            "velocity": round(safe_float_convert(current_pitch['Vel']), 1) if pd.notna(current_pitch['Vel']) else None,
            "tilt": current_pitch['Tilt'] if pd.notna(current_pitch['Tilt']) else None,
            "strike_zone_location": round(safe_float_convert(current_pitch['PZ']), 2) if pd.notna(current_pitch['PZ']) else None,
            "extension": round(safe_float_convert(current_pitch['Extension']), 1) if pd.notna(current_pitch['Extension']) else None,
            "horizontal_approach_angle": round(safe_float_convert(current_pitch['HorzApprAngle']), 1) if pd.notna(current_pitch['HorzApprAngle']) else None,
            "vertical_approach_angle": round(safe_float_convert(current_pitch['VertApprAngle']), 1) if pd.notna(current_pitch['VertApprAngle']) else None,
            "horizontal_release_angle": round(safe_float_convert(current_pitch.get('HorzRelAngle', None)), 1) if pd.notna(current_pitch.get('HorzRelAngle', None)) else None,
            "vertical_release_angle": round(safe_float_convert(current_pitch.get('VertRelAngle', None)), 1) if pd.notna(current_pitch.get('VertRelAngle', None)) else None
        }

        # Function to safely convert stats
        def safe_convert(value, is_percentage=False):
            if pd.isna(value) or value == '' or value == '-':
                return 0.0
            try:
                if is_percentage and isinstance(value, str) and '%' in value:
                    return float(value.replace('%', ''))
                return float(value)
            except (ValueError, TypeError):
                return 0.0

        # Season stats in expected format
        pitcher_season_stats = {
            "era": safe_convert(pitcher_stats.get('ERA', 0)),
            "whip": safe_convert(pitcher_stats.get('WHIP', 0)),
            "k_percent": safe_convert(pitcher_stats.get('K%', 0), True),
            "bb_percent": safe_convert(pitcher_stats.get('BB%', 0), True),
            "k_bb_percent": safe_convert(pitcher_stats.get('K%-BB%', 0), True),
            "fip": safe_convert(pitcher_stats.get('FIP', 0)),
            "woba_against": safe_convert(pitcher_stats.get('wOBA', 0)),
            "hard_hit_percent": safe_convert(pitcher_stats.get('HardHit%', 0), True),
            "barrel_percent": safe_convert(pitcher_stats.get('Barrel%', 0), True),
            "csw_percent": safe_convert(pitcher_stats.get('CSW%', 0), True),
            "chase_percent": safe_convert(pitcher_stats.get('Chase%', 0), True),
            "first_pitch_strike_percent": safe_convert(pitcher_stats.get('FPStk%', 0), True)
        }

        batter_season_stats = {
            "avg": safe_convert(batter_stats.get('BA', 0)),
            "obp": safe_convert(batter_stats.get('OBP', 0)),
            "slg": safe_convert(batter_stats.get('SLG', 0)),
            "ops": safe_convert(batter_stats.get('OPS', 0)),
            "woba": safe_convert(batter_stats.get('wOBA', 0)),
            "xwoba": safe_convert(batter_stats.get('xWOBA', 0)),
            "avg_exit_velocity": safe_convert(batter_stats.get('AvgEV', 0)),
            "max_exit_velocity": safe_convert(batter_stats.get('MaxEV', 0)),
            "launch_angle": safe_convert(batter_stats.get('LaunchAng', 0)),
            "hard_hit_percent": safe_convert(batter_stats.get('HardHit%', 0), True),
            "barrel_percent": safe_convert(batter_stats.get('Barrel%', 0), True),
            "k_percent": safe_convert(batter_stats.get('K%', 0), True),
            "bb_percent": safe_convert(batter_stats.get('BB%', 0), True),
            "pa": int(safe_convert(batter_stats.get('PA', 0))),
            "hits": int(safe_convert(batter_stats.get('H', 0))),
            "home_runs": int(safe_convert(batter_stats.get('HR', 0)))
        }
        
        return JSONResponse(content={
            "pitch": pitch_data, 
            "trackman": trackman_metrics,
            "pitcher_stats": pitcher_season_stats,
            "batter_stats": batter_season_stats,
            "game_info": {
                "total_pitches": len(combined_df),
                "current_pitch_number": current_pitch_index,
                "game": "Missouri vs Alabama"
            }
        })
        
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# ---------------------- Server Startup ----------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
