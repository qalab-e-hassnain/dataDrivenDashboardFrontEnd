import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './EVMSection.css'

function EVMSection({ data }) {
  if (!data) {
    return <div className="evm-section">Loading EVM data...</div>
  }

  const chartData = data.months.map((month, index) => ({
    month,
    'Planned Value (PV)': data.pv[index],
    'Earned Value (EV)': data.ev[index],
    'Actual Cost (AC)': data.ac[index],
  }))

  // Round values to 2 decimal places
  const pv = typeof data.pv[data.pv.length - 1] === 'number' 
    ? parseFloat(data.pv[data.pv.length - 1].toFixed(2)) 
    : 0
  const ev = typeof data.ev[data.ev.length - 1] === 'number' 
    ? parseFloat(data.ev[data.ev.length - 1].toFixed(2)) 
    : 0
  const ac = typeof data.ac[data.ac.length - 1] === 'number' 
    ? parseFloat(data.ac[data.ac.length - 1].toFixed(2)) 
    : 0

  return (
    <div className="evm-section">
      <div className="section-header">
        <div className="section-title-wrapper">
          <span className="section-icon">💼</span>
          <h2 className="section-title">Earned Value Management (EVM)</h2>
        </div>
      </div>
      
      <div className="evm-chart-container">
        <h3 className="chart-title">Cumulative Cost & Value (in Billions PKR)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 60, bottom: 65 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="month" 
              stroke="#666"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#666"
              label={{ value: 'Billions PKR', angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle' } }}
              domain={[0, 'dataMax + 0.2']}
              tickFormatter={(value) => `₨${parseFloat(value.toFixed(2))}B`}
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (typeof value === 'number') {
                  const formattedValue = parseFloat(value.toFixed(2))
                  return [`₨${formattedValue}B`, name]
                }
                return [value, name]
              }}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }}
              labelStyle={{ marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}
              itemStyle={{ fontSize: '12px', padding: '2px 0' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '5px', paddingBottom: '0' }}
              iconType="line"
              verticalAlign="bottom"
              height={36}
            />
            <Line 
              type="monotone" 
              dataKey="Planned Value (PV)" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="Earned Value (EV)" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="Actual Cost (AC)" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="evm-summary-cards">
        <div className="evm-summary-card pv-card">
          <div className="evm-summary-label">Planned Value (PV)</div>
          <div className="evm-summary-value">₨{pv}B</div>
        </div>
        <div className="evm-summary-card ev-card">
          <div className="evm-summary-label">Earned Value (EV)</div>
          <div className="evm-summary-value">₨{ev}B</div>
        </div>
        <div className="evm-summary-card ac-card">
          <div className="evm-summary-label">Actual Cost (AC)</div>
          <div className="evm-summary-value">₨{ac}B</div>
        </div>
      </div>
    </div>
  )
}

export default EVMSection
