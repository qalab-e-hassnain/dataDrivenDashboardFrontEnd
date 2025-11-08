import React from 'react'
import './KPICards.css'

function KPICards({ data }) {
  if (!data) {
    return <div>Loading KPI data...</div>
  }

  // Round values to 2 decimal places
  const spi = typeof data.spi === 'number' ? parseFloat(data.spi.toFixed(2)) : 0.92
  const cpi = typeof data.cpi === 'number' ? parseFloat(data.cpi.toFixed(2)) : 1.05
  const completion = Math.round(data.completion || 68)
  const aiConfidence = Math.round(data.aiConfidence || 87)

  const kpis = [
    {
      title: 'Schedule Performance Index (SPI)',
      value: spi,
      description: `↓ Behind schedule by ${Math.round((1 - spi) * 100)}%`,
      icon: '📊',
      gradient: 'purple',
    },
    {
      title: 'Cost Performance Index (CPI)',
      value: cpi,
      description: `↑ Under budget by ${Math.round((cpi - 1) * 100)}%`,
      icon: '💵',
      gradient: 'green',
    },
    {
      title: 'Project Completion',
      value: `${completion}%`,
      description: `${data.daysRemaining || 32} days remaining`,
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
