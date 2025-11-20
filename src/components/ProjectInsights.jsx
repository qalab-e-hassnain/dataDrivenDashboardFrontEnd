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

  // Helper function to get severity (handles both severity and priority fields)
  const getRecommendationSeverity = (rec) => {
    if (!rec) return 'low'
    return (rec.severity || rec.priority || 'low').toLowerCase()
  }

  const getHealthColor = (score) => {
    if (score >= 80) return '#10b981' // green
    if (score >= 60) return '#f59e0b' // yellow
    if (score >= 40) return '#ea580c' // orange
    return '#dc2626' // red
  }

  // Use health status from API, fallback to calculated if not provided
  const getHealthStatus = (score, apiStatus) => {
    if (apiStatus) return apiStatus
    // Fallback calculation
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'At Risk'
  }

  // Extract data from correct structure
  const healthScore = insights.health_score || 0
  const insightsData = insights.insights || {}
  const recommendationsByPriority = insights.recommendations_by_priority || {}
  
  // Use pre-calculated counts from API
  const criticalCount = insightsData.critical_count || 0
  const highPriorityCount = insightsData.high_priority_count || 0
  const totalIssues = insightsData.total_issues_identified || 0
  const healthStatus = getHealthStatus(healthScore, insightsData.status)

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
                background: `conic-gradient(${getHealthColor(healthScore)} ${healthScore * 3.6}deg, #e5e7eb 0deg)`
              }}
            >
              <div className="health-inner-circle">
                <div className="health-score-number">{healthScore}</div>
                <div className="health-score-label">/ 100</div>
              </div>
            </div>
            <div className="health-status" style={{ color: getHealthColor(healthScore) }}>
              {healthStatus}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="health-summary">
          <div className="summary-card critical">
            <div className="summary-icon">🔴</div>
            <div className="summary-content">
              <div className="summary-value">{criticalCount}</div>
              <div className="summary-label">Critical Issues</div>
            </div>
          </div>
          <div className="summary-card high">
            <div className="summary-icon">🟠</div>
            <div className="summary-content">
              <div className="summary-value">{highPriorityCount}</div>
              <div className="summary-label">High Priority</div>
            </div>
          </div>
          <div className="summary-card total">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <div className="summary-value">{totalIssues}</div>
              <div className="summary-label">Total Recommendations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations by Priority */}
      {recommendationsByPriority && Object.keys(recommendationsByPriority).length > 0 && (
        <div className="categorized-recommendations">
          <h3 className="categories-title">📂 Recommendations by Priority</h3>
          <div className="categories-grid">
            {/* Critical Actions */}
            {recommendationsByPriority.critical_actions && recommendationsByPriority.critical_actions.length > 0 && (
              <div className="category-card">
                <div className="category-header">
                  <span className="category-icon">🔴</span>
                  <h4 className="category-name">Critical Actions</h4>
                  <span className="category-count">{recommendationsByPriority.critical_actions.length}</span>
                </div>
                <div className="category-recommendations">
                  {recommendationsByPriority.critical_actions.slice(0, 3).map((rec, idx) => (
                    <div key={idx} className="mini-rec-card">
                      <div className="mini-rec-header">
                        <span className="mini-rec-title">{rec.title || rec.recommendation_title || 'Recommendation'}</span>
                        <span 
                          className="mini-severity-badge"
                          style={{ backgroundColor: getSeverityColor(getRecommendationSeverity(rec)) }}
                        >
                          {getRecommendationSeverity(rec)}
                        </span>
                      </div>
                      <p className="mini-rec-desc">{rec.description || rec.recommendation_description || ''}</p>
                    </div>
                  ))}
                  {recommendationsByPriority.critical_actions.length > 3 && (
                    <div className="more-recs">
                      +{recommendationsByPriority.critical_actions.length - 3} more recommendation{recommendationsByPriority.critical_actions.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* High Priority */}
            {recommendationsByPriority.high_priority && recommendationsByPriority.high_priority.length > 0 && (
              <div className="category-card">
                <div className="category-header">
                  <span className="category-icon">🟠</span>
                  <h4 className="category-name">High Priority</h4>
                  <span className="category-count">{recommendationsByPriority.high_priority.length}</span>
                </div>
                <div className="category-recommendations">
                  {recommendationsByPriority.high_priority.slice(0, 3).map((rec, idx) => (
                    <div key={idx} className="mini-rec-card">
                      <div className="mini-rec-header">
                        <span className="mini-rec-title">{rec.title || rec.recommendation_title || 'Recommendation'}</span>
                        <span 
                          className="mini-severity-badge"
                          style={{ backgroundColor: getSeverityColor(getRecommendationSeverity(rec)) }}
                        >
                          {getRecommendationSeverity(rec)}
                        </span>
                      </div>
                      <p className="mini-rec-desc">{rec.description || rec.recommendation_description || ''}</p>
                    </div>
                  ))}
                  {recommendationsByPriority.high_priority.length > 3 && (
                    <div className="more-recs">
                      +{recommendationsByPriority.high_priority.length - 3} more recommendation{recommendationsByPriority.high_priority.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Medium Priority */}
            {recommendationsByPriority.medium_priority && recommendationsByPriority.medium_priority.length > 0 && (
              <div className="category-card">
                <div className="category-header">
                  <span className="category-icon">🟡</span>
                  <h4 className="category-name">Medium Priority</h4>
                  <span className="category-count">{recommendationsByPriority.medium_priority.length}</span>
                </div>
                <div className="category-recommendations">
                  {recommendationsByPriority.medium_priority.slice(0, 3).map((rec, idx) => (
                    <div key={idx} className="mini-rec-card">
                      <div className="mini-rec-header">
                        <span className="mini-rec-title">{rec.title || rec.recommendation_title || 'Recommendation'}</span>
                        <span 
                          className="mini-severity-badge"
                          style={{ backgroundColor: getSeverityColor(getRecommendationSeverity(rec)) }}
                        >
                          {getRecommendationSeverity(rec)}
                        </span>
                      </div>
                      <p className="mini-rec-desc">{rec.description || rec.recommendation_description || ''}</p>
                    </div>
                  ))}
                  {recommendationsByPriority.medium_priority.length > 3 && (
                    <div className="more-recs">
                      +{recommendationsByPriority.medium_priority.length - 3} more recommendation{recommendationsByPriority.medium_priority.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Optimizations */}
            {recommendationsByPriority.optimizations && recommendationsByPriority.optimizations.length > 0 && (
              <div className="category-card">
                <div className="category-header">
                  <span className="category-icon">💡</span>
                  <h4 className="category-name">Optimizations</h4>
                  <span className="category-count">{recommendationsByPriority.optimizations.length}</span>
                </div>
                <div className="category-recommendations">
                  {recommendationsByPriority.optimizations.slice(0, 3).map((rec, idx) => (
                    <div key={idx} className="mini-rec-card">
                      <div className="mini-rec-header">
                        <span className="mini-rec-title">{rec.title || rec.recommendation_title || 'Recommendation'}</span>
                        <span 
                          className="mini-severity-badge"
                          style={{ backgroundColor: getSeverityColor(getRecommendationSeverity(rec)) }}
                        >
                          {getRecommendationSeverity(rec)}
                        </span>
                      </div>
                      <p className="mini-rec-desc">{rec.description || rec.recommendation_description || ''}</p>
                    </div>
                  ))}
                  {recommendationsByPriority.optimizations.length > 3 && (
                    <div className="more-recs">
                      +{recommendationsByPriority.optimizations.length - 3} more recommendation{recommendationsByPriority.optimizations.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Severity Breakdown - Calculate from recommendations_by_priority */}
      {recommendationsByPriority && Object.keys(recommendationsByPriority).length > 0 && (
        <div className="severity-breakdown">
          <h3 className="severity-title">🎯 Severity Breakdown</h3>
          <div className="severity-grid">
            {[
              { name: 'Critical', recs: recommendationsByPriority.critical_actions || [], color: '#dc2626' },
              { name: 'High', recs: recommendationsByPriority.high_priority || [], color: '#ea580c' },
              { name: 'Medium', recs: recommendationsByPriority.medium_priority || [], color: '#f59e0b' },
              { name: 'Low', recs: recommendationsByPriority.optimizations || [], color: '#10b981' }
            ].filter(item => item.recs.length > 0).map(({ name, recs, color }) => (
              <div key={name} className="severity-card" style={{ borderColor: color }}>
                <div className="severity-header">
                  <h4 className="severity-name" style={{ color: color }}>
                    {name}
                  </h4>
                  <span className="severity-count">{recs.length}</span>
                </div>
                <div className="severity-bar-container">
                  <div 
                    className="severity-bar"
                    style={{ 
                      width: totalIssues > 0 ? `${(recs.length / totalIssues) * 100}%` : '0%',
                      backgroundColor: color
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

