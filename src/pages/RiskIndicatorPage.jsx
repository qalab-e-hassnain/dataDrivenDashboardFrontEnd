import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import RiskIndicatorDashboard from '../components/RiskIndicatorDashboard'
import './RiskIndicatorPage.css'

function RiskIndicatorPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!projectId) {
      navigate('/')
    }
  }, [projectId, navigate])

  const handleProjectChange = (newProjectId) => {
    if (newProjectId) {
      navigate(`/risk-indicators/${newProjectId}`)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="risk-indicator-page">
      <Header 
        projectId={projectId} 
        onProjectChange={handleProjectChange}
        onRefresh={() => window.location.reload()}
        refreshing={false}
      />
      <div className="page-content">
        <div className="page-header">
          <button 
            className="back-button"
            onClick={() => navigate(`/project/${projectId}`)}
          >
            ← Back to Dashboard
          </button>
          <h1 className="page-title">Time-based Risk Indicators</h1>
        </div>
        <div className="risk-indicator-container">
          <RiskIndicatorDashboard projectId={projectId} />
        </div>
      </div>
    </div>
  )
}

export default RiskIndicatorPage

