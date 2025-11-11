import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Navigation from './components/Navigation'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import './App.css'

function AppContent() {
  const location = useLocation()
  const { user } = useAuth()
  
  // Determine current page from pathname
  const getCurrentPage = () => {
    if (location.pathname.startsWith('/admin/super')) return 'super-admin'
    if (location.pathname.startsWith('/admin/org')) return 'org-admin'
    if (location.pathname.startsWith('/admin/users')) return 'users'
    if (location.pathname.startsWith('/admin/subscription')) return 'subscription'
    if (location.pathname.startsWith('/dashboard')) return 'dashboard'
    return 'dashboard'
  }

  // Protect routes - redirect to login if not authenticated
  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

  if (user && location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="App">
      {user && <Navigation currentPage={getCurrentPage()} />}
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/super" element={<AdminPage page="super" />} />
        <Route path="/admin/org" element={<AdminPage page="org" />} />
        <Route path="/admin/users" element={<AdminPage page="users" />} />
        <Route path="/admin/subscription" element={<AdminPage page="subscription" />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
