import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import './RiskIndicatorDashboard.css'

const RiskIndicatorDashboard = ({ projectId }) => {
  const [indicators, setIndicators] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (projectId) {
      fetchIndicators()
      // Auto-refresh every 5 minutes
      const interval = setInterval(fetchIndicators, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [projectId])

  const fetchIndicators = async () => {
    try {
      const data = await apiService.getTimeBasedRiskIndicators(projectId)
      setIndicators(data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch indicators:', err)
      setError('Failed to load risk indicators. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityGradient = (severity) => {
    switch (severity) {
      case 'critical':
        return 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)'
      case 'high':
        return 'linear-gradient(135deg, #fd7e14 0%, #f59e0b 100%)'
      case 'medium':
        return 'linear-gradient(135deg, #ffc107 0%, #ffd54f 100%)'
      case 'low':
        return 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
      default:
        return 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#f5576c'
      case 'high':
        return '#fd7e14'
      case 'medium':
        return '#ffc107'
      case 'low':
        return '#11998e'
      default:
        return '#6c757d'
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return '🔴'
      case 'high':
        return '🟠'
      case 'medium':
        return '🟡'
      case 'low':
        return '🟢'
      default:
        return '⚪'
    }
  }

  if (loading) {
    return <div className="risk-indicator-loading">Loading risk indicators...</div>
  }

  if (error) {
    return <div className="risk-indicator-error">{error}</div>
  }

  if (!indicators || !indicators.indicators || indicators.indicators.length === 0) {
    return (
      <div className="risk-indicator-dashboard">
        <div className="risk-indicator-header">
          <h2>Time-based Risk Indicators</h2>
          <button onClick={fetchIndicators} className="btn-refresh">Refresh</button>
        </div>
        <div className="no-indicators">No risk indicators found.</div>
      </div>
    )
  }

  return (
    <div className="risk-indicator-dashboard">
      <div className="risk-indicator-header">
        <h2>Time-based Risk Indicators</h2>
        <button onClick={fetchIndicators} className="btn-refresh">Refresh</button>
      </div>

      <div className="risk-summary-section">
        <div className={`overall-risk-badge overall-risk-${indicators.overall_risk_level}`}>
          <div className="overall-risk-label">Overall Risk Level</div>
          <div className="overall-risk-value">
            {indicators.overall_risk_level.toUpperCase()}
          </div>
        </div>

        <div className="risk-summary-stats">
          <div className="summary-stat summary-stat-total">
            <div className="stat-value">{indicators.summary.total_indicators}</div>
            <div className="stat-label">Total Indicators</div>
          </div>
          <div className="summary-stat summary-stat-critical">
            <div className="stat-value">{indicators.summary.critical_indicators}</div>
            <div className="stat-label">Critical</div>
          </div>
          <div className="summary-stat summary-stat-high">
            <div className="stat-value">{indicators.summary.high_risk_indicators}</div>
            <div className="stat-label">High</div>
          </div>
          <div className="summary-stat summary-stat-medium">
            <div className="stat-value">{indicators.summary.medium_risk_indicators}</div>
            <div className="stat-label">Medium</div>
          </div>
          <div className="summary-stat summary-stat-low">
            <div className="stat-value">{indicators.summary.low_risk_indicators}</div>
            <div className="stat-label">Low</div>
          </div>
        </div>
      </div>

      <div className="indicators-list">
        {indicators.indicators.map((indicator, index) => (
          <div
            key={index}
            className="indicator-card"
            style={{ borderLeft: `4px solid ${getSeverityColor(indicator.severity)}` }}
          >
            <div className="indicator-header">
              <div className="indicator-severity">
                <span className="severity-icon">{getSeverityIcon(indicator.severity)}</span>
                <span
                  className="severity-badge"
                  style={{ background: getSeverityGradient(indicator.severity) }}
                >
                  {indicator.severity.toUpperCase()}
                </span>
              </div>
              <div className="indicator-type">{indicator.type.replace(/_/g, ' ').toUpperCase()}</div>
            </div>
            <h4 className="indicator-title">{indicator.title}</h4>
            <p className="indicator-description">{indicator.description}</p>

            {indicator.task_name && (
              <div className="indicator-task-info">
                <strong>Task:</strong> {indicator.task_name}
                {indicator.task_id && <span className="task-id">({indicator.task_id})</span>}
              </div>
            )}

            {indicator.days_until_late_start !== undefined && (
              <div className="indicator-metric">
                <strong>Days Until Late Start:</strong> {indicator.days_until_late_start} days
              </div>
            )}

            {indicator.delay_days !== undefined && (
              <div className="indicator-metric">
                <strong>Delay:</strong> {indicator.delay_days} days
              </div>
            )}

            {indicator.spi !== undefined && (
              <div className="indicator-metric">
                <strong>SPI:</strong> {indicator.spi.toFixed(2)}
                {indicator.schedule_variance && (
                  <span> | <strong>Schedule Variance:</strong> PKR {indicator.schedule_variance.toLocaleString()}</span>
                )}
              </div>
            )}

            {indicator.dependency_task_name && (
              <div className="indicator-metric">
                <strong>Dependency:</strong> {indicator.dependency_task_name}
                {indicator.potential_delay_days && (
                  <span> | <strong>Potential Delay:</strong> {indicator.potential_delay_days} days</span>
                )}
              </div>
            )}

            {indicator.current_completion !== undefined && (
              <div className="indicator-metric">
                <strong>Current Completion:</strong> {indicator.current_completion.toFixed(1)}%
                {indicator.required_completion_per_day && (
                  <span> | <strong>Required/Day:</strong> {indicator.required_completion_per_day.toFixed(1)}%</span>
                )}
                {indicator.current_completion_per_day && (
                  <span> | <strong>Current/Day:</strong> {indicator.current_completion_per_day.toFixed(1)}%</span>
                )}
              </div>
            )}

            <div className="recommended-action">
              <strong>Recommended Action:</strong>
              <p>{indicator.recommended_action}</p>
            </div>
          </div>
        ))}
      </div>

      {indicators.generated_at && (
        <div className="indicators-footer">
          Last updated: {new Date(indicators.generated_at).toLocaleString()}
        </div>
      )}
    </div>
  )
}

export default RiskIndicatorDashboard

