// --- TeamPage.tsx (Sortable, Clickable) ---

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/utils/api';

const TeamPage = () => {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [type, setType] = useState<'hitters' | 'pitchers'>('hitters');
  const [sortField, setSortField] = useState('Player');
  const [sortAsc, setSortAsc] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    position: '',
    handedness: '',
    paRange: ''
  });
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const fetchData = async (type: string) => {
    const res = await api(`/team/${type}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch data: ${res.status}`);
    }
    const json = await res.json();
    setData(json);
    setFilteredData(json);
  };

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
    fetchData(type);
    setSearchTerm('');
    setFilters({ position: '', handedness: '', paRange: '' });
  }, [type]);

  // Check if handedness data is available
  const hasHandednessData = data.length > 0 && (
    (type === 'hitters' && data.some(player => player.Bats)) ||
    (type === 'pitchers' && data.some(player => player.Throws))
  );

  // Filter and search data
  useEffect(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.Player.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.position) {
      // Filter by position (for hitters mostly, pitchers are all "P")
      filtered = filtered.filter(player =>
        player.Position?.includes(filters.position) ||
        player.Pos?.includes(filters.position)
      );
    }

    if (filters.handedness && hasHandednessData) {
      // Filter by handedness - for hitters use "Bats", for pitchers use "Throws"
      if (type === 'hitters') {
        filtered = filtered.filter(player =>
          player.Bats === filters.handedness
        );
      } else if (type === 'pitchers') {
        filtered = filtered.filter(player =>
          player.Throws === filters.handedness
        );
      }
    }

    if (filters.paRange && type === 'hitters') {
      const paValue = parseInt(filters.paRange);
      filtered = filtered.filter(player => (player.PA || 0) >= paValue);
    }

    setFilteredData(filtered);
  }, [data, searchTerm, filters, type]);

  // Function to format values based on stat type
  const formatValue = (key: string, val: any) => {
    if (typeof val !== 'number') return String(val);

    // No decimals for counting stats
    if (['PA', 'AB', 'H', '1B', '2B', '3B', 'HR', 'Rank'].includes(key)) {
      return val.toFixed(0);
    }

    // 1 decimal for percentages and velocity-based stats
    if (key.includes('%') || ['ExitVelo', 'AvgEV', 'MaxEV', 'HH%', 'HardHit%', 'BB%', 'K%', 'LaunchAng', 'IP'].includes(key)) {
      return val.toFixed(1);
    }

    // 2 decimals for ERA and similar metrics
    if (['ERA', 'RA9-ERA', 'RA/9', 'WHIP', 'FIP', 'xFIP_TM', 'GB/FB'].includes(key)) {
      return val.toFixed(2);
    }

    // 3 decimals for advanced metrics
    if (['wOBA', 'xWOBA', 'BA', 'OBP', 'SLG', 'OPS', 'xSLG'].includes(key)) {
      return val.toFixed(3);
    }

    // Default: 3 decimals for other stats
    return val.toFixed(3);
  };

  // Calculate team averages
  const calculateTeamAverages = () => {
    if (filteredData.length === 0) return null;

    const averages: any = { Player: 'TEAM AVERAGE' };
    const keys = Object.keys(filteredData[0]).filter(key => key !== 'Player');

    keys.forEach(key => {
      const values = filteredData.map(row => row[key]).filter(val => typeof val === 'number' && !isNaN(val));
      if (values.length > 0) {
        // For counting stats (PA, AB, H, etc.), sum them instead of averaging
        if (['PA', 'AB', 'H', '2B', '3B', 'HR'].includes(key)) {
          averages[key] = values.reduce((sum, val) => sum + val, 0);
        } else {
          averages[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
        }
      } else {
        averages[key] = filteredData[0][key]; // Keep non-numeric values
      }
    });

    return averages;
  };

  // Define column order for each player type
  const getColumnOrder = () => {
    if (type === 'hitters') {
      return ['Player', 'AB', 'PA', 'xWOBA', 'wOBA', 'BA', 'OBP', 'SLG', 'OPS', 'AvgEV', 'Barrel%', 'HH%', 'BB%', 'K%'];
    } else if (type === 'pitchers') {
      return ['Player', 'IP', 'xFIP_TM', 'FIP', 'K%-BB%', 'xWOBA', 'CSW%', 'Barrel%', 'HH%'];
    }
    return ['Player']; // fallback
  };

  const getOrderedColumns = () => {
    if (filteredData.length === 0) return [];

    const preferredOrder = getColumnOrder();
    const allColumns = Object.keys(filteredData[0]);
    const remainingColumns = allColumns.filter(col => !preferredOrder.includes(col));

    // For mobile, show fewer columns
    if (isMobile) {
      if (type === 'hitters') {
        return ['Player', 'BA', 'OBP', 'SLG', 'OPS'];
      } else {
        return ['Player', 'ERA', 'WHIP', 'K%', 'BB%'];
      }
    }

    return [...preferredOrder.filter(col => allColumns.includes(col)), ...remainingColumns];
  };

  // Function to display column names with custom formatting
  const getDisplayName = (columnName: string) => {
    if (columnName === 'xWOBA') return 'xwOBA';
    return columnName;
  };

  const orderedColumns = getOrderedColumns();
  const teamAverages = calculateTeamAverages();
  const sortedData = [...filteredData].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    } else {
      return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    }
  });

  const handleSort = (field: string) => {
    if (field === sortField) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-white">Missouri Team Stats</h1>

      <div className="mb-6">
        <button
          onClick={() => setType('hitters')}
          className={`mr-4 px-6 py-3 rounded-lg font-semibold text-lg transition-colors ${type === 'hitters'
            ? 'bg-[#F1B82D] text-black shadow-lg'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Hitters
        </button>
        <button
          onClick={() => setType('pitchers')}
          className={`px-6 py-3 rounded-lg font-semibold text-lg transition-colors ${type === 'pitchers'
            ? 'bg-[#F1B82D] text-black shadow-lg'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Pitchers
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 bg-black rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div>
            <label className="block text-yellow-400 text-sm font-bold mb-2">
              Search Player
            </label>
            <input
              type="text"
              placeholder="Enter player name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Position Filter */}
          <div>
            <label className="block text-yellow-400 text-sm font-bold mb-2">
              Position
            </label>
            <select
              title="Filter by position"
              value={filters.position}
              onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none"
            >
              <option value="">All Positions</option>
              <option value="C">Catcher</option>
              <option value="1B">First Base</option>
              <option value="2B">Second Base</option>
              <option value="3B">Third Base</option>
              <option value="SS">Shortstop</option>
              <option value="OF">Outfield</option>
              <option value="P">Pitcher</option>
            </select>
          </div>

          {/* Handedness Filter */}
          {hasHandednessData && (
            <div>
              <label className="block text-yellow-400 text-sm font-bold mb-2">
                {type === 'hitters' ? 'Bats' : 'Throws'}
              </label>
              <select
                title={`Filter by ${type === 'hitters' ? 'batting' : 'throwing'} handedness`}
                value={filters.handedness}
                onChange={(e) => setFilters(prev => ({ ...prev, handedness: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none"
              >
                <option value="">All {type === 'hitters' ? 'Batters' : 'Pitchers'}</option>
                <option value="L">Left</option>
                <option value="R">Right</option>
                {type === 'hitters' && <option value="S">Switch</option>}
              </select>
            </div>
          )}

          {/* PA Range Filter */}
          {type === 'hitters' && (
            <div>
              <label className="block text-yellow-400 text-sm font-bold mb-2">
                PA Range
              </label>
              <select
                title="Filter by PA range"
                value={filters.paRange}
                onChange={(e) => setFilters(prev => ({ ...prev, paRange: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none"
              >
                <option value="">All PA</option>
                <option value="20+">20+ PA</option>
                <option value="50+">50+ PA</option>
                <option value="100+">100+ PA</option>
              </select>
            </div>
          )}

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({ position: '', handedness: '', paRange: '' });
              }}
              className="w-full px-4 py-2 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mt-4 text-white text-sm">
          Showing {filteredData.length} of {data.length} players
        </div>
      </div>

      {/* Desktop Table */}
      {!isMobile && filteredData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                {getOrderedColumns().map((key) => (
                  <th
                    key={key}
                    className="border-b-2 border-gray-200 px-6 py-4 text-left font-bold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort(key)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{getDisplayName(key)}</span>
                      <span className="text-sm font-bold">
                        {sortField === key ? (sortAsc ? '↑' : '↓') : '↕'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, i) => (
                <tr
                  key={i}
                  className={`cursor-pointer transition-colors border-b border-gray-200 ${i % 2 === 0
                    ? 'bg-white hover:bg-[#F1B82D]/10'
                    : 'bg-gray-50 hover:bg-[#F1B82D]/20'
                    }`}
                  onClick={() => navigate(`/reports/${row.Player}`)}
                >
                  {getOrderedColumns().map((key, j) => (
                    <td key={j} className="px-6 py-4 text-gray-900 font-semibold">
                      {formatValue(key, row[key])}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Team Average Row */}
              {teamAverages && (
                <tr className="bg-[#F1B82D] border-t-4 border-[#F1B82D]">
                  {getOrderedColumns().map((key, j) => (
                    <td key={j} className="px-6 py-4 text-black font-bold text-lg">
                      {key === 'Player' ? String(teamAverages[key]) : formatValue(key, teamAverages[key])}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Cards */}
      {isMobile && filteredData.length > 0 && (
        <div className="space-y-4">
          {sortedData.map((row, i) => (
            <div
              key={i}
              className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/reports/${row.Player}`)}
            >
              <div className="text-[#F1B82D] font-bold text-lg mb-3 border-b border-gray-200 pb-2">
                {row.Player}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {getOrderedColumns().slice(1).map((key) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 text-sm font-medium">{getDisplayName(key)}:</span>
                    <span className="text-gray-900 text-sm font-semibold">
                      {formatValue(key, row[key])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Mobile Team Averages */}
          {teamAverages && (
            <div className="bg-[#F1B82D] rounded-lg p-4">
              <div className="text-black font-bold text-lg mb-3 border-b border-black pb-2">
                Team Average
              </div>
              <div className="grid grid-cols-2 gap-3">
                {getOrderedColumns().slice(1).map((key) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-black text-sm font-medium">{getDisplayName(key)}:</span>
                    <span className="text-black text-sm font-bold">
                      {formatValue(key, teamAverages[key])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {filteredData.length === 0 && data.length > 0 && (
        <div className="bg-black rounded-lg p-8 text-center">
          <p className="text-white text-lg">No players match your current filters.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilters({ position: '', handedness: '', paRange: '' });
            }}
            className="mt-4 px-6 py-2 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
