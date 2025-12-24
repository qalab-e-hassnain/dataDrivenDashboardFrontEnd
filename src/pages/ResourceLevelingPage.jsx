import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import ResourceLeveling from '../components/ResourceLeveling'
import './ResourceLevelingPage.css'

function ResourceLevelingPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!projectId) {
      navigate('/')
    }
  }, [projectId, navigate])

  const handleProjectChange = (newProjectId) => {
    if (newProjectId) {
      navigate(`/resource-leveling/${newProjectId}`)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="resource-leveling-page">
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
          <h1 className="page-title">Resource Leveling</h1>
        </div>
        <div className="resource-leveling-container">
          <ResourceLeveling projectId={projectId} />
        </div>
      </div>
    </div>
  )
}

export default ResourceLevelingPage

