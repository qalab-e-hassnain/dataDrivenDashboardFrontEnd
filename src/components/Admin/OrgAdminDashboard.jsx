import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import UserList from '../UserManagement/UserList'
import SubscriptionPlans from '../Subscription/SubscriptionPlans'
import './OrgAdminDashboard.css'

function OrgAdminDashboard() {
  const { organization, hasRole, hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState('users')

  if (!hasRole('Org Admin') && !hasRole('Super Admin')) {
    return (
      <div className="org-admin-container">
        <div className="access-denied">
          <span className="access-denied-icon">🔒</span>
          <h3>Access Denied</h3>
          <p>Organization Admin access required.</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'users', label: '👥 Users', component: <UserList organizationId={organization?.id} /> },
    { id: 'subscription', label: '💳 Subscription', component: <SubscriptionPlans /> },
    { id: 'integrations', label: '🔌 Integrations', component: <IntegrationsTab /> },
    { id: 'settings', label: '⚙️ Settings', component: <OrgSettingsTab /> },
  ]

  return (
    <div className="org-admin-container">
      <div className="org-admin-header">
        <div>
          <h1 className="admin-title">🏢 Organization Administration</h1>
          <p className="admin-subtitle">{organization?.name || 'Organization Management'}</p>
        </div>
      </div>

      <div className="org-admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="org-admin-content">
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>
    </div>
  )
}

function IntegrationsTab() {
  const { hasPermission } = useAuth()
  const integrations = [
    { id: 'slack', name: 'Slack', icon: '💬', connected: false },
    { id: 'jira', name: 'Jira', icon: '🎯', connected: false },
    { id: 'teams', name: 'Microsoft Teams', icon: '👥', connected: false },
    { id: 'github', name: 'GitHub', icon: '🐙', connected: false },
  ]

  if (!hasPermission('configure_integrations')) {
    return (
      <div className="access-denied">
        <span className="access-denied-icon">🔒</span>
        <h3>Access Denied</h3>
        <p>You don't have permission to configure integrations.</p>
      </div>
    )
  }

  return (
    <div className="integrations-container">
      <h2 className="section-title">Integrations</h2>
      <p className="section-subtitle">Connect your favorite tools to streamline workflows</p>
      
      <div className="integrations-grid">
        {integrations.map((integration) => (
          <div key={integration.id} className="integration-card">
            <div className="integration-icon">{integration.icon}</div>
            <h3 className="integration-name">{integration.name}</h3>
            <button className={`btn-integration ${integration.connected ? 'connected' : ''}`}>
              {integration.connected ? 'Connected' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function OrgSettingsTab() {
  const { organization, updateOrganization, hasPermission } = useAuth()
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    email: organization?.email || '',
    timezone: organization?.timezone || 'UTC',
  })

  const handleSave = async () => {
    if (!hasPermission('manage_billing')) {
      alert('You don\'t have permission to update organization settings')
      return
    }

    try {
      // Update organization via API
      // await apiService.updateOrganization(organization.id, formData)
      updateOrganization({ ...organization, ...formData })
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to update settings:', error)
      alert('Failed to update settings')
    }
  }

  return (
    <div className="org-settings-container">
      <h2 className="section-title">Organization Settings</h2>
      
      <div className="settings-form">
        <div className="form-group">
          <label>Organization Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Contact Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Timezone</label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Asia/Karachi">Karachi</option>
          </select>
        </div>
        <div className="form-actions">
          <button className="btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrgAdminDashboard

