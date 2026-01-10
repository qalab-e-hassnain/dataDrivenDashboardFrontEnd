import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import './DataCompleteness.css'

const DataCompleteness = ({ projectId, onRefresh }) => {
  const [completeness, setCompleteness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (projectId) {
      fetchCompleteness()
    }
  }, [projectId, onRefresh])

  const fetchCompleteness = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiService.getDataCompleteness(projectId)
      setCompleteness(data)
    } catch (err) {
      console.error('Failed to fetch data completeness:', err)
      setError('Failed to load data completeness information.')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#28a745' // Green
    if (score >= 60) return '#ffc107' // Yellow
    if (score >= 40) return '#fd7e14' // Orange
    return '#dc3545' // Red
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  if (loading) {
    return (
      <div className="data-completeness">
        <div className="completeness-loading">Loading data completeness...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="data-completeness">
        <div className="completeness-error">{error}</div>
      </div>
    )
  }

  if (!completeness) {
    return (
      <div className="data-completeness">
        <div className="completeness-empty">No data completeness information available.</div>
      </div>
    )
  }

  const score = completeness.completeness_score || 0
  const scoreColor = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)

  return (
    <div className="data-completeness">
      <div className="completeness-header">
        <h3>Data Completeness</h3>
        <button onClick={fetchCompleteness} className="btn-refresh-small">Refresh</button>
      </div>

      <div className="completeness-score-card">
        <div className="score-circle" style={{ borderColor: scoreColor }}>
          <div className="score-value" style={{ color: scoreColor }}>
            {score.toFixed(0)}%
          </div>
          <div className="score-label">{scoreLabel}</div>
        </div>
        <div className="score-details">
          <div className="detail-item">
            <strong>Project Name:</strong> {completeness.has_project_name ? '✓' : '✗'}
          </div>
          <div className="detail-item">
            <strong>Task Names:</strong> {completeness.has_task_names ? '✓' : '✗'} 
            ({completeness.tasks_with_names || 0} / {completeness.total_tasks || 0})
          </div>
          <div className="detail-item">
            <strong>Task Durations:</strong> {completeness.has_task_durations ? '✓' : '✗'}
            ({completeness.tasks_with_durations || 0} / {completeness.total_tasks || 0})
          </div>
          <div className="detail-item">
            <strong>Workforce Entries:</strong> {completeness.has_workforce ? '✓' : '✗'}
            ({completeness.workforce_count || 0} entries)
          </div>
          <div className="detail-item">
            <strong>Inventory Entries:</strong> {completeness.has_inventory ? '✓' : '✗'}
            ({completeness.inventory_count || 0} entries)
          </div>
        </div>
      </div>

      {completeness.recommendations && completeness.recommendations.length > 0 && (
        <div className="completeness-recommendations">
          <h4>Recommendations</h4>
          <ul>
            {completeness.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {completeness.missing_fields && completeness.missing_fields.length > 0 && (
        <div className="completeness-missing">
          <h4>Missing Fields</h4>
          <ul>
            {completeness.missing_fields.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default DataCompleteness
