import React, { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import './SuperAdminDashboard.css'

function SuperAdminDashboard() {
  const { hasRole } = useAuth()
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    revenue: 0,
  })

  useEffect(() => {
    if (hasRole('Super Admin')) {
      fetchData()
    }
  }, [hasRole])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [orgsResponse, statsResponse] = await Promise.all([
        apiService.getOrganizations(),
        apiService.getPlatformStats(),
      ])
      
      setOrganizations(Array.isArray(orgsResponse) ? orgsResponse : orgsResponse?.organizations || [])
      setStats(statsResponse || stats)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!hasRole('Super Admin')) {
    return (
      <div className="admin-dashboard-container">
        <div className="access-denied">
          <span className="access-denied-icon">🔒</span>
          <h3>Access Denied</h3>
          <p>Super Admin access required.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">⚙️ Super Admin Dashboard</h1>
          <p className="admin-subtitle">Platform-wide management and analytics</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalOrganizations}</div>
            <div className="stat-label">Organizations</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeSubscriptions}</div>
            <div className="stat-label">Active Subscriptions</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">${(stats.revenue / 1000).toFixed(1)}K</div>
            <div className="stat-label">Monthly Revenue</div>
          </div>
        </div>
      </div>

      <div className="admin-sections">
        <OrganizationsList organizations={organizations} loading={loading} />
        <PlatformSettings />
      </div>
    </div>
  )
}

function OrganizationsList({ organizations, loading }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredOrgs = organizations.filter(org =>
    org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2 className="section-title">Organizations</h2>
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading organizations...</div>
      ) : (
        <div className="organizations-table">
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Admin</th>
                <th>Subscription</th>
                <th>Users</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrgs.map((org) => (
                <tr key={org.id || org._id}>
                  <td>
                    <div className="org-info">
                      <div className="org-avatar">{org.name?.charAt(0) || 'O'}</div>
                      <div>
                        <div className="org-name">{org.name || 'Unknown'}</div>
                        <div className="org-email">{org.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{org.admin_name || 'N/A'}</td>
                  <td>
                    <span className={`subscription-badge ${org.subscription_tier?.toLowerCase()}`}>
                      {org.subscription_tier || 'Basic'}
                    </span>
                  </td>
                  <td>{org.current_users || 0}</td>
                  <td>
                    <span className={`status-badge ${org.subscription_status || 'active'}`}>
                      {org.subscription_status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-action">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PlatformSettings() {
  return (
    <div className="admin-section">
      <h2 className="section-title">Platform Settings</h2>
      <div className="settings-grid">
        <div className="setting-card">
          <h3>AI Modules</h3>
          <p>Configure AI features and models</p>
          <button className="btn-primary">Configure</button>
        </div>
        <div className="setting-card">
          <h3>Billing & Payments</h3>
          <p>Manage payment gateways and pricing</p>
          <button className="btn-primary">Manage</button>
        </div>
        <div className="setting-card">
          <h3>Audit Logs</h3>
          <p>View platform-wide activity logs</p>
          <button className="btn-primary">View Logs</button>
        </div>
      </div>
    </div>
  )
}

export default SuperAdminDashboard

