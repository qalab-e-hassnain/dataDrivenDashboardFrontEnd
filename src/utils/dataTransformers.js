/**
 * Data transformation utilities to convert API responses to dashboard component formats
 */

/**
 * Transform EVM metrics to dashboard format
 */
export const transformEVMMetrics = (evmData, projectData) => {
  if (!evmData) return null

  // Calculate monthly progression (simplified - you may need to adjust based on actual data)
  const months = []
  const pv = []
  const ev = []
  const ac = []

  // If we have project start date, calculate months
  if (projectData?.start_date) {
    const startDate = new Date(projectData.start_date)
    const currentDate = new Date()
    const monthsSinceStart = Math.max(1, Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24 * 30)))
    
    for (let i = 1; i <= Math.min(monthsSinceStart + 2, 12); i++) {
      months.push(`Month ${i}`)
      // Calculate progressive values (simplified)
      const progress = i / (monthsSinceStart + 2)
      pv.push((evmData.budget_at_completion || 0) * progress)
      ev.push((evmData.earned_value || 0) * progress)
      ac.push((evmData.actual_cost || 0) * progress)
    }
  } else {
    // Default 8 months if no dates
    for (let i = 1; i <= 8; i++) {
      months.push(`Month ${i}`)
      const progress = i / 8
      pv.push((evmData.budget_at_completion || 0) * progress)
      ev.push((evmData.earned_value || 0) * progress)
      ac.push((evmData.actual_cost || 0) * progress)
    }
  }

  return {
    months,
    pv: pv.map(v => v / 1000000000), // Convert to billions
    ev: ev.map(v => v / 1000000000),
    ac: ac.map(v => v / 1000000000),
    metrics: {
      plannedValue: evmData.planned_value || 0,
      earnedValue: evmData.earned_value || 0,
      actualCost: evmData.actual_cost || 0,
      spi: evmData.schedule_performance_index || 0,
      cpi: evmData.cost_performance_index || 0,
      scheduleVariance: evmData.schedule_variance || 0,
      costVariance: evmData.cost_variance || 0,
      eac: evmData.estimate_at_completion || 0,
      etc: evmData.estimate_to_complete || 0,
      vac: evmData.variance_at_completion || 0,
      bac: evmData.budget_at_completion || 0,
      status: evmData.status || 'unknown',
    },
  }
}

/**
 * Transform workforce data to dashboard format
 */
export const transformWorkforceData = (workforceData) => {
  if (!workforceData || !Array.isArray(workforceData) || workforceData.length === 0) {
    return null
  }

  // Calculate totals
  const totalWorkers = new Set(workforceData.map(w => w.worker_name)).size
  const activeWorkers = workforceData.filter(w => w.utilization_rate > 0).length
  
  // Calculate averages
  const avgProductivity = workforceData.reduce((sum, w) => {
    const productivity = w.hours_worked && w.hours_planned 
      ? (w.hours_worked / w.hours_planned) * 100 
      : 0
    return sum + productivity
  }, 0) / workforceData.length

  const avgUtilization = workforceData.reduce((sum, w) => sum + (w.utilization_rate || 0), 0) / workforceData.length

  // Group by week (simplified - you may need to adjust based on actual date grouping)
  const weeklyData = []
  const weeks = 7
  for (let i = 1; i <= weeks; i++) {
    const weekWorkers = workforceData.filter((w, index) => (index % weeks) === (i - 1))
    const weekProductivity = weekWorkers.length > 0
      ? weekWorkers.reduce((sum, w) => {
          const productivity = w.hours_worked && w.hours_planned 
            ? (w.hours_worked / w.hours_planned) * 100 
            : 0
          return sum + productivity
        }, 0) / weekWorkers.length
      : avgProductivity

    const weekUtilization = weekWorkers.length > 0
      ? weekWorkers.reduce((sum, w) => sum + (w.utilization_rate || 0), 0) / weekWorkers.length
      : avgUtilization

    weeklyData.push({
      week: `Week ${i}`,
      productivity: Math.round(weekProductivity),
      utilization: Math.round(weekUtilization),
    })
  }

  return {
    total: totalWorkers,
    active: activeWorkers,
    productivity: Math.round(avgProductivity),
    utilization: Math.round(avgUtilization),
    weeklyData,
    rawData: workforceData,
  }
}

/**
 * Transform inventory data to dashboard format
 */
export const transformInventoryData = (inventoryData, depletionPredictions = []) => {
  if (!inventoryData || !Array.isArray(inventoryData)) {
    return []
  }

  return inventoryData.map((item) => {
    // Determine status based on stock level and predictions
    let status = 'Adequate'
    const stockLevel = item.stock_level || 0
    const dailyUsage = item.daily_usage || 0
    
    // Find depletion prediction for this item
    const prediction = depletionPredictions.find(p => p.inventory_id === item.id)
    const daysRemaining = prediction?.days_remaining || (dailyUsage > 0 ? stockLevel / dailyUsage : 999)

    if (daysRemaining < 5) {
      status = 'Low Stock'
    } else if (daysRemaining < 15) {
      status = 'Moderate'
    }

    // Format quantity
    const quantity = item.stock_level || 0
    let quantityText = `${quantity.toLocaleString()} ${item.unit || 'units'}`
    
    // Format large numbers
    if (quantity >= 1000) {
      quantityText = `${(quantity / 1000).toFixed(1)}K ${item.unit || 'units'}`
    }

    return {
      id: item.id,
      name: item.item_name || 'Unknown Item',
      quantity: quantityText,
      status,
      stockLevel,
      dailyUsage,
      daysRemaining,
      unitCost: item.unit_cost || 0,
    }
  })
}

/**
 * Transform forecast data to dashboard format
 */
export const transformForecastData = (forecastData) => {
  if (!forecastData) return null

  // Format completion date
  const completionDate = forecastData.estimated_completion_date
    ? new Date(forecastData.estimated_completion_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A'

  // Format final cost
  const finalCost = forecastData.estimated_total_cost || 0
  const finalCostFormatted = finalCost >= 1000000000
    ? `Rs${(finalCost / 1000000000).toFixed(2)}B`
    : finalCost >= 1000000
    ? `Rs${(finalCost / 1000000).toFixed(2)}M`
    : `Rs${finalCost.toLocaleString()}`

  // Calculate cost variance percentage
  const budget = forecastData.budget || 0
  const costVariance = budget > 0
    ? ((finalCost - budget) / budget) * 100
    : 0

  // ✅ Use confidence_percentage from API (NEW FIELD)
  const confidence = forecastData.confidence_percentage || 
    (forecastData.confidence === 'high' ? 87 : forecastData.confidence === 'medium' ? 75 : 60)

  // ✅ Calculate days remaining from estimated_completion_date (more accurate)
  const calculateDaysRemaining = () => {
    if (!forecastData.estimated_completion_date) {
      return null
    }
    const now = new Date()
    const completionDate = new Date(forecastData.estimated_completion_date)
    const diffTime = completionDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const daysRemaining = calculateDaysRemaining()

  // Generate predictions based on metrics
  const predictions = []
  if (forecastData.metrics_used?.spi < 0.9) {
    predictions.push(`Schedule delay detected: SPI is ${forecastData.metrics_used.spi.toFixed(2)}`)
  }
  if (forecastData.metrics_used?.cpi < 0.9) {
    predictions.push(`Budget overrun likely: CPI is ${forecastData.metrics_used.cpi.toFixed(2)}`)
  }
  if (daysRemaining !== null && forecastData.planned_completion_date) {
    const plannedDate = new Date(forecastData.planned_completion_date)
    const estimatedDate = new Date(forecastData.estimated_completion_date)
    const delayDays = Math.ceil((estimatedDate.getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24))
    if (delayDays > 0) {
      predictions.push(`Project may be delayed by ${delayDays} days`)
    }
  }
  if (forecastData.metrics_used?.tasks_in_progress > 0) {
    predictions.push(`${forecastData.metrics_used.tasks_in_progress} tasks currently in progress`)
  }

  return {
    completionDate,
    completionConfidence: confidence,
    dataPoints: forecastData.metrics_used?.total_tasks || 0,
    finalCost: finalCostFormatted,
    costConfidence: Math.max(0, confidence - 3), // Slightly lower for cost, but not negative
    costVariance: Math.round(costVariance),
    daysRemaining: daysRemaining, // ✅ NEW: Days remaining calculated from estimated_completion_date
    predictions: predictions.length > 0 ? predictions : [
      'Resource optimization recommended',
      'Monitor critical path tasks',
      'Review workforce utilization',
      'Track inventory levels closely',
    ],
    rawData: forecastData,
  }
}

/**
 * Transform tasks to timeline format
 */
export const transformTasksToTimeline = (tasksData) => {
  if (!tasksData || !Array.isArray(tasksData)) {
    return []
  }

  return tasksData.map((task) => {
    let status = 'Not Started'
    const progress = task.completion_percentage || 0

    if (progress >= 100) {
      status = 'Complete'
    } else if (task.is_critical && progress > 0) {
      status = 'Critical'
    } else if (progress > 0) {
      status = task.status === 'in_progress' ? 'In Progress' : 'Started'
    }

    return {
      id: task.id,
      task: task.name || 'Unknown Task',
      progress: Math.round(progress),
      status,
      isCritical: task.is_critical || false,
      plannedStart: task.planned_start_date,
      plannedEnd: task.planned_end_date,
      actualStart: task.actual_start_date,
      actualEnd: task.actual_end_date,
    }
  })
}

/**
 * Transform alerts to dashboard format
 */
export const transformAlerts = (alertsData, anomaliesData = null) => {
  const alerts = []

  // Transform API alerts
  if (alertsData && Array.isArray(alertsData)) {
    alertsData.forEach((alert) => {
      // Map alert types to dashboard types
      let type = 'info'
      if (alert.severity === 'high') {
        type = alert.alert_type?.includes('delay') || alert.alert_type?.includes('critical') ? 'critical' : 'warning'
      } else if (alert.severity === 'medium') {
        type = 'warning'
      }

      alerts.push({
        id: alert.id,
        type,
        title: alert.title || 'Alert',
        message: alert.message || 'No message',
        timestamp: alert.created_at ? formatTimeAgo(alert.created_at) : 'Recently',
        isRead: alert.is_read || false,
        isResolved: alert.is_resolved || false,
        severity: alert.severity || 'medium',
      })
    })
  }

  // Add anomalies as alerts if provided
  if (anomaliesData) {
    // Workforce anomalies
    if (anomaliesData.workforce_anomalies && Array.isArray(anomaliesData.workforce_anomalies)) {
      anomaliesData.workforce_anomalies.forEach((anomaly) => {
        alerts.push({
          id: `anomaly-${anomaly.entry_id}`,
          type: anomaly.severity === 'high' ? 'critical' : 'warning',
          title: 'Workforce Anomaly Detected',
          message: anomaly.message || `${anomaly.worker_name} has ${anomaly.anomaly_type}`,
          timestamp: anomaliesData.detected_at ? formatTimeAgo(anomaliesData.detected_at) : 'Recently',
          isRead: false,
          isResolved: false,
          severity: anomaly.severity || 'medium',
        })
      })
    }

    // Inventory anomalies
    if (anomaliesData.inventory_anomalies && Array.isArray(anomaliesData.inventory_anomalies)) {
      anomaliesData.inventory_anomalies.forEach((anomaly) => {
        alerts.push({
          id: `anomaly-${anomaly.entry_id}`,
          type: anomaly.severity === 'high' ? 'critical' : 'warning',
          title: 'Inventory Anomaly Detected',
          message: anomaly.message || `${anomaly.item_name} has ${anomaly.anomaly_type}`,
          timestamp: anomaliesData.detected_at ? formatTimeAgo(anomaliesData.detected_at) : 'Recently',
          isRead: false,
          isResolved: false,
          severity: anomaly.severity || 'medium',
        })
      })
    }
  }

  // Sort by severity and timestamp (most recent first)
  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    if (severityOrder[a.type] !== severityOrder[b.type]) {
      return severityOrder[a.type] - severityOrder[b.type]
    }
    return new Date(b.timestamp) - new Date(a.timestamp)
  })
}

