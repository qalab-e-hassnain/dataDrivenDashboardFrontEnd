import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import GanttChart from '../components/GanttChart'
import './GanttChartPage.css'

function GanttChartPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!projectId) {
      navigate('/')
    }
  }, [projectId, navigate])

  const handleProjectChange = (newProjectId) => {
    if (newProjectId) {
      navigate(`/gantt-chart/${newProjectId}`)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="gantt-chart-page">
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
          <h1 className="page-title">Gantt Chart</h1>
        </div>
        <div className="gantt-chart-container">
          <GanttChart projectId={projectId} />
        </div>
      </div>
    </div>
  )
}

export default GanttChartPage

