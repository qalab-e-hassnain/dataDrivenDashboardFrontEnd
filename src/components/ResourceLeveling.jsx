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
    considerAvailability: true
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
      const data = await apiService.applyResourceLeveling(projectId, options)
      setResult(data)
      // Refresh forecast after leveling
      fetchUtilizationForecast()
    } catch (err) {
      console.error('Failed to apply resource leveling:', err)
      setError('Failed to apply resource leveling. Please try again.')
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
          utilization: item.utilization_rate || item.utilization_percentage || 0,
          status: item.status || 'optimal',
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
          Analyze and optimize resource allocation to identify conflicts and suggest adjustments.
        </p>
      </div>

      <div className="resource-leveling-options">
        <div className="options-card">
          <h3>Leveling Options</h3>
          <div className="options-form">
            <div className="form-group">
              <label>
                Max Hours Per Day:
                <input
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
                />
              </label>
            </div>
            <div className="form-group">
              <label>
                Max Hours Per Week:
                <input
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
                />
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={options.considerAvailability}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      considerAvailability: e.target.checked
                    })
                  }
                />
                Consider Workforce Availability
              </label>
            </div>
          </div>
          <button
            onClick={applyLeveling}
            disabled={loading}
            className="btn-apply-leveling"
          >
            {loading ? 'Analyzing...' : 'Apply Resource Leveling'}
          </button>
        </div>
      </div>

      {error && <div className="resource-leveling-error">{error}</div>}

      {result && (
        <div className="resource-leveling-results">
          <div className="results-summary">
            <h3>Leveling Results</h3>
            <div className="summary-cards">
              <div className="summary-card conflict-card">
                <div className="summary-value">{result.summary?.total_conflicts || 0}</div>
                <div className="summary-label">Total Conflicts</div>
              </div>
              <div className="summary-card days-card">
                <div className="summary-value">{result.summary?.conflict_days || 0}</div>
                <div className="summary-label">Conflict Days</div>
              </div>
              <div className="summary-card hours-card">
                <div className="summary-value">
                  {result.summary?.total_shortage_hours?.toFixed(1) || 0}
                </div>
                <div className="summary-label">Shortage Hours</div>
              </div>
              <div className="summary-card roles-card">
                <div className="summary-value">
                  {result.summary?.affected_roles?.length || 0}
                </div>
                <div className="summary-label">Affected Roles</div>
              </div>
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
                        if (name === 'utilization') return `${value.toFixed(1)}%`
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
                                    ? `${entry.value.toFixed(1)}%`
                                    : `${entry.value.toFixed(1)} hrs`
                                }
                              </div>
                            ))}
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

          {result.leveled && (
            <div className="leveling-success">
              Resource leveling analysis completed successfully.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ResourceLeveling