/**
 * Transform project data to KPI format
 */
export const transformKPIData = (evmData, forecastData, projectData) => {
  if (!evmData && !forecastData && !projectData) {
    return null
  }

  let spi = evmData?.schedule_performance_index || 0
  let cpi = evmData?.cost_performance_index || 0
  
  // Validate and clamp SPI (should be between 0 and 2, typically 0.5 to 1.5)
  if (typeof spi !== 'number' || !isFinite(spi) || spi < 0 || spi > 2) {
    console.warn('Invalid SPI value from API:', evmData?.schedule_performance_index, 'Using 0.92 as default')
    spi = 0.92
  }
  
  // Validate and clamp CPI (should be between 0 and 2, typically 0.5 to 1.5)
  if (typeof cpi !== 'number' || !isFinite(cpi) || cpi < 0 || cpi > 2) {
    console.warn('Invalid CPI value from API:', evmData?.cost_performance_index, 'Using 1.05 as default')
    cpi = 1.05
  }
  
  // Calculate completion percentage
  const completion = projectData?.current_completion_percentage 
    || (forecastData?.current_completion_percentage) 
    || 0

  // ✅ Use confidence_percentage from API (NEW FIELD)
  let aiConfidence = forecastData?.confidence_percentage || 75
  // Fallback to string-based calculation if confidence_percentage is not available
  if (!forecastData?.confidence_percentage) {
    if (forecastData?.confidence === 'high') {
      aiConfidence = 87
    } else if (forecastData?.confidence === 'medium') {
      aiConfidence = 75
    } else if (forecastData?.metrics_used?.total_tasks > 10) {
      aiConfidence = 80
    }
  }
  
  // Validate confidence is within reasonable range
  if (aiConfidence < 0 || aiConfidence > 100 || !isFinite(aiConfidence)) {
    console.warn('Invalid confidence_percentage:', forecastData?.confidence_percentage, 'Using default 75')
    aiConfidence = 75
  }

  // ✅ Calculate days remaining from estimated_completion_date
  const calculateDaysRemaining = () => {
    if (!forecastData?.estimated_completion_date) {
      return null
    }
    const now = new Date()
    const completionDate = new Date(forecastData.estimated_completion_date)
    const diffTime = completionDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const daysRemaining = calculateDaysRemaining()

  return {
    spi: spi,
    cpi: cpi,
    completion: Math.round(completion),
    aiConfidence: Math.round(aiConfidence),
    daysRemaining: daysRemaining, // ✅ NEW: Days remaining calculated from estimated_completion_date
  }
}

/**
 * Format time ago helper
 */
const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Recently'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
  } catch (error) {
    return 'Recently'
  }
}
