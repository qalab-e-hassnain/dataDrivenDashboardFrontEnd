import React from 'react'
import './AIForecasting.css'

function AIForecasting({ data }) {
  if (!data) {
    return <div className="ai-forecasting-section">Loading AI forecasts...</div>
  }

  return (
    <div className="ai-forecasting-section">
      <div className="section-header">
        <div className="section-title-wrapper">
          <span className="section-icon">🧠</span>
          <h2 className="section-title">AI Forecasting & Predictions</h2>
        </div>
        <span className="ml-tag">MACHINE LEARNING</span>
      </div>

      <div className="forecast-cards">
        <div className="forecast-card completion-card">
          <div className="forecast-card-title">Predicted Completion Date</div>
          <div className="forecast-card-value">{data.completionDate || 'Feb 18, 2026'}</div>
          <div className="forecast-card-details">
            <div className="forecast-detail-item">
              <span className="detail-icon">⚡</span>
              <span>Confidence: {Math.round(data.completionConfidence || 87)}%</span>
            </div>
            <div className="forecast-detail-item">
              <span className="detail-icon">📊</span>
              <span>Based on {Math.round(data.dataPoints || 1247).toLocaleString()} data points</span>
            </div>
          </div>
        </div>

        <div className="forecast-card cost-card">
          <div className="forecast-card-title">Forecasted Final Cost</div>
          <div className="forecast-card-value">{data.finalCost || '₨1.95B'}</div>
          <div className="forecast-card-details">
            <div className="forecast-detail-item">
              <span className="detail-icon">⚡</span>
              <span>Confidence: {Math.round(data.costConfidence || 84)}%</span>
            </div>
            <div className="forecast-detail-item">
              <span className="detail-icon">📈</span>
              <span>{Math.round(data.costVariance || 3)}% over initial budget</span>
            </div>
          </div>
        </div>
      </div>

      <div className="key-predictions">
        <div className="predictions-header">
          <span className="predictions-icon">🎯</span>
          <h3 className="predictions-title">Key Predictions</h3>
        </div>
        <div className="predictions-list">
          {(data.predictions || []).slice(0, 5).map((prediction, index) => (
            <div key={index} className="prediction-item">
              {prediction}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AIForecasting
