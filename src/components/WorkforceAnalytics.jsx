import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { apiService } from '../services/api'
import './WorkforceAnalytics.css'

function WorkforceAnalytics({ data, projectId }) {
  const navigate = useNavigate()
  const [workforceSummary, setWorkforceSummary] = useState(null)
  const [totalWorkers, setTotalWorkers] = useState(null)
  const [activeWorkers, setActiveWorkers] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [selectedView, setSelectedView] = useState(null) // 'total', 'active', 'summary'
  const [daysActive, setDaysActive] = useState(30)
  const [workforceData, setWorkforceData] = useState([])
  const [showOverUtilizedModal, setShowOverUtilizedModal] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchWorkforceSummary()
      fetchWorkforceData()
    }
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchWorkforceSummary = async () => {
    try {
      const summary = await apiService.getWorkforceSummary(projectId)
      setWorkforceSummary(summary)
    } catch (err) {
      console.error('Failed to fetch workforce summary:', err)
    }
  }

  const fetchWorkforceData = async () => {
    try {
      const data = await apiService.getWorkforceByProject(projectId)
      setWorkforceData(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch workforce data:', err)
      setWorkforceData([])
    }
  }

  // Get over-utilized workers (utilization > 100%)
  const getOverUtilizedWorkers = () => {
    if (!workforceData || workforceData.length === 0) return []
    
    // Group by worker name and calculate average utilization
    const workerUtilization = {}
    workforceData.forEach(entry => {
      const workerName = entry.worker_name
      if (!workerUtilization[workerName]) {
        workerUtilization[workerName] = {
          name: workerName,
          utilization_rates: [],
          role: entry.role || entry.primary_role || 'N/A',
          employee_id: entry.employee_id || 'N/A'
        }
      }
      if (entry.utilization_rate !== null && entry.utilization_rate !== undefined) {
        workerUtilization[workerName].utilization_rates.push(entry.utilization_rate)
      }
    })
    
    // Calculate average utilization per worker and filter > 100%
    return Object.values(workerUtilization)
      .map(worker => {
        const avgUtilization = worker.utilization_rates.length > 0
          ? worker.utilization_rates.reduce((sum, rate) => sum + rate, 0) / worker.utilization_rates.length
          : 0
        return {
          ...worker,
          average_utilization: avgUtilization
        }
      })
      .filter(worker => worker.average_utilization > 100)
      .sort((a, b) => b.average_utilization - a.average_utilization)
  }

  const handleMetricClick = async (type) => {
    setLoadingDetails(true)
    setSelectedView(type)
    
    try {
      if (type === 'total') {
        const workers = await apiService.getTotalWorkers(projectId)
        setTotalWorkers(workers)
      } else if (type === 'active') {
        const workers = await apiService.getActiveWorkers(projectId, daysActive)
        setActiveWorkers(workers)
      } else if (type === 'summary') {
        const summary = await apiService.getWorkforceSummary(projectId)
        setWorkforceSummary(summary)
      }
    } catch (err) {
      console.error('Failed to fetch worker details:', err)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedView(null)
    setTotalWorkers(null)
    setActiveWorkers(null)
  }

  if (!data) {
    return <div className="workforce-section">Loading workforce data...</div>
  }

  // Use summary data if available, otherwise fall back to existing data
  const totalWorkersCount = workforceSummary?.total_workers || Math.round(data.total || 247)
  const activeWorkersCount = workforceSummary?.active_workers || Math.round(data.active || 203)

  const metrics = [
    { label: 'Total Workforce', value: totalWorkersCount, type: 'total', clickable: true },
    { label: 'Active Workers', value: activeWorkersCount, type: 'active', clickable: true },
    { label: 'Avg. Productivity', value: `${Math.round(data.productivity || 87)}%`, type: 'productivity', clickable: false },
    { label: 'Utilization Rate', value: `${Math.round(data.utilization || 92)}%`, type: 'utilization', clickable: false },
  ]

  // ✅ Use time-series data (now date-based from API)
  // Chart data can have either 'week' or 'date' field
  const chartData = data.weeklyData && data.weeklyData.length > 0 
    ? data.weeklyData.map(item => ({
        // Use date if available, otherwise use week
        label: item.date 
          ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : item.week || 'Week',
        week: item.week || item.label || 'Week',
        date: item.date,
        productivity: item.productivity || 0,
        utilization: item.utilization || 0,
      }))
    : [
        { week: 'Week 1', productivity: 87, utilization: 92 },
        { week: 'Week 2', productivity: 89, utilization: 94 },
        { week: 'Week 3', productivity: 85, utilization: 90 },
        { week: 'Week 4', productivity: 88, utilization: 93 },
        { week: 'Week 5', productivity: 86, utilization: 91 },
        { week: 'Week 6', productivity: 90, utilization: 95 },
        { week: 'Week 7', productivity: 87, utilization: 92 },
      ]

  return (
    <div className="workforce-section">
      <div className="section-header">
        <div className="section-title-wrapper">
          <h2 className="section-title">Workforce Analytics</h2>
          <span className="ai-tag">AI POWERED</span>
        </div>
        <div className="workforce-navigation">
          <button
            className="nav-button resource-leveling-button"
            onClick={() => projectId && navigate(`/resource-leveling/${projectId}`)}
            disabled={!projectId}
            title="View Resource Leveling analysis"
          >
            Resource Leveling →
          </button>
        </div>
      </div>

      {/* Over-Utilization Warning */}
      {(() => {
        const overUtilized = getOverUtilizedWorkers()
        if (overUtilized.length > 0) {
          return (
            <div className="over-utilization-warning">
              <span className="warning-icon">⚠️</span>
              <span className="warning-text">
                {overUtilized.length} worker{overUtilized.length > 1 ? 's' : ''} over-utilized:
              </span>
              {overUtilized.slice(0, 3).map((worker, idx) => (
                <span key={idx} className="over-utilized-badge">
                  {worker.name} ({worker.average_utilization.toFixed(1)}%)
                </span>
              ))}
              {overUtilized.length > 3 && (
                <span 
                  className="over-utilized-more clickable" 
                  onClick={() => setShowOverUtilizedModal(true)}
                  title="Click to view all over-utilized workers"
                >
                  +{overUtilized.length - 3} more
                </span>
              )}
            </div>
          )
        }
        return null
      })()}

      <div className="workforce-metrics">
        {metrics.map((metric, index) => (
          <div 
            key={index} 
            className={`workforce-metric-card ${metric.clickable ? 'clickable' : ''}`}
            onClick={() => metric.clickable && handleMetricClick(metric.type)}
            title={metric.clickable ? `Click to view ${metric.label} details` : ''}
          >
            <div className="metric-value">{metric.value}</div>
            <div className="metric-label">{metric.label}</div>
            <div className="metric-progress-bar">
              <div 
                className="metric-progress-fill" 
                style={{ width: `${typeof metric.value === 'number' ? Math.min((metric.value / 300) * 100, 100) : Math.min(parseInt(metric.value), 100)}%` }}
              ></div>
            </div>
            {metric.clickable && <div className="click-hint">Click to view details</div>}
          </div>
        ))}
      </div>

      <div className="workforce-chart-container">
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 60, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="label" 
              stroke="#666"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#666"
              domain={[0, 'dataMax']}
              label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle' } }}
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip 
              formatter={(value) => `${Math.round(value)}%`}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }}
              labelStyle={{ marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}
              itemStyle={{ fontSize: '12px', padding: '2px 0' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '8px', paddingBottom: '2px' }}
              iconType="line"
              verticalAlign="bottom"
              height={38}
            />
            <Line 
              type="monotone" 
              dataKey="productivity" 
              name="Productivity %"
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="utilization" 
              name="Utilization %"
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
            No chart data available
          </div>
        )}
      </div>

      {/* Worker Details Modal */}
      {selectedView && (
        <WorkerDetailsModal
          view={selectedView}
          totalWorkers={totalWorkers}
          activeWorkers={activeWorkers}
          workforceSummary={workforceSummary}
          loading={loadingDetails}
          daysActive={daysActive}
          onDaysActiveChange={setDaysActive}
          onClose={handleCloseModal}
        />
      )}

      {/* Over-Utilized Workers Modal */}
      {showOverUtilizedModal && (
        <OverUtilizedModal
          workers={getOverUtilizedWorkers()}
          onClose={() => setShowOverUtilizedModal(false)}
        />
      )}
    </div>
  )
}

