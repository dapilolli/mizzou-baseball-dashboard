import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import TeamPage from './pages/TeamPage'
import ReportsPage from './pages/ReportsPage'
import ReportsListPage from './pages/ReportsListPage'
import ScoutingPage from './pages/ScoutingPage'
import PDPPage from './pages/PDPPage'
import GamedayPage from './pages/GamedayPage'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'
import Header from './components/Header'

// Check if user is authenticated
const isAuthenticated = () => localStorage.getItem('isAuthenticated') === 'true';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Header />
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route path="/" element={
          isAuthenticated() ? <Navigate to="/team" replace /> : <Navigate to="/login" replace />
        } />

        <Route path="/team" element={
          <ProtectedRoute>
            <TeamPage />
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute>
            <ReportsListPage />
          </ProtectedRoute>
        } />

        <Route path="/reports/:playerId" element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        } />

        <Route path="/scouting" element={
          <ProtectedRoute>
            <ScoutingPage />
          </ProtectedRoute>
        } />

        <Route path="/pdp" element={
          <ProtectedRoute>
            <PDPPage />
          </ProtectedRoute>
        } />

        <Route path="/gameday" element={
          <ProtectedRoute>
            <GamedayPage />
          </ProtectedRoute>
        } />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
