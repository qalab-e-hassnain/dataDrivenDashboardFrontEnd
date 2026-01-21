import axios from 'axios'

// Base URL for API
// For local testing: Create .env.local with VITE_API_BASE_URL=http://localhost:8000/api
// For production: Uses Azure API URL or set VITE_API_BASE_URL in environment
// Priority: .env.local > environment variable > default Azure URL
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api'

// Security fix: Automatically convert HTTP to HTTPS for production URLs (prevents mixed content errors)
// Only allow HTTP for localhost
if (API_BASE_URL.startsWith('http://') && !API_BASE_URL.includes('localhost')) {
  console.warn('⚠️ Security: Converting HTTP API URL to HTTPS to prevent mixed content errors')
  API_BASE_URL = API_BASE_URL.replace('http://', 'https://')
}

// Additional safety: Force HTTPS for Azure URLs even if they come from env vars
if (API_BASE_URL.includes('azurewebsites.net') && API_BASE_URL.startsWith('http://')) {
  console.warn('⚠️ Security: Forcing HTTPS for Azure API URL')
  API_BASE_URL = API_BASE_URL.replace('http://', 'https://')
}

// Log API URL for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_BASE_URL)
  console.log('🌐 Environment:', import.meta.env.MODE)
  console.log('📝 VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || 'Not set (using default)')
}

// CRITICAL: Ensure API_BASE_URL is HTTPS before creating axios instance
// This must happen BEFORE axios.create() to prevent any HTTP requests
const FINAL_API_BASE_URL = (() => {
  let url = API_BASE_URL
  // Force HTTPS for production URLs
  if (url.startsWith('http://') && !url.includes('localhost')) {
    console.warn('⚠️ Security: Converting HTTP to HTTPS before axios instance creation')
    url = url.replace('http://', 'https://')
  }
  // Double-check for Azure URLs
  if (url.includes('azurewebsites.net') && url.startsWith('http://')) {
    console.warn('⚠️ Security: Forcing HTTPS for Azure URL before axios instance creation')
    url = url.replace('http://', 'https://')
  }
  return url
})()

// Log the final URL that will be used
console.log('🔗 Final API Base URL (used by axios):', FINAL_API_BASE_URL)

// Create axios instance with default config
const api = axios.create({
  baseURL: FINAL_API_BASE_URL, // Use the guaranteed HTTPS URL
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // 20 second timeout for all requests
  maxRedirects: 5, // Follow redirects automatically
  // Don't send credentials to avoid CORS preflight issues
  withCredentials: false,
})

