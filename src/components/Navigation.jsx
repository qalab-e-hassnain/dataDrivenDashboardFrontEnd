import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import './Navigation.css'

function Navigation({ currentPage }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, organization, logout } = useAuth()
  const { 
    isSuperAdmin, 
    isOrgAdmin, 
    canManageUsers, 
    canManageBilling,
    subscriptionTier 
  } = usePermissions()

  const menuItems = []

  // Dashboard (always available)
  menuItems.push({
    id: 'dashboard',
    label: '📊 Dashboard',
    path: '/dashboard',
    available: true,
  })

  // Super Admin menu
  if (isSuperAdmin) {
    menuItems.push({
      id: 'super-admin',
      label: '⚙️ Super Admin',
      path: '/admin/super',
      available: true,
    })
  }

  // Org Admin menu
  if (isOrgAdmin || isSuperAdmin) {
    menuItems.push({
      id: 'org-admin',
      label: '🏢 Organization',
      path: '/admin/org',
      available: true,
    })
  }

  // User Management (if has permission)
  if (canManageUsers) {
    menuItems.push({
      id: 'users',
      label: '👥 Users',
      path: '/admin/users',
      available: true,
    })
  }

  // Subscription (if has permission)
  if (canManageBilling) {
    menuItems.push({
      id: 'subscription',
      label: '💳 Subscription',
      path: '/admin/subscription',
      available: true,
    })
  }

  const handleNavigate = (path) => {
    navigate(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="main-navigation">
      <div className="nav-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <span className="brand-icon">🚀</span>
        <span className="brand-text">Project Dashboard</span>
      </div>
      
      <div className="nav-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNavigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="nav-user">
        <div className="user-info">
          <div className="user-avatar-small">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-details-small">
            <div className="user-name-small">{user?.name || 'User'}</div>
            <div className="user-role-small">{user?.role || 'Member'}</div>
          </div>
        </div>
        {organization && (
          <div className="tier-badge-small">
            {subscriptionTier}
          </div>
        )}
        <button className="btn-logout" onClick={handleLogout} title="Logout">
          🚪
        </button>
      </div>
    </nav>
  )
}

export default Navigation

