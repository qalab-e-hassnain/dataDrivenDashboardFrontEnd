import React, { useState, useEffect } from 'react'
import Header from './Header'
import KPICards from './KPICards'
import EVMSection from './EVMSection'
import WorkforceAnalytics from './WorkforceAnalytics'
import InventoryManagement from './InventoryManagement'
import AIForecasting from './AIForecasting'
import ProjectTimeline from './ProjectTimeline'
import AIAlerts from './AIAlerts'
import ExportActions from './ExportActions'
import ToastContainer from './ToastContainer'
import { KPISkeleton, CardSkeleton, ChartSkeleton } from './LoadingSkeleton'
import { apiService } from '../services/api'
import {
  transformEVMMetrics,
  transformWorkforceData,
  transformInventoryData,
  transformForecastData,
  transformTasksToTimeline,
  transformAlerts,
  transformKPIData,
} from '../utils/dataTransformers'
import './Dashboard.css'

function Dashboard() {
  // No default project - user must select one
  const [projectId, setProjectId] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    // Only fetch data when projectId changes and is not null
    if (projectId) {
      console.log('Fetching data for project:', projectId)
      fetchDashboardData()
    }
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const addToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('API request timeout - using mock data')
      setError('API request timeout. Using mock data for demonstration.')
      addToast('API timeout - using mock data', 'warning')
      setDashboardData(getMockData())
      setLoading(false)
      setRefreshing(false)
    }, 15000) // 15 second timeout

    try {
      // Fetch all data from actual API endpoints with individual timeouts
      const apiCalls = [
        apiService.getProject(projectId).catch((err) => {
          console.warn('Failed to fetch project:', err)
          return null
        }),
        apiService.getEVMMetrics(projectId).catch((err) => {
          console.warn('Failed to fetch EVM metrics:', err)
          return null
        }),
        apiService.getWorkforceByProject(projectId).catch((err) => {
          console.warn('Failed to fetch workforce:', err)
          return null
        }),
        apiService.getInventoryByProject(projectId).catch((err) => {
          console.warn('Failed to fetch inventory:', err)
          return null
        }),
        apiService.getForecast(projectId).catch((err) => {
          console.warn('Failed to fetch forecast:', err)
          return null
        }),
        apiService.getTasksByProject(projectId).catch((err) => {
          console.warn('Failed to fetch tasks:', err)
          return null
        }),
        apiService.getProjectAlerts(projectId).catch((err) => {
          console.warn('Failed to fetch alerts:', err)
          return null
        }),
        apiService.getAllAnomalies(projectId).catch((err) => {
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

  // Generate week timeline from project and tasks data
  const generateWeekTimeline = (projectData, tasksData) => {
    if (!projectData?.start_date) {
      return [
        { week: 1, value: 82 },
        { week: 2, value: 80 },
        { week: 3, value: null },
        { week: 4, value: null },
        { week: 5, value: null },
        { week: 6, value: null },
        { week: 7, value: null },
      ]
    }

    const startDate = new Date(projectData.start_date)
    const currentDate = new Date()
    const weeks = []
    const totalWeeks = 7

    for (let i = 1; i <= totalWeeks; i++) {
      const weekDate = new Date(startDate)
      weekDate.setDate(startDate.getDate() + (i - 1) * 7)
      
      let value = null
      // Calculate completion percentage for this week if we have tasks
      if (tasksData && Array.isArray(tasksData) && i <= Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24 * 7))) {
        const weekTasks = tasksData.filter(task => {
          if (!task.planned_start_date) return false
          const taskStart = new Date(task.planned_start_date)
          return taskStart <= weekDate && weekDate <= new Date(task.planned_end_date || taskStart)
        })
        if (weekTasks.length > 0) {
          const avgCompletion = weekTasks.reduce((sum, t) => sum + (t.completion_percentage || 0), 0) / weekTasks.length
          value = Math.round(avgCompletion)
        }
      }

      weeks.push({ week: i, value })
    }

    return weeks
  }

  const getMockData = () => {
    return {
      kpi: {
        spi: 0.92,
        cpi: 1.05,
        completion: 68,
        aiConfidence: 87,
      },
      evm: {
        months: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7', 'Month 8'],
        pv: [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.68],
        ev: [0.18, 0.35, 0.52, 0.68, 0.85, 1.02, 1.20, 1.38],
        ac: [0.17, 0.33, 0.49, 0.64, 0.80, 0.96, 1.13, 1.31],
      },
      workforce: {
        total: 247,
        active: 203,
        productivity: 87,
        utilization: 92,
        weeklyData: [
          { week: 'Week 1', productivity: 85, utilization: 88 },
          { week: 'Week 2', productivity: 86, utilization: 89 },
          { week: 'Week 3', productivity: 88, utilization: 90 },
          { week: 'Week 4', productivity: 89, utilization: 91 },
          { week: 'Week 5', productivity: 87, utilization: 90 },
          { week: 'Week 6', productivity: 89, utilization: 92 },
          { week: 'Week 7', productivity: 85, utilization: 90 },
        ],
      },
      inventory: [
        { name: 'Cement (50kg bags)', quantity: '1,450 units', status: 'Low Stock' },
        { name: 'Steel Rebar (tons)', quantity: '45.2 tons', status: 'Adequate' },
        { name: 'Bricks (thousands)', quantity: '82.5K', status: 'Adequate' },
        { name: 'Sand (cubic meters)', quantity: '156 m³', status: 'Moderate' },
        { name: 'Electrical Wiring (m)', quantity: '3,200 m', status: 'Adequate' },
        { name: 'Plumbing Pipes (m)', quantity: '890 m', status: 'Moderate' },
      ],
      forecasts: {
        completionDate: 'Feb 18, 2026',
        completionConfidence: 87,
        dataPoints: 1247,
        finalCost: 'Rs1.95B',
        costConfidence: 84,
        costVariance: 3,
        predictions: [
          'Resource shortage likely in Week 8',
          'Weather delays may add 4-6 days',
          'Optimal workforce: 225-240 workers',
          'Critical path completion: 89% probability',
        ],
      },
      timeline: [
        { task: 'Foundation Work', progress: 100, status: 'Complete' },
        { task: 'Structural Framework', progress: 75, status: 'Critical' },
        { task: 'Electrical Installation', progress: 40, status: 'In Progress' },
        { task: 'Plumbing Systems', progress: 35, status: 'In Progress' },
        { task: 'Interior Finishing', progress: 15, status: 'Started' },
        { task: 'Quality Inspection', progress: 0, status: 'Not Started' },
      ],
      weekTimeline: [
        { week: 1, value: 82 },
        { week: 2, value: 80 },
        { week: 3, value: null },
        { week: 4, value: null },
        { week: 5, value: null },
        { week: 6, value: null },
        { week: 7, value: null },
      ],
      alerts: [
        {
          type: 'critical',
          title: 'Critical Delay Detected',
          message: 'Structural framework is 8 days behind schedule. Recommend increasing workforce by 15%.',
          timestamp: '2 hours ago',
        },
        {
          type: 'warning',
          title: 'Resource Constraint',
          message: 'Cement inventory projected to run low in 5 days. Reorder suggested.',
          timestamp: '4 hours ago',
        },
        {
          type: 'info',
          title: 'Optimization Opportunity',
          message: 'Parallel execution of plumbing and electrical work can save 6 days.',
          timestamp: '6 hours ago',
        },
        {
          type: 'info',
          title: 'Workforce Anomaly',
          message: 'Unusual productivity spike detected in Week 6. Review work patterns.',
          timestamp: '8 hours ago',
        },
      ],
    }
  }

  const handleProjectChange = (newProjectId) => {
    if (newProjectId && newProjectId !== projectId) {
      console.log('Project changed to:', newProjectId)
      // Show loading state immediately
      setLoading(true)
      setDashboardData(null)
      setError(null)
      // Don't show loading toast - the loading skeleton will indicate loading state
      setProjectId(newProjectId)
      // The useEffect will automatically trigger data fetch when projectId changes
    }
  }

  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  // Show empty state when no project is selected
  if (!projectId) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">
          <Header 
            projectId={projectId} 
            onProjectChange={handleProjectChange}
            onRefresh={handleRefresh}
            refreshing={false}
            onUploadSuccess={(message, type) => addToast(message, type)}
          />
          <div className="dashboard-content">
            <div className="no-project-selected">
              <div className="no-project-icon">📊</div>
              <h2>Welcome to the Project Dashboard</h2>
              <p>Please select a project from the dropdown above to view its data and analytics.</p>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">
          <Header 
            projectId={projectId} 
            onProjectChange={handleProjectChange}
            onRefresh={handleRefresh}
            refreshing={false}
            onUploadSuccess={(message, type) => addToast(message, type)}
          />
          <div className="dashboard-content">
            <div className="kpi-section">
              <KPISkeleton />
            </div>
            <div className="top-section">
              <div className="top-left">
                <CardSkeleton />
              </div>
              <div className="top-right">
                <CardSkeleton />
              </div>
            </div>
            <div className="middle-section">
              <div className="middle-left">
                <CardSkeleton />
              </div>
              <div className="middle-right">
                <CardSkeleton />
              </div>
            </div>
            <div className="bottom-section">
              <div className="bottom-left">
                <ChartSkeleton />
              </div>
              <div className="bottom-right">
                <CardSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <Header 
          projectId={projectId} 
          onProjectChange={handleProjectChange}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onUploadSuccess={(message, type) => addToast(message, type)}
        />
        
        <div className="dashboard-content">
          <ToastContainer toasts={toasts} onRemove={removeToast} />
          
          {error && (
            <div className="error-banner">
              <p>{error}</p>
            </div>
          )}
          
          {/* Top Section: KPI Cards */}
          <div className="kpi-section">
            <KPICards data={dashboardData?.kpi} />
          </div>

          {/* Top Section: Project Timeline & AI Alerts */}
          <div className="top-section">
            <div className="top-left">
              <ProjectTimeline data={dashboardData?.timeline} />
            </div>
            <div className="top-right">
              <AIAlerts data={dashboardData?.alerts} />
            </div>
          </div>

          {/* Middle Section: Workforce & Inventory */}
          <div className="middle-section">
            <div className="middle-left">
              <WorkforceAnalytics data={dashboardData?.workforce} />
            </div>
            <div className="middle-right">
              <InventoryManagement data={dashboardData?.inventory} />
            </div>
          </div>

          {/* Bottom Section: EVM & AI Forecasting */}
          <div className="bottom-section">
            <div className="bottom-left">
              <EVMSection data={dashboardData?.evm} />
            </div>
            <div className="bottom-right">
              <AIForecasting data={dashboardData?.forecasts} />
            </div>
          </div>

          {/* Export Actions */}
          <ExportActions 
            projectId={projectId}
            onExportStart={(type) => addToast(`Starting ${type} export...`, 'info')}
            onExportComplete={(type, message) => addToast(message || `${type} export completed`, 'success')}
            onExportError={(type, error) => addToast(`Failed to export ${type}: ${error}`, 'error')}
          />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
