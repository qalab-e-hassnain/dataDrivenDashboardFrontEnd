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

  // Calculate schedule variance percentage safely
  const scheduleVariancePercent = spi < 1 
    ? Math.max(0, Math.min(100, Math.round((1 - spi) * 100))) // Clamp between 0-100%
    : 0

  // Calculate cost variance percentage safely
  const costVariancePercent = cpi > 1
    ? Math.max(0, Math.min(100, Math.round((cpi - 1) * 100))) // Clamp between 0-100%
    : 0

  const kpis = [
    {
      title: 'Schedule Performance Index (SPI)',
      value: spi,
      description: spi < 1 
        ? `↓ Behind schedule by ${scheduleVariancePercent}%`
        : spi > 1
        ? `↑ Ahead of schedule by ${Math.min(100, Math.round((spi - 1) * 100))}%`
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
        ? `↓ Over budget by ${Math.min(100, Math.round((1 - cpi) * 100))}%`
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
      description: 'High prediction accuracy',
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
