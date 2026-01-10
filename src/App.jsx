import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import DashboardPage from './pages/DashboardPage'
import CriticalPathPage from './pages/CriticalPathPage'
import GanttChartPage from './pages/GanttChartPage'
import ResourceLevelingPage from './pages/ResourceLevelingPage'
import RiskRegisterPage from './pages/RiskRegisterPage'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/project/:projectId" element={<DashboardPage />} />
            <Route path="/critical-path/:projectId" element={<CriticalPathPage />} />
            <Route path="/gantt-chart/:projectId" element={<GanttChartPage />} />
            <Route path="/resource-leveling/:projectId" element={<ResourceLevelingPage />} />
            <Route path="/risk-register/:projectId" element={<RiskRegisterPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
