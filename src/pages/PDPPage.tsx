import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PDPDashboard from "../components/PDPDashboard";
import Header from "../components/Header";
import { api } from "@/utils/api";

export default function PDPPage() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<{ hitters: string[], pitchers: string[], all: string[] }>({
    hitters: [],
    pitchers: [],
    all: []
  });
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'hitters' | 'pitchers'>('hitters');
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    api("/pdp/list")
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data);
      })
      .catch((err) => console.error("Failed to fetch player list:", err));
  }, []);

  return (
    <div className={`${isMobile ? 'p-3' : 'p-6'} min-h-screen bg-gray-800`}>
      <div className="mb-6">
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'} mb-4`}>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-white`}>
            Player Development Plan
          </h1>
        </div>

        {/* Hitters/Pitchers Toggle */}
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-4'} mb-6`}>
          <button
            onClick={() => {
              setActiveTab('hitters');
              setSelectedPlayer('');
            }}
            className={`${isMobile ? 'w-full' : ''} px-6 py-2 rounded font-semibold ${activeTab === 'hitters'
              ? 'bg-yellow-400 text-black'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Hitters
          </button>
          <button
            onClick={() => {
              setActiveTab('pitchers');
              setSelectedPlayer('');
            }}
            className={`${isMobile ? 'w-full' : ''} px-6 py-2 rounded font-semibold ${activeTab === 'pitchers'
              ? 'bg-yellow-400 text-black'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Pitchers
          </button>
        </div>
      </div>

      <div className={`${isMobile ? 'mx-3' : 'max-w-lg mx-auto'} mb-6`}>
        <label htmlFor="player-select" className={`block font-medium mb-2 text-white ${isMobile ? 'text-sm' : ''}`}>
          Select {activeTab === 'hitters' ? 'Hitter' : 'Pitcher'}
        </label>
        <select
          id="player-select"
          title="Select player"
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          className={`p-2 border rounded w-full ${isMobile ? 'text-sm' : ''}`}
        >
          <option value="">Choose a {activeTab === 'hitters' ? 'hitter' : 'pitcher'}...</option>
          {(activeTab === 'hitters' ? players.hitters : players.pitchers).map((player) => (
            <option key={player} value={player}>
              {player}
            </option>
          ))}
        </select>
      </div>

      {selectedPlayer && (
        <div className="max-w-7xl mx-auto">
          <PDPDashboard
            playerName={selectedPlayer}
            playerType={activeTab === 'hitters' ? 'hitter' : 'pitcher'}
          />
        </div>
      )}
    </div>
  );
}
