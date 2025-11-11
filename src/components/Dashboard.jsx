import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import Header from './Header'
import KPICards from './KPICards'
import ProjectTimeline from './ProjectTimeline'
import AIAlerts from './AIAlerts'
import WorkforceAnalytics from './WorkforceAnalytics'
import InventoryManagement from './InventoryManagement'
import EVMSection from './EVMSection'
import AIForecasting from './AIForecasting'
import ExportActions from './ExportActions'
import LoadingSkeleton from './LoadingSkeleton'
import ToastContainer from './ToastContainer'
import ErrorBoundary from './ErrorBoundary'
import { apiService } from '../services/api'
import { 
  transformKPIData, 
  transformEVMMetrics, 
  transformWorkforceData, 
  transformInventoryData,
  transformForecastData,
  transformTasksToTimeline,
  transformAlerts,
} from '../utils/dataTransformers'
import { getMockData } from '../utils/mockData'
import './Dashboard.css'

function Dashboard() {
  const { user, organization } = useAuth()
  const { 
    canViewReports, 
    canAccessAIFeatures, 
    hasAIRecommendations,
    hasWorkloadAnalytics,
    hasAdvancedDashboards,
    subscriptionTier 
  } = usePermissions()

  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [projectId, setProjectId] = useState(null)
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    // Set default project if available
    if (projectId) {
      fetchDashboardData(projectId)
    }
  }, [projectId])

  const addToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts([...toasts, { id, message, type }])
    setTimeout(() => removeToast(id), 5000)
  }

  const removeToast = (id) => {
    setToasts(toasts.filter(toast => toast.id !== id))
  }

  const fetchDashboardData = async (selectedProjectId, isRefresh = false) => {
    if (!selectedProjectId) {
      console.warn('No project ID provided')
      setLoading(false)
      return
    }

    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      // Set overall timeout
      const timeoutId = setTimeout(() => {
        console.warn('Dashboard data fetch timeout - using mock data')
        setError('Request timeout. Using mock data for demonstration.')
        addToast('Using mock data - API timeout', 'warning')
        setDashboardData(getMockData())
        setLoading(false)
        setRefreshing(false)
      }, 15000)

      const apiCalls = [
        apiService.getProject(selectedProjectId).catch((err) => {
          console.warn('Failed to fetch project:', err)
          return null
        }),
        apiService.getEVMMetrics(selectedProjectId).catch((err) => {
          console.warn('Failed to fetch EVM metrics:', err)
          return null
        }),
        apiService.getWorkforceByProject(selectedProjectId).catch((err) => {
          console.warn('Failed to fetch workforce:', err)
          return null
        }),
        apiService.getInventoryByProject(selectedProjectId).catch((err) => {
          console.warn('Failed to fetch inventory:', err)
          return null
        }),
        apiService.getForecast(selectedProjectId).catch((err) => {
          console.warn('Failed to fetch forecast:', err)
          return null
        }),
        apiService.getTasksByProject(selectedProjectId).catch((err) => {
          console.warn('Failed to fetch tasks:', err)
          return null
        }),
        apiService.getProjectAlerts(selectedProjectId).catch((err) => {
          console.warn('Failed to fetch alerts:', err)
          return null
        }),
        apiService.getAllAnomalies(selectedProjectId).catch((err) => {
          console.warn('Failed to fetch anomalies:', err)
          return null
        }),
      ]

      const [
        projectData,
        evmData,
        workforceData,
        inventoryData,
        forecastData,
        tasksData,
        alertsData,
        anomaliesData,
      ] = await Promise.all(apiCalls)

      clearTimeout(timeoutId)

      // Check if we got any data at all - be more lenient
      const hasAnyData = projectData || evmData || workforceData || inventoryData || forecastData || tasksData || alertsData || anomaliesData
      
      // Log what data we received for debugging
      console.log('📊 API Response Summary:', {
        projectData: !!projectData,
        evmData: !!evmData,
        workforceData: !!workforceData,
        inventoryData: !!inventoryData,
        forecastData: !!forecastData,
        tasksData: !!tasksData,
        alertsData: !!alertsData,
        anomaliesData: !!anomaliesData,
        hasAnyData,
      })

      if (hasAnyData) {
        // Transform API data to dashboard format
        const transformedData = {
          project: projectData,
          kpi: transformKPIData(evmData, forecastData, projectData),
          evm: transformEVMMetrics(evmData, projectData),
          workforce: transformWorkforceData(workforceData),
          inventory: transformInventoryData(inventoryData),
          forecasts: transformForecastData(forecastData),
          timeline: transformTasksToTimeline(tasksData),
          alerts: transformAlerts(alertsData, anomaliesData),
        }

        setDashboardData(transformedData)
        setError(null) // Clear any previous errors
        
        if (isRefresh) {
          addToast('Data refreshed successfully', 'success')
        } else {
          // Show success message when project data is loaded
          const projectName = projectData?.name || projectData?.title || 'Project'
          addToast(`${projectName} data loaded successfully`, 'success')
        }
      } else {
        // No data received - use mock data
        console.warn('⚠️ No data received from API - using mock data')
        console.warn('Check: 1) CORS settings on API, 2) Environment variables in Azure, 3) API endpoint URLs')
        setError('No data received from API. Using mock data for demonstration. Check browser console for details.')
        addToast('Using mock data - API returned no data', 'warning')
        setDashboardData(getMockData())
      }
    } catch (err) {
      clearTimeout(timeoutId)
      console.error('❌ Error loading dashboard:', err)
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config?.url,
      })
      
      // Check for specific error types
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        console.error('🌐 Network Error: Check CORS settings on your API server')
        console.error('The API must allow requests from:', window.location.origin)
      }
      
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load dashboard data'
      setError(`Failed to load dashboard data: ${errorMessage}. Using mock data for demonstration. Check browser console for details.`)
      addToast('Using mock data - API error', 'warning')
      // Set mock data for development
      setDashboardData(getMockData())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleProjectChange = (newProjectId) => {
    setProjectId(newProjectId)
    setLoading(true)
    fetchDashboardData(newProjectId)
  }

  const handleRefresh = () => {
    if (projectId) {
      fetchDashboardData(projectId, true)
    }
  }

  const handleUploadSuccess = (message, type) => {
    addToast(message, type)
  }

  // Check if user has access to view reports
  if (!canViewReports) {
    return (
      <div className="dashboard-container">
        <div className="access-denied">
          <span className="access-denied-icon">🔒</span>
          <h3>Access Denied</h3>
          <p>You don't have permission to view the dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="dashboard-container">
        <Header
          projectId={projectId}
          onProjectChange={handleProjectChange}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onUploadSuccess={handleUploadSuccess}
        />

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : dashboardData ? (
          <div className="dashboard-content">
            <div className="top-section">
              <KPICards data={dashboardData.kpi} />
            </div>

            <div className="middle-section">
              <ProjectTimeline data={dashboardData.timeline} />
              <AIAlerts data={dashboardData.alerts} />
            </div>

            <div className="bottom-section">
              <WorkforceAnalytics data={dashboardData.workforce} />
              <InventoryManagement data={dashboardData.inventory} />
            </div>

            <div className="bottom-section">
              <EVMSection data={dashboardData.evm} />
              {canAccessAIFeatures && hasAIRecommendations && (
                <AIForecasting data={dashboardData.forecasts} />
              )}
            </div>

            {canViewReports && (
              <ExportActions projectId={projectId} />
            )}
          </div>
        ) : (
          <div className="no-data-message">
            <p>No dashboard data available. Please select a project.</p>
          </div>
        )}

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </ErrorBoundary>
  )
}

export default Dashboard
