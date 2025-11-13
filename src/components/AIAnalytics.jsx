import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import AIRecommendations from './AIRecommendations'
import ProjectInsights from './ProjectInsights'
import ActionPlan from './ActionPlan'
import './AIAnalytics.css'

function AIAnalytics({ projectId }) {
  const [activeTab, setActiveTab] = useState('recommendations')
  const [recommendations, setRecommendations] = useState([])
  const [insights, setInsights] = useState(null)
  const [actionPlan, setActionPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('AIAnalytics: useEffect triggered with projectId:', projectId)
    if (projectId) {
      console.log('AIAnalytics: Fetching data for project:', projectId)
      fetchAllData()
    } else {
      console.log('AIAnalytics: No projectId, skipping fetch')
    }
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAllData = async () => {
    console.log('AIAnalytics: Starting fetchAllData for project:', projectId)
    setLoading(true)
    setError(null)

    try {
      console.log('AIAnalytics: Calling API endpoints...')
      // Fetch all three endpoints in parallel
      const [recsData, insightsData, planData] = await Promise.allSettled([
        apiService.getRecommendations(projectId, 'ai'),
        apiService.getProjectInsights(projectId),
        apiService.getActionPlan(projectId),
      ])

      console.log('AIAnalytics: API responses:', {
        recommendations: recsData.status,
        insights: insightsData.status,
        actionPlan: planData.status
      })

      // Handle recommendations
      if (recsData.status === 'fulfilled') {
        console.log('AIAnalytics: Recommendations data:', recsData.value)
        setRecommendations(recsData.value?.recommendations || [])
      } else {
        console.warn('AIAnalytics: Failed to fetch recommendations:', recsData.reason)
      }

      // Handle insights
      if (insightsData.status === 'fulfilled') {
        console.log('AIAnalytics: Insights data:', insightsData.value)
        setInsights(insightsData.value)
      } else {
        console.warn('AIAnalytics: Failed to fetch insights:', insightsData.reason)
      }

      // Handle action plan
      if (planData.status === 'fulfilled') {
        console.log('AIAnalytics: Action plan data:', planData.value)
        setActionPlan(planData.value)
      } else {
        console.warn('AIAnalytics: Failed to fetch action plan:', planData.reason)
      }

      // If all failed, show error
      if (recsData.status === 'rejected' && insightsData.status === 'rejected' && planData.status === 'rejected') {
        console.error('AIAnalytics: All API calls failed')
        setError('Failed to load AI recommendations. Please try again later.')
      }
    } catch (err) {
      console.error('AIAnalytics: Error fetching AI data:', err)
      setError('Failed to load AI recommendations. Please try again later.')
    } finally {
      console.log('AIAnalytics: Finished fetching data, loading=false')
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchAllData()
  }

  return (
    <div className="ai-analytics-section">
      <div className="section-header">
        <div className="header-left">
          <div className="title-row">
            <span className="section-icon">🤖</span>
            <h2 className="section-title">AI Alerts & Recommendations</h2>
          </div>
        </div>
        <button 
          className={`refresh-btn ${loading ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh AI analysis"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="ai-tabs">
        <button
          className={`ai-tab ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          <span className="tab-icon">💡</span>
          <span className="tab-label">AI Recommendations</span>
          {recommendations.length > 0 && (
            <span className="tab-badge">{recommendations.length}</span>
          )}
        </button>
        <button
          className={`ai-tab ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-label">Project Insights</span>
        </button>
        <button
          className={`ai-tab ${activeTab === 'action-plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('action-plan')}
        >
          <span className="tab-icon">🎯</span>
          <span className="tab-label">Action Plan</span>
        </button>
      </div>

      {/* Content */}
      <div className="ai-content">
        {loading && (
          <div className="ai-loading">
            <div className="loading-spinner"></div>
            <p>Analyzing project data with AI...</p>
          </div>
        )}

        {error && !loading && (
          <div className="ai-error">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button onClick={handleRefresh} className="retry-btn">Try Again</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {activeTab === 'recommendations' && (
              <AIRecommendations recommendations={recommendations} />
            )}
            {activeTab === 'insights' && (
              <ProjectInsights insights={insights} />
            )}
            {activeTab === 'action-plan' && (
              <ActionPlan actionPlan={actionPlan} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AIAnalytics