// Axios interceptor to remove Content-Type for FormData and handle CORS
api.interceptors.request.use((config) => {
  // CRITICAL: Force HTTPS FIRST - before any other processing
  // Override baseURL directly to ensure HTTPS is always used
  if (config.baseURL && config.baseURL.startsWith('http://') && !config.baseURL.includes('localhost')) {
    console.error('🚨 CRITICAL: HTTP detected in interceptor! Converting to HTTPS:', config.baseURL)
    config.baseURL = config.baseURL.replace('http://', 'https://')
  }
  
  // Also override the axios instance default if somehow it got changed
  if (api.defaults.baseURL && api.defaults.baseURL.startsWith('http://') && !api.defaults.baseURL.includes('localhost')) {
    console.error('🚨 CRITICAL: HTTP detected in axios.defaults.baseURL! Converting to HTTPS')
    api.defaults.baseURL = api.defaults.baseURL.replace('http://', 'https://')
    config.baseURL = api.defaults.baseURL // Use the corrected default
  }
  
  // Ensure config.baseURL uses the FINAL_API_BASE_URL if somehow it's still HTTP
  if (!config.baseURL || (config.baseURL.startsWith('http://') && !config.baseURL.includes('localhost'))) {
    console.error('🚨 CRITICAL: Forcing FINAL_API_BASE_URL due to HTTP detected')
    config.baseURL = FINAL_API_BASE_URL
  }
  
  // Also check the full URL if baseURL is not set (shouldn't happen, but safety check)
  if (config.url && config.url.startsWith('http://') && !config.url.includes('localhost')) {
    console.error('🚨 CRITICAL: HTTP detected in config.url! Converting to HTTPS:', config.url)
    config.url = config.url.replace('http://', 'https://')
  }
  
  // If data is FormData, remove Content-Type header to let browser set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
    // Also delete the common header if it exists
    if (config.headers.common && config.headers.common['Content-Type']) {
      delete config.headers.common['Content-Type']
    }
  }
  
  // Ensure withCredentials is false for all requests to avoid CORS preflight issues
  if (config.withCredentials === undefined) {
    config.withCredentials = false
  }
  
  // FINAL SAFETY: Construct the full URL and force HTTPS if needed
  const constructedURL = config.baseURL ? `${config.baseURL}${config.url}` : config.url
  if (constructedURL && constructedURL.startsWith('http://') && !constructedURL.includes('localhost')) {
    console.error('🚨 CRITICAL: Full URL is HTTP! Forcing HTTPS conversion')
    // Reconstruct with HTTPS
    const httpsBaseURL = config.baseURL?.replace('http://', 'https://') || FINAL_API_BASE_URL
    config.baseURL = httpsBaseURL
    // Reconstruct the full URL
    const httpsFullURL = `${httpsBaseURL}${config.url}`
    console.error('   Original URL:', constructedURL)
    console.error('   Fixed URL:', httpsFullURL)
  }
  
  // Log request details for debugging (only in development or for POST requests)
  if (import.meta.env.DEV || config.method?.toUpperCase() === 'POST') {
    const finalURL = config.baseURL ? `${config.baseURL}${config.url}` : config.url
    console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      axiosDefaultsBaseURL: api.defaults.baseURL,
      FINAL_API_BASE_URL: FINAL_API_BASE_URL,
      fullURL: finalURL,
      isHTTPS: finalURL?.startsWith('https://'),
      isHTTP: finalURL?.startsWith('http://'),
      headers: config.headers,
      withCredentials: config.withCredentials,
    })
    
    // Final safety check: if it's still HTTP (shouldn't happen), log a warning
    if (finalURL && finalURL.startsWith('http://') && !finalURL.includes('localhost')) {
      console.error('🚨 CRITICAL: Request is STILL using HTTP after all fixes!')
      console.error('   This indicates a deeper issue - possibly cached bundle or service worker')
      console.error('   baseURL:', config.baseURL)
      console.error('   url:', config.url)
      console.error('   fullURL:', finalURL)
      console.error('   Attempting emergency HTTPS fix...')
      // Emergency fix: directly modify the URL
      if (config.url && !config.url.startsWith('http')) {
        config.baseURL = FINAL_API_BASE_URL
      }
    }
  }
  
  return config
})

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log CORS errors specifically
    if (error.message && (error.message.includes('CORS') || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
      console.error('🚨 CORS or Network Error detected:', error.message)
      console.error('This usually means:')
      console.error('1. The API server does not allow requests from this origin')
      console.error('2. CORS preflight (OPTIONS) request failed')
      console.error('3. The server is not reachable')
      console.error('4. Check browser console Network tab for preflight (OPTIONS) request')
    }
    return Promise.reject(error)
  }
)

