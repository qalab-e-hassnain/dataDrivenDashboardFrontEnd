import React from 'react'
import './ProjectTimeline.css'

function ProjectTimeline({ data }) {
  if (!data) {
    return <div className="timeline-section">Loading timeline data...</div>
  }

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
          <span className="section-icon">📅</span>
          <h2 className="section-title">Project Timeline & Critical Path</h2>
        </div>
        <div className="timeline-actions">
          <span className="ai-enhanced-tag">AI ENHANCED</span>
          <button className="action-button">↻</button>
          <button className="action-button">⚙</button>
        </div>
      </div>

      <div className="timeline-tasks">
        {data.map((task, index) => {
          const progress = Math.round(task.progress || 0)
          const progressStyle = getProgressBarStyle(progress, task.status)
          const statusText = task.status === 'Complete' ? '✓ Complete' : 
                            task.status === 'Critical' ? '⚠ Critical' : 
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
        })}
      </div>
    </div>
  )
}

export default ProjectTimeline
