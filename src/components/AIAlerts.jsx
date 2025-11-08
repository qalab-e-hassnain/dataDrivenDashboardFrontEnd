import React from 'react'
import './AIAlerts.css'

function AIAlerts({ data }) {
  if (!data) {
    return <div className="alerts-section">Loading alerts...</div>
  }

  const getAlertIcon = (type) => {
    if (type === 'critical') return '⚠️'
    if (type === 'warning') return '⚠️'
    if (type === 'info') return '💡'
    return 'ℹ️'
  }

  const getAlertBorderColor = (type) => {
    if (type === 'critical') return '#ef4444'
    if (type === 'warning') return '#f59e0b'
    if (type === 'info') return '#3b82f6'
    return '#6b7280'
  }

  const getAlertBackgroundColor = (type) => {
    if (type === 'critical') return '#fef2f2'
    if (type === 'warning') return '#fffbeb'
    if (type === 'info') return '#eff6ff'
    return '#f9fafb'
  }

  const getAlertIconColor = (type) => {
    if (type === 'critical') return '#ef4444'
    if (type === 'warning') return '#f59e0b'
    if (type === 'info') return '#3b82f6'
    return '#6b7280'
  }

  return (
    <div className="alerts-section">
      <div className="section-header">
        <div className="section-title-wrapper">
          <span className="section-icon">🤖</span>
          <h2 className="section-title">AI Alerts & Recommendations</h2>
        </div>
      </div>

      <div className="alerts-list">
        {data.map((alert, index) => (
          <div 
            key={index} 
            className="alert-card"
            style={{ 
              borderLeftColor: getAlertBorderColor(alert.type),
              backgroundColor: getAlertBackgroundColor(alert.type)
            }}
          >
            <div className="alert-icon-wrapper">
              <span className="alert-icon">
                {getAlertIcon(alert.type)}
              </span>
            </div>
            <div className="alert-content">
              <div className="alert-title">{alert.title}</div>
              <div className="alert-message">{alert.message}</div>
              <div className="alert-timestamp">{alert.timestamp}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AIAlerts
