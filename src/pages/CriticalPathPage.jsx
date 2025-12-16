import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import CriticalPathView from '../components/CriticalPathView'
import './CriticalPathPage.css'

function CriticalPathPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!projectId) {
      navigate('/')
    }
  }, [projectId, navigate])

  const handleProjectChange = (newProjectId) => {
    if (newProjectId) {
      navigate(`/critical-path/${newProjectId}`)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="critical-path-page">
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
          <h1 className="page-title">Critical Path Analysis</h1>
        </div>
        <div className="critical-path-container">
          <CriticalPathView projectId={projectId} />
        </div>
      </div>
    </div>
  )
}

export default CriticalPathPage