// Worker Details Modal Component
const WorkerDetailsModal = ({ 
  view, 
  totalWorkers, 
  activeWorkers, 
  workforceSummary, 
  loading,
  daysActive,
  onDaysActiveChange,
  onClose 
}) => {
  const getTitle = () => {
    switch (view) {
      case 'total':
        return 'Total Workers'
      case 'active':
        return `Active Workers (Last ${daysActive} days)`
      case 'summary':
        return 'Workforce Summary'
      default:
        return 'Worker Details'
    }
  }

  return (
    <div className="worker-modal-overlay" onClick={onClose}>
      <div className="worker-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="worker-modal-header">
          <h2>{getTitle()}</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="worker-modal-body">
          {loading ? (
            <div className="worker-loading">Loading worker details...</div>
          ) : (
            <>
              {view === 'total' && totalWorkers && (
                <TotalWorkersView data={totalWorkers} />
              )}
              {view === 'active' && activeWorkers && (
                <ActiveWorkersView 
                  data={activeWorkers} 
                  daysActive={daysActive}
                  onDaysActiveChange={onDaysActiveChange}
                />
              )}
              {view === 'summary' && workforceSummary && (
                <WorkforceSummaryView data={workforceSummary} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Total Workers View
const TotalWorkersView = ({ data }) => {
  return (
    <div className="workers-view">
      <div className="workers-summary-cards">
        <div className="summary-stat-card">
          <div className="stat-value">{data.total_workers}</div>
          <div className="stat-label">Total Workers</div>
        </div>
        <div className="summary-stat-card">
          <div className="stat-value">{data.summary?.unique_roles || 0}</div>
          <div className="stat-label">Unique Roles</div>
        </div>
      </div>

      {data.by_role && Object.keys(data.by_role).length > 0 && (
        <div className="role-breakdown">
          <h3>Workers by Role</h3>
          <div className="role-badges">
            {Object.entries(data.by_role).map(([role, count]) => (
              <div key={role} className="role-badge">
                <span className="role-name">{role}</span>
                <span className="role-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.workers && data.workers.length > 0 && (
        <div className="workers-table-section">
          <h3>All Workers ({data.workers.length})</h3>
          <div className="workers-table-container">
            <table className="workers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Primary Role</th>
                  <th>Utilization Rate</th>
                  <th>All Roles</th>
                  <th>Total Hours</th>
                  <th>Total Cost</th>
                  <th>Entries</th>
                  <th>Departments</th>
                </tr>
              </thead>
              <tbody>
                {data.workers.map((worker, index) => {
                  const utilization = worker.average_utilization ?? worker.utilization_rate ?? null
                  const isOverUtilized = utilization !== null && utilization > 100
                  const hasUtilization = utilization !== null && utilization !== undefined
                  return (
                    <tr key={index} className={isOverUtilized ? 'over-utilized-row' : ''}>
                      <td className="worker-name">
                        {worker.name}
                        {isOverUtilized && <span className="over-utilized-indicator" title="Over-utilized">⚠️</span>}
                      </td>
                      <td>{worker.employee_id || 'N/A'}</td>
                      <td>
                        <span className="role-tag">{worker.primary_role || 'N/A'}</span>
                      </td>
                      <td>
                        {hasUtilization ? (
                          <span className={`utilization-badge ${isOverUtilized ? 'over-utilized' : utilization > 80 ? 'high-utilization' : 'normal-utilization'}`}>
                            {utilization.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="utilization-badge no-data">N/A</span>
                        )}
                      </td>
                      <td>
                        <div className="roles-list">
                          {worker.roles && worker.roles.length > 0 ? (
                            worker.roles.map((role, i) => (
                              <span key={i} className="role-chip">{role}</span>
                            ))
                          ) : (
                            'N/A'
                          )}
                        </div>
                      </td>
                      <td>{worker.total_hours?.toFixed(1) || 0} hrs</td>
                      <td>PKR {worker.total_cost?.toLocaleString() || 0}</td>
                      <td>{worker.entries_count || 0}</td>
                      <td>
                        {worker.departments && worker.departments.length > 0
                          ? worker.departments.join(', ')
                          : 'N/A'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Active Workers View
const ActiveWorkersView = ({ data, daysActive, onDaysActiveChange }) => {
  return (
    <div className="workers-view">
      <div className="active-workers-controls">
        <label>
          Days Active:
          <select 
            value={daysActive} 
            onChange={(e) => onDaysActiveChange(Number(e.target.value))}
            className="days-select"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </label>
      </div>

      <div className="workers-summary-cards">
        <div className="summary-stat-card">
          <div className="stat-value">{data.active_workers}</div>
          <div className="stat-label">Active Workers</div>
        </div>
        <div className="summary-stat-card">
          <div className="stat-value">{data.period_days}</div>
          <div className="stat-label">Period (Days)</div>
        </div>
      </div>

      {data.by_role && Object.keys(data.by_role).length > 0 && (
        <div className="role-breakdown">
          <h3>Active Workers by Role</h3>
          <div className="role-badges">
            {Object.entries(data.by_role).map(([role, count]) => (
              <div key={role} className="role-badge">
                <span className="role-name">{role}</span>
                <span className="role-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.workers && data.workers.length > 0 && (
        <div className="workers-table-section">
          <h3>Active Workers ({data.workers.length})</h3>
          <div className="workers-table-container">
            <table className="workers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Primary Role</th>
                  <th>Utilization Rate</th>
                  <th>Recent Hours</th>
                  <th>Recent Cost</th>
                  <th>Entries</th>
                  <th>Last Active</th>
                  <th>Days Since</th>
                </tr>
              </thead>
              <tbody>
                {data.workers.map((worker, index) => {
                  const utilization = worker.average_utilization ?? worker.utilization_rate ?? null
                  const isOverUtilized = utilization !== null && utilization > 100
                  const hasUtilization = utilization !== null && utilization !== undefined
                  return (
                    <tr key={index} className={isOverUtilized ? 'over-utilized-row' : ''}>
                      <td className="worker-name">
                        {worker.name}
                        {isOverUtilized && <span className="over-utilized-indicator" title="Over-utilized">⚠️</span>}
                      </td>
                      <td>{worker.employee_id || 'N/A'}</td>
                      <td>
                        <span className="role-tag">{worker.primary_role || 'N/A'}</span>
                      </td>
                      <td>
                        {hasUtilization ? (
                          <span className={`utilization-badge ${isOverUtilized ? 'over-utilized' : utilization > 80 ? 'high-utilization' : 'normal-utilization'}`}>
                            {utilization.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="utilization-badge no-data">N/A</span>
                        )}
                      </td>
                      <td>{worker.recent_hours?.toFixed(1) || 0} hrs</td>
                      <td>PKR {worker.recent_cost?.toLocaleString() || 0}</td>
                      <td>{worker.entries_count || 0}</td>
                      <td>
                        {worker.last_active
                          ? new Date(worker.last_active).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td>
                        {worker.days_since_last_active !== null && worker.days_since_last_active !== undefined
                          ? `${worker.days_since_last_active} days`
                          : 'N/A'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Workforce Summary View
const WorkforceSummaryView = ({ data }) => {
  return (
    <div className="workers-view">
      <div className="workers-summary-cards">
        <div className="summary-stat-card total-card">
          <div className="stat-value">{data.total_workers}</div>
          <div className="stat-label">Total Workers</div>
        </div>
        <div className="summary-stat-card active-card">
          <div className="stat-value">{data.active_workers}</div>
          <div className="stat-label">Active Workers</div>
        </div>
        <div className="summary-stat-card inactive-card">
          <div className="stat-value">{data.inactive_workers}</div>
          <div className="stat-label">Inactive Workers</div>
        </div>
        <div className="summary-stat-card hours-card">
          <div className="stat-value">{data.statistics?.total_hours?.toFixed(0) || 0}</div>
          <div className="stat-label">Total Hours</div>
        </div>
        <div className="summary-stat-card cost-card">
          <div className="stat-value">PKR {data.statistics?.total_cost?.toLocaleString() || 0}</div>
          <div className="stat-label">Total Cost</div>
        </div>
        <div className="summary-stat-card utilization-card">
          <div className="stat-value">{data.statistics?.average_utilization?.toFixed(1) || 0}%</div>
          <div className="stat-label">Avg Utilization</div>
        </div>
      </div>

      <div className="summary-sections">
        <div className="summary-section">
          <h3>Workers by Role (All)</h3>
          <div className="role-badges">
            {data.workers_by_role && Object.entries(data.workers_by_role).map(([role, count]) => (
              <div key={role} className="role-badge">
                <span className="role-name">{role}</span>
                <span className="role-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="summary-section">
          <h3>Active Workers by Role</h3>
          <div className="role-badges">
            {data.active_workers_by_role && Object.entries(data.active_workers_by_role).map(([role, count]) => (
              <div key={role} className="role-badge active">
                <span className="role-name">{role}</span>
                <span className="role-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="summary-section">
          <h3>Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-item-label">Unique Roles:</span>
              <span className="stat-item-value">{data.statistics?.unique_roles || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-item-label">Recent Activity Period:</span>
              <span className="stat-item-value">{data.recent_activity?.period_days || 30} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Over-Utilized Workers Modal
const OverUtilizedModal = ({ workers, onClose }) => {
  return (
    <div className="worker-modal-overlay" onClick={onClose}>
      <div className="worker-modal-content over-utilized-modal" onClick={(e) => e.stopPropagation()}>
        <div className="worker-modal-header">
          <h2>Over-Utilized Workers</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="worker-modal-body">
          <div className="over-utilized-modal-content">
            <p className="modal-description">
              The following {workers.length} worker{workers.length > 1 ? 's have' : ' has'} utilization rate above 100%:
            </p>
            <div className="over-utilized-workers-list">
              {workers.map((worker, index) => (
                <div key={index} className="over-utilized-worker-item">
                  <div className="worker-info">
                    <span className="worker-name-modal">{worker.name}</span>
                    <span className="worker-role-modal">{worker.role}</span>
                  </div>
                  <span className="utilization-badge over-utilized">
                    {worker.average_utilization.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkforceAnalytics
