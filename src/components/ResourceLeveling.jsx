import React, { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { apiService } from '../services/api'
import './ResourceLeveling.css'

const ResourceLeveling = ({ projectId }) => {
  const [result, setResult] = useState(null)
  const [utilizationForecast, setUtilizationForecast] = useState(null)
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
          role: item.role,
          needed: item.needed_hours || 0,
          available: item.available_hours || 0,
          utilization: item.utilization_percentage || 0,
          status: item.status || 'optimal'
        }
      }
    })

    return Object.values(roleGroups).sort((a, b) => new Date(a.date) - new Date(b.date))
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
              <h3>Resource Utilization Forecast</h3>
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
                        return `${value.toFixed(1)} hrs`
                      }}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="needed" 
                      stroke="#dc3545" 
                      strokeWidth={2}
                      name="Needed Hours"
                      dot={{ fill: '#dc3545', r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="available" 
                      stroke="#28a745" 
                      strokeWidth={2}
                      name="Available Hours"
                      dot={{ fill: '#28a745', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
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

