import React, { useState, useEffect, useRef, useMemo } from 'react'
import { apiService } from '../services/api'
import { getCachedData, setCachedData } from '../utils/cache'
import './CriticalPathView.css'

function CriticalPathView({ projectId }) {
  const [criticalPath, setCriticalPath] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    criticalOnly: false,
    search: '',
    floatRange: 'all'
  })
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

  // Filter activities based on current filters
  // MUST be called before early returns to follow Rules of Hooks
  const filteredActivities = useMemo(() => {
    if (!criticalPath?.activities || !Array.isArray(criticalPath.activities)) return []
    
    return criticalPath.activities.filter(activity => {
      // Critical only filter
      if (filters.criticalOnly && !activity.is_critical) return false
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const taskName = ((activity.task_name || activity.name || '') + ' ' + (activity.task_id || activity.id || '')).toLowerCase()
        if (!taskName.includes(searchLower)) return false
      }
      
      // Float range filter
      if (filters.floatRange !== 'all') {
        const float = activity.float || 0
        if (filters.floatRange === 'zero' && float !== 0) return false
        if (filters.floatRange === 'low' && (float === 0 || float > 5)) return false
        if (filters.floatRange === 'high' && float <= 5) return false
      }
      
      return true
    })
  }, [criticalPath?.activities, filters])

  // Filter critical path sequence
  // MUST be called before early returns to follow Rules of Hooks
  const filteredCriticalPath = useMemo(() => {
    if (!criticalPath?.critical_path || !Array.isArray(criticalPath.critical_path)) return []
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return criticalPath.critical_path.filter(task => {
        const taskName = ((task.task_name || task.name || '') + ' ' + (task.task_id || task.id || '')).toLowerCase()
        return taskName.includes(searchLower)
      })
    }
    
    return criticalPath.critical_path
  }, [criticalPath?.critical_path, filters.search])

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

      {/* Filter Bar */}
      <div className="critical-path-filters">
        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={filters.criticalOnly}
              onChange={(e) => setFilters({ ...filters, criticalOnly: e.target.checked })}
            />
            Critical Tasks Only
          </label>
        </div>
        <div className="filter-group">
          <label htmlFor="float-filter">Float:</label>
          <select
            id="float-filter"
            value={filters.floatRange}
            onChange={(e) => setFilters({ ...filters, floatRange: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Float Values</option>
            <option value="zero">Zero Float (Critical)</option>
            <option value="low">Low Float (0-5 days)</option>
            <option value="high">High Float (&gt;5 days)</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="search-filter">Search:</label>
          <input
            id="search-filter"
            type="text"
            placeholder="Search activities..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="filter-input"
          />
        </div>
        <div className="filter-results">
          Showing {filteredActivities.length} of {criticalPath.activities?.length || 0} activities
        </div>
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
          <h3 className="section-subtitle">
            Critical Path Sequence 
            {filters.search && ` (${filteredCriticalPath.length} of ${criticalPath.critical_path.length} found)`}
          </h3>
          {filteredCriticalPath.length > 0 ? (
            <div className="path-list">
              {filteredCriticalPath.map((task, index) => (
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
                    {(task.predecessor_details || task.immediate_predecessors_details || task.immediate_predecessors) && 
                     (task.predecessor_details?.length > 0 || task.immediate_predecessors_details?.length > 0 || task.immediate_predecessors?.length > 0) && (
                      <span className="detail-badge predecessor-badge">
                        <span className="badge-label">Predecessors:</span>
                        <span className="badge-value">
                          {(task.predecessor_details || task.immediate_predecessors_details || []).map((pred, idx) => 
                            pred.task_name || pred.name || pred.task_id || pred.id || task.immediate_predecessors?.[idx] || 'Unknown'
                          ).join(', ') || task.immediate_predecessors?.join(', ') || '-'}
                        </span>
                      </span>
                    )}
                    {(task.immediate_successors_details || task.immediate_successors) && 
                     (task.immediate_successors_details?.length > 0 || task.immediate_successors?.length > 0) && (
                      <span className="detail-badge successor-badge">
                        <span className="badge-label">Successors:</span>
                        <span className="badge-value">
                          {(task.immediate_successors_details || []).map((succ) => 
                            succ.task_name || succ.name || succ.task_id || succ.id || 'Unknown'
                          ).join(', ') || task.immediate_successors?.join(', ') || '-'}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
          ) : (
            <div className="no-results-message">
              No tasks match the current filters. Try adjusting your search criteria.
            </div>
          )}
        </div>
      )}

      {/* PART B - CPM Tables */}
      {criticalPath.activities && criticalPath.activities.length > 0 && (
        <div className="cpm-tables-section">
          <h3 className="section-subtitle">CPM Tables (Following Agreed Schema)</h3>
          
          {/* 1. Activity Input Table */}
          <div className="cpm-table-wrapper">
            <h4 className="table-title">1. Activity Input Table (Uploaded Data)</h4>
            <div className="table-container">
              <table className="cpm-table">
                <thead>
                  <tr>
                    <th>Task_ID</th>
                    <th>Task_Name</th>
                    <th>Duration (Days)</th>
                    <th>Predecessors</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity, index) => (
                    <tr key={index}>
                      <td>{activity.task_id || activity.id}</td>
                      <td className="task-name-cell">{activity.task_name || activity.name}</td>
                      <td>{activity.duration}</td>
                      <td>
                        {(activity.predecessor_details || activity.immediate_predecessors_details || activity.immediate_predecessors) && 
                         (activity.predecessor_details?.length > 0 || activity.immediate_predecessors_details?.length > 0 || activity.immediate_predecessors?.length > 0)
                          ? (activity.predecessor_details || activity.immediate_predecessors_details || []).map((pred) => 
                              pred.task_id || pred.id || 'Unknown'
                            ).join(', ') || activity.immediate_predecessors?.join(', ') || '—'
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Forward Pass Table (Early Dates) */}
          <div className="cpm-table-wrapper">
            <h4 className="table-title">2. Forward Pass Table (Early Dates)</h4>
            <p className="table-note">Rules applied: ES = max(EF of predecessors), EF = ES + Duration</p>
            <div className="table-container">
              <table className="cpm-table">
                <thead>
                  <tr>
                    <th>Task_ID</th>
                    <th>ES</th>
                    <th>EF</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity, index) => (
                    <tr key={index}>
                      <td>{activity.task_id || activity.id}</td>
                      <td>{activity.es}</td>
                      <td>{activity.ef}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Backward Pass Table (Late Dates) */}
          <div className="cpm-table-wrapper">
            <h4 className="table-title">3. Backward Pass Table (Late Dates)</h4>
            <p className="table-note">Rules applied: LF = min(LS of successors), LS = LF − Duration</p>
            <div className="table-container">
              <table className="cpm-table">
                <thead>
                  <tr>
                    <th>Task_ID</th>
                    <th>LS</th>
                    <th>LF</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity, index) => (
                    <tr key={index}>
                      <td>{activity.task_id || activity.id}</td>
                      <td>{activity.ls}</td>
                      <td>{activity.lf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Float Calculation Table */}
          <div className="cpm-table-wrapper">
            <h4 className="table-title">4. Float Calculation Table</h4>
            <p className="table-note">Rule: Total Float = LS − ES (or LF − EF)</p>
            <div className="table-container">
              <table className="cpm-table">
                <thead>
                  <tr>
                    <th>Task_ID</th>
                    <th>ES</th>
                    <th>LS</th>
                    <th>EF</th>
                    <th>LF</th>
                    <th>Total Float</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity, index) => (
                    <tr 
                      key={index}
                      className={activity.float === 0 ? 'critical-row' : ''}
                    >
                      <td>{activity.task_id || activity.id}</td>
                      <td>{activity.es}</td>
                      <td>{activity.ls}</td>
                      <td>{activity.ef}</td>
                      <td>{activity.lf}</td>
                      <td className={activity.float === 0 ? 'float-zero' : ''}>
                        {activity.float}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Critical Path Identification Table */}
          <div className="cpm-table-wrapper">
            <h4 className="table-title">5. Critical Path Identification Table</h4>
            <div className="table-container">
              <table className="cpm-table">
                <thead>
                  <tr>
                    <th>Task_ID</th>
                    <th>Total Float</th>
                    <th>Critical</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity, index) => (
                    <tr 
                      key={index}
                      className={activity.is_critical ? 'critical-row' : ''}
                    >
                      <td>{activity.task_id || activity.id}</td>
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
        </div>
      )}
    </div>
  )
}

export default CriticalPathView

