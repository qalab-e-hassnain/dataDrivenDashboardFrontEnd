import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import './InventoryManagement.css'

function InventoryManagement({ data, projectId, thresholds, thresholdsExplanation }) {
  const [showThresholdsModal, setShowThresholdsModal] = useState(false)
  const [editingThresholds, setEditingThresholds] = useState({
    low_stock_threshold: thresholds?.low_stock_threshold || 10.0,
    critical_stock_threshold: thresholds?.critical_stock_threshold || 5.0,
    daily_usage_percentage_threshold: thresholds?.daily_usage_percentage_threshold || 0.1,
  })
  const [savingThresholds, setSavingThresholds] = useState(false)
  const [thresholdsError, setThresholdsError] = useState(null)
  const [thresholdsSuccess, setThresholdsSuccess] = useState(null)

  // Update editing thresholds when thresholds prop changes
  useEffect(() => {
    if (thresholds) {
      setEditingThresholds({
        low_stock_threshold: thresholds.low_stock_threshold || 10.0,
        critical_stock_threshold: thresholds.critical_stock_threshold || 5.0,
        daily_usage_percentage_threshold: thresholds.daily_usage_percentage_threshold || 0.1,
      })
    }
  }, [thresholds])

  if (!data) {
    return <div className="inventory-section">Loading inventory data...</div>
  }

  const getStatusClass = (status) => {
    if (status === 'Critical Stock') return 'status-critical'
    if (status === 'Low Stock') return 'status-low'
    if (status === 'High Usage') return 'status-high-usage'
    if (status === 'Adequate') return 'status-adequate'
    if (status === 'Moderate') return 'status-moderate'
    return 'status-adequate'
  }

  const handleUpdateThresholds = async () => {
    if (!projectId) {
      setThresholdsError('Project ID is required')
      return
    }

    setSavingThresholds(true)
    setThresholdsError(null)
    setThresholdsSuccess(null)

    try {
      await apiService.updateInventoryThresholds(projectId, editingThresholds)
      setThresholdsSuccess('Thresholds updated successfully!')
      // Refresh the page data by reloading (or trigger parent refresh)
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('Error updating thresholds:', error)
      setThresholdsError(error.response?.data?.detail || error.message || 'Failed to update thresholds')
    } finally {
      setSavingThresholds(false)
    }
  }

  return (
    <div className="inventory-section">
      <div className="section-header">
        <div className="section-title-wrapper">
          <h2 className="section-title">Inventory Management</h2>
        </div>
        {projectId && (
          <button 
            className="thresholds-button"
            onClick={() => {
              setShowThresholdsModal(true)
              setThresholdsError(null)
              setThresholdsSuccess(null)
            }}
            title="Configure inventory thresholds"
          >
            ⚙️ Thresholds
          </button>
        )}
      </div>

      {thresholds && (
        <div className="thresholds-info">
          <div className="thresholds-summary">
            <span className="thresholds-label">Current Thresholds:</span>
            <span className="threshold-value">Low: {thresholds.low_stock_threshold}</span>
            <span className="threshold-value">Critical: {thresholds.critical_stock_threshold}</span>
            <span className="threshold-value">Daily Usage: {(thresholds.daily_usage_percentage_threshold * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      <div className="stock-legend">
        <span className="legend-title">Stock Levels:</span>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-indicator status-critical"></span>
            <span className="legend-label">Critical</span>
          </div>
          <div className="legend-item">
            <span className="legend-indicator status-low"></span>
            <span className="legend-label">Low Stock</span>
          </div>
          <div className="legend-item">
            <span className="legend-indicator status-moderate"></span>
            <span className="legend-label">Moderate</span>
          </div>
          <div className="legend-item">
            <span className="legend-indicator status-adequate"></span>
            <span className="legend-label">Adequate</span>
          </div>
        </div>
      </div>

      <div className="inventory-list">
        {data.map((item, index) => (
          <div key={index} className="inventory-item">
            <div className="inventory-item-content">
              <div className="inventory-item-name">{item.name}</div>
            </div>
            <div className="inventory-stats">
              <span>{item.quantity}</span>
              <span className={`inventory-status ${getStatusClass(item.status)}`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showThresholdsModal && (
        <div className="modal-overlay" onClick={() => {
          setShowThresholdsModal(false)
          setThresholdsError(null)
          setThresholdsSuccess(null)
        }}>
          <div className="modal-content thresholds-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Inventory Thresholds Configuration</h3>
              <button className="modal-close" onClick={() => {
                setShowThresholdsModal(false)
                setThresholdsError(null)
                setThresholdsSuccess(null)
              }}>×</button>
            </div>
            <div className="modal-body">
              {thresholdsExplanation && (
                <div className="thresholds-explanation">
                  <h4>How Thresholds Work:</h4>
                  <ul>
                    <li><strong>Low Stock Threshold:</strong> {thresholdsExplanation.low_stock_threshold}</li>
                    <li><strong>Critical Stock Threshold:</strong> {thresholdsExplanation.critical_stock_threshold}</li>
                    <li><strong>Daily Usage Percentage Threshold:</strong> {thresholdsExplanation.daily_usage_percentage_threshold}</li>
                  </ul>
                </div>
              )}
              
              <div className="thresholds-form">
                <div className="form-group">
                  <label htmlFor="low_stock_threshold">
                    Low Stock Threshold
                    <span className="help-text">(Alert when stock_level &lt; this value)</span>
                  </label>
                  <input
                    type="number"
                    id="low_stock_threshold"
                    min="0"
                    step="0.1"
                    value={editingThresholds.low_stock_threshold}
                    onChange={(e) => setEditingThresholds({
                      ...editingThresholds,
                      low_stock_threshold: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="critical_stock_threshold">
                    Critical Stock Threshold
                    <span className="help-text">(High severity alert when stock_level &lt; this value)</span>
                  </label>
                  <input
                    type="number"
                    id="critical_stock_threshold"
                    min="0"
                    step="0.1"
                    value={editingThresholds.critical_stock_threshold}
                    onChange={(e) => setEditingThresholds({
                      ...editingThresholds,
                      critical_stock_threshold: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="daily_usage_percentage_threshold">
                    Daily Usage Percentage Threshold
                    <span className="help-text">(Alert when daily_usage &gt; stock_level × this percentage, e.g., 0.1 = 10%)</span>
                  </label>
                  <input
                    type="number"
                    id="daily_usage_percentage_threshold"
                    min="0"
                    max="1"
                    step="0.01"
                    value={editingThresholds.daily_usage_percentage_threshold}
                    onChange={(e) => setEditingThresholds({
                      ...editingThresholds,
                      daily_usage_percentage_threshold: parseFloat(e.target.value) || 0
                    })}
                  />
                  <div className="percentage-display">
                    {(editingThresholds.daily_usage_percentage_threshold * 100).toFixed(1)}%
                  </div>
                </div>

                {thresholdsError && (
                  <div className="form-error">{thresholdsError}</div>
                )}

                {thresholdsSuccess && (
                  <div className="form-success">{thresholdsSuccess}</div>
                )}

                <div className="form-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowThresholdsModal(false)
                      setThresholdsError(null)
                      setThresholdsSuccess(null)
                    }}
                    disabled={savingThresholds}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleUpdateThresholds}
                    disabled={savingThresholds}
                  >
                    {savingThresholds ? 'Saving...' : 'Save Thresholds'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryManagement
