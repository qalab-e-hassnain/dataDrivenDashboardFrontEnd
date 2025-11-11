import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import './ProtectedRoute.css'

function ProtectedRoute({ 
  children, 
  requiredRole = null, 
  fallbackRole = null,
  requiredPermission = null, 
  requiredFeature = null,
  fallback = null 
}) {
  const { hasRole, hasPermission, hasTierAccess, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    // Check fallback role
    if (fallbackRole && hasRole(fallbackRole)) {
      return <>{children}</>
    }
    return fallback || (
      <div className="access-denied-container">
        <div className="access-denied">
          <span className="access-denied-icon">🔒</span>
          <h3>Access Denied</h3>
          <p>This page requires {requiredRole} role.</p>
        </div>
      </div>
    )
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (
      <div className="access-denied-container">
        <div className="access-denied">
          <span className="access-denied-icon">🔒</span>
          <h3>Access Denied</h3>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  // Check feature/tier requirement
  if (requiredFeature && !hasTierAccess(requiredFeature)) {
    return fallback || (
      <div className="access-denied-container">
        <div className="access-denied">
          <span className="access-denied-icon">💎</span>
          <h3>Feature Not Available</h3>
          <p>This feature requires a higher subscription tier.</p>
          <button className="btn-upgrade">Upgrade Plan</button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute

