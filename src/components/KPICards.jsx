import React from 'react'
import './KPICards.css'

function KPICards({ data }) {
  if (!data) {
    return <div>Loading KPI data...</div>
  }

  // Round values to 2 decimal places and validate ranges
  let spi = typeof data.spi === 'number' ? parseFloat(data.spi.toFixed(2)) : 0.92
  // Validate SPI range (typically 0 to 2, but clamp to reasonable values)
  if (spi < 0 || spi > 2 || !isFinite(spi)) {
    console.warn('Invalid SPI value:', data.spi, 'Using default 0.92')
    spi = 0.92
  }
  
  let cpi = typeof data.cpi === 'number' ? parseFloat(data.cpi.toFixed(2)) : 1.05
  // Validate CPI range
  if (cpi < 0 || cpi > 2 || !isFinite(cpi)) {
    console.warn('Invalid CPI value:', data.cpi, 'Using default 1.05')
    cpi = 1.05
  }
  
  const completion = Math.round(data.completion || 68)
  const aiConfidence = Math.round(data.aiConfidence || 87)

  // Dynamic description based on actual confidence from API (not hardcoded "High")
  const aiConfidenceDescription =
    aiConfidence >= 75
      ? 'High prediction accuracy'
      : aiConfidence >= 50
        ? 'Moderate prediction accuracy'
        : 'Low prediction accuracy — use with caution'

  // ✅ Use schedule_delay_percentage (preferred) or schedule_variance_percentage from API
  // schedule_delay_percentage = (1 - SPI) × 100, which correctly shows "behind schedule" percentage
  let scheduleDelayPercent = data.scheduleDelayPercentage
  
  // If schedule_delay_percentage is not available, fall back to schedule_variance_percentage
  if (scheduleDelayPercent === null || scheduleDelayPercent === undefined) {
    scheduleDelayPercent = data.scheduleVariancePercentage
  }
  
  // Validate and clamp schedule delay percentage
  if (scheduleDelayPercent === null || scheduleDelayPercent === undefined) {
    // Fallback: Calculate from SPI if API doesn't provide it (for backward compatibility)
    scheduleDelayPercent = spi < 1 
      ? Math.max(0, Math.min(100, Math.round((1 - spi) * 100)))
      : 0
  } else if (typeof scheduleDelayPercent !== 'number' || !isFinite(scheduleDelayPercent)) {
    console.warn('Invalid scheduleDelayPercentage:', data.scheduleDelayPercentage, 'Using fallback')
    scheduleDelayPercent = spi < 1 ? Math.max(0, Math.min(100, Math.round((1 - spi) * 100))) : 0
  } else {
    // Clamp to 0-100% range for safety
    scheduleDelayPercent = Math.max(0, Math.min(100, Math.round(scheduleDelayPercent)))
  }

  // ✅ Use cost_variance_percentage from API (backend should provide this)
  let costVariancePercent = data.costVariancePercentage
  // Validate and clamp cost variance percentage
  if (costVariancePercent === null || costVariancePercent === undefined) {
    // Fallback: Calculate from CPI if API doesn't provide it (for backward compatibility)
    costVariancePercent = cpi > 1
      ? Math.max(0, Math.min(100, Math.round((cpi - 1) * 100)))
      : 0
  } else if (typeof costVariancePercent !== 'number' || !isFinite(costVariancePercent)) {
    console.warn('Invalid costVariancePercentage:', data.costVariancePercentage, 'Using fallback')
    costVariancePercent = cpi > 1 ? Math.max(0, Math.min(100, Math.round((cpi - 1) * 100))) : 0
  } else {
    // Clamp to 0-100% range for safety
    costVariancePercent = Math.max(0, Math.min(100, Math.round(costVariancePercent)))
  }

  const kpis = [
    {
      title: 'Schedule Performance Index (SPI)',
      value: spi,
      description: spi < 1 
        ? `↓ Behind schedule by ${scheduleDelayPercent}%`
        : spi > 1
        ? `↑ Ahead of schedule by ${Math.max(0, Math.min(100, Math.round((spi - 1) * 100)))}%`
        : '✓ On schedule',
      icon: '📊',
      gradient: 'purple',
    },
    {
      title: 'Cost Performance Index (CPI)',
      value: cpi,
      description: cpi > 1
        ? `↑ Under budget by ${costVariancePercent}%`
        : cpi < 1
        ? `↓ Over budget by ${Math.max(0, Math.min(100, costVariancePercent < 0 ? Math.abs(costVariancePercent) : Math.round((1 - cpi) * 100)))}%`
        : '✓ On budget',
      icon: '💵',
      gradient: 'green',
    },
    {
      title: 'Project Completion',
      value: `${completion}%`,
      description: data.daysRemaining !== null && data.daysRemaining !== undefined
        ? `${data.daysRemaining} days remaining`
        : 'Completion date not available',
      icon: '🕐',
      gradient: 'blue',
    },
    {
      title: 'AI Confidence Score',
      value: `${aiConfidence}%`,
      description: aiConfidenceDescription,
      icon: '🧠',
      gradient: 'pink',
    },
  ]

  return (
    <div className="kpi-cards-container">
      {kpis.map((kpi, index) => (
        <div key={index} className={`kpi-card kpi-card-${kpi.gradient}`}>
          <div className="kpi-header">
            <span className="kpi-icon">{kpi.icon}</span>
            <h3 className="kpi-title">{kpi.title}</h3>
          </div>
          <div className="kpi-value">{kpi.value}</div>
          <div className="kpi-description">{kpi.description}</div>
        </div>
      ))}
    </div>
  )
}

export default KPICards
