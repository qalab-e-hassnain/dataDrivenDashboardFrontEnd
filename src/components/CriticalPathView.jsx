import React, { useState, useEffect, useRef } from 'react'
import { apiService } from '../services/api'
import { getCachedData, setCachedData } from '../utils/cache'
import './CriticalPathView.css'

function CriticalPathView({ projectId }) {
  const [criticalPath, setCriticalPath] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    
    if (projectId) {
      loadCriticalPath()
    } else {
      setLoading(false)
    }

    return () => {
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const loadCriticalPath = async (forceRefresh = false) => {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedData = getCachedData(projectId, 'criticalPath')
      if (cachedData) {
        if (isMountedRef.current) {
          setCriticalPath(cachedData)
          setLoading(false)
        }
        // Optionally refresh in background
        refreshInBackground()
        return
      }
    }

    // No cache or force refresh, fetch from API
    if (isMountedRef.current) {
      setLoading(true)
      setError(null)
    }

    try {
      const data = await apiService.getCriticalPath(projectId)
      
      // Cache the data
      setCachedData(projectId, 'criticalPath', data)
      
      if (isMountedRef.current) {
        setCriticalPath(data)
        setLoading(false)
      }
    } catch (err) {
      console.error('Error loading critical path:', err)
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load critical path')
        setLoading(false)
      }
    }
  }

  // Refresh data in background without showing loading state
  const refreshInBackground = async () => {
    try {
      const data = await apiService.getCriticalPath(projectId)
      setCachedData(projectId, 'criticalPath', data)
      if (isMountedRef.current) {
        setCriticalPath(data)
      }
    } catch (err) {
      console.error('Background refresh failed:', err)
      // Don't show error for background refresh
    }
  }

  if (loading) {
    return (
      <div className="critical-path-loading">
        <div className="loading-spinner"></div>
        <p>Loading critical path...</p>
        <p className="loading-hint">This may take a few moments while we calculate the critical path</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="critical-path-error">
        <p>Error: {error}</p>
        <button onClick={() => loadCriticalPath(true)} className="retry-button">Try Again</button>
      </div>
    )
  }

  if (!criticalPath) {
    return (
      <div className="critical-path-empty">
        <p>No critical path data available</p>
        <p className="empty-hint">Upload a project file to calculate the critical path</p>
      </div>
    )
  }

  return (
    <div className="critical-path-view">
      {/* Header with refresh button */}
      <div className="view-header">
        <button 
          onClick={() => loadCriticalPath(true)} 
          className="refresh-button"
          title="Refresh data"
        >
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="critical-path-summary">
        <div className="summary-card duration-card">
          <div className="summary-content">
            <div className="summary-label">Total Duration</div>
            <div className="summary-value-wrapper">
              <span className="summary-value">{criticalPath.total_duration || 0}</span>
              <span className="summary-unit">days</span>
            </div>
          </div>
        </div>
        <div className="summary-card critical-card">
          <div className="summary-content">
            <div className="summary-label">Critical Tasks</div>
            <div className="summary-value-wrapper">
              <span className="summary-value">{criticalPath.critical_tasks?.length || 0}</span>
            </div>
          </div>
        </div>
        <div className="summary-card activities-card">
          <div className="summary-content">
            <div className="summary-label">Total Activities</div>
            <div className="summary-value-wrapper">
              <span className="summary-value">{criticalPath.activities?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Path Sequence */}
      {criticalPath.critical_path && criticalPath.critical_path.length > 0 && (
        <div className="path-sequence">
          <h3 className="section-subtitle">Critical Path Sequence</h3>
          <div className="path-list">
            {criticalPath.critical_path.map((task, index) => (
              <div 
                key={index} 
                className={`path-item ${task.float === 0 ? 'critical' : ''}`}
              >
                <div className="path-item-number">{index + 1}</div>
                <div className="path-item-content">
                  <div className="path-item-name">{task.task_name || task.name}</div>
                  <div className="path-item-id">ID: {task.task_id || task.id}</div>
                  <div className="path-item-details">
                    <span className="detail-badge duration-badge">
                      <span className="badge-label">Duration:</span>
                      <span className="badge-value">{task.duration} days</span>
                    </span>
                    <span className="detail-badge es-badge">
                      <span className="badge-label">ES:</span>
                      <span className="badge-value">{task.es}</span>
                    </span>
                    <span className="detail-badge ef-badge">
                      <span className="badge-label">EF:</span>
                      <span className="badge-value">{task.ef}</span>
                    </span>
                    <span className="detail-badge ls-badge">
                      <span className="badge-label">LS:</span>
                      <span className="badge-value">{task.ls}</span>
                    </span>
                    <span className="detail-badge lf-badge">
                      <span className="badge-label">LF:</span>
                      <span className="badge-value">{task.lf}</span>
                    </span>
                    <span className={`detail-badge float-badge ${task.float === 0 ? 'float-critical' : ''}`}>
                      <span className="badge-label">Float:</span>
                      <span className="badge-value">{task.float} days</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Activities Table */}
      {criticalPath.activities && criticalPath.activities.length > 0 && (
        <div className="activities-table-section">
          <h3 className="section-subtitle">All Activities</h3>
          <div className="table-container">
            <table className="activities-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Task Name</th>
                  <th>Duration</th>
                  <th>ES</th>
                  <th>EF</th>
                  <th>LS</th>
                  <th>LF</th>
                  <th>Float</th>
                  <th>Critical</th>
                </tr>
              </thead>
              <tbody>
                {criticalPath.activities.map((activity, index) => (
                  <tr 
                    key={index}
                    className={activity.is_critical ? 'critical-row' : ''}
                  >
                    <td>{activity.task_id || activity.id}</td>
                    <td className="task-name-cell">{activity.task_name || activity.name}</td>
                    <td>{activity.duration}</td>
                    <td>{activity.es}</td>
                    <td>{activity.ef}</td>
                    <td>{activity.ls}</td>
                    <td>{activity.lf}</td>
                    <td className={activity.float === 0 ? 'float-zero' : ''}>
                      {activity.float}
                    </td>
                    <td>
                      {activity.is_critical ? (
                        <span className="critical-badge">Yes</span>
                      ) : (
                        <span className="non-critical-badge">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default CriticalPathView

