import React, { useState, useEffect, useRef } from 'react'
import { apiService } from '../services/api'
import { getCachedData, setCachedData } from '../utils/cache'
import './GanttChart.css'

function GanttChart({ projectId }) {
  const [ganttData, setGanttData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scale, setScale] = useState(10) // pixels per day
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    
    if (projectId) {
      loadGanttData()
    } else {
      setLoading(false)
    }

    return () => {
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const loadGanttData = async (forceRefresh = false) => {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedData = getCachedData(projectId, 'ganttData')
      if (cachedData) {
        if (isMountedRef.current) {
          setGanttData(cachedData)
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
      const data = await apiService.getGanttData(projectId)
      
      // Cache the data
      setCachedData(projectId, 'ganttData', data)
      
      if (isMountedRef.current) {
        setGanttData(data)
        setLoading(false)
      }
    } catch (err) {
      console.error('Error loading Gantt data:', err)
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load Gantt chart data')
        setLoading(false)
      }
    }
  }

  // Refresh data in background without showing loading state
  const refreshInBackground = async () => {
    try {
      const data = await apiService.getGanttData(projectId)
      setCachedData(projectId, 'ganttData', data)
      if (isMountedRef.current) {
        setGanttData(data)
      }
    } catch (err) {
      console.error('Background refresh failed:', err)
      // Don't show error for background refresh
    }
  }

  if (loading) {
    return (
      <div className="gantt-loading">
        <div className="loading-spinner"></div>
        <p>Loading Gantt chart...</p>
        <p className="loading-hint">This may take a few moments while we generate the Gantt chart</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="gantt-error">
        <p>Error: {error}</p>
        <button onClick={() => loadGanttData(true)} className="retry-button">Try Again</button>
      </div>
    )
  }

  if (!ganttData || !ganttData.gantt_data || ganttData.gantt_data.length === 0) {
    return (
      <div className="gantt-empty">
        <p>No Gantt chart data available</p>
        <p className="empty-hint">Upload a project file to generate the Gantt chart</p>
      </div>
    )
  }

  // Calculate timeline range
  const tasks = ganttData.gantt_data
  const minES = Math.min(...tasks.map(t => t.es || 0))
  const maxEF = Math.max(...tasks.map(t => t.ef || 0))
  const totalDays = maxEF - minES + 1

  // Generate date labels for timeline
  const generateTimelineLabels = () => {
    const labels = []
    const numLabels = Math.min(20, totalDays) // Max 20 labels
    const step = Math.ceil(totalDays / numLabels)
    
    for (let i = 0; i <= totalDays; i += step) {
      const day = minES + i
      labels.push(day)
    }
    
    return labels
  }

  const timelineLabels = generateTimelineLabels()

  return (
    <div className="gantt-chart-view">
      {/* Controls */}
      <div className="gantt-controls">
        <button 
          onClick={() => loadGanttData(true)} 
          className="refresh-button-small"
          title="Refresh data"
        >
          Refresh
        </button>
        <div className="scale-controls">
          <label>Scale:</label>
          <button 
            className={scale === 5 ? 'active' : ''}
            onClick={() => setScale(5)}
          >
            Compact
          </button>
          <button 
            className={scale === 10 ? 'active' : ''}
            onClick={() => setScale(10)}
          >
            Normal
          </button>
          <button 
            className={scale === 15 ? 'active' : ''}
            onClick={() => setScale(15)}
          >
            Detailed
          </button>
        </div>
        <div className="gantt-info">
          <span>Total Tasks: {tasks.length}</span>
          <span>Critical Tasks: {tasks.filter(t => t.is_critical).length}</span>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="gantt-timeline-header">
        <div className="task-name-header" style={{ width: '200px' }}>Task Name</div>
        <div className="timeline-header" style={{ flex: 1, position: 'relative' }}>
          {timelineLabels.map((day, index) => (
            <div
              key={index}
              className="timeline-marker"
              style={{
                left: `${((day - minES) * scale)}px`,
                position: 'absolute',
              }}
            >
              <div className="marker-line"></div>
              <div className="marker-label">Day {day}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gantt Chart Content */}
      <div className="gantt-content">
        <div className="gantt-tasks-list">
          {tasks.map((task, index) => {
            const startOffset = (task.es || 0) - minES
            const duration = task.duration || 1
            const left = startOffset * scale
            const width = duration * scale

            return (
              <div key={index} className="gantt-task-row">
                <div className="task-name-column" style={{ width: '200px' }}>
                  <div className="task-name-gantt">
                    {task.name || task.task_name}
                  </div>
                  <div className="task-id-gantt">
                    ID: {task.task_id || task.id}
                  </div>
                </div>
                <div 
                  className="gantt-bar-container"
                  style={{ 
                    flex: 1,
                    position: 'relative',
                    height: '50px',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div
                    className={`gantt-bar ${task.is_critical ? 'critical' : 'normal'}`}
                    style={{
                      position: 'absolute',
                      left: `${left}px`,
                      width: `${width}px`,
                      height: '40px',
                      top: '5px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    title={`${task.name || task.task_name}: ${duration} days (ES: ${task.es}, EF: ${task.ef})`}
                  >
                    {duration}d
                  </div>
                  {task.is_critical && (
                    <div className="critical-indicator" title="Critical Task">
                      ⚠
                    </div>
                  )}
                </div>
                <div className="task-details-column" style={{ width: '150px', padding: '0 10px' }}>
                  <div className="task-detail-item">
                    <span className="detail-label">ES:</span> {task.es}
                  </div>
                  <div className="task-detail-item">
                    <span className="detail-label">EF:</span> {task.ef}
                  </div>
                  <div className="task-detail-item">
                    <span className="detail-label">Float:</span> 
                    <span className={task.float === 0 ? 'float-zero' : ''}>
                      {task.float}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default GanttChart

