import React from 'react'
import './ActionPlan.css'

function ActionPlan({ actionPlan }) {
  if (!actionPlan || !actionPlan.action_plan) {
    return (
      <div className="no-action-plan">
        <div className="no-plan-icon">🎯</div>
        <h3>No Action Plan Available</h3>
        <p>Unable to generate action plan at this time.</p>
      </div>
    )
  }

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'schedule': return '📅'
      case 'cost': return '💰'
      case 'task': return '✅'
      case 'resource': return '👥'
      case 'inventory': return '📦'
      case 'risk': return '⚠️'
      case 'predictive': return '🔮'
      default: return '💡'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      default: return '#6b7280'
    }
  }

  const getTimelineIcon = (timeline) => {
    switch (timeline?.toLowerCase()) {
      case 'immediate': return '🚨'
      case 'this_week': return '📅'
      case 'this_month': return '📆'
      case 'future': return '🗓️'
      case 'next_quarter': return '🗓️'
      // Legacy support
      case 'immediate_actions': return '🚨'
      case 'short_term': return '📅'
      case 'medium_term': return '📆'
      case 'long_term': return '🗓️'
      default: return '⏱️'
    }
  }

  const getTimelineLabel = (timeline) => {
    switch (timeline?.toLowerCase()) {
      case 'immediate': return 'Immediate'
      case 'this_week': return 'This Week'
      case 'this_month': return 'This Month'
      case 'future': return 'Future'
      case 'next_quarter': return 'Next Quarter'
      // Legacy support
      case 'immediate_actions': return 'Immediate'
      case 'short_term': return 'This Week'
      case 'medium_term': return 'This Month'
      case 'long_term': return 'Future'
      default: return 'Future'
    }
  }

  // Calculate counts from actual action_plan data to ensure accuracy
  const calculateCounts = () => {
    const counts = {
      total: 0,
      immediate: 0,
      this_week: 0,
      this_month: 0,
      future: 0
    }

    if (actionPlan.action_plan) {
      Object.entries(actionPlan.action_plan).forEach(([timeline, actions]) => {
        const actionCount = Array.isArray(actions) ? actions.length : 0
        counts.total += actionCount

        // Map timeline keys to count fields
        const timelineLower = timeline.toLowerCase()
        if (timelineLower === 'immediate' || timelineLower === 'immediate_actions') {
          counts.immediate += actionCount
        } else if (timelineLower === 'this_week' || timelineLower === 'short_term') {
          counts.this_week += actionCount
        } else if (timelineLower === 'this_month' || timelineLower === 'medium_term') {
          counts.this_month += actionCount
        } else if (timelineLower === 'future' || timelineLower === 'long_term' || timelineLower === 'next_quarter') {
          counts.future += actionCount
        }
      })
    }

    return counts
  }

  const counts = calculateCounts()

  return (
    <div className="action-plan">
      {/* Summary */}
      <div className="plan-summary">
        <div className="summary-header">
          <h3 className="summary-title">📊 Action Plan Summary</h3>
          <span className="summary-date">Generated: {new Date().toLocaleDateString()}</span>
        </div>
        <div className="summary-stats">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-value">{counts.total}</div>
              <div className="stat-label">Total Actions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚨</div>
            <div className="stat-content">
              <div className="stat-value">{counts.immediate}</div>
              <div className="stat-label">Immediate</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value">{counts.this_week}</div>
              <div className="stat-label">This Week</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📆</div>
            <div className="stat-content">
              <div className="stat-value">{counts.this_month}</div>
              <div className="stat-label">This Month</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🗓️</div>
            <div className="stat-content">
              <div className="stat-value">{counts.future}</div>
              <div className="stat-label">Future</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline-based Actions */}
      <div className="timeline-actions">
        {Object.entries(actionPlan.action_plan).map(([timeline, actions]) => (
          actions.length > 0 && (
            <div key={timeline} className="timeline-section">
              <div className="timeline-header">
                <span className="timeline-icon">{getTimelineIcon(timeline)}</span>
                <h3 className="timeline-title">{getTimelineLabel(timeline)}</h3>
                <span className="timeline-count">{actions.length} action{actions.length > 1 ? 's' : ''}</span>
              </div>
              
              <div className="timeline-actions-list">
                {actions.map((action, index) => (
                  <div key={action.id || action.title || `action-${timeline}-${index}`} className="action-card">
                    <div className="action-header">
                      <div className="action-title-section">
                        <span className="action-category-icon">{getCategoryIcon(action.category)}</span>
                        <h4 className="action-title">{action.title}</h4>
                      </div>
                      <div className="action-badges">
                        <span 
                          className="action-severity-badge"
                          style={{ backgroundColor: getSeverityColor(action.severity) }}
                        >
                          {action.severity}
                        </span>
                        <span className="action-priority-badge">
                          {action.priority_level}
                        </span>
                      </div>
                    </div>

                    <p className="action-description">{action.description}</p>

                    {/* Recommended Actions */}
                    {action.recommended_actions && action.recommended_actions.length > 0 && (
                      <div className="action-steps">
                        <h5 className="action-steps-title">Action Steps:</h5>
                        <ol className="action-steps-list">
                          {action.recommended_actions.map((step, idx) => (
                            <li key={idx} className="action-step">
                              <span className="step-number">{idx + 1}</span>
                              <span className="step-text">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Success Metrics */}
                    {action.success_metrics && action.success_metrics.length > 0 && (
                      <div className="action-metrics">
                        <h5 className="action-metrics-title">Success Metrics:</h5>
                        <ul className="action-metrics-list">
                          {action.success_metrics.map((metric, idx) => (
                            <li key={idx} className="action-metric">✓ {metric}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="action-meta">
                      {action.estimated_effort && (
                        <span className="meta-item">⏱️ {action.estimated_effort}</span>
                      )}
                      {action.data_confidence && (
                        <span className="meta-item">🎯 {action.data_confidence} confidence</span>
                      )}
                      {action.priority_score && (
                        <span className="meta-item">📊 Score: {action.priority_score}/100</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

    </div>
  )
}

export default ActionPlan

