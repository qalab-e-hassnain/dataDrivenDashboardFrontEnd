/**
 * Data transformation utilities to convert API responses to dashboard component formats
 */

/**
 * Transform EVM metrics to dashboard format
 */
export const transformEVMMetrics = (evmData, projectData) => {
  if (!evmData) {
    console.warn('⚠️ transformEVMMetrics: evmData is null/undefined')
    return null
  }

  // Debug: Log full EVM data structure
  console.log('📊 EVM Data from API (Full):', evmData)
  console.log('📊 EVM Data Summary:', {
    hasMonthlyProgression: !!evmData.monthly_progression,
    monthlyProgressionLength: evmData.monthly_progression?.length || 0,
    planned_value: evmData.planned_value,
    earned_value: evmData.earned_value,
    actual_cost: evmData.actual_cost,
    budget_at_completion: evmData.budget_at_completion,
    allKeys: Object.keys(evmData),
  })

  // ✅ Use monthly_progression from API (backend should provide this)
  let months = []
  let pv = []
  let ev = []
  let ac = []

  if (evmData.monthly_progression && Array.isArray(evmData.monthly_progression) && evmData.monthly_progression.length > 0) {
    // Use monthly progression data from API (values are cumulative)
    evmData.monthly_progression.forEach((monthData) => {
      months.push(monthData.month || monthData.month_name || monthData.label || 'Month')
      // Convert to millions for display (API values are in base units, e.g., 1,680,000 = 1.68M)
      pv.push((monthData.planned_value || 0) / 1000000)
      ev.push((monthData.earned_value || 0) / 1000000)
      ac.push((monthData.actual_cost || 0) / 1000000)
    })
  } else {
    // Fallback: Use current values from API root level to create at least one data point
    console.warn('⚠️ EVM API: monthly_progression not found, using current values from API')
    console.log('🔍 Fallback Values:', {
      planned_value: evmData.planned_value,
      earned_value: evmData.earned_value,
      actual_cost: evmData.actual_cost,
      budget_at_completion: evmData.budget_at_completion,
    })
    
    // Use correct field names from API (snake_case)
    const pvValue = evmData.planned_value || 0
    const evValue = evmData.earned_value || 0
    const acValue = evmData.actual_cost || 0
    
    console.log('🔍 Extracted Values (raw):', { pvValue, evValue, acValue })
    
    // Convert to millions for display (API values are in base units, e.g., 1,680,000 = 1.68M)
    const currentPV = pvValue / 1000000
    const currentEV = evValue / 1000000
    const currentAC = acValue / 1000000
    
    console.log('🔍 Converted to Millions:', { currentPV, currentEV, currentAC })
    
    // Create a single data point with current values
    months.push('Current')
    pv.push(currentPV)
    ev.push(currentEV)
    ac.push(currentAC)
    
    // If we have project start date, create progressive months
    if (projectData?.start_date) {
      const startDate = new Date(projectData.start_date)
      const currentDate = new Date()
      const monthsSinceStart = Math.max(1, Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24 * 30)))
      
      // Create progressive months leading up to current
      for (let i = 1; i < Math.min(monthsSinceStart, 8); i++) {
        months.unshift(`Month ${i}`)
        const progress = i / monthsSinceStart
        pv.unshift(currentPV * progress)
        ev.unshift(currentEV * progress)
        ac.unshift(currentAC * progress)
      }
    } else {
      // Create a few progressive months if no start date
      for (let i = 1; i < 4; i++) {
        months.unshift(`Month ${i}`)
        const progress = i / 4
        pv.unshift(currentPV * progress)
        ev.unshift(currentEV * progress)
        ac.unshift(currentAC * progress)
      }
    }
  }

  // ✅ Use correct field names from API (snake_case as per API documentation)
  const plannedValue = evmData.planned_value || 0
  const earnedValue = evmData.earned_value || 0
  const actualCost = evmData.actual_cost || 0

  console.log('🔍 Final Metrics Extracted (raw values):', { plannedValue, earnedValue, actualCost })

  return {
    months,
    pv,
    ev,
    ac,
    metrics: {
      plannedValue: plannedValue,
      earnedValue: earnedValue,
      actualCost: actualCost,
      spi: evmData.schedule_performance_index || evmData.spi || evmData.metrics?.schedule_performance_index || 0,
      cpi: evmData.cost_performance_index || evmData.cpi || evmData.metrics?.cost_performance_index || 0,
      scheduleVariance: evmData.schedule_variance || evmData.sv || evmData.metrics?.schedule_variance || 0,
      costVariance: evmData.cost_variance || evmData.cv || evmData.metrics?.cost_variance || 0,
      scheduleVariancePercentage: evmData.schedule_variance_percentage || evmData.metrics?.schedule_variance_percentage || null, // ✅ From API
      costVariancePercentage: evmData.cost_variance_percentage || evmData.metrics?.cost_variance_percentage || null, // ✅ From API
      eac: evmData.estimate_at_completion || evmData.eac || evmData.metrics?.estimate_at_completion || 0,
      etc: evmData.estimate_to_complete || evmData.etc || evmData.metrics?.estimate_to_complete || 0,
      vac: evmData.variance_at_completion || evmData.vac || evmData.metrics?.variance_at_completion || 0,
      bac: evmData.budget_at_completion || evmData.bac || evmData.metrics?.budget_at_completion || 0,
      status: evmData.status || evmData.metrics?.status || 'unknown',
    },
  }
}

/**
 * Transform workforce data to dashboard format
 * Uses actual dates from workforce entries to create proper time-series data
 */
export const transformWorkforceData = (workforceData, trendsData = null) => {
  if (!workforceData || !Array.isArray(workforceData) || workforceData.length === 0) {
    return null
  }

  // Calculate totals
  const totalWorkers = new Set(workforceData.map(w => w.worker_name)).size
  const activeWorkers = workforceData.filter(w => w.utilization_rate > 0).length
  
  // ✅ Use productivity_percentage from API (backend should provide this)
  // Calculate average productivity from API-provided productivity_percentage
  const workersWithProductivity = workforceData.filter(w => 
    w.productivity_percentage !== null && 
    w.productivity_percentage !== undefined && 
    typeof w.productivity_percentage === 'number' &&
    isFinite(w.productivity_percentage)
  )
  
  const avgProductivity = workersWithProductivity.length > 0
    ? workersWithProductivity.reduce((sum, w) => sum + (w.productivity_percentage || 0), 0) / workersWithProductivity.length
    : 0

  const avgUtilization = workforceData.reduce((sum, w) => sum + (w.utilization_rate || 0), 0) / workforceData.length

  // ✅ Use trends API if available (has daily_trends with average_productivity)
  let timeSeriesData = []
  
  if (trendsData && trendsData.daily_trends && Array.isArray(trendsData.daily_trends) && trendsData.daily_trends.length > 0) {
    // Use trends API data for time-series (most accurate)
    console.log('📊 Using workforce trends API data for time-series')
    const firstDate = new Date(trendsData.daily_trends[0].date)
    timeSeriesData = trendsData.daily_trends.map((trend, index) => {
      const date = new Date(trend.date)
      // Calculate week number from first date
      const daysDiff = Math.floor((date - firstDate) / (1000 * 60 * 60 * 24))
      const weekNum = Math.floor(daysDiff / 7) + 1
      
      return {
        date: trend.date,
        week: `Week ${weekNum}`,
        productivity: Math.round(trend.average_productivity || 0),
        utilization: Math.round(trend.average_utilization || trend.utilization || 0),
      }
    })
  } else {
    // ✅ Group by actual dates from workforce entries (dates are now spread over timeline)
    const dateGroups = new Map()
    
    workforceData.forEach(entry => {
      // Use date field (entry_date, date, or created_at)
      const entryDate = entry.entry_date || entry.date || entry.created_at
      if (!entryDate) return
      
      const dateKey = new Date(entryDate).toISOString().split('T')[0] // YYYY-MM-DD
      
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, {
          date: dateKey,
          entries: [],
        })
      }
      
      dateGroups.get(dateKey).entries.push(entry)
    })
    
    // Sort dates chronologically
    const sortedDates = Array.from(dateGroups.keys()).sort()
    
    // Calculate averages for each date
    timeSeriesData = sortedDates.map((dateKey, index) => {
      const group = dateGroups.get(dateKey)
      const entries = group.entries
      
      // Calculate average productivity from API productivity_percentage
      const entriesWithProductivity = entries.filter(e => 
        e.productivity_percentage !== null && 
        e.productivity_percentage !== undefined && 
        typeof e.productivity_percentage === 'number' &&
        isFinite(e.productivity_percentage)
      )
      
      const dateProductivity = entriesWithProductivity.length > 0
        ? entriesWithProductivity.reduce((sum, e) => sum + (e.productivity_percentage || 0), 0) / entriesWithProductivity.length
        : avgProductivity
      
      const dateUtilization = entries.length > 0
        ? entries.reduce((sum, e) => sum + (e.utilization_rate || 0), 0) / entries.length
        : avgUtilization
      
      return {
        date: dateKey,
        week: `Week ${Math.floor(index / 7) + 1}`,
        productivity: Math.round(dateProductivity),
        utilization: Math.round(dateUtilization),
      }
    })
    
    // If no dates found, fallback to weekly grouping by index
    if (timeSeriesData.length === 0) {
      console.warn('⚠️ No dates found in workforce entries, using fallback weekly grouping')
      const weeks = 7
      for (let i = 1; i <= weeks; i++) {
        const weekWorkers = workforceData.filter((w, index) => (index % weeks) === (i - 1))
        
        const weekProductivity = weekWorkers.length > 0
          ? weekWorkers
              .filter(w => w.productivity_percentage !== null && w.productivity_percentage !== undefined && typeof w.productivity_percentage === 'number' && isFinite(w.productivity_percentage))
              .reduce((sum, w) => sum + (w.productivity_percentage || 0), 0) / Math.max(1, weekWorkers.filter(w => w.productivity_percentage !== null && w.productivity_percentage !== undefined).length)
          : avgProductivity

        const weekUtilization = weekWorkers.length > 0
          ? weekWorkers.reduce((sum, w) => sum + (w.utilization_rate || 0), 0) / weekWorkers.length
          : avgUtilization

        timeSeriesData.push({
          week: `Week ${i}`,
          productivity: Math.round(weekProductivity),
          utilization: Math.round(weekUtilization),
        })
      }
    }
  }

  console.log('📊 Workforce Time-Series Data:', {
    totalEntries: workforceData.length,
    timeSeriesPoints: timeSeriesData.length,
    hasTrendsData: !!trendsData,
    avgProductivity: Math.round(avgProductivity),
  })

  return {
    total: totalWorkers,
    active: activeWorkers,
    productivity: Math.round(avgProductivity),
    utilization: Math.round(avgUtilization),
    weeklyData: timeSeriesData, // Now contains date-based time-series data
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

  // ✅ Use cost_variance_percentage from API (backend should provide this)
  let costVariance = forecastData.cost_variance_percentage || null
  // Validate cost variance percentage
  if (costVariance !== null && (typeof costVariance !== 'number' || !isFinite(costVariance))) {
    console.warn('Invalid cost_variance_percentage from API:', forecastData.cost_variance_percentage)
    costVariance = null
  }

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
    costVariance: costVariance !== null ? Math.round(costVariance) : null, // ✅ From API
    daysRemaining: daysRemaining, // ✅ Days remaining calculated from estimated_completion_date
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

  // ✅ Use schedule_variance_percentage and cost_variance_percentage from API
  let scheduleVariancePercentage = evmData?.schedule_variance_percentage ?? null
  let costVariancePercentage = evmData?.cost_variance_percentage ?? null
  
  // Validate variance percentages
  if (scheduleVariancePercentage !== null && (typeof scheduleVariancePercentage !== 'number' || !isFinite(scheduleVariancePercentage))) {
    console.warn('Invalid schedule_variance_percentage from API:', evmData?.schedule_variance_percentage)
    scheduleVariancePercentage = null
  }
  
  if (costVariancePercentage !== null && (typeof costVariancePercentage !== 'number' || !isFinite(costVariancePercentage))) {
    console.warn('Invalid cost_variance_percentage from API:', evmData?.cost_variance_percentage)
    costVariancePercentage = null
  }

  return {
    spi: spi,
    cpi: cpi,
    completion: Math.round(completion),
    aiConfidence: Math.round(aiConfidence),
    daysRemaining: daysRemaining, // ✅ Days remaining calculated from estimated_completion_date
    scheduleVariancePercentage: scheduleVariancePercentage, // ✅ From API
    costVariancePercentage: costVariancePercentage, // ✅ From API
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
