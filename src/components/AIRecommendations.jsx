import React, { useState } from 'react'
import './AIRecommendations.css'

function AIRecommendations({ recommendations }) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSeverity, setSelectedSeverity] = useState('all')

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="no-recommendations">
        <div className="no-recs-icon">✨</div>
        <h3>No Recommendations Available</h3>
        <p>Your project is running smoothly! The AI hasn't detected any issues that require corrective actions.</p>
      </div>
    )
  }

  // Filter recommendations
  const filteredRecs = recommendations.filter(rec => {
    const categoryMatch = selectedCategory === 'all' || rec.category === selectedCategory
    const severityMatch = selectedSeverity === 'all' || rec.severity === selectedSeverity
    return categoryMatch && severityMatch
  })

  // Get unique categories and severities
  const categories = [...new Set(recommendations.map(r => r.category))]
  const severities = [...new Set(recommendations.map(r => r.severity))]

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      default: return '#6b7280'
    }
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

  return (
    <div className="ai-recommendations">
      {/* Filters */}
      <div className="recs-filters">
        <div className="filter-group">
          <label>Category:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories ({recommendations.length})</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {getCategoryIcon(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)} 
                ({recommendations.filter(r => r.category === cat).length})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Severity:</label>
          <select 
            value={selectedSeverity} 
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Severities</option>
            {severities.map(sev => (
              <option key={sev} value={sev}>
                {sev.charAt(0).toUpperCase() + sev.slice(1)}
                ({recommendations.filter(r => r.severity === sev).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="recs-list">
        {filteredRecs.length === 0 ? (
          <div className="no-filtered-recs">
            <p>No recommendations match the selected filters.</p>
          </div>
        ) : (
          filteredRecs.map((rec) => (
            <div key={rec.id} className="recommendation-card">
              {/* Header */}
              <div className="rec-header">
                <div className="rec-title-section">
                  <span className="rec-category-icon">{getCategoryIcon(rec.category)}</span>
                  <h3 className="rec-title">{rec.title}</h3>
                </div>
                <div className="rec-badges">
                  <span 
                    className="severity-badge"
                    style={{ backgroundColor: getSeverityColor(rec.severity) }}
                  >
                    {rec.severity?.toUpperCase()}
                  </span>
                  <span className="priority-badge">
                    {rec.priority_level || `P${Math.floor(rec.priority_score / 25)}`}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="rec-description">
                <p>{rec.description}</p>
              </div>

              {/* Root Cause */}
              {rec.root_cause && (
                <div className="rec-section">
                  <h4 className="rec-section-title">🔍 Root Cause</h4>
                  <p className="rec-section-content">{rec.root_cause}</p>
                </div>
              )}

              {/* Recommended Actions */}
              {rec.recommended_actions && rec.recommended_actions.length > 0 && (
                <div className="rec-section">
                  <h4 className="rec-section-title">🎯 Recommended Actions</h4>
                  <ul className="rec-actions-list">
                    {rec.recommended_actions.map((action, idx) => (
                      <li key={idx} className="rec-action-item">{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Impact Assessment */}
              {rec.impact_assessment && Object.keys(rec.impact_assessment).length > 0 && (
                <div className="rec-section">
                  <h4 className="rec-section-title">📈 Impact Assessment</h4>
                  <div className="impact-grid">
                    {Object.entries(rec.impact_assessment).map(([key, value]) => (
                      <div key={key} className="impact-item">
                        <span className="impact-label">{key.replace(/_/g, ' ')}:</span>
                        <span className="impact-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Metrics */}
              {rec.success_metrics && rec.success_metrics.length > 0 && (
                <div className="rec-section">
                  <h4 className="rec-section-title">✅ Success Metrics</h4>
                  <ul className="rec-metrics-list">
                    {rec.success_metrics.map((metric, idx) => (
                      <li key={idx} className="rec-metric-item">{metric}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer */}
              <div className="rec-footer">
                <div className="rec-meta">
                  <span className="rec-timeline">⏱️ {rec.timeline || 'Immediate action'}</span>
                  <span className="rec-confidence">
                    🎯 {rec.data_confidence || 'high'} confidence
                  </span>
                  {rec.priority_score && (
                    <span className="rec-score">📊 Score: {rec.priority_score}/100</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AIRecommendations

