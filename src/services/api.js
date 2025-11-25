import axios from 'axios'

// Base URL for API
// For local testing: Create .env.local with VITE_API_BASE_URL=http://localhost:8000/api
// For production: Uses Azure API URL or set VITE_API_BASE_URL in environment
// Priority: .env.local > environment variable > default Azure URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api'

// Log API URL for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_BASE_URL)
  console.log('🌐 Environment:', import.meta.env.MODE)
  console.log('📝 VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || 'Not set (using default)')
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // 20 second timeout for all requests
  maxRedirects: 5, // Follow redirects automatically
})

// Axios interceptor to remove Content-Type for FormData
api.interceptors.request.use((config) => {
  // If data is FormData, remove Content-Type header to let browser set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
    // Also delete the common header if it exists
    if (config.headers.common && config.headers.common['Content-Type']) {
      delete config.headers.common['Content-Type']
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

  // Create Project
  createProject: async (projectData) => {
    try {
      const response = await api.post('/projects', projectData)
      return response.data
    } catch (error) {
      console.error('Error creating project:', error)
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
}

export default api