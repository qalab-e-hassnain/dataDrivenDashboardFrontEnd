import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './WorkforceAnalytics.css'

function WorkforceAnalytics({ data }) {
  if (!data) {
    return <div className="workforce-section">Loading workforce data...</div>
  }

  const metrics = [
    { label: 'Total Workforce', value: Math.round(data.total || 247) },
    { label: 'Active Workers', value: Math.round(data.active || 203) },
    { label: 'Avg. Productivity', value: `${Math.round(data.productivity || 87)}%` },
    { label: 'Utilization Rate', value: `${Math.round(data.utilization || 92)}%` },
  ]

  // Ensure we have valid chart data
  const chartData = data.weeklyData && data.weeklyData.length > 0 
    ? data.weeklyData 
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
          <span className="section-icon">👷</span>
          <h2 className="section-title">Workforce Analytics</h2>
          <span className="ai-tag">AI POWERED</span>
        </div>
        <div className="card-actions">
          <button className="icon-btn" title="Filter">🔍</button>
          <button className="icon-btn" title="Export">📥</button>
        </div>
      </div>

      <div className="workforce-metrics">
        {metrics.map((metric, index) => (
          <div key={index} className="workforce-metric-card">
            <div className="metric-value">{metric.value}</div>
            <div className="metric-label">{metric.label}</div>
            <div className="metric-progress-bar">
              <div 
                className="metric-progress-fill" 
                style={{ width: `${typeof metric.value === 'number' ? Math.min((metric.value / 300) * 100, 100) : Math.min(parseInt(metric.value), 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="workforce-chart-container">
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 60, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="week" 
              stroke="#666"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#666"
              domain={[80, 100]}
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
    </div>
  )
}

export default WorkforceAnalytics
