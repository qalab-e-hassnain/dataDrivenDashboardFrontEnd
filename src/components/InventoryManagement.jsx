import React from 'react'
import './InventoryManagement.css'

function InventoryManagement({ data }) {
  if (!data) {
    return <div className="inventory-section">Loading inventory data...</div>
  }

  const getStatusClass = (status) => {
    if (status === 'Low Stock') return 'status-low'
    if (status === 'Adequate') return 'status-adequate'
    if (status === 'Moderate') return 'status-moderate'
    return 'status-adequate'
  }

  return (
    <div className="inventory-section">
      <div className="section-header">
        <div className="section-title-wrapper">
          <span className="section-icon">📦</span>
          <h2 className="section-title">Inventory Management</h2>
        </div>
        <button className="add-button">+</button>
      </div>

      <div className="stock-legend">
        <span className="legend-title">Stock Levels:</span>
        <div className="legend-items">
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
    </div>
  )
}

export default InventoryManagement
