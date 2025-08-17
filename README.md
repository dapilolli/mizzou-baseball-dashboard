# Mizzou Baseball Analytics Dashboard 🐅⚾

A comprehensive dual-mode scouting hub that combines professional data visualizations with AI-generated tactical narratives for baseball coaches and analysts.

## 🌟 Features

### **Dual-Mode Interface**

- **Visual Mode**: Professional charts, graphs, and heat maps
- **Narrative Mode**: AI-generated tactical analysis and recommendations
- **Split View**: Combined visual and narrative display
- **Print/Export**: PDF-ready formatting for reports

### **Advanced Scouting Analytics**

- **Pitcher Arsenal Analysis**: Detailed pitch movement profiles with TrackMan-style metrics
- **Pitch Movement Charts**: IVB vs HB scatter plots with color-coded pitch types
- **Tilt Analysis**: Radial histogram charts showing spin axis distribution (clock notation)
- **Expandable Cards**: Progressive disclosure interface for detailed analysis
- **Heat Maps**: Strike zone location tendencies
- **Performance Metrics**: FIP, whiff rates, usage patterns, and effectiveness data

### **Interactive Visualizations**

- **Recharts Integration**: Professional data visualization library
- **Responsive Design**: Mobile-friendly interface with TailwindCSS
- **Dark Theme**: Optimized for extended use and readability
- **Filter System**: Team, handedness, and situation filtering
- **Real-time Updates**: Dynamic chart updates based on filter selections

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash

   git clone https://github.com/dapilolli/mizzou-baseball-dashboard.git
   cd mizzou-baseball-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash

   npm run dev
   ```

4. **Open browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Build for Production

```bash
npm run build

npm run preview
```

## 📊 Data Structure

The application uses TrackMan/TruMedia-style baseball analytics with comprehensive metrics:

### **Real Data Sources**

- **Game Data**: Pitch-by-pitch data from Missouri vs Alabama games
- **Player Statistics**: Season stats for Missouri hitters and pitchers  
- **PDP Data**: Player Development Program goals and progress tracking
- **Training Data**: Drill templates and coaching resources

### **Key Data Files**

- `MIZZOUVBAMA.csv` - Pitch-by-pitch game data
- `Missouri - Hitting.csv` / `Missouri - Pitching.csv` - Season statistics
- `Pitch Level Data v Alabama.csv` - Detailed TrackMan metrics
- `Hitter_PDP_Goals.csv` / `Pitcher_PDP_Goals.csv` - Development targets
- `Training_Drills.csv` - Practice drill library
- `pdp_hitters.json` / `pdp_pitchers.json` - Player profiles

### **Advanced Metrics**

- **Movement Profile**: Induced Vertical Break (IVB) and Horizontal Break (HB)
- **Tilt Analysis**: Spin axis direction in degrees (0-360°) with clock notation
- **Release Point**: Extension and height data
- **Effectiveness**: Situational performance splits

## 🎯 Usage Examples

### **Scouting Page Navigation**

1. Select **Scouting** from main navigation

2. Choose view mode: Visual, Narrative, or Split
3. Apply filters: Team (Alabama/Missouri), handedness, situations
4. Click pitcher cards to expand detailed analysis
5. Export reports using print functionality

### **Understanding Pitch Movement**

- **Movement Chart**: Shows how each pitch moves relative to others
- **Tilt Chart**: Displays spin axis like a clock face (12:00 = backspin, 6:00 = topspin)
- **Color Coding**: Each pitch type has unique colors for easy identification

### **Arsenal Analysis**

- **Overview**: Basic pitch mix and usage percentages
- **Expanded**: Detailed movement profiles, effectiveness metrics, and visual charts
- **Recommendations**: AI-generated tactical advice for opposing hitters

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: TailwindCSS for responsive design
- **Charts**: Recharts for data visualization
- **Build Tool**: Vite for fast development
- **Routing**: React Router for navigation
- **Data Processing**: Mock data with realistic baseball analytics

## 📁 Project Structure

```
src/
├── components/
│   ├── AIRecommendations.tsx   # AI coaching insights
│   ├── AlabamaScouting.tsx     # Opponent analysis
│   ├── Header.tsx              # Main navigation
│   ├── PDPDashboard.tsx        # Player development portal
│   └── ...
├── pages/
│   ├── ScoutingPage.tsx        # Pitcher arsenal analysis
│   ├── GamedayPage.tsx         # Live game dashboard
│   ├── ReportsPage.tsx         # Player performance reports
│   ├── PDPPage.tsx             # Development program interface
│   └── ...
├── types/
│   └── scouting.ts            # TypeScript interfaces
├── data/                       # Real baseball data (CSV/JSON)
├── assets/                     # Images and fonts
└── main.tsx                   # Application entry point
```

## 🎨 Key Components

### **ScoutingPageEnhanced**

Main orchestrator component with dual-mode interface, filtering, and export functionality.

### **PitcherArsenalCard**

Expandable pitcher analysis with overview and detailed breakdown including movement charts.

### **PitchMovementChart**

TrackMan-style scatter plot showing IVB vs HB with interactive tooltips.

### **TiltRadialChart**

Radial histogram displaying pitch tilt distribution with clock notation.

## 🧪 Mock Data

The application includes realistic mock data featuring:

- **5 Unique Pitcher Archetypes**: Power, Finesse, Command, Hybrid, Veteran
- **Varied Pitch Mixes**: Different combinations and usage patterns
- **Realistic Metrics**: Based on actual professional baseball data
- **Movement Profiles**: Accurate physics-based pitch movement

## 📋 Development Notes

### **Data Architecture**

- **Scouting Page**: Uses mock data for advanced pitcher analysis (realistic TrackMan-style metrics)
- **Game Day**: Real pitch-by-pitch data from CSV files via backend API
- **Reports**: Actual player statistics from season data files
- **PDP Dashboard**: Player development data from CSV files and JSON profiles

### **Adding New Features**

1. Define TypeScript interfaces in `types/scouting.ts`
2. Create components in appropriate directories
3. For scouting features: Add mock data generators in `data/mockData.ts`
4. For other features: Add CSV data processing in backend
5. Integrate with existing filter and view systems

### **Backend Requirements**

This frontend requires a Python backend server to process CSV data and serve APIs. Key endpoints:

- `/gameday/*` - Live game data and pitch tracking
- `/reports/*` - Player statistics and performance data  
- `/pdp/*` - Player development program data
- `/team/*` - Roster and lineup information

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Acknowledgments

- **Missouri Tigers Baseball** - Inspiration and use case
- **TrackMan/TruMedia** - Analytics standards and terminology
- **Recharts** - Excellent data visualization library
- **TailwindCSS** - Responsive design framework

## 📞 Support

For questions or support, please open an issue in the GitHub repository.

---

**Built with ❤️ for baseball analytics and coaching excellence** 🐅⚾