// API Service Functions
export const apiService = {
  // ==================== Projects API ====================
  
  // Get All Projects
  getAllProjects: async () => {
    try {
      // Use trailing slash to avoid 307 redirect
      const url = '/projects/'
      console.log('API: Fetching projects from:', `${API_BASE_URL}${url}`)
      console.log('API: Full URL:', `${API_BASE_URL}${url}`)
      
      const response = await api.get(url)
      
      console.log('API: Response status:', response.status)
      console.log('API: Response headers:', response.headers)
      console.log('API: Response data type:', typeof response.data)
      console.log('API: Response data is array:', Array.isArray(response.data))
      console.log('API: Response data length:', Array.isArray(response.data) ? response.data.length : 'N/A')
      console.log('API: Response data:', JSON.stringify(response.data, null, 2))
      
      // If response.data is an array, return it directly
      if (Array.isArray(response.data)) {
        console.log(`API: Returning ${response.data.length} projects`)
        return response.data
      }
      
      // If response.data is an object, try to extract projects
      if (response.data && typeof response.data === 'object') {
        console.log('API: Response data is object, checking for projects array...')
        console.log('API: Object keys:', Object.keys(response.data))
        
        // Check common property names
        if (response.data.projects && Array.isArray(response.data.projects)) {
          console.log(`API: Found projects array with ${response.data.projects.length} items`)
          return response.data.projects
        }
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log(`API: Found data array with ${response.data.data.length} items`)
          return response.data.data
        }
        if (response.data.items && Array.isArray(response.data.items)) {
          console.log(`API: Found items array with ${response.data.items.length} items`)
          return response.data.items
        }
      }
      
      console.warn('API: Unexpected response format, returning as-is:', response.data)
      return response.data
    } catch (error) {
      console.error('API: Error fetching projects')
      console.error('API: Error type:', error.constructor.name)
      console.error('API: Error message:', error.message)
      console.error('API: Error code:', error.code)
      
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('API: Response status:', error.response.status)
        console.error('API: Response data:', error.response.data)
        console.error('API: Response headers:', error.response.headers)
      } else if (error.request) {
        // The request was made but no response was received
        console.error('API: No response received')
        console.error('API: Request:', error.request)
      } else {
        // Something happened in setting up the request
        console.error('API: Error setting up request:', error.message)
      }
      
      throw error
    }
  },

  // Get Project by ID
  getProject: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching project:', error)
      throw error
    }
  },

  // Create Project (with increased timeout for validation and database operations)
  createProject: async (projectData) => {
    try {
      // Log the base URL before making the request to debug CORS issues
      console.log('🔍 Creating project with baseURL:', FINAL_API_BASE_URL)
      console.log('🔍 Full URL will be:', `${FINAL_API_BASE_URL}/projects`)
      console.log('🔍 Axios instance baseURL:', api.defaults.baseURL)
      console.log('🔍 Environment VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || 'Not set')
      
      // Use longer timeout for project creation (60 seconds) to handle validation and database operations
      // Note: Don't override headers - let the interceptor handle it to avoid CORS preflight issues
      const response = await api.post('/projects', projectData, {
        timeout: 60000, // 60 seconds timeout
        // Removed explicit headers to let interceptor handle them (reduces CORS preflight complexity)
        // The default Content-Type: application/json from axios instance is sufficient
        withCredentials: false,
      })
      return response.data
    } catch (error) {
      console.error('❌ Error creating project:', error)
      console.error('📋 Error details:', {
        message: error.message,
        code: error.code,
        name: error.name,
        response: error.response?.data,
        status: error.response?.status,
        requestURL: error.config?.url,
        requestMethod: error.config?.method,
        requestBaseURL: error.config?.baseURL,
        requestHeaders: error.config?.headers,
        fullURL: error.config?.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config?.url,
      })
      
      // Log if it's a CORS/network error
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.error('🚨 Network Error Details:')
        console.error('  - This usually means the request was blocked before reaching the server')
        console.error('  - Check if baseURL is HTTPS:', error.config?.baseURL)
        console.error('  - Check browser Network tab for OPTIONS preflight request')
        console.error('  - Verify CORS headers on the backend for POST /projects')
      }
      
      // Enhance error object with helpful information
      if (error.response) {
        // Server responded with error status
        error.response._handled = true
        error.response._errorType = error.response.status >= 500 ? 'server' : 'client'
      } else if (error.request) {
        // Request made but no response (timeout, network error)
        error._handled = true
        error._errorType = 'network'
        error._isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout')
      }
      
      throw error
    }
  },

  // Update Project
  updateProject: async (projectId, projectData) => {
    try {
      const response = await api.put(`/projects/${projectId}`, projectData)
      return response.data
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  },

  // Delete Project
  deleteProject: async (projectId) => {
    try {
      const response = await api.delete(`/projects/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  },

  // ==================== Tasks API ====================
  
  // Get Tasks by Project
  getTasksByProject: async (projectId) => {
    try {
      const response = await api.get(`/tasks/project/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw error
    }
  },

  // Get Task by ID
  getTask: async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching task:', error)
      throw error
    }
  },

  // Create Task
  createTask: async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData)
      return response.data
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  },

  // Update Task
  updateTask: async (taskId, taskData) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, taskData)
      return response.data
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  },

  // Delete Task
  deleteTask: async (taskId) => {
    try {
      const response = await api.delete(`/tasks/${taskId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  },

  // ==================== Inventory API ====================
  
  // Get Inventory by Project
  getInventoryByProject: async (projectId) => {
    try {
      const response = await api.get(`/inventory/project/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching inventory:', error)
      throw error
    }
  },

  // Create Inventory Entry
  createInventoryEntry: async (inventoryData) => {
    try {
      const response = await api.post('/inventory', inventoryData)
      return response.data
    } catch (error) {
      console.error('Error creating inventory entry:', error)
      throw error
    }
  },

  // Predict Material Depletion
  predictMaterialDepletion: async (inventoryId) => {
    try {
      const response = await api.get(`/inventory/${inventoryId}/predict-depletion`)
      return response.data
    } catch (error) {
      console.error('Error predicting depletion:', error)
      throw error
    }
  },

  // Get Inventory Thresholds
  getInventoryThresholds: async (projectId) => {
    try {
      const response = await api.get(`/inventory/project/${projectId}/thresholds`)
      return response.data
    } catch (error) {
      console.error('Error fetching inventory thresholds:', error)
      throw error
    }
  },

  // Update Inventory Thresholds
  updateInventoryThresholds: async (projectId, thresholds) => {
    try {
      const params = new URLSearchParams()
      if (thresholds.low_stock_threshold !== undefined) {
        params.append('low_stock_threshold', thresholds.low_stock_threshold)
      }
      if (thresholds.critical_stock_threshold !== undefined) {
        params.append('critical_stock_threshold', thresholds.critical_stock_threshold)
      }
      if (thresholds.daily_usage_percentage_threshold !== undefined) {
        params.append('daily_usage_percentage_threshold', thresholds.daily_usage_percentage_threshold)
      }
      
      const response = await api.put(`/inventory/project/${projectId}/thresholds?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Error updating inventory thresholds:', error)
      throw error
    }
  },

  // ==================== Workforce API ====================
  
  // Get Workforce by Project
  getWorkforceByProject: async (projectId) => {
    try {
      const response = await api.get(`/workforce/project/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching workforce:', error)
      throw error
    }
  },

  // Create Workforce Entry
  createWorkforceEntry: async (workforceData) => {
    try {
      const response = await api.post('/workforce', workforceData)
      return response.data
    } catch (error) {
      console.error('Error creating workforce entry:', error)
      throw error
    }
  },

  // Get Workforce Trends (with productivity over time)
  getWorkforceTrends: async (projectId) => {
    try {
      const response = await api.get(`/workforce-analytics/project/${projectId}/trends`)
      return response.data
    } catch (error) {
      console.error('Error fetching workforce trends:', error)
      throw error
    }
  },

  // ==================== Workforce Dashboard API ====================
  
  // Get Total Workers
  getTotalWorkers: async (projectId) => {
    try {
      const response = await api.get(`/workforce-dashboard/project/${projectId}/total-workers`)
      return response.data
    } catch (error) {
      console.error('Error fetching total workers:', error)
      throw error
    }
  },

  // Get Active Workers
  getActiveWorkers: async (projectId, daysActive = 30) => {
    try {
      const response = await api.get(`/workforce-dashboard/project/${projectId}/active-workers`, {
        params: { days_active: daysActive }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching active workers:', error)
      throw error
    }
  },

  // Get Workforce Summary
  getWorkforceSummary: async (projectId) => {
    try {
      const response = await api.get(`/workforce-dashboard/project/${projectId}/summary`)
      return response.data
    } catch (error) {
      console.error('Error fetching workforce summary:', error)
      throw error
    }
  },

  // ==================== EVM Metrics API ====================
  
  // Get EVM Metrics
  getEVMMetrics: async (projectId) => {
    try {
      const response = await api.get(`/evm/project/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching EVM metrics:', error)
      throw error
    }
  },

  // ==================== AI Forecasting API ====================
  
  // Get Forecast
  getForecast: async (projectId) => {
    try {
      const response = await api.get(`/forecast/project/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching forecast:', error)
      throw error
    }
  },

  // ==================== Gantt Chart API ====================
  
  // Get Gantt Chart Data
  getGanttChartData: async (projectId) => {
    try {
      const response = await api.get(`/gantt/project/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching gantt chart data:', error)
      throw error
    }
  },

  // ==================== Critical Path API ====================
  
  // Get Critical Path
  getCriticalPath: async (projectId) => {
    try {
      const response = await api.get(`/critical-path/project/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching critical path:', error)
      throw error
    }
  },

  // ==================== Anomaly Detection API ====================
  
  // Get All Anomalies
  getAllAnomalies: async (projectId) => {
    try {
      const response = await api.get(`/anomaly/project/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching anomalies:', error)
      throw error
    }
  },

  // Get Workforce Anomalies
  getWorkforceAnomalies: async (projectId) => {
    try {
      const response = await api.get(`/anomaly/project/${projectId}/workforce`)
      return response.data
    } catch (error) {
      console.error('Error fetching workforce anomalies:', error)
      throw error
    }
  },

  // Get Inventory Anomalies
  getInventoryAnomalies: async (projectId) => {
    try {
      const response = await api.get(`/anomaly/project/${projectId}/inventory`)
      return response.data
    } catch (error) {
      console.error('Error fetching inventory anomalies:', error)
      throw error
    }
  },

  // ==================== Alerts API ====================
  
  // Get Project Alerts
  getProjectAlerts: async (projectId, params = {}) => {
    try {
      const response = await api.get(`/alerts/project/${projectId}`, { params })
      return response.data
    } catch (error) {
      console.error('Error fetching alerts:', error)
      throw error
    }
  },

  // Check and Create Alerts
  checkAndCreateAlerts: async (projectId) => {
    try {
      const response = await api.post(`/alerts/project/${projectId}/check`)
      return response.data
    } catch (error) {
      console.error('Error checking alerts:', error)
      throw error
    }
  },

  // Update Alert
  updateAlert: async (alertId, alertData) => {
    try {
      const response = await api.put(`/alerts/${alertId}`, alertData)
      return response.data
    } catch (error) {
      console.error('Error updating alert:', error)
      throw error
    }
  },

  // ==================== Reports API ====================
  
  // Export Excel Report
  exportExcelReport: async (projectId) => {
    try {
      const response = await api.get(`/reports/project/${projectId}/excel`, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      console.error('Error exporting Excel report:', error)
      throw error
    }
  },

  // Export PDF Report
  exportPDFReport: async (projectId) => {
    try {
      const response = await api.get(`/reports/project/${projectId}/pdf`, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      console.error('Error exporting PDF report:', error)
      throw error
    }
  },

  // ==================== File Upload API ====================
  
  // Upload File (Primavera endpoint - supports Excel and CSV)
  uploadExcelFile: async (projectId, file, onUploadProgress) => {
    try {
      console.log('Uploading file:', file.name, 'Size:', file.size, 'bytes')
      console.log('Project ID:', projectId)
      
      const formData = new FormData()
      formData.append('file', file)
      
      // Use Primavera upload endpoint
      let url = `/upload/project/${projectId}/primavera`
      console.log('Upload URL:', `${API_BASE_URL}${url}`)
      
      // Create a separate axios instance for file uploads with proper configuration
      const uploadConfig = {
        baseURL: API_BASE_URL,
        timeout: 120000, // 2 minute timeout for large files
        maxRedirects: 5,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: function (status) {
          return status >= 200 && status < 300; // Accept 2xx status codes
        },
      }
      
      const uploadApi = axios.create(uploadConfig)
      
      // Remove Content-Type header for FormData
      uploadApi.interceptors.request.use((config) => {
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type']
        }
        return config
      })
      
      const response = await uploadApi.post(url, formData, {
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onUploadProgress(percentCompleted)
          } else if (onUploadProgress) {
            // Simulate progress if total is not available
            const estimatedProgress = Math.min(90, (progressEvent.loaded / (1024 * 1024)) * 10)
            onUploadProgress(estimatedProgress)
          }
        },
      })
      
      console.log('Upload response status:', response.status)
      console.log('Upload response data:', response.data)
      return response.data
    } catch (error) {
      console.error('Error uploading Excel file:', error)
      
      // Try with trailing slash as fallback
      if (error.response?.status === 404 || error.code === 'ENOTFOUND') {
        console.log('Retrying with trailing slash...')
        try {
          const formData = new FormData()
          formData.append('file', file)
          const retryUrl = `/upload/project/${projectId}/primavera/`
          const response = await api.post(retryUrl, formData, {
            timeout: 120000,
            onUploadProgress: (progressEvent) => {
              if (onUploadProgress && progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                onUploadProgress(percentCompleted)
              }
            },
          })
          console.log('Retry successful:', response.data)
          return response.data
        } catch (retryError) {
          console.error('Retry also failed:', retryError)
        }
      }
      
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
      })
      throw error
    }
  },

  // Upload CSV File (uses Primavera endpoint)
  uploadCSVFile: async (projectId, file, onUploadProgress) => {
    try {
      console.log('Uploading file:', file.name, 'Size:', file.size, 'bytes')
      console.log('Project ID:', projectId)
      
      const formData = new FormData()
      formData.append('file', file)
      
      // Use Primavera upload endpoint
      let url = `/upload/project/${projectId}/primavera`
      console.log('Upload URL:', `${API_BASE_URL}${url}`)
      
      // Create a separate axios instance for file uploads with proper configuration
      const uploadConfig = {
        baseURL: API_BASE_URL,
        timeout: 120000, // 2 minute timeout for large files
        maxRedirects: 5,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: function (status) {
          return status >= 200 && status < 300; // Accept 2xx status codes
        },
      }
      
      const uploadApi = axios.create(uploadConfig)
      
      // Remove Content-Type header for FormData
      uploadApi.interceptors.request.use((config) => {
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type']
        }
        return config
      })
      
      const response = await uploadApi.post(url, formData, {
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onUploadProgress(percentCompleted)
          } else if (onUploadProgress) {
            // Simulate progress if total is not available
            const estimatedProgress = Math.min(90, (progressEvent.loaded / (1024 * 1024)) * 10)
            onUploadProgress(estimatedProgress)
          }
        },
      })
      
      console.log('Upload response status:', response.status)
      console.log('Upload response data:', response.data)
      return response.data
    } catch (error) {
      console.error('Error uploading CSV file:', error)
      
      // Try with trailing slash as fallback
      if (error.response?.status === 404 || error.code === 'ENOTFOUND') {
        console.log('Retrying with trailing slash...')
        try {
          const formData = new FormData()
          formData.append('file', file)
          const retryUrl = `/upload/project/${projectId}/primavera/`
          const response = await api.post(retryUrl, formData, {
            timeout: 120000,
            onUploadProgress: (progressEvent) => {
              if (onUploadProgress && progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                onUploadProgress(percentCompleted)
              }
            },
          })
          console.log('Retry successful:', response.data)
          return response.data
        } catch (retryError) {
          console.error('Retry also failed:', retryError)
        }
      }
      
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
      })
      throw error
    }
  },

  // ===== AI RECOMMENDATIONS API =====
  
  // Get AI recommendations for a project (with mode: standard or ai)
  getRecommendations: async (projectId, mode = 'ai') => {
    try {
      const response = await api.get(`/recommendations/project/${projectId}`, {
        params: { mode }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      throw error
    }
  },

  // Get project insights with health score
  getProjectInsights: async (projectId) => {
    try {
      const response = await api.get(`/recommendations/project/${projectId}/insights`)
      return response.data
    } catch (error) {
      console.error('Error fetching project insights:', error)
      throw error
    }
  },

  // Get action plan (timeline-based recommendations)
  getActionPlan: async (projectId) => {
    try {
      const response = await api.get(`/recommendations/project/${projectId}/action-plan`)
      return response.data
    } catch (error) {
      console.error('Error fetching action plan:', error)
      throw error
    }
  },

  // ===== CRITICAL PATH & GANTT CHART API =====
  // Get Critical Path data
  getCriticalPath: async (projectId) => {
    try {
      const response = await api.get(`/critical-path/project/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching critical path:', error)
      throw error
    }
  },

  // Get Gantt chart data
  getGanttData: async (projectId) => {
    try {
      const response = await api.get(`/gantt/project/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching Gantt data:', error)
      throw error
    }
  },

  // Download template
  downloadTemplate: (format = 'excel') => {
    // API_BASE_URL already includes /api, so we need to construct the full URL
    const baseUrl = API_BASE_URL.endsWith('/api') 
      ? API_BASE_URL.replace('/api', '') 
      : API_BASE_URL.replace(/\/api\/?$/, '')
    const url = `${baseUrl}/api/template/activities/${format}`
    window.open(url, '_blank')
  },

  // Upload Primavera file
  uploadPrimaveraFile: async (projectId, file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Content-Type will be automatically removed by the interceptor for FormData
      const response = await api.post(`/upload/project/${projectId}/primavera`, formData)
      return response.data
    } catch (error) {
      console.error('Error uploading Primavera file:', error)
      throw error
    }
  },

  // ==================== Risk Management API ====================
  
  // Create Risk
  createRisk: async (projectId, riskData) => {
    try {
      const response = await api.post(`/risk/project/${projectId}`, riskData)
      return response.data
    } catch (error) {
      console.error('Error creating risk:', error)
      throw error
    }
  },

  // Get All Risks
  getRisks: async (projectId, filters = {}) => {
    try {
      const response = await api.get(`/risk/project/${projectId}`, { params: filters })
      return response.data
    } catch (error) {
      console.error('Error fetching risks:', error)
      throw error
    }
  },

  // Get High Priority Risks
  getHighPriorityRisks: async (projectId, threshold = 0.5) => {
    try {
      const response = await api.get(`/risk/project/${projectId}/high-priority`, {
        params: { threshold }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching high priority risks:', error)
      throw error
    }
  },

  // Get Risk Register Summary
  getRiskSummary: async (projectId) => {
    try {
      const response = await api.get(`/risk/project/${projectId}/summary`)
      return response.data
    } catch (error) {
      console.error('Error fetching risk summary:', error)
      throw error
    }
  },

  // Get Mitigation Actions
  getMitigationActions: async (riskId) => {
    try {
      const response = await api.get(`/risk/${riskId}/mitigation-actions`)
      return response.data
    } catch (error) {
      console.error('Error fetching mitigation actions:', error)
      throw error
    }
  },

  // Auto-detect Risks
  autoDetectRisks: async (projectId) => {
    try {
      const response = await api.post(`/risk/project/${projectId}/auto-detect`)
      return response.data
    } catch (error) {
      console.error('Error auto-detecting risks:', error)
      throw error
    }
  },

  // Update Risk
  updateRisk: async (riskId, riskData) => {
    try {
      const response = await api.put(`/risk/${riskId}`, riskData)
      return response.data
    } catch (error) {
      console.error('Error updating risk:', error)
      throw error
    }
  },

  // Get Single Risk
  getRisk: async (riskId) => {
    try {
      const response = await api.get(`/risk/${riskId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching risk:', error)
      throw error
    }
  },

  // ==================== Resource Leveling API ====================
  
  // Apply Resource Leveling
  applyResourceLeveling: async (projectId, options = {}) => {
    try {
      const params = {
        max_hours_per_day: options.maxHoursPerDay || 8,
        max_hours_per_week: options.maxHoursPerWeek || 40,
        consider_availability: options.considerAvailability !== false
      }
      const response = await api.post(`/resource-leveling/project/${projectId}/apply`, null, { params })
      return response.data
    } catch (error) {
      console.error('Error applying resource leveling:', error)
      throw error
    }
  },

  // Get Resource Utilization Forecast
  getUtilizationForecast: async (projectId, startDate, endDate) => {
    try {
      const params = {}
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      const response = await api.get(`/resource-leveling/project/${projectId}/utilization-forecast`, { params })
      return response.data
    } catch (error) {
      console.error('Error fetching utilization forecast:', error)
      throw error
    }
  },

  // Apply Resource Leveling V2 (Actually applies schedule changes)
  applyResourceLevelingV2: async (projectId, options = {}) => {
    try {
      const params = {
        auto_apply: options.autoApply !== undefined ? options.autoApply : false,
        protect_critical: options.protectCritical !== undefined ? options.protectCritical : true,
        max_hours_per_day: options.maxHoursPerDay || 8,
        max_hours_per_week: options.maxHoursPerWeek || 40,
        consider_availability: options.considerAvailability !== false
      }
      // Increase timeout for resource leveling operations (60 seconds)
      const response = await api.post(`/resource-leveling/project/${projectId}/apply-v2`, null, { 
        params,
        timeout: 60000 // 60 seconds timeout
      })
      return response.data
    } catch (error) {
      console.error('Error applying resource leveling V2:', error)
      throw error
    }
  },

  // ==================== Project Validation API ====================
  
  // Get Data Completeness Validation
  getDataCompleteness: async (projectId) => {
    try {
      const response = await api.get(`/project-validation/project/${projectId}/completeness`)
      return response.data
    } catch (error) {
      console.error('Error fetching data completeness:', error)
      throw error
    }
  },
}

export default api