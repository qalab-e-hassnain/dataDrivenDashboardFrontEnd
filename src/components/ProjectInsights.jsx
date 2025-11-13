import React from 'react'
import './ProjectInsights.css'

function ProjectInsights({ insights }) {
  if (!insights) {
    return (
      <div className="no-insights">
        <div className="no-insights-icon">📊</div>
        <h3>No Insights Available</h3>
        <p>Unable to load project insights at this time.</p>
      </div>
    )
  }

  const getHealthColor = (score) => {
    if (score >= 80) return '#10b981' // green
    if (score >= 60) return '#f59e0b' // yellow
    if (score >= 40) return '#ea580c' // orange
    return '#dc2626' // red
  }

  const getHealthStatus = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Attention'
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

  return (
    <div className="project-insights">
      {/* Health Score */}
      <div className="health-score-container">
        <div className="health-score-card">
          <h3 className="health-title">Project Health Score</h3>
          <div className="health-score-visual">
            <div 
              className="health-circle"
              style={{ 
                background: `conic-gradient(${getHealthColor(insights.health_score)} ${insights.health_score * 3.6}deg, #e5e7eb 0deg)`
              }}
            >
              <div className="health-inner-circle">
                <div className="health-score-number">{insights.health_score}</div>
                <div className="health-score-label">/ 100</div>
              </div>
            </div>
            <div className="health-status" style={{ color: getHealthColor(insights.health_score) }}>
              {getHealthStatus(insights.health_score)}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="health-summary">
          <div className="summary-card critical">
            <div className="summary-icon">🔴</div>
            <div className="summary-content">
              <div className="summary-value">{insights.critical_count || 0}</div>
              <div className="summary-label">Critical Issues</div>
            </div>
          </div>
          <div className="summary-card high">
            <div className="summary-icon">🟠</div>
            <div className="summary-content">
              <div className="summary-value">{insights.high_priority_count || 0}</div>
              <div className="summary-label">High Priority</div>
            </div>
          </div>
          <div className="summary-card total">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <div className="summary-value">{insights.total_recommendations || 0}</div>
              <div className="summary-label">Total Recommendations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {insights.executive_summary && (
        <div className="executive-summary">
          <h3 className="summary-title">📋 Executive Summary</h3>
          <p className="summary-text">{insights.executive_summary}</p>
        </div>
      )}

      {/* Categorized Recommendations */}
      {insights.recommendations_by_category && Object.keys(insights.recommendations_by_category).length > 0 && (
        <div className="categorized-recommendations">
          <h3 className="categories-title">📂 Recommendations by Category</h3>
          <div className="categories-grid">
            {Object.entries(insights.recommendations_by_category).map(([category, recs]) => (
              <div key={category} className="category-card">
                <div className="category-header">
                  <span className="category-icon">{getCategoryIcon(category)}</span>
                  <h4 className="category-name">{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                  <span className="category-count">{recs.length}</span>
                </div>
                <div className="category-recommendations">
                  {recs.slice(0, 3).map((rec, idx) => (
                    <div key={idx} className="mini-rec-card">
                      <div className="mini-rec-header">
                        <span className="mini-rec-title">{rec.title}</span>
                        <span 
                          className="mini-severity-badge"
                          style={{ backgroundColor: getSeverityColor(rec.severity) }}
                        >
                          {rec.severity}
                        </span>
                      </div>
                      <p className="mini-rec-desc">{rec.description}</p>
                    </div>
                  ))}
                  {recs.length > 3 && (
                    <div className="more-recs">
                      +{recs.length - 3} more recommendation{recs.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Severity Breakdown */}
      {insights.recommendations_by_severity && Object.keys(insights.recommendations_by_severity).length > 0 && (
        <div className="severity-breakdown">
          <h3 className="severity-title">🎯 Severity Breakdown</h3>
          <div className="severity-grid">
            {Object.entries(insights.recommendations_by_severity).map(([severity, recs]) => (
              <div key={severity} className="severity-card" style={{ borderColor: getSeverityColor(severity) }}>
                <div className="severity-header">
                  <h4 className="severity-name" style={{ color: getSeverityColor(severity) }}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </h4>
                  <span className="severity-count">{recs.length}</span>
                </div>
                <div className="severity-bar-container">
                  <div 
                    className="severity-bar"
                    style={{ 
                      width: `${(recs.length / insights.total_recommendations) * 100}%`,
                      backgroundColor: getSeverityColor(severity)
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectInsights

