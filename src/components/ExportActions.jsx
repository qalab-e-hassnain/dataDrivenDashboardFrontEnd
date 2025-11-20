import React, { useState } from 'react'
import { apiService } from '../services/api'
import './ExportActions.css'

function ExportActions({ projectId, onExportStart, onExportComplete, onExportError }) {
  const [exporting, setExporting] = useState(null)

  const handleExport = async (type) => {
    setExporting(type)
    if (onExportStart) onExportStart(type)
    
    try {
      let blob
      let filename
      
      if (type === 'Excel') {
        blob = await apiService.exportExcelReport(projectId)
        filename = `dashboard-export-${Date.now()}.xlsx`
      } else if (type === 'PDF') {
        blob = await apiService.exportPDFReport(projectId)
        filename = `dashboard-report-${Date.now()}.pdf`
      }

      // Create download link for Excel and PDF
      if (blob) {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        if (onExportComplete) {
          onExportComplete(type, `${type} export completed successfully`)
        }
      }
    } catch (error) {
      console.error(`Error exporting to ${type}:`, error)
      const errorMessage = error.response?.data?.detail || error.message || 'Export failed'
      if (onExportError) {
        onExportError(type, errorMessage)
      }
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="export-actions">
      <button 
        className={`export-button ${exporting === 'Excel' ? 'exporting' : ''}`}
        onClick={() => handleExport('Excel')}
        disabled={exporting !== null}
      >
        📊 {exporting === 'Excel' ? 'Exporting...' : 'Export to Excel'}
      </button>
      <button 
        className={`export-button ${exporting === 'PDF' ? 'exporting' : ''}`}
        onClick={() => handleExport('PDF')}
        disabled={exporting !== null}
      >
        📄 {exporting === 'PDF' ? 'Generating...' : 'Generate PDF Report'}
      </button>
    </div>
  )
}

export default ExportActions
