import React from 'react'
import './LoadingSkeleton.css'

export function CardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-subtitle"></div>
      </div>
      <div className="skeleton-content">
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line short"></div>
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-chart">
        <div className="skeleton-bar" style={{ height: '60%' }}></div>
        <div className="skeleton-bar" style={{ height: '80%' }}></div>
        <div className="skeleton-bar" style={{ height: '45%' }}></div>
        <div className="skeleton-bar" style={{ height: '70%' }}></div>
        <div className="skeleton-bar" style={{ height: '90%' }}></div>
        <div className="skeleton-bar" style={{ height: '55%' }}></div>
        <div className="skeleton-bar" style={{ height: '75%' }}></div>
        <div className="skeleton-bar" style={{ height: '65%' }}></div>
      </div>
    </div>
  )
}

export function KPISkeleton() {
  return (
    <div className="kpi-skeleton-container">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="skeleton-kpi-card">
          <div className="skeleton-kpi-header">
            <div className="skeleton-icon"></div>
            <div className="skeleton-kpi-title"></div>
          </div>
          <div className="skeleton-kpi-value"></div>
          <div className="skeleton-kpi-desc"></div>
        </div>
      ))}
    </div>
  )
}
