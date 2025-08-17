# Changelog

All notable changes to the Mizzou Baseball Analytics Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-17

### Added
- **Dual-Mode Scouting Interface**: Visual, Narrative, and Split view modes
- **Advanced Pitcher Analytics**: Comprehensive pitch movement analysis with TrackMan-style metrics
- **Pitch Movement Charts**: Interactive scatter plots showing IVB vs HB for all pitch types
- **Tilt Analysis**: Radial histogram charts displaying spin axis distribution with clock notation
- **Expandable Cards**: Progressive disclosure interface for detailed pitcher analysis
- **Professional Visualizations**: Recharts integration with custom dark theme styling
- **Filter System**: Team, handedness, and situational filtering capabilities
- **Export Functionality**: Print/PDF export with optimized formatting
- **Mock Data System**: Realistic baseball analytics with 5 unique pitcher archetypes
- **Responsive Design**: Mobile-friendly interface built with TailwindCSS
- **TypeScript Integration**: Full type safety with comprehensive interfaces

### Features
- **Arsenal Analysis**: Detailed breakdown of pitch types, usage, and effectiveness
- **Movement Profiles**: IVB, HB, extension, release height, and tilt measurements
- **Performance Metrics**: Whiff rates, putaway rates, FIP-based splits
- **Heat Maps**: Strike zone location tendencies visualization
- **AI Recommendations**: Generated tactical advice for opposing teams
- **Times Through Order**: Performance analysis across multiple plate appearances

### Technical
- React 18 + TypeScript foundation
- Vite build system for fast development
- TailwindCSS for utility-first styling
- Recharts for professional data visualization
- React Router for client-side navigation
- Modular component architecture

### Data
- **Pitch Types**: 4S, SI, SL, CH, CB, CT, SFF, SW with realistic metrics
- **Movement Data**: Physics-based IVB/HB calculations
- **Tilt Analysis**: 360-degree spin axis measurements
- **Velocity Profiles**: Realistic speed distributions per pitch type
- **Usage Patterns**: Varied pitch mix percentages across archetypes

## [0.1.0] - 2025-08-16

### Added
- Initial project setup
- Basic scouting page structure
- Header navigation component
- Basic pitcher card layout

---

**Release Notes:**
- This is the initial public release of the Mizzou Baseball Analytics Dashboard
- Features comprehensive scouting tools for college baseball analysis
- Built specifically for coaching staff and analytics teams
- Ready for production deployment with mock data
- Designed for easy integration with real baseball data sources
