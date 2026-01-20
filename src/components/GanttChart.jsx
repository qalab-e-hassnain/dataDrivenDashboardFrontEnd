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
  
  // Debug: Log task data to understand structure
  if (tasks.length > 0) {
    console.log('📊 Sample task data:', tasks[0])
    console.log('📊 Critical tasks check:', tasks.map(t => ({
      name: t.name || t.task_name,
      is_critical: t.is_critical,
      critical: t.critical,
      total_float: t.total_float,
      Total_Float: t.Total_Float
    })))
  }
  
  const minES = Math.min(...tasks.map(t => t.es || 0))
  const maxEF = Math.max(...tasks.map(t => t.ef || 0))
  const totalDays = maxEF - minES + 1

  // Chart width in pixels (ensures background extends across full scroll area)
  const chartWidth = Math.max(totalDays * scale, 800)

  // Generate date labels for timeline - prevent overlapping and ensure chronological order
  const generateTimelineLabels = () => {
    const labels = []
    const labelSet = new Set() // Track unique days to avoid duplicates
    
    // Minimum spacing needed for a label (approximately 50px for "Day XX")
    const minLabelWidth = 50
    const minSpacing = minLabelWidth / scale
    
    // Calculate step to ensure labels don't overlap
    let step = Math.ceil(minSpacing)
    
    // For very small scales, increase step significantly
    if (scale < 8) {
      step = Math.max(step, Math.ceil(60 / scale))
    } else if (scale < 12) {
      step = Math.max(step, Math.ceil(40 / scale))
    }
    
    // Ensure step is at least 1
    step = Math.max(1, step)
    
    // For very long timelines, limit to max 30 labels
    const maxLabels = 30
    if (totalDays / step > maxLabels) {
      step = Math.ceil(totalDays / maxLabels)
    }
    
    // Always include the first day
    labels.push({ day: minES, position: 0 })
    labelSet.add(minES)
    
    // Generate labels with step, starting from step
    for (let i = step; i < totalDays; i += step) {
      const day = minES + i
      if (!labelSet.has(day)) {
        labels.push({ day, position: i })
        labelSet.add(day)
      }
    }
    
    // Always include the last day if not already included
    if (!labelSet.has(maxEF)) {
      labels.push({ day: maxEF, position: totalDays })
      labelSet.add(maxEF)
    }
    
    // Sort by day value to ensure chronological order
    labels.sort((a, b) => a.day - b.day)
    
    // Remove any duplicates that might have been created
    const uniqueLabels = []
    const seenDays = new Set()
    labels.forEach(label => {
      if (!seenDays.has(label.day)) {
        uniqueLabels.push({
          ...label,
          position: label.day - minES // Recalculate position based on sorted day
        })
        seenDays.add(label.day)
      }
    })
    
    return uniqueLabels
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
          <span>Critical Tasks: {tasks.filter(t => {
            // Check multiple possible field names and conditions for critical tasks
            return t.is_critical === true || 
                   t.critical === true || 
                   t.Critical === true ||
                   t.is_critical === 'Yes' ||
                   t.critical === 'Yes' ||
                   (t.total_float !== undefined && t.total_float === 0) ||
                   (t.Total_Float !== undefined && t.Total_Float === 0) ||
                   (t.float !== undefined && t.float === 0)
          }).length}</span>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="gantt-timeline-header">
        <div className="task-name-header" style={{ width: '200px' }}>Task Name</div>
        <div className="timeline-header" style={{ width: `${chartWidth}px`, position: 'relative' }}>
          {timelineLabels.map((item, index) => (
            <div
              key={index}
              className="timeline-marker"
              style={{
                left: `${item.position * scale}px`,
                position: 'absolute',
              }}
            >
              <div className="marker-line"></div>
              <div className="marker-label">Day {item.day}</div>
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

            // Determine if task is critical
            const isCritical = task.is_critical === true || 
                             task.critical === true || 
                             task.Critical === true ||
                             task.is_critical === 'Yes' ||
                             task.critical === 'Yes' ||
                             (task.total_float !== undefined && task.total_float === 0) ||
                             (task.Total_Float !== undefined && task.Total_Float === 0) ||
                             (task.float !== undefined && task.float === 0)

            return (
              <div key={index} className="gantt-task-row">
                <div className="task-name-column" style={{ width: '200px' }}>
                  <div className="task-name-gantt">
                    {task.name || task.task_name}
                  </div>
                  <div className="task-id-gantt">
                    ({task.task_id || task.id || task.activity_id || 'N/A'})
                  </div>
                </div>
                <div 
                  className="gantt-bar-container"
                  style={{ 
                    width: `${chartWidth}px`,
                    '--scale': `${scale}px`,
                  }}
                >
                  <div
                    className={`gantt-bar ${isCritical ? 'critical' : 'normal'}`}
                    style={{
                      position: 'absolute',
                      left: `${left}px`,
                      width: `${Math.max(width, 20)}px`,
                      height: '40px',
                      top: '5px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: width >= 30 ? '11px' : '9px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minWidth: '20px',
                    }}
                    title={`${task.name || task.task_name}: ${duration} day${duration !== 1 ? 's' : ''} (ES: Day ${task.es}, EF: Day ${task.ef})`}
                  >
                    {width >= 30 ? `${duration}d` : duration}
                  </div>
                  {isCritical && (
                    <div 
                      className="critical-indicator" 
                      title="Critical Task"
                      style={{
                        position: 'absolute',
                        right: '5px',
                        top: '5px',
                        fontSize: '14px',
                        color: '#dc2626',
                        fontWeight: 'bold',
                        zIndex: 6,
                      }}
                    >
                      ⚠
                    </div>
                  )}
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

