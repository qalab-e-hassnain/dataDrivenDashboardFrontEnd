import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './ProjectTimeline.css'

function ProjectTimeline({ data, onRefresh, projectId }) {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  })

  if (!data) {
    return <div className="timeline-section">Loading timeline data...</div>
  }

  // Filter tasks based on current filters
  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return []
    
    return data.filter(task => {
      // Status filter
      if (filters.status !== 'all') {
        const taskStatus = task.status || ''
        if (filters.status === 'complete' && taskStatus !== 'Complete') return false
        if (filters.status === 'critical' && taskStatus !== 'Critical') return false
        if (filters.status === 'in-progress' && taskStatus !== 'In Progress') return false
        if (filters.status === 'started' && taskStatus !== 'Started') return false
        if (filters.status === 'not-started' && taskStatus !== 'Not Started') return false
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const taskName = (task.task || task.name || '').toLowerCase()
        if (!taskName.includes(searchLower)) return false
      }
      
      return true
    })
  }, [data, filters])


  const getStatusClass = (status) => {
    if (status === 'Complete') return 'status-complete'
    if (status === 'Critical') return 'status-critical'
    if (status === 'In Progress') return 'status-progress'
    if (status === 'Started') return 'status-started'
    return 'status-not-started'
  }

  const getStatusIcon = (status) => {
    if (status === 'Complete') return '✓'
    if (status === 'Critical') return '▲'
    return ''
  }

  const getProgressColor = (progress, status) => {
    if (status === 'Complete') return 'linear-gradient(90deg, #11998e 0%, #38ef7d 100%)' // Green gradient
    if (status === 'Critical') return 'linear-gradient(90deg, #f5576c 0%, #f093fb 100%)' // Pink/red gradient
    if (status === 'In Progress') return 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' // Purple gradient
    if (status === 'Started') return 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' // Purple gradient
    return '#e5e7eb' // Grey
  }
  
  const getProgressBarStyle = (progress, status) => {
    const backgroundColor = getProgressColor(progress, status)
    const width = progress || 0
    let left = '0%'
    
    // For completed tasks, start from left
    if (status === 'Complete') {
      left = '0%'
    } else if (status === 'Critical') {
      left = '0%'
    } else if (progress > 0) {
      // For in-progress tasks, position based on start time (simplified)
      // In real implementation, this would be based on actual start date
      left = '0%' // Start from beginning for now
    } else {
      left = '0%'
    }
    
    return {
      left,
      width: `${width}%`,
      background: backgroundColor,
    }
  }

  return (
    <div className="timeline-section">
      <div className="section-header">
        <div className="section-title-wrapper">
          <h2 className="section-title">Project Timeline & Critical Path</h2>
        </div>
        <div className="timeline-actions">
          <span className="ai-enhanced-tag">AI ENHANCED</span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="timeline-navigation">
        <button
          className="nav-button critical-path-button"
          onClick={() => projectId && navigate(`/critical-path/${projectId}`)}
          disabled={!projectId}
          title="View detailed Critical Path analysis"
        >
          View Critical Path →
        </button>
        <button
          className="nav-button gantt-button"
          onClick={() => projectId && navigate(`/gantt-chart/${projectId}`)}
          disabled={!projectId}
          title="View detailed Gantt Chart"
        >
          View Gantt Chart →
        </button>
      </div>

      {/* Filter Bar */}
      <div className="timeline-filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="complete">Complete</option>
            <option value="critical">Critical</option>
            <option value="in-progress">In Progress</option>
            <option value="started">Started</option>
            <option value="not-started">Not Started</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="search-filter">Search:</label>
          <input
            id="search-filter"
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="filter-input"
          />
        </div>
        <div className="filter-results">
          Showing {filteredData.length} of {data?.length || 0} tasks
        </div>
      </div>

      {/* Timeline Content */}
      <div className="timeline-content">
        <div className="timeline-tasks">
          {filteredData && filteredData.length > 0 ? (
            filteredData.map((task, index) => {
              const progress = Math.round(task.progress || 0)
              const progressStyle = getProgressBarStyle(progress, task.status)
              const statusText = task.status === 'Complete' ? 'Complete' : 
                                task.status === 'Critical' ? 'Critical' : 
                                task.status === 'Not Started' ? 'Not Started' : 
                                task.status
              const statusColor = task.status === 'Complete' ? '#059669' : 
                                 task.status === 'Critical' ? '#dc2626' : 
                                 task.status === 'Not Started' ? '#9ca3af' : 
                                 '#6b7280'
              
              return (
                <div key={index} className="timeline-task">
                  <div className="task-name">{task.task}</div>
                  <div className="task-progress-container">
                    <div 
                      className="task-progress-bar"
                      style={progressStyle}
                    >
                      {progress > 0 ? `${progress}%` : 'Pending'}
                    </div>
                  </div>
                  <span className="task-status" style={{ fontSize: '12px', color: statusColor, minWidth: '100px', textAlign: 'right' }}>
                    {statusText}
                  </span>
                </div>
              )
            })
          ) : (
            <div className="no-timeline-data">
              <p>{filters.status !== 'all' || filters.search ? 'No tasks match the current filters' : 'No timeline data available'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectTimeline
