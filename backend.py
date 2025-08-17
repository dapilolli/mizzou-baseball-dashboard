#!/usr/bin/env python3
"""
Mizzou Baseball Analytics Dashboard - Backend Server
Serves CSV data via REST API for the React frontend
"""

import pandas as pd
import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import random
from typing import Dict, List, Any

app = FastAPI(title="Mizzou Baseball Analytics API", version="1.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data directory
DATA_DIR = Path("./data")

# Global data cache
_data_cache = {}

def load_csv_safely(filename: str) -> pd.DataFrame:
    """Load CSV with error handling"""
    try:
        filepath = DATA_DIR / filename
        if not filepath.exists():
            print(f"Warning: {filename} not found")
            return pd.DataFrame()
        
        if filename in _data_cache:
            return _data_cache[filename]
            
        df = pd.read_csv(filepath)
        _data_cache[filename] = df
        print(f"Loaded {filename}: {len(df)} rows")
        return df
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return pd.DataFrame()

def load_json_safely(filename: str) -> Dict:
    """Load JSON with error handling"""
    try:
        filepath = DATA_DIR / filename
        if not filepath.exists():
            return {}
        with open(filepath, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return {}

@app.get("/")
async def root():
    return {"message": "Mizzou Baseball Analytics API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "data_files": list(DATA_DIR.glob("*.csv"))}

# Team endpoints
@app.get("/team/hitters")
async def get_hitters():
    """Get Missouri hitters from hitting stats"""
    df = load_csv_safely("Missouri - Hitting.csv")
    if df.empty:
        return []
    
    # Rename 'player' column to 'Player' to match frontend expectations
    if 'player' in df.columns:
        df = df.rename(columns={'player': 'Player'})
    
    # Convert to records and clean up
    hitters = []
    for _, row in df.iterrows():
        hitter = row.to_dict()
        # Clean up any NaN values
        for key, value in hitter.items():
            if pd.isna(value):
                hitter[key] = None
        hitters.append(hitter)
    
    return hitters

@app.get("/team/pitchers") 
async def get_pitchers():
    """Get Missouri pitchers from pitching stats"""
    df = load_csv_safely("Missouri - Pitching.csv")
    if df.empty:
        return []
    
    # Rename 'player' column to 'Player' to match frontend expectations
    if 'player' in df.columns:
        df = df.rename(columns={'player': 'Player'})
    
    pitchers = []
    for _, row in df.iterrows():
        pitcher = row.to_dict()
        # Clean up any NaN values
        for key, value in pitcher.items():
            if pd.isna(value):
                pitcher[key] = None
        pitchers.append(pitcher)
    
    return pitchers

# Reports endpoints
@app.get("/reports/{player_name}")
async def get_player_report(player_name: str):
    """Get detailed player report"""
    # Try to find player in hitting data
    hitting_df = load_csv_safely("Missouri - Hitting.csv")
    pitching_df = load_csv_safely("Missouri - Pitching.csv")
    
    # Rename columns to match frontend expectations
    if not hitting_df.empty and 'player' in hitting_df.columns:
        hitting_df = hitting_df.rename(columns={'player': 'Player'})
    if not pitching_df.empty and 'player' in pitching_df.columns:
        pitching_df = pitching_df.rename(columns={'player': 'Player'})
    
    # Search in hitters first
    if not hitting_df.empty:
        player_hitting = hitting_df[hitting_df['Player'].str.contains(player_name, case=False, na=False)]
        if not player_hitting.empty:
            player_data = player_hitting.iloc[0].to_dict()
            # Clean NaN values
            for key, value in player_data.items():
                if pd.isna(value):
                    player_data[key] = None
            
            return {
                "player_type": "hitter",
                "player_stats": player_data,
                "chart_data": [player_data]  # For now, single data point
            }
    
    # Search in pitchers
    if not pitching_df.empty:
        player_pitching = pitching_df[pitching_df['Player'].str.contains(player_name, case=False, na=False)]
        if not player_pitching.empty:
            player_data = player_pitching.iloc[0].to_dict()
            # Clean NaN values
            for key, value in player_data.items():
                if pd.isna(value):
                    player_data[key] = None
                    
            return {
                "player_type": "pitcher", 
                "player_stats": player_data,
                "chart_data": [player_data]
            }
    
    raise HTTPException(status_code=404, detail=f"Player {player_name} not found")

@app.get("/splits/{player_name}")
async def get_player_splits(player_name: str):
    """Get player splits data for situational analysis"""
    # For now, return mock splits data structure that the frontend expects
    # In a real implementation, this would come from detailed pitch-by-pitch data
    
    # Try to find if player is hitter or pitcher first
    hitting_df = load_csv_safely("Missouri - Hitting.csv")
    pitching_df = load_csv_safely("Missouri - Pitching.csv")
    
    # Rename columns to match frontend expectations
    if not hitting_df.empty and 'player' in hitting_df.columns:
        hitting_df = hitting_df.rename(columns={'player': 'Player'})
    if not pitching_df.empty and 'player' in pitching_df.columns:
        pitching_df = pitching_df.rename(columns={'player': 'Player'})
    
    player_type = None
    if not hitting_df.empty and not hitting_df[hitting_df['Player'].str.contains(player_name, case=False, na=False)].empty:
        player_type = "hitter"
    elif not pitching_df.empty and not pitching_df[pitching_df['Player'].str.contains(player_name, case=False, na=False)].empty:
        player_type = "pitcher"
    else:
        raise HTTPException(status_code=404, detail=f"Player {player_name} not found")
    
    # Generate realistic mock splits data based on player type
    if player_type == "hitter":
        splits_data = {
            "counts": {
                "0-0": {"PA": 45, "BA": 0.289, "OBP": 0.356, "SLG": 0.445, "wOBA": 0.345, "K%": 22.2, "BB%": 8.9},
                "0-1": {"PA": 38, "BA": 0.263, "OBP": 0.289, "SLG": 0.368, "wOBA": 0.298, "K%": 31.6, "BB%": 2.6},
                "1-0": {"PA": 42, "BA": 0.325, "OBP": 0.429, "SLG": 0.525, "wOBA": 0.395, "K%": 16.7, "BB%": 14.3},
                "1-1": {"PA": 35, "BA": 0.278, "OBP": 0.314, "SLG": 0.389, "wOBA": 0.315, "K%": 25.7, "BB%": 5.7},
                "2-0": {"PA": 28, "BA": 0.385, "OBP": 0.500, "SLG": 0.615, "wOBA": 0.445, "K%": 10.7, "BB%": 21.4},
                "2-1": {"PA": 31, "BA": 0.300, "OBP": 0.387, "SLG": 0.467, "wOBA": 0.365, "K%": 19.4, "BB%": 12.9},
                "3-1": {"PA": 18, "BA": 0.412, "OBP": 0.556, "SLG": 0.647, "wOBA": 0.485, "K%": 5.6, "BB%": 27.8},
                "2-2": {"PA": 29, "BA": 0.241, "OBP": 0.276, "SLG": 0.345, "wOBA": 0.285, "K%": 37.9, "BB%": 3.4},
                "3-2": {"PA": 22, "BA": 0.273, "OBP": 0.409, "SLG": 0.409, "wOBA": 0.345, "K%": 27.3, "BB%": 18.2}
            },
            "base_situations": {
                "Empty": {"PA": 112, "BA": 0.280, "OBP": 0.348, "SLG": 0.440, "wOBA": 0.335, "K%": 24.1, "BB%": 8.9},
                "RISP": {"PA": 58, "BA": 0.304, "OBP": 0.397, "SLG": 0.478, "wOBA": 0.375, "K%": 20.7, "BB%": 12.1},
                "Loaded": {"PA": 12, "BA": 0.333, "OBP": 0.417, "SLG": 0.500, "wOBA": 0.395, "K%": 16.7, "BB%": 8.3}
            },
            "vs_pitcher_hand": {
                "vs RHP": {"PA": 142, "BA": 0.285, "OBP": 0.356, "SLG": 0.442, "wOBA": 0.345, "K%": 23.2, "BB%": 9.2},
                "vs LHP": {"PA": 40, "BA": 0.297, "OBP": 0.375, "SLG": 0.459, "wOBA": 0.355, "K%": 22.5, "BB%": 10.0}
            },
            "outs": {
                "0 Outs": {"PA": 61, "BA": 0.278, "OBP": 0.361, "SLG": 0.426, "wOBA": 0.340, "K%": 24.6, "BB%": 11.5},
                "1 Out": {"PA": 65, "BA": 0.292, "OBP": 0.354, "SLG": 0.458, "wOBA": 0.350, "K%": 21.5, "BB%": 7.7},
                "2 Outs": {"PA": 56, "BA": 0.286, "OBP": 0.357, "SLG": 0.449, "wOBA": 0.345, "K%": 23.2, "BB%": 8.9}
            },
            "player_handedness": {"hand": "R", "type": "hitter"}
        }
    else:  # pitcher
        splits_data = {
            "pitch_types": {
                "Fastball": {"Usage%": 58.2, "Vel": 92.3, "Spin": 2245, "wOBA": 0.345, "K%": 22.1, "BB%": 8.4, "CSW%": 28.5},
                "Slider": {"Usage%": 23.1, "Vel": 84.7, "Spin": 2456, "wOBA": 0.289, "K%": 31.2, "BB%": 6.8, "CSW%": 35.2},
                "Changeup": {"Usage%": 12.4, "Vel": 85.1, "Spin": 1832, "wOBA": 0.312, "K%": 26.8, "BB%": 9.1, "CSW%": 31.4},
                "Curveball": {"Usage%": 6.3, "Vel": 78.9, "Spin": 2687, "wOBA": 0.298, "K%": 28.9, "BB%": 7.2, "CSW%": 33.1}
            },
            "counts": {
                "0-0": {"PA": 245, "Strike%": 65.3, "Ball%": 34.7, "wOBA": 0.325, "K%": 24.1, "BB%": 8.2},
                "0-1": {"PA": 160, "Strike%": 71.9, "Ball%": 28.1, "wOBA": 0.298, "K%": 31.9, "BB%": 4.4},
                "1-0": {"PA": 85, "Strike%": 58.8, "Ball%": 41.2, "wOBA": 0.378, "K%": 17.6, "BB%": 14.1},
                "1-1": {"PA": 125, "Strike%": 68.0, "Ball%": 32.0, "wOBA": 0.315, "K%": 26.4, "BB%": 6.4},
                "2-0": {"PA": 35, "Strike%": 48.6, "Ball%": 51.4, "wOBA": 0.425, "K%": 11.4, "BB%": 25.7},
                "2-1": {"PA": 78, "Strike%": 62.8, "Ball%": 37.2, "wOBA": 0.355, "K%": 21.8, "BB%": 10.3},
                "3-1": {"PA": 18, "Strike%": 44.4, "Ball%": 55.6, "wOBA": 0.485, "K%": 5.6, "BB%": 33.3},
                "2-2": {"PA": 92, "Strike%": 45.7, "Ball%": 54.3, "wOBA": 0.285, "K%": 41.3, "BB%": 4.3},
                "3-2": {"PA": 41, "Strike%": 48.8, "Ball%": 51.2, "wOBA": 0.345, "K%": 29.3, "BB%": 22.0}
            },
            "base_situations": {
                "Empty": {"PA": 420, "Strike%": 63.8, "Ball%": 36.2, "wOBA": 0.315, "K%": 25.7, "BB%": 7.9},
                "RISP": {"PA": 185, "Strike%": 61.6, "Ball%": 38.4, "wOBA": 0.345, "K%": 22.2, "BB%": 9.7},
                "Loaded": {"PA": 25, "Strike%": 59.2, "Ball%": 40.8, "wOBA": 0.385, "K%": 20.0, "BB%": 12.0}
            },
            "vs_batter_hand": {
                "vs RHB": {"PA": 387, "Strike%": 63.3, "Ball%": 36.7, "wOBA": 0.325, "K%": 24.8, "BB%": 8.3},
                "vs LHB": {"PA": 243, "Strike%": 62.1, "Ball%": 37.9, "wOBA": 0.335, "K%": 23.5, "BB%": 8.6}
            },
            "outs": {
                "0 Outs": {"PA": 210, "Strike%": 62.4, "Ball%": 37.6, "wOBA": 0.335, "K%": 23.8, "BB%": 9.0},
                "1 Out": {"PA": 220, "Strike%": 63.2, "Ball%": 36.8, "wOBA": 0.325, "K%": 25.0, "BB%": 7.7},
                "2 Outs": {"PA": 200, "Strike%": 63.0, "Ball%": 37.0, "wOBA": 0.320, "K%": 24.5, "BB%": 8.5}
            },
            "player_handedness": {"hand": "R", "type": "pitcher"}
        }
    
    return {
        "player_name": player_name,
        "player_type": player_type,
        "splits": splits_data
    }

# Gameday endpoints (mock for now)
@app.get("/gameday/demo-pitch")
async def get_demo_pitch():
    """Get current pitch data for gameday demo"""
    # This would normally come from live data
    # For now, return mock structure matching what frontend expects
    return {
        "pitch": {
            "type": "4-Seam Fastball",
            "velocity": 92.5,
            "spinRate": 2350,
            "result": "Strike Looking",
            "pitch_result": "Strike Looking",
            "x": -0.2,
            "y": 2.1,
            "count": "1-1",
            "inning": "Bot 3",
            "outs": 1,
            "runners_on_base": {"first": False, "second": True, "third": False},
            "pitcher": "W. Libbert",
            "batter": "Unknown",
            "pitcher_handedness": "L",
            "batter_handedness": "R",
            "is_missouri_pitching": True,
            "team_pitching": "Missouri",
            "team_hitting": "Alabama"
        },
        "trackman": {
            "induced_vertical_break": 14.2,
            "horizontal_break": -12.1,
            "extension": 6.1,
            "release_height": 5.8,
            "tilt": "10:30",
            "vertical_approach_angle": -5.2,
            "horizontal_approach_angle": 1.1
        },
        "pitcher_stats": {
            "era": 4.15,
            "whip": 1.25,
            "fip": 3.89,
            "k_bb_percent": 15.2,
            "csw_percent": 28.5,
            "first_pitch_strike_percent": 65.0
        },
        "batter_stats": {
            "avg": 0.285,
            "obp": 0.350,
            "slg": 0.475,
            "ops": 0.825,
            "k_percent": 18.5,
            "bb_percent": 8.2
        },
        "game_info": {
            "total_pitches": 156,
            "current_pitch_number": 89,
            "game": "Missouri vs Alabama"
        }
    }

@app.post("/gameday/reset-demo")
async def reset_demo():
    """Reset demo game state"""
    return {"status": "reset"}

@app.get("/gameday/due-up")
async def get_due_up():
    """Get due up hitters"""
    return {
        "hitting_team": "Alabama",
        "due_up": ["B. Norton", "J. Torres", "R. Bonomolo Jr."]
    }

# PDP endpoints
@app.get("/pdp/list")
async def get_pdp_players():
    """Get list of all PDP players"""
    hitters_pdp = load_json_safely("pdp_hitters.json")
    pitchers_pdp = load_json_safely("pdp_pitchers.json")
    
    return {
        "hitters": list(hitters_pdp.keys()),
        "pitchers": list(pitchers_pdp.keys()),
        "all": list(set(list(hitters_pdp.keys()) + list(pitchers_pdp.keys())))
    }

@app.get("/pdp/{player_name}/dashboard")
async def get_pdp_dashboard(player_name: str):
    """Get PDP dashboard data for player"""
    # Load PDP data
    hitters_pdp = load_json_safely("pdp_hitters.json")
    pitchers_pdp = load_json_safely("pdp_pitchers.json")
    
    # Check if player exists in PDP data
    player_data = None
    player_type = None
    
    if player_name in hitters_pdp:
        player_data = hitters_pdp[player_name]
        player_type = "hitter"
    elif player_name in pitchers_pdp:
        player_data = pitchers_pdp[player_name] 
        player_type = "pitcher"
    
    if not player_data:
        # Return default structure for unknown players
        mock_profile = {
            "name": player_name,
            "position": "RHP" if "pitcher" in player_name.lower() else "OF",
            "tier": "Development",
            "class": "Sophomore",
            "year": "2nd Year",
            "status": "Active",
            "identity": f"{player_type or 'Player'} Development Focus"
        }
        
        mock_metrics = [
            {"name": "Exit Velocity", "current": 85.2, "target": 90.0, "tier": "Development", "trend": [82, 83.5, 84.8, 85.2], "unit": " mph"},
            {"name": "Launch Angle", "current": 12.5, "target": 15.0, "tier": "Development", "trend": [10, 11, 12, 12.5], "unit": "°"},
            {"name": "Contact%", "current": 68.2, "target": 75.0, "tier": "Development", "trend": [65, 66.5, 67.8, 68.2], "unit": "%"}
        ] if player_type == "hitter" else [
            {"name": "Strike%", "current": 58.2, "target": 65.0, "tier": "Development", "trend": [55, 56.5, 57.8, 58.2], "unit": "%"},
            {"name": "FPStk%", "current": 58.2, "target": 65.0, "tier": "Development", "trend": [55, 56.5, 57.8, 58.2], "unit": "%"},
            {"name": "Chase%", "current": 31.2, "target": 35.0, "tier": "Solid", "trend": [29, 30, 30.5, 31.2], "unit": "%"}
        ]
        
        mock_goals = [
            {
                "id": "1",
                "description": f"Improve consistency metrics by 10%",
                "current": 65.0,
                "target": 75.0,
                "progress": 45,
                "lastUpdated": "2025-08-17",
                "completed": False
            }
        ]
        
        return {
            "profile": mock_profile,
            "metrics": mock_metrics,
            "goals": mock_goals,
            "coach_notes": {
                "strengths": "Good work ethic, coachable attitude",
                "weaknesses": "Needs consistency development",
                "lastUpdated": "2025-08-17"
            }
        }
    
    # Create realistic player profile from PDP data
    player_profile = {
        "name": player_name,
        "position": "RHP" if player_type == "pitcher" else "OF",
        "tier": player_data.get("tier", "Development"),
        "class": "Sophomore",
        "year": "2nd Year", 
        "status": "Active",
        "identity": f"{player_type.title()} Development Focus"
    }
    
    # Generate realistic metrics based on player type and deficiencies
    deficiencies = player_data.get("deficiencies", [])
    proficiencies = player_data.get("proficiencies", [])
    
    if player_type == "hitter":
        metrics = [
            {"name": "Exit Velocity", "current": 87.2, "target": 92.0, "tier": "Solid", "trend": [85, 86, 86.8, 87.2], "unit": " mph"},
            {"name": "HardHit%", "current": 33.0, "target": 38.0, "tier": "Development", "trend": [30, 31.5, 32.2, 33.0], "unit": "%"},
            {"name": "Contact%", "current": 72.4, "target": 78.0, "tier": "Solid", "trend": [70, 71, 71.8, 72.4], "unit": "%"},
            {"name": "Miss% vs FB", "current": 26.4, "target": 20.0, "tier": "Development", "trend": [28, 27.2, 26.8, 26.4], "unit": "%"},
            {"name": "Barrel%", "current": 8.2, "target": 12.0, "tier": "Development", "trend": [7.5, 7.8, 8.0, 8.2], "unit": "%"}
        ]
    else:
        metrics = [
            {"name": "Strike%", "current": 64.2, "target": 68.0, "tier": "Solid", "trend": [62, 63, 63.8, 64.2], "unit": "%"},
            {"name": "FPStk%", "current": 58.2, "target": 65.0, "tier": "Development", "trend": [55, 56.5, 57.8, 58.2], "unit": "%"},
            {"name": "CSW%", "current": 28.5, "target": 32.0, "tier": "Development", "trend": [26, 27, 28, 28.5], "unit": "%"},
            {"name": "Chase%", "current": 31.2, "target": 35.0, "tier": "Solid", "trend": [29, 30, 30.5, 31.2], "unit": "%"},
            {"name": "K%-BB%", "current": 15.2, "target": 18.0, "tier": "Solid", "trend": [12, 13.5, 14.8, 15.2], "unit": "%"}
        ]
    
    # Create goals from deficiencies
    goals = []
    for i, deficiency in enumerate(deficiencies[:3]):  # Limit to 3 goals
        goals.append({
            "id": str(i + 1),
            "description": f"Improve {deficiency}",
            "current": 65.0 + (i * 5),
            "target": 80.0 + (i * 5),
            "progress": 45 + (i * 15),
            "lastUpdated": "2025-08-17",
            "completed": False
        })
    
    return {
        "profile": player_profile,
        "metrics": metrics,
        "goals": goals,
        "coach_notes": {
            "strengths": ", ".join(proficiencies) if proficiencies else "Good work ethic and attitude",
            "weaknesses": ", ".join(deficiencies) if deficiencies else "Areas for continued development",
            "lastUpdated": "2025-08-17"
        }
    }

@app.get("/pdp/{player_name}/personalized-drills")
async def get_personalized_drills(player_name: str):
    """Get personalized drills for player"""
    # Load PDP data to determine player type and tier
    hitters_pdp = load_json_safely("pdp_hitters.json")
    pitchers_pdp = load_json_safely("pdp_pitchers.json")
    
    player_type = None
    player_tier = "Development"
    deficiencies = []
    
    if player_name in hitters_pdp:
        player_type = "hitter"
        player_data = hitters_pdp[player_name]
        player_tier = player_data.get("tier", "Development")
        deficiencies = player_data.get("deficiencies", [])
    elif player_name in pitchers_pdp:
        player_type = "pitcher"
        player_data = pitchers_pdp[player_name]
        player_tier = player_data.get("tier", "Development")
        deficiencies = player_data.get("deficiencies", [])
    else:
        # Default for unknown players
        player_type = "hitter"
        deficiencies = ["contact development", "power development"]
    
    # Generate drills based on player type and deficiencies
    drills = {}
    
    if player_type == "hitter":
        if player_tier == "Development":
            drills = {
                "contact-development": {
                    "id": "contact-development",
                    "title": "Basic Contact Development",
                    "description": "Focus on making consistent contact and barrel awareness",
                    "detailed_instructions": "Use tee work and soft toss to develop hand-eye coordination. Focus on hitting the ball squarely with good timing.",
                    "category": "Contact",
                    "developmentArea": "Contact Quality",
                    "tier": "Development",
                    "player_type": "hitter",
                    "equipment_needed": "Tee, baseballs, bat",
                    "duration_minutes": 20,
                    "weeklyTarget": {"swings": 75, "minSuccessRate": 70, "frequency": 5},
                    "metrics_tracked": "Contact%, Exit Velocity, Sweet Spot%",
                    "progressHistory": []
                },
                "mechanics-foundation": {
                    "id": "mechanics-foundation", 
                    "title": "Swing Mechanics Foundation",
                    "description": "Establish proper swing path and timing",
                    "detailed_instructions": "Work on load, stride, and swing path consistency. Use mirror work and slow motion swings.",
                    "category": "Mechanics",
                    "developmentArea": "Swing Mechanics",
                    "tier": "Development",
                    "player_type": "hitter",
                    "equipment_needed": "Mirror, bat, video camera",
                    "duration_minutes": 25,
                    "weeklyTarget": {"swings": 60, "minSuccessRate": 75, "frequency": 4},
                    "metrics_tracked": "Swing Path, Timing, Balance",
                    "progressHistory": []
                }
            }
        elif player_tier == "Solid":
            drills = {
                "power-development": {
                    "id": "power-development",
                    "title": "Power Development Training", 
                    "description": "Increase exit velocity and launch angle optimization",
                    "detailed_instructions": "Focus on lower half engagement and rotational power. Use weighted balls and explosive movements.",
                    "category": "Power",
                    "developmentArea": "Power Development",
                    "tier": "Solid",
                    "player_type": "hitter",
                    "equipment_needed": "Weighted balls, medicine ball, bat",
                    "duration_minutes": 30,
                    "weeklyTarget": {"swings": 50, "minSuccessRate": 75, "frequency": 4},
                    "metrics_tracked": "Exit Velocity, Launch Angle, Distance",
                    "progressHistory": []
                },
                "advanced-recognition": {
                    "id": "advanced-recognition",
                    "title": "Advanced Pitch Recognition",
                    "description": "Identify spin, location, and sequencing patterns",
                    "detailed_instructions": "Use video analysis and live BP to recognize pitch types early. Focus on spin recognition.",
                    "category": "Recognition", 
                    "developmentArea": "Advanced Recognition",
                    "tier": "Solid",
                    "player_type": "hitter",
                    "equipment_needed": "Video system, baseballs, bat",
                    "duration_minutes": 25,
                    "weeklyTarget": {"reps": 40, "minSuccessRate": 80, "frequency": 4},
                    "metrics_tracked": "Recognition%, Swing Decision, Contact Quality",
                    "progressHistory": []
                }
            }
        else:  # Elite
            drills = {
                "elite-power": {
                    "id": "elite-power",
                    "title": "Elite Power Training",
                    "description": "Maximize exit velocity and optimize launch angle for home runs",
                    "detailed_instructions": "Advanced rotational mechanics and explosive power development. Focus on premium contact quality.",
                    "category": "Power",
                    "developmentArea": "Elite Power",
                    "tier": "Elite",
                    "player_type": "hitter",
                    "equipment_needed": "Blast sensor, weighted implements, premium baseballs",
                    "duration_minutes": 35,
                    "weeklyTarget": {"swings": 40, "minSuccessRate": 85, "frequency": 4},
                    "metrics_tracked": "Exit Velocity, Launch Angle, Barrel%, Distance",
                    "progressHistory": []
                }
            }
    else:  # pitcher
        if player_tier == "Development":
            drills = {
                "command-basics": {
                    "id": "command-basics",
                    "title": "Basic Strike Zone Command",
                    "description": "Develop ability to consistently throw strikes",
                    "detailed_instructions": "Focus on repeatable delivery and hitting the strike zone consistently. Use target work.",
                    "category": "Command",
                    "developmentArea": "Strike Zone Command",
                    "tier": "Development",
                    "player_type": "pitcher",
                    "equipment_needed": "Baseballs, target, mound",
                    "duration_minutes": 25,
                    "weeklyTarget": {"pitches": 30, "minSuccessRate": 70, "frequency": 4},
                    "metrics_tracked": "Strike%, First Pitch Strike%, Zone%",
                    "progressHistory": []
                },
                "delivery-consistency": {
                    "id": "delivery-consistency",
                    "title": "Delivery Consistency",
                    "description": "Develop repeatable pitching mechanics",
                    "detailed_instructions": "Work on balance point, stride length, and arm slot consistency. Use video analysis.",
                    "category": "Mechanics",
                    "developmentArea": "Delivery Mechanics",
                    "tier": "Development",
                    "player_type": "pitcher",
                    "equipment_needed": "Video camera, mound, baseballs",
                    "duration_minutes": 30,
                    "weeklyTarget": {"reps": 50, "minSuccessRate": 80, "frequency": 5},
                    "metrics_tracked": "Delivery Consistency, Balance, Timing",
                    "progressHistory": []
                }
            }
        elif player_tier == "Solid":
            drills = {
                "command-refinement": {
                    "id": "command-refinement",
                    "title": "Advanced Strike Zone Command",
                    "description": "Refine ability to hit specific zones under pressure",
                    "detailed_instructions": "Work on painting corners and commanding multiple zones. Add game-like pressure.",
                    "category": "Command",
                    "developmentArea": "Situational Pitching",
                    "tier": "Solid",
                    "player_type": "pitcher",
                    "equipment_needed": "Zone targets, baseballs, mound",
                    "duration_minutes": 30,
                    "weeklyTarget": {"pitches": 25, "minSuccessRate": 75, "frequency": 4},
                    "metrics_tracked": "Zone%, CSW%, Called Strike%",
                    "progressHistory": []
                },
                "secondary-mastery": {
                    "id": "secondary-mastery",
                    "title": "Secondary Pitch Development",
                    "description": "Develop changeup and breaking ball command",
                    "detailed_instructions": "Focus on consistent arm speed and command of off-speed pitches. Work on tunneling.",
                    "category": "Pitch Development",
                    "developmentArea": "Secondary Pitches",
                    "tier": "Solid",
                    "player_type": "pitcher",
                    "equipment_needed": "Baseballs, mound, catcher",
                    "duration_minutes": 25,
                    "weeklyTarget": {"pitches": 20, "minSuccessRate": 70, "frequency": 4},
                    "metrics_tracked": "Secondary Strike%, Spin Rate, Movement",
                    "progressHistory": []
                }
            }
        else:  # Elite
            drills = {
                "elite-command": {
                    "id": "elite-command",
                    "title": "Elite Level Command",
                    "description": "Paint corners consistently in high-leverage situations",
                    "detailed_instructions": "Advanced situational command work. Focus on executing in pressure situations with precision.",
                    "category": "Command",
                    "developmentArea": "Precision Control",
                    "tier": "Elite",
                    "player_type": "pitcher",
                    "equipment_needed": "Advanced targets, baseballs, pressure scenarios",
                    "duration_minutes": 35,
                    "weeklyTarget": {"pitches": 20, "minSuccessRate": 85, "frequency": 4},
                    "metrics_tracked": "Edge%, CSW%, Clutch Performance",
                    "progressHistory": []
                }
            }
    
    return {"drills": drills}

@app.get("/pdp/{player_name}/drill-logs")
async def get_drill_logs(player_name: str):
    """Get drill logs for player"""
    # Return mock drill logs structure
    return {
        "drill_logs": {
            "contact-development": {
                "sessions": [
                    {
                        "date": "2025-08-15",
                        "reps": 0,
                        "swings": 75,
                        "pitches": 0,
                        "successRate": 72.0,
                        "notes": "Good contact quality, focused on barrel awareness"
                    },
                    {
                        "date": "2025-08-13",
                        "reps": 0,
                        "swings": 68,
                        "pitches": 0,
                        "successRate": 68.5,
                        "notes": "Improving timing consistency"
                    }
                ]
            },
            "mechanics-foundation": {
                "sessions": [
                    {
                        "date": "2025-08-14",
                        "reps": 0,
                        "swings": 60,
                        "pitches": 0,
                        "successRate": 75.0,
                        "notes": "Better swing path consistency"
                    }
                ]
            }
        }
    }

@app.post("/pdp/{player_name}/drill-log")
async def save_drill_log(player_name: str, drill_data: dict):
    """Save drill log for player"""
    # In a real app, this would save to database
    # For now, just return success
    return {
        "success": True,
        "message": f"Drill log saved for {player_name}",
        "data": drill_data
    }

if __name__ == "__main__":
    print("🐅⚾ Starting Mizzou Baseball Analytics API Server...")
    print("📊 Data directory:", DATA_DIR.absolute())
    print("🌐 Frontend URL: http://localhost:5173")
    print("🔌 API URL: http://localhost:8000")
    print("📖 API Docs: http://localhost:8000/docs")
    
    uvicorn.run(
        "backend:app",
        host="127.0.0.1", 
        port=8000,
        reload=True,
        log_level="info"
    )
