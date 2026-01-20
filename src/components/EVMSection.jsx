import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './EVMSection.css'

function EVMSection({ data }) {
  if (!data) {
    return <div className="evm-section">Loading EVM data...</div>
  }

  // Smart formatter: use thousands or actual values for small amounts
  const formatValue = (value) => {
    if (value === null || value === undefined || isNaN(value)) return { value: 0, unit: '', display: '₨0' }
    
    const absValue = Math.abs(value)
    
    // If value is less than 0.1 million (100,000), show in thousands
    if (absValue < 0.1) {
      const inThousands = value * 1000
      return {
        value: parseFloat(inThousands.toFixed(2)),
        unit: 'K',
        display: `₨${inThousands.toFixed(2)}K`
      }
    }
    // If value is less than 1 million, show with more decimals
    else if (absValue < 1) {
      return {
        value: parseFloat(value.toFixed(3)),
        unit: 'M',
        display: `₨${value.toFixed(3)}M`
      }
    }
    // Otherwise show in millions with 2 decimals
    else {
      return {
        value: parseFloat(value.toFixed(2)),
        unit: 'M',
        display: `₨${value.toFixed(2)}M`
      }
    }
  }

  // Determine the best unit based on max value
  const maxValue = Math.max(
    ...(data.pv || []),
    ...(data.ev || []),
    ...(data.ac || []),
    data.metrics?.plannedValue ? data.metrics.plannedValue / 1000000 : 0,
    data.metrics?.earnedValue ? data.metrics.earnedValue / 1000000 : 0,
    data.metrics?.actualCost ? data.metrics.actualCost / 1000000 : 0
  )
  
  const useThousands = maxValue < 0.1
  const useMoreDecimals = maxValue < 1

  const chartData = data.months.map((month, index) => ({
    month,
    'Planned Value (PV)': useThousands ? (data.pv[index] || 0) * 1000 : (data.pv[index] || 0),
    'Earned Value (EV)': useThousands ? (data.ev[index] || 0) * 1000 : (data.ev[index] || 0),
    'Actual Cost (AC)': useThousands ? (data.ac[index] || 0) * 1000 : (data.ac[index] || 0),
  }))

  // Get raw values from metrics or chart data
  const rawPv = data.metrics?.plannedValue 
    ? data.metrics.plannedValue / 1000000
    : (data.pv && data.pv.length > 0 && typeof data.pv[data.pv.length - 1] === 'number')
    ? data.pv[data.pv.length - 1]
    : 0
    
  const rawEv = data.metrics?.earnedValue
    ? data.metrics.earnedValue / 1000000
    : (data.ev && data.ev.length > 0 && typeof data.ev[data.ev.length - 1] === 'number')
    ? data.ev[data.ev.length - 1]
    : 0
    
  const rawAc = data.metrics?.actualCost
    ? data.metrics.actualCost / 1000000
    : (data.ac && data.ac.length > 0 && typeof data.ac[data.ac.length - 1] === 'number')
    ? data.ac[data.ac.length - 1]
    : 0

  const pvFormatted = formatValue(rawPv)
  const evFormatted = formatValue(rawEv)
  const acFormatted = formatValue(rawAc)

  return (
    <div className="evm-section">
      <div className="section-header">
        <div className="section-title-wrapper">
          <span className="section-icon">💼</span>
          <h2 className="section-title">Earned Value Management (EVM)</h2>
        </div>
      </div>
      
      <div className="evm-chart-container">
        <h3 className="chart-title">
          Cumulative Cost & Value {useThousands ? '(in Thousands PKR)' : useMoreDecimals ? '(in Millions PKR)' : '(in Millions PKR)'}
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 85, bottom: 65 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="month" 
              stroke="#666"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#666"
              label={{ 
                value: useThousands ? 'Thousands PKR' : 'Millions PKR', 
                angle: -90, 
                position: 'insideLeft', 
                offset: -10,
                style: { textAnchor: 'middle', fontSize: 12 } 
              }}
              domain={[0, 'dataMax + 0.2']}
              tickFormatter={(value) => {
                if (useThousands) {
                  return `₨${parseFloat(value.toFixed(1))}K`
                } else if (useMoreDecimals) {
                  return `₨${parseFloat(value.toFixed(3))}M`
                } else {
                  return `₨${parseFloat(value.toFixed(2))}M`
                }
              }}
              tick={{ fontSize: 11 }}
              width={75}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (typeof value === 'number') {
                  if (useThousands) {
                    return [`₨${parseFloat(value.toFixed(1))}K`, name]
                  } else if (useMoreDecimals) {
                    return [`₨${parseFloat(value.toFixed(3))}M`, name]
                  } else {
                    return [`₨${parseFloat(value.toFixed(2))}M`, name]
                  }
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
          <div className="evm-summary-value">{pvFormatted.display}</div>
        </div>
        <div className="evm-summary-card ev-card">
          <div className="evm-summary-label">Earned Value (EV)</div>
          <div className="evm-summary-value">{evFormatted.display}</div>
        </div>
        <div className="evm-summary-card ac-card">
          <div className="evm-summary-label">Actual Cost (AC)</div>
          <div className="evm-summary-value">{acFormatted.display}</div>
        </div>
      </div>
    </div>
  )
}

export default EVMSection
