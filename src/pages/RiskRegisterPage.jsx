import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import RiskRegister from '../components/RiskRegister'
import './RiskRegisterPage.css'

function RiskRegisterPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!projectId) {
      navigate('/')
    }
  }, [projectId, navigate])

  const handleProjectChange = (newProjectId) => {
    if (newProjectId) {
      navigate(`/risk-register/${newProjectId}`)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="risk-register-page">
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
          <h1 className="page-title">Risk Register</h1>
        </div>
        <div className="risk-register-container">
          <RiskRegister projectId={projectId} />
        </div>
      </div>
    </div>
  )
}

export default RiskRegisterPage

