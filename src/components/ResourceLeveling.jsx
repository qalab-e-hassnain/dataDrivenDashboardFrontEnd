import React, { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { apiService } from '../services/api'
import './ResourceLeveling.css'

const ResourceLeveling = ({ projectId }) => {
  const [result, setResult] = useState(null)
  const [utilizationForecast, setUtilizationForecast] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingForecast, setLoadingForecast] = useState(false)
  const [error, setError] = useState(null)
  const [options, setOptions] = useState({
    maxHoursPerDay: 8,
    maxHoursPerWeek: 40,
    considerAvailability: true,
    autoApply: false, // Don't apply changes by default (show suggestions first)
    protectCritical: true // Protect critical tasks by default
  })

  useEffect(() => {
    if (projectId) {
      fetchUtilizationForecast()
      fetchTasks()
    }
  }, [projectId])

  const fetchUtilizationForecast = async () => {
    setLoadingForecast(true)
    try {
      const data = await apiService.getUtilizationForecast(projectId)
      setUtilizationForecast(data)
    } catch (err) {
      console.error('Failed to fetch utilization forecast:', err)
    } finally {
      setLoadingForecast(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const data = await apiService.getTasksByProject(projectId)
      setTasks(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
      setTasks([])
    }
  }

  const applyLeveling = async () => {
    setLoading(true)
    setError(null)
    try {
      // Apply Resource Leveling
      const data = await apiService.applyResourceLevelingV2(projectId, {
        ...options,
        autoApply: options.autoApply,
        protectCritical: options.protectCritical
      })
      
      console.log('📊 Resource Leveling Response:', data)
      console.log('📊 CPM Tables:', data.cpm_tables)
      console.log('📊 Resource Leveling Tables:', data.resource_leveling_tables)
      
      setResult(data)
      // Refresh forecast after leveling
      fetchUtilizationForecast()
      // Refresh tasks to get updated schedule
      fetchTasks()
      
      // Show info about unresolved conflicts if any
      if (data.unresolved_conflicts && data.unresolved_conflicts > 0) {
        console.warn(`Resource leveling completed but ${data.unresolved_conflicts} conflicts could not be resolved (only critical tasks affected)`)
      }
    } catch (err) {
      console.error('Failed to apply resource leveling:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to apply resource leveling. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'overutilized':
        return '#dc3545'
      case 'optimal':
        return '#28a745'
      case 'underutilized':
        return '#ffc107'
      case 'no_resources':
        return '#6c757d'
      default:
        return '#6c757d'
    }
  }

  // Prepare conflict timeline data
  const getConflictTimelineData = () => {
    if (!result?.conflicts) return []
    
    const conflictsByDate = {}
    result.conflicts.forEach(conflict => {
      const date = conflict.date
      if (!conflictsByDate[date]) {
        conflictsByDate[date] = {
          date,
          conflicts: 0,
          shortageHours: 0,
          roles: new Set()
        }
      }
      conflictsByDate[date].conflicts++
      conflictsByDate[date].shortageHours += conflict.shortage_hours || 0
      conflictsByDate[date].roles.add(conflict.role)
    })

    return Object.values(conflictsByDate).map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      conflicts: item.conflicts,
      shortageHours: item.shortageHours,
      roles: item.roles.size
    })).sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  // Prepare utilization chart data
  const getUtilizationChartData = () => {
    if (!utilizationForecast?.daily_utilization) return []
    
    const roleGroups = {}
    utilizationForecast.daily_utilization.forEach(item => {
      const key = `${item.date}_${item.role}`
      if (!roleGroups[key]) {
        roleGroups[key] = {
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dateRaw: item.date,
          role: item.role,
          needed: item.needed_hours || 0,
          available: item.available_hours || 0,
          utilization: item.utilization_rate !== null && item.utilization_rate !== undefined 
            ? item.utilization_rate 
            : (item.utilization_percentage !== null && item.utilization_percentage !== undefined 
              ? item.utilization_percentage 
              : null), // Handle null utilization (no resources)
          status: item.status || 'optimal',
          statusMessage: item.status_message || null,
          formula: item.formula || null,
          isActualDate: item.is_actual_date || false, // Highlight actual dates
          contributingTasks: item.contributing_tasks || [] // Use API-provided contributing tasks
        }
      }
    })

    return Object.values(roleGroups).sort((a, b) => new Date(a.dateRaw) - new Date(b.dateRaw))
  }

  // Get tasks that contribute to a specific date
  const getTasksForDate = (dateStr, role) => {
    if (!dateStr || !tasks.length) return []
    
    const targetDate = new Date(dateStr)
    targetDate.setHours(0, 0, 0, 0)
    
    return tasks.filter(task => {
      if (!task.planned_start_date) return false
      
      const startDate = new Date(task.planned_start_date)
      startDate.setHours(0, 0, 0, 0)
      
      // Calculate end date from duration or use planned_end_date
      let endDate
      if (task.planned_end_date) {
        endDate = new Date(task.planned_end_date)
      } else if (task.duration_days) {
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + (task.duration_days || 0))
      } else {
        // If no duration or end date, assume 1 day task
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 1)
      }
      endDate.setHours(0, 0, 0, 0)
      
      // Check if task role matches (if role is specified in task)
      const taskRole = task.role || task.assigned_role || task.resource_role
      if (role && taskRole && taskRole.toLowerCase() !== role.toLowerCase()) {
        return false
      }
      
      // Check if target date falls within task date range
      return targetDate >= startDate && targetDate <= endDate
    })
  }

  // Prepare role conflict summary
  const getRoleConflictSummary = () => {
    if (!result?.conflicts) return []
    
    const roleStats = {}
    result.conflicts.forEach(conflict => {
      if (!roleStats[conflict.role]) {
        roleStats[conflict.role] = {
          role: conflict.role,
          conflicts: 0,
          totalShortage: 0
        }
      }
      roleStats[conflict.role].conflicts++
      roleStats[conflict.role].totalShortage += conflict.shortage_hours || 0
    })

    return Object.values(roleStats).sort((a, b) => b.conflicts - a.conflicts)
  }

  return (
    <div className="resource-leveling">
      <div className="resource-leveling-header">
        <h2>Resource Leveling</h2>
        <p className="resource-leveling-description">
          After CPM calculates the critical path, resource leveling adjusts the schedule to ensure no worker is assigned to more activities than available, while respecting task dependencies. The system detects overallocations, adjusts start dates, and recalculates the schedule (CPM → Detect → Adjust → Recalculate).
        </p>
      </div>

      <div className="resource-leveling-options">
        <div className="options-card">
          <h3>Resource Leveling Configuration</h3>
          
          {/* Main Options Grid */}
          <div className="options-main-grid">
            <div className="options-row">
              <div className="form-group">
                <label htmlFor="maxHoursPerDay">
                  Max Hours Per Day
                </label>
                <input
                  id="maxHoursPerDay"
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  value={options.maxHoursPerDay}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      maxHoursPerDay: parseFloat(e.target.value) || 8
                    })
                  }
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="maxHoursPerWeek">
                  Max Hours Per Week
                </label>
                <input
                  id="maxHoursPerWeek"
                  type="number"
                  min="1"
                  max="168"
                  step="0.5"
                  value={options.maxHoursPerWeek}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      maxHoursPerWeek: parseFloat(e.target.value) || 40
                    })
                  }
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Advanced Options Cards */}
          <div className="advanced-options-section">
            <h4 className="advanced-options-title">Advanced Options</h4>
            <div className="advanced-options-grid">
              {/* Auto Apply Option */}
              <div className={`option-card ${options.autoApply ? 'option-card-warning' : 'option-card-info'}`}>
                <label className="option-card-label">
                  <input
                    type="checkbox"
                    checked={options.autoApply}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        autoApply: e.target.checked
                      })
                    }
                    disabled={loading}
                    className="option-checkbox"
                  />
                  <div className="option-content">
                    <div className="option-header">
                      <span className="option-icon">{options.autoApply ? '⚠️' : '💡'}</span>
                      <strong className="option-title">Auto Apply Changes</strong>
                    </div>
                    <p className="option-description">
                      {options.autoApply 
                        ? 'Changes will be saved to the database. Task dates will be permanently updated.'
                        : 'Only suggest changes without saving. Review adjustments before applying.'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Protect Critical Tasks Option */}
              <div className={`option-card ${options.protectCritical ? 'option-card-success' : 'option-card-warning'}`}>
                <label className="option-card-label">
                  <input
                    type="checkbox"
                    checked={options.protectCritical}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        protectCritical: e.target.checked
                      })
                    }
                    disabled={loading}
                    className="option-checkbox"
                  />
                  <div className="option-content">
                    <div className="option-header">
                      <span className="option-icon">{options.protectCritical ? '🛡️' : '⚠️'}</span>
                      <strong className="option-title">Protect Critical Tasks</strong>
                    </div>
                    <p className="option-description">
                      {options.protectCritical 
                        ? 'Critical tasks will not be delayed unless unavoidable. Maintains critical path integrity.'
                        : 'Critical tasks may be delayed if necessary. May extend project timeline.'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Consider Availability Option */}
              <div className={`option-card ${options.considerAvailability ? 'option-card-info' : 'option-card-default'}`}>
                <label className="option-card-label">
                  <input
                    type="checkbox"
                    checked={options.considerAvailability}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        considerAvailability: e.target.checked
                      })
                    }
                    disabled={loading}
                    className="option-checkbox"
                  />
                  <div className="option-content">
                    <div className="option-header">
                      <span className="option-icon">👥</span>
                      <strong className="option-title">Consider Workforce Availability</strong>
                    </div>
                    <p className="option-description">
                      {options.considerAvailability 
                        ? 'Account for actual workforce availability when leveling resources.'
                        : 'Leveling based on theoretical capacity only.'}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={applyLeveling}
            disabled={loading}
            className="btn-apply-leveling"
          >
            {loading 
              ? 'Applying Resource Leveling...' 
              : 'Apply Resource Leveling'}
          </button>

          {/* Status Info */}
          <div className={`workflow-info ${options.autoApply ? 'workflow-info-warning' : 'workflow-info-info'}`}>
            <div className="workflow-info-icon">
              {options.autoApply ? '⚠️' : 'ℹ️'}
            </div>
            <div className="workflow-info-content">
              <strong>Workflow Status:</strong>
              <p>
                {options.autoApply 
                  ? 'Changes will be APPLIED and SAVED to the database. Task dates will be permanently updated.'
                  : 'This will detect overallocations and suggest adjustments. Changes will NOT be saved (review mode).'}
              </p>
              {options.protectCritical && (
                <p className="workflow-info-detail">
                  🛡️ Critical tasks will be protected from delays unless unavoidable.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="resource-leveling-error">{error}</div>}

          {result && (
        <div className="resource-leveling-results">
          <div className="results-summary">
            <h3>Leveling Results</h3>
            <div className="summary-cards">
              <div className="summary-card conflict-card">
                <div className="summary-value">{result.summary?.total_conflicts || result.total_conflicts || 0}</div>
                <div className="summary-label">Total Conflicts</div>
              </div>
              <div className="summary-card days-card">
                <div className="summary-value">{result.summary?.conflict_days || result.conflict_days || 0}</div>
                <div className="summary-label">Conflict Days</div>
              </div>
              {result.unresolved_conflicts !== undefined && (
                <div className="summary-card unresolved-card" style={{ background: '#fff3cd', border: '2px solid #ffc107' }}>
                  <div className="summary-value" style={{ color: '#856404' }}>{result.unresolved_conflicts}</div>
                  <div className="summary-label" style={{ color: '#856404' }}>Unresolved (Critical Only)</div>
                </div>
              )}
              <div className="summary-card hours-card">
                <div className="summary-value">
                  {(result.summary?.total_shortage_hours || result.total_shortage_hours || 0).toFixed(1)}
                </div>
                <div className="summary-label">Shortage Hours</div>
              </div>
              <div className="summary-card roles-card">
                <div className="summary-value">
                  {(result.summary?.affected_roles || result.affected_roles || []).length}
                </div>
                <div className="summary-label">Affected Roles</div>
              </div>
              {result.adjustments_applied !== undefined && (
                <div className="summary-card adjustments-card" style={{ background: '#d4edda', border: '2px solid #28a745' }}>
                  <div className="summary-value" style={{ color: '#155724' }}>{result.adjustments_applied}</div>
                  <div className="summary-label" style={{ color: '#155724' }}>Tasks Leveled</div>
                </div>
              )}
            </div>
          </div>

          {/* Conflict Timeline Chart */}
          {result.conflicts && result.conflicts.length > 0 && (
            <div className="chart-section">
              <h3>Conflict Timeline</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getConflictTimelineData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="#666"
                      label={{ value: 'Conflicts', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="conflicts" fill="#dc3545" name="Conflicts" />
                    <Bar dataKey="roles" fill="#fd7e14" name="Affected Roles" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Role Conflict Summary Chart */}
          {result.conflicts && result.conflicts.length > 0 && (
            <div className="chart-section">
              <h3>Conflicts by Role</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getRoleConflictSummary()} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis type="number" stroke="#666" tick={{ fontSize: 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="role" 
                      stroke="#666"
                      tick={{ fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="conflicts" fill="#dc3545" name="Number of Conflicts" />
                    <Bar dataKey="totalShortage" fill="#f59e0b" name="Total Shortage (hrs)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Utilization Forecast Chart */}
          {utilizationForecast && utilizationForecast.daily_utilization && (
            <div className="chart-section">
              <div className="chart-header-with-explanation">
                <h3>Resource Utilization Forecast</h3>
                <div className="utilization-explanation">
                  <div className="explanation-header">
                    <span className="info-icon">ℹ️</span>
                    <strong>How dates are calculated:</strong>
                  </div>
                  <p className="explanation-text">
                    Daily utilization dates are derived by expanding task start dates into daily workload based on task duration and assigned hours. 
                    Each task's start date is expanded across its duration period (from start date to end date), distributing the required hours across each day.
                    <strong> Only dates that exist in the source data are displayed.</strong>
                  </p>
                  <div className="explanation-details">
                    <div className="detail-item">
                      <strong>Task Start Date:</strong> The date when a task begins (shown in Project Timeline)
                    </div>
                    <div className="detail-item">
                      <strong>Task Duration:</strong> Number of days the task spans (from <code>duration_days</code> field or calculated from start to end date)
                    </div>
                    <div className="detail-item">
                      <strong>Calculated End Date:</strong> <code>planned_start_date + duration_days</code> (shown in task breakdown table)
                    </div>
                    <div className="detail-item">
                      <strong>Actual Dates:</strong> Dates marked with <span style={{ background: '#ffd43b', padding: '2px 4px', borderRadius: '3px', fontSize: '10px' }}>ACTUAL DATE</span> badge indicate dates with <code>is_actual_date: true</code>
                    </div>
                    <div className="detail-item">
                      <strong>Contributing Tasks:</strong> Hover over any data point to see which tasks contribute to that date's utilization
                    </div>
                  </div>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={getUtilizationChartData()} margin={{ top: 10, right: 30, left: 60, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis 
                      stroke="#666"
                      label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'utilization') {
                          // Handle null utilization
                          if (value === null || value === undefined) return 'No resources'
                          return `${value.toFixed(1)}%`
                        }
                        if (name === 'needed' || name === 'available') return `${value.toFixed(1)} hrs`
                        return value
                      }}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px', padding: '12px', maxWidth: '400px' }}
                      labelFormatter={(label) => {
                        const dataPoint = getUtilizationChartData().find(d => d.date === label)
                        if (!dataPoint) return label
                        return `${label} - ${dataPoint.role}`
                      }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null
                        
                        const dataPoint = getUtilizationChartData().find(d => d.date === label)
                        if (!dataPoint) return null
                        
                        // Use API-provided contributing_tasks, fallback to calculated if not available
                        const contributingTasks = dataPoint.contributingTasks && dataPoint.contributingTasks.length > 0
                          ? dataPoint.contributingTasks
                          : getTasksForDate(dataPoint.dateRaw, dataPoint.role)
                        
                        return (
                          <div style={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px', padding: '12px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
                              {label} - {dataPoint.role}
                              {dataPoint.isActualDate && (
                                <span style={{ 
                                  marginLeft: '8px', 
                                  padding: '2px 6px', 
                                  background: '#ffd43b', 
                                  borderRadius: '4px', 
                                  fontSize: '10px',
                                  fontWeight: '600'
                                }}>
                                  ACTUAL DATE
                                </span>
                              )}
                            </div>
                            {payload.map((entry, index) => (
                              <div key={index} style={{ marginBottom: '4px', color: entry.color }}>
                                <strong>{entry.name}:</strong> {
                                  entry.name === 'utilization' 
                                    ? (entry.value === null || entry.value === undefined 
                                        ? 'No resources' 
                                        : `${entry.value.toFixed(1)}%`)
                                    : `${entry.value.toFixed(1)} hrs`
                                }
                              </div>
                            ))}
                            {dataPoint.statusMessage && (
                              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb', fontSize: '11px', color: '#666' }}>
                                <strong>Status:</strong> {dataPoint.statusMessage}
                              </div>
                            )}
                            {dataPoint.formula && (
                              <div style={{ marginTop: '4px', fontSize: '10px', color: '#999', fontStyle: 'italic' }}>
                                Formula: {dataPoint.formula}
                              </div>
                            )}
                            {contributingTasks.length > 0 && (
                              <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>
                                  <strong>Contributing Tasks ({contributingTasks.length}):</strong>
                                </div>
                                <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '10px', color: '#666' }}>
                                  {contributingTasks.slice(0, 5).map((task, idx) => {
                                    // Handle both API format and task object format
                                    const taskName = task.task_name || task.name || task.task || `Task ${idx + 1}`
                                    const taskId = task.task_id || task.id
                                    const startDate = task.planned_start_date ? new Date(task.planned_start_date).toLocaleDateString() : 'N/A'
                                    const duration = task.duration_days || (task.planned_start_date && task.planned_end_date 
                                      ? Math.ceil((new Date(task.planned_end_date) - new Date(task.planned_start_date)) / (1000 * 60 * 60 * 24))
                                      : 1)
                                    // Calculate end date: planned_start_date + duration_days
                                    const calculatedEndDate = task.planned_start_date && duration
                                      ? new Date(new Date(task.planned_start_date).getTime() + duration * 24 * 60 * 60 * 1000).toLocaleDateString()
                                      : task.planned_end_date
                                        ? new Date(task.planned_end_date).toLocaleDateString()
                                        : 'N/A'
                                    return (
                                      <li key={idx} style={{ marginBottom: '3px' }}>
                                        <strong>{taskName}</strong>
                                        {taskId && <span style={{ color: '#999', fontSize: '9px' }}> (ID: {taskId})</span>}
                                        <span style={{ color: '#999' }}>
                                          {' '}({startDate} - {calculatedEndDate}, {duration} day{duration !== 1 ? 's' : ''})
                                        </span>
                                      </li>
                                    )
                                  })}
                                  {contributingTasks.length > 5 && (
                                    <li style={{ color: '#999', fontStyle: 'italic' }}>
                                      +{contributingTasks.length - 5} more tasks
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        )
                      }}
                    />
                    <Legend 
                      content={({ payload }) => (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', paddingTop: '10px' }}>
                          {payload?.map((entry, index) => (
                            <span key={index} style={{ fontSize: '12px', color: '#666' }}>
                              <span style={{ 
                                display: 'inline-block', 
                                width: '12px', 
                                height: '12px', 
                                background: entry.color, 
                                marginRight: '6px',
                                borderRadius: '50%'
                              }}></span>
                              {entry.value}
                            </span>
                          ))}
                          <span style={{ fontSize: '11px', color: '#999', marginLeft: '20px' }}>
                            <span style={{ 
                              display: 'inline-block', 
                              width: '10px', 
                              height: '10px', 
                              background: '#ff6b6b', 
                              border: '2px solid #fff',
                              marginRight: '6px',
                              borderRadius: '50%'
                            }}></span>
                            Larger dots = Actual dates
                          </span>
                        </div>
                      )}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="needed" 
                      stroke="#dc3545" 
                      strokeWidth={2}
                      name="Needed Hours"
                      dot={(props) => {
                        const { cx, cy, payload } = props
                        if (!payload) return null
                        const isActual = payload.isActualDate || false
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isActual ? 5 : 3}
                            fill={isActual ? '#ff6b6b' : '#dc3545'}
                            stroke={isActual ? '#fff' : 'none'}
                            strokeWidth={isActual ? 2 : 0}
                          />
                        )
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="available" 
                      stroke="#28a745" 
                      strokeWidth={2}
                      name="Available Hours"
                      dot={(props) => {
                        const { cx, cy, payload } = props
                        if (!payload) return null
                        const isActual = payload.isActualDate || false
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isActual ? 5 : 3}
                            fill={isActual ? '#51cf66' : '#28a745'}
                            stroke={isActual ? '#fff' : 'none'}
                            strokeWidth={isActual ? 2 : 0}
                          />
                        )
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Task Breakdown Table */}
              {tasks.length > 0 && (
                <div className="task-breakdown-section">
                  <h4>Task Breakdown Reference</h4>
                  <p className="breakdown-description">
                    Below are the tasks that contribute to the utilization forecast. Each task's start date is expanded across its duration to generate daily utilization data.
                    <strong> End dates are calculated as: planned_start_date + duration_days</strong>
                  </p>
                  <div className="task-breakdown-table-container">
                    <table className="task-breakdown-table">
                      <thead>
                        <tr>
                          <th>Task Name</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Duration (Days)</th>
                          <th>Status</th>
                          <th>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.slice(0, 20).map((task, idx) => {
                          const startDate = task.planned_start_date ? new Date(task.planned_start_date).toLocaleDateString() : 'N/A'
                          const endDate = task.planned_end_date 
                            ? new Date(task.planned_end_date).toLocaleDateString()
                            : task.duration_days && task.planned_start_date
                              ? new Date(new Date(task.planned_start_date).getTime() + task.duration_days * 24 * 60 * 60 * 1000).toLocaleDateString()
                              : 'N/A'
                          const duration = task.duration_days || (task.planned_start_date && task.planned_end_date 
                            ? Math.ceil((new Date(task.planned_end_date) - new Date(task.planned_start_date)) / (1000 * 60 * 60 * 24))
                            : task.planned_start_date ? 1 : 0)
                          const role = task.role || task.assigned_role || task.resource_role || 'N/A'
                          
                          return (
                            <tr key={idx}>
                              <td>{task.name || task.task || `Task ${idx + 1}`}</td>
                              <td>{startDate}</td>
                              <td>{endDate}</td>
                              <td>{duration > 0 ? `${duration} day${duration !== 1 ? 's' : ''}` : 'N/A'}</td>
                              <td>
                                <span className={`task-status-badge status-${(task.status || '').toLowerCase().replace(' ', '-')}`}>
                                  {task.status || 'Unknown'}
                                </span>
                              </td>
                              <td>{role}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {tasks.length > 20 && (
                      <p className="breakdown-note">
                        Showing first 20 of {tasks.length} tasks. View Project Timeline for complete task list.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conflict Calendar/Heatmap */}
          {result.conflicts && result.conflicts.length > 0 && (
            <div className="conflicts-section">
              <h3>Resource Conflicts Details</h3>
              <div className="conflict-calendar">
                {result.conflicts.map((conflict, index) => (
                  <div key={index} className="conflict-day-card">
                    <div className="conflict-day-header">
                      <div className="conflict-date-badge">
                        {new Date(conflict.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="conflict-role-badge">{conflict.role}</div>
                    </div>
                    <div className="conflict-metrics-visual">
                      <div className="metric-bar-container">
                        <div className="metric-bar-label">Needed: {conflict.needed_hours}h</div>
                        <div className="metric-bar">
                          <div 
                            className="metric-bar-fill needed" 
                            style={{ width: `${Math.min((conflict.needed_hours / 24) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="metric-bar-container">
                        <div className="metric-bar-label">Available: {conflict.available_hours}h</div>
                        <div className="metric-bar">
                          <div 
                            className="metric-bar-fill available" 
                            style={{ width: `${Math.min((conflict.available_hours / 24) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="metric-bar-container shortage">
                        <div className="metric-bar-label">Shortage: {conflict.shortage_hours}h</div>
                        <div className="metric-bar">
                          <div 
                            className="metric-bar-fill shortage-fill" 
                            style={{ width: `${Math.min((conflict.shortage_hours / 24) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    {conflict.affected_tasks && conflict.affected_tasks.length > 0 && (
                      <div className="affected-tasks-compact">
                        <strong>{conflict.affected_tasks.length} task{conflict.affected_tasks.length > 1 ? 's' : ''} affected</strong>
                        <div className="task-tags">
                          {conflict.affected_tasks.slice(0, 3).map((task, taskIndex) => (
                            <span key={taskIndex} className="task-tag">
                              {task.task_name}
                            </span>
                          ))}
                          {conflict.affected_tasks.length > 3 && (
                            <span className="task-tag more">+{conflict.affected_tasks.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.suggested_adjustments && result.suggested_adjustments.length > 0 && (
            <div className="adjustments-section">
              <h3>Suggested Task Adjustments</h3>
              <div className="adjustments-timeline">
                {result.suggested_adjustments.map((adjustment, index) => {
                  const currentDate = new Date(adjustment.current_start)
                  const suggestedDate = new Date(adjustment.suggested_start)
                  const delayDays = adjustment.delay_days || 0
                  
                  return (
                    <div key={index} className="adjustment-timeline-card">
                      <div className="adjustment-task-header">
                        <h4>{adjustment.task_name}</h4>
                        <div className="adjustment-delay-badge">
                          {delayDays} day{delayDays !== 1 ? 's' : ''} delay
                        </div>
                      </div>
                      <div className="adjustment-timeline-visual">
                        <div className="timeline-row">
                          <div className="timeline-label">Current</div>
                          <div className="timeline-bar-container">
                            <div className="timeline-bar current-bar">
                              <span className="timeline-date">
                                {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="timeline-arrow">→</div>
                        <div className="timeline-row">
                          <div className="timeline-label">Suggested</div>
                          <div className="timeline-bar-container">
                            <div className="timeline-bar suggested-bar" style={{ marginLeft: `${(delayDays / 30) * 100}%` }}>
                              <span className="timeline-date">
                                {suggestedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="adjustment-reason-compact">
                        <strong>Reason:</strong> {adjustment.reason}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {result.recommendations && result.recommendations.length > 0 && (
            <div className="recommendations-section">
              <h3>Recommendations</h3>
              <div className="recommendations-list">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-card">
                    <div className="recommendation-header">
                      <span
                        className="recommendation-priority"
                        style={{
                          backgroundColor:
                            rec.priority === 'high'
                              ? '#dc3545'
                              : rec.priority === 'medium'
                              ? '#ffc107'
                              : '#28a745'
                        }}
                      >
                        {rec.priority.toUpperCase()}
                      </span>
                      <span className="recommendation-type">{rec.type}</span>
                    </div>
                    <p className="recommendation-message">{rec.message}</p>
                    {rec.actions && rec.actions.length > 0 && (
                      <ul className="recommendation-actions">
                        {rec.actions.map((action, actionIndex) => (
                          <li key={actionIndex}>{action}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PART B — CPM Tables (Following Guide Format) - From API */}
          {result && result.cpm_tables && (
            <div className="cpm-tables-section" style={{ marginTop: '32px', padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '2px solid #e5e7eb' }}>
              <h3 className="section-subtitle" style={{ color: '#111827', marginBottom: '24px' }}>
                PART B — CPM Tables (Following Agreed Schema)
              </h3>
              
              {/* 1. Activity Input Table */}
              {result.cpm_tables.activity_input_table && result.cpm_tables.activity_input_table.length > 0 && (
                <div className="resource-table-wrapper" style={{ marginBottom: '24px' }}>
                  <h4 className="table-title">1. Activity Input Table (Uploaded Data)</h4>
                  <div className="table-container">
                    <table className="resource-table">
                      <thead>
                        <tr>
                          <th>Task_ID</th>
                          <th>Task_Name</th>
                          <th>Duration (Days)</th>
                          <th>Predecessors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.cpm_tables.activity_input_table.map((row, idx) => (
                          <tr key={idx}>
                            <td><strong>{row.task_id || row.task_ID}</strong></td>
                            <td className="task-name-cell">{row.task_name || row.task_Name}</td>
                            <td>{row.duration || row.duration_days || row.Duration || 'N/A'}</td>
                            <td>
                              {row.predecessors 
                                ? (Array.isArray(row.predecessors) ? row.predecessors.join(', ') : row.predecessors)
                                : (row.Predecessors 
                                  ? (Array.isArray(row.Predecessors) ? row.Predecessors.join(', ') : row.Predecessors)
                                  : '—')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="table-note">
                    <strong>Rules applied:</strong> Tasks are listed with their dependencies (predecessors).
                  </p>
                </div>
              )}

              {/* 2. Forward Pass Table */}
              {result.cpm_tables.forward_pass_table && result.cpm_tables.forward_pass_table.length > 0 && (
                <div className="resource-table-wrapper" style={{ marginBottom: '24px' }}>
                  <h4 className="table-title">2. Forward Pass Table (Early Dates)</h4>
                  <div className="table-container">
                    <table className="resource-table">
                      <thead>
                        <tr>
                          <th>Task_ID</th>
                          <th>ES</th>
                          <th>EF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.cpm_tables.forward_pass_table.map((row, idx) => (
                          <tr key={idx}>
                            <td><strong>{row.task_id || row.task_ID}</strong></td>
                            <td>{row.es || row.ES !== undefined ? row.ES : row.es}</td>
                            <td>{row.ef || row.EF !== undefined ? row.EF : row.ef}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="table-note">
                    <strong>Rules applied:</strong> ES = max(EF of predecessors), EF = ES + Duration
                  </p>
                </div>
              )}

              {/* 3. Backward Pass Table */}
              {result.cpm_tables.backward_pass_table && result.cpm_tables.backward_pass_table.length > 0 && (
                <div className="resource-table-wrapper" style={{ marginBottom: '24px' }}>
                  <h4 className="table-title">3. Backward Pass Table (Late Dates)</h4>
                  <div className="table-container">
                    <table className="resource-table">
                      <thead>
                        <tr>
                          <th>Task_ID</th>
                          <th>LS</th>
                          <th>LF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.cpm_tables.backward_pass_table.map((row, idx) => (
                          <tr key={idx}>
                            <td><strong>{row.task_id || row.task_ID}</strong></td>
                            <td>{row.ls || row.LS !== undefined ? row.LS : row.ls}</td>
                            <td>{row.lf || row.LF !== undefined ? row.LF : row.lf}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="table-note">
                    <strong>Rules applied:</strong> LF = min(LS of successors), LS = LF − Duration
                  </p>
                </div>
              )}

              {/* 4. Float Calculation Table */}
              {result.cpm_tables.float_calculation_table && result.cpm_tables.float_calculation_table.length > 0 && (
                <div className="resource-table-wrapper" style={{ marginBottom: '24px' }}>
                  <h4 className="table-title">4. Float Calculation Table</h4>
                  <div className="table-container">
                    <table className="resource-table">
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
                        {result.cpm_tables.float_calculation_table.map((row, idx) => (
                          <tr key={idx}>
                            <td><strong>{row.task_id || row.task_ID}</strong></td>
                            <td>{row.es || row.ES !== undefined ? row.ES : row.es}</td>
                            <td>{row.ls || row.LS !== undefined ? row.LS : row.ls}</td>
                            <td>{row.ef || row.EF !== undefined ? row.EF : row.ef}</td>
                            <td>{row.lf || row.LF !== undefined ? row.LF : row.lf}</td>
                            <td>
                              <span className={row.total_float === 0 || row.Total_Float === 0 ? 'critical-badge' : ''}>
                                {row.total_float !== undefined ? row.total_float : (row.Total_Float !== undefined ? row.Total_Float : 'N/A')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="table-note">
                    <strong>Rule:</strong> Total Float = LS − ES (or LF − EF)
                  </p>
                </div>
              )}

              {/* 5. Critical Path Identification Table */}
              {result.cpm_tables.critical_path_identification_table && result.cpm_tables.critical_path_identification_table.length > 0 && (
                <div className="resource-table-wrapper" style={{ marginBottom: '24px' }}>
                  <h4 className="table-title">5. Critical Path Identification Table</h4>
                  <div className="table-container">
                    <table className="resource-table">
                      <thead>
                        <tr>
                          <th>Task_ID</th>
                          <th>Total Float</th>
                          <th>Critical</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.cpm_tables.critical_path_identification_table.map((row, idx) => {
                          const isCritical = row.critical === true || row.Critical === true || 
                                           row.critical === 'Yes' || row.Critical === 'Yes' ||
                                           (row.total_float === 0 || row.Total_Float === 0)
                          return (
                            <tr key={idx} className={isCritical ? 'critical-row' : ''}>
                              <td><strong>{row.task_id || row.task_ID}</strong></td>
                              <td>{row.total_float !== undefined ? row.total_float : (row.Total_Float !== undefined ? row.Total_Float : 'N/A')}</td>
                              <td>
                                {isCritical ? (
                                  <span className="critical-badge">Yes</span>
                                ) : (
                                  <span className="non-critical-badge">No</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Critical Path Sequence */}
              {result.cpm_tables.critical_path_sequence && (
                <div className="resource-table-wrapper" style={{ marginBottom: '24px', background: '#fff7ed', border: '2px solid #fb923c' }}>
                  <h4 className="table-title" style={{ color: '#c2410c' }}>Critical Path Sequence</h4>
                  <div style={{ padding: '16px', fontSize: '16px', fontWeight: '600', color: '#ea580c' }}>
                    {result.cpm_tables.critical_path_string || 
                     (Array.isArray(result.cpm_tables.critical_path_sequence) 
                       ? result.cpm_tables.critical_path_sequence.join(' → ') 
                       : result.cpm_tables.critical_path_sequence)}
                  </div>
                  <p className="table-note" style={{ color: '#92400e' }}>
                    <strong>Critical Path:</strong> Tasks with Total Float = 0 form the critical path that determines project duration.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PART A — Resource Leveling Tables (Following Guide Format) - From API */}
          {result && (() => {
            // Use resource_leveling_tables if available, otherwise fall back to tables
            const tables = result.resource_leveling_tables || result.tables
            if (!tables) return null
            
            return (
              <div className="resource-tables-section" style={{ marginTop: '32px', padding: '24px', background: '#f0f9ff', borderRadius: '12px', border: '2px solid #bae6fd' }}>
                <h3 className="section-subtitle" style={{ color: '#0c4a6e', marginBottom: '24px' }}>
                  PART A — Resource Leveling Tables (Following Guide Format)
                </h3>
                
                {/* 6. Resource Requirement Table */}
                {tables.resource_requirement_table && tables.resource_requirement_table.length > 0 && (
                  <div className="resource-table-wrapper" style={{ marginBottom: '24px' }}>
                    <h4 className="table-title">6. Resource Requirement Table (for Leveling)</h4>
                    <div className="table-container">
                      <table className="resource-table">
                        <thead>
                          <tr>
                            <th>Task_ID</th>
                            <th>Task_Name</th>
                            <th>Resource Type</th>
                            <th>Required Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tables.resource_requirement_table.map((row, idx) => (
                            <tr key={idx}>
                              <td><strong>{row.task_id || row.task_ID}</strong></td>
                              <td className="task-name-cell">{row.task_name || row.task_Name}</td>
                              <td>{row.resource_type || row.Resource_Type}</td>
                              <td>{row.required_qty !== undefined ? row.required_qty : (row.Required_Qty !== undefined ? row.Required_Qty : 'N/A')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="table-note">
                      Shows which resources (roles) are required for each task.
                    </p>
                  </div>
                )}

                {/* 7. Resource Availability Table */}
                {tables.resource_availability_table && tables.resource_availability_table.length > 0 && (
                  <div className="resource-table-wrapper" style={{ marginBottom: '24px' }}>
                    <h4 className="table-title">7. Resource Availability Table</h4>
                    <div className="table-container">
                      <table className="resource-table">
                        <thead>
                          <tr>
                            <th>Resource Type</th>
                            <th>Available per Day</th>
                            <th>Total Days</th>
                            <th>Date Range</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tables.resource_availability_table.map((row, idx) => (
                            <tr key={idx}>
                              <td><strong>{row.resource_type || row.Resource_Type}</strong></td>
                              <td>{row.available_per_day !== undefined ? row.available_per_day : (row.Available_per_Day !== undefined ? row.Available_per_Day : 'N/A')}</td>
                              <td>{row.total_days !== undefined ? row.total_days : (row.Total_Days !== undefined ? row.Total_Days : 'N/A')}</td>
                              <td>
                                {row.date_range ? (
                                  <span>
                                    {row.date_range.start ? new Date(row.date_range.start).toLocaleDateString() : 'N/A'} - {row.date_range.end ? new Date(row.date_range.end).toLocaleDateString() : 'N/A'}
                                  </span>
                                ) : (row.Date_Range ? (
                                  <span>
                                    {row.Date_Range.start ? new Date(row.Date_Range.start).toLocaleDateString() : 'N/A'} - {row.Date_Range.end ? new Date(row.Date_Range.end).toLocaleDateString() : 'N/A'}
                                  </span>
                                ) : 'N/A')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="table-note">
                      Shows available resources per day for each role (average availability if uniform, or min/max if varying).
                    </p>
                  </div>
                )}

                {/* 8. Final Schedule Table (Post-Leveling) */}
                {tables.final_schedule_table && tables.final_schedule_table.length > 0 && (
                  <div className="resource-table-wrapper" style={{ marginBottom: '24px' }}>
                    <h4 className="table-title">8. Final Schedule Table (Post-Leveling)</h4>
                    <p className="table-note">
                      (If shifts occur, Leveled = Yes and dates update.) Days are 0-based (Day 0 = project start)
                    </p>
                    <div className="table-container">
                      <table className="resource-table">
                        <thead>
                          <tr>
                            <th>Task_ID</th>
                            <th>Task_Name</th>
                            <th>Start Day</th>
                            <th>End Day</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Duration (Days)</th>
                            <th>Leveled</th>
                            <th>Critical</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tables.final_schedule_table.map((row, idx) => {
                            const isLeveled = row.leveled === true || row.Leveled === true || row.leveled === 'Yes' || row.Leveled === 'Yes'
                            const isCritical = row.is_critical === true || row.Is_Critical === true || row.critical === true || row.Critical === true
                            
                            return (
                              <tr 
                                key={idx}
                                className={isCritical ? 'critical-row' : ''}
                                style={{ background: isLeveled ? '#f0fdf4' : 'white' }}
                              >
                                <td><strong>{row.task_id || row.task_ID}</strong></td>
                                <td className="task-name-cell">{row.task_name || row.task_Name}</td>
                                <td>{row.start_day !== undefined ? row.start_day : (row.Start_Day !== undefined ? row.Start_Day : 'N/A')}</td>
                                <td>{row.end_day !== undefined ? row.end_day : (row.End_Day !== undefined ? row.End_Day : 'N/A')}</td>
                                <td>{row.start_date ? new Date(row.start_date).toLocaleDateString() : (row.Start_Date ? new Date(row.Start_Date).toLocaleDateString() : 'N/A')}</td>
                                <td>{row.end_date ? new Date(row.end_date).toLocaleDateString() : (row.End_Date ? new Date(row.End_Date).toLocaleDateString() : 'N/A')}</td>
                                <td>{row.duration_days !== undefined ? row.duration_days : (row.Duration_Days !== undefined ? row.Duration_Days : 'N/A')}</td>
                                <td>
                                  {isLeveled ? (
                                    <span className="leveled-badge">Yes</span>
                                  ) : (
                                    <span className="not-leveled-badge">No</span>
                                  )}
                                </td>
                                <td>
                                  {isCritical ? (
                                    <span className="critical-badge">Yes</span>
                                  ) : (
                                    <span className="non-critical-badge">No</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="table-note">
                      Shows the final schedule after resource leveling with the <strong>leveled</strong> flag indicating if a task was adjusted.
                    </p>
                  </div>
                )}
              </div>
            )
          })()}

          {result.leveled && (
            <div className="leveling-success" style={{
              padding: '16px',
              background: '#d4edda',
              border: '2px solid #28a745',
              borderRadius: '8px',
              color: '#155724',
              marginTop: '20px'
            }}>
              <strong>✅ Resource Leveling Applied Successfully</strong>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                Schedule changes have been applied. Tasks have been adjusted to respect resource constraints while maintaining dependencies. 
                {result.adjustments_applied !== undefined && (
                  <span> <strong>{result.adjustments_applied}</strong> task(s) were leveled.</span>
                )}
                {result.tasks_leveled !== undefined && (
                  <span> <strong>{result.tasks_leveled}</strong> task(s) marked as "Leveled".</span>
                )}
              </p>
              {result.unresolved_conflicts !== undefined && result.unresolved_conflicts > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '6px',
                  color: '#856404'
                }}>
                  <strong>⚠️ Unresolved Conflicts: {result.unresolved_conflicts}</strong>
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
                    Some conflicts could not be resolved because only critical tasks were affected. 
                    Critical tasks are protected during leveling to maintain the critical path. 
                    Consider increasing available resources or adjusting project scope.
                  </p>
                </div>
              )}
              {result.conflicts_resolved !== undefined && (
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#155724' }}>
                  <strong>Conflicts resolved:</strong> {result.conflicts_resolved}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ResourceLeveling

