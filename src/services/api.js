import axios from 'axios'

// Base URL for API
// For local testing: Uses localhost by default
// For production: Set VITE_API_BASE_URL in environment variables
// Priority: .env.local > environment variable > default localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

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
  timeout: 10000, // 10 second timeout for all requests
  maxRedirects: 5, // Follow redirects automatically
})

// Add token to requests if available
const token = localStorage.getItem('access_token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Axios interceptor to handle token and FormData
api.interceptors.request.use((config) => {
  // If data is FormData, remove Content-Type header to let browser set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
    // Also delete the common header if it exists
    if (config.headers.common && config.headers.common['Content-Type']) {
      delete config.headers.common['Content-Type']
    }
  }
  
  // Add token to each request if available
  const currentToken = localStorage.getItem('access_token')
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`
  }
  
  return config
})

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          console.log('🔄 Attempting token refresh...')
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          })
          
          if (response.data.access_token) {
            localStorage.setItem('access_token', response.data.access_token)
            localStorage.setItem('refresh_token', response.data.refresh_token)
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`
            originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`
            
            console.log('✅ Token refreshed successfully')
            return api(originalRequest)
          }
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError)
        // Clear tokens and redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        delete api.defaults.headers.common['Authorization']
        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }
    
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

  // ==================== Authentication API ====================
  
  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  },

  // Login
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      // Store tokens
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('refresh_token', response.data.refresh_token)
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`
      }
      return response.data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/auth/refresh', { refresh_token: refreshToken })
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('refresh_token', response.data.refresh_token)
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`
      }
      return response.data
    } catch (error) {
      console.error('Token refresh error:', error)
      throw error
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me')
      return response.data
    } catch (error) {
      console.error('Error fetching current user:', error)
      throw error
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await api.post('/auth/logout')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      delete api.defaults.headers.common['Authorization']
      return response.data
    } catch (error) {
      console.error('Logout error:', error)
      // Clear tokens anyway
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      delete api.defaults.headers.common['Authorization']
      throw error
    }
  },

  // ==================== User Management API ====================
  
  // Create user
  createUser: async (userData) => {
    try {
      const response = await api.post('/users', userData)
      return response.data
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  },

  // Get users list with filters
  getUsers: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.organization_id) params.append('organization_id', filters.organization_id)
      if (filters.role) params.append('role', filters.role)
      if (filters.is_active !== undefined) params.append('is_active', filters.is_active)
      if (filters.skip) params.append('skip', filters.skip)
      if (filters.limit) params.append('limit', filters.limit)
      
      const response = await api.get(`/users?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },

  // Get user by ID
  getUser: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData)
      return response.data
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  },

  // Update user role (legacy method, uses updateUser)
  updateUserRole: async (userId, role) => {
    try {
      const response = await api.put(`/users/${userId}`, { role })
      return response.data
    } catch (error) {
      console.error('Error updating user role:', error)
      throw error
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      await api.delete(`/users/${userId}`)
      return { success: true }
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  },

  // Assign projects to user
  assignProjectsToUser: async (userId, projectIds) => {
    try {
      const response = await api.post(`/users/${userId}/assign-projects`, projectIds)
      return response.data
    } catch (error) {
      console.error('Error assigning projects:', error)
      throw error
    }
  },

  // Get user projects
  getUserProjects: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/projects`)
      return response.data
    } catch (error) {
      console.error('Error fetching user projects:', error)
      throw error
    }
  },

  // ==================== Organization Management API ====================
  
  // Create organization
  createOrganization: async (orgData) => {
    try {
      const response = await api.post('/organizations', orgData)
      return response.data
    } catch (error) {
      console.error('Error creating organization:', error)
      throw error
    }
  },

  // Get organizations list
  getOrganizations: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.subscription_tier) params.append('subscription_tier', filters.subscription_tier)
      if (filters.subscription_status) params.append('subscription_status', filters.subscription_status)
      if (filters.skip) params.append('skip', filters.skip)
      if (filters.limit) params.append('limit', filters.limit)
      
      const response = await api.get(`/organizations?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Error fetching organizations:', error)
      throw error
    }
  },

  // Get organization by ID
  getOrganization: async (organizationId) => {
    try {
      const response = await api.get(`/organizations/${organizationId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching organization:', error)
      throw error
    }
  },

  // Update organization
  updateOrganization: async (organizationId, data) => {
    try {
      const response = await api.put(`/organizations/${organizationId}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating organization:', error)
      throw error
    }
  },

  // Delete organization
  deleteOrganization: async (organizationId) => {
    try {
      await api.delete(`/organizations/${organizationId}`)
      return { success: true }
    } catch (error) {
      console.error('Error deleting organization:', error)
      throw error
    }
  },

  // Get organization stats
  getOrganizationStats: async (organizationId) => {
    try {
      const response = await api.get(`/organizations/${organizationId}/stats`)
      return response.data
    } catch (error) {
      console.error('Error fetching organization stats:', error)
      throw error
    }
  },

  // Get organization users
  getOrganizationUsers: async (organizationId, skip = 0, limit = 50) => {
    try {
      const response = await api.get(`/organizations/${organizationId}/users?skip=${skip}&limit=${limit}`)
      return response.data
    } catch (error) {
      console.error('Error fetching organization users:', error)
      throw error
    }
  },

  // ==================== Subscription API ====================
  
  // Create subscription
  createSubscription: async (subscriptionData) => {
    try {
      const response = await api.post('/subscriptions', subscriptionData)
      return response.data
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw error
    }
  },

  // Get subscriptions list
  getSubscriptions: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.organization_id) params.append('organization_id', filters.organization_id)
      if (filters.tier) params.append('tier', filters.tier)
      if (filters.status) params.append('status', filters.status)
      if (filters.skip) params.append('skip', filters.skip)
      if (filters.limit) params.append('limit', filters.limit)
      
      const response = await api.get(`/subscriptions?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      throw error
    }
  },

  // Get subscription by ID
  getSubscription: async (subscriptionId) => {
    try {
      const response = await api.get(`/subscriptions/${subscriptionId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching subscription:', error)
      throw error
    }
  },

  // Update subscription
  updateSubscription: async (subscriptionId, data) => {
    try {
      const response = await api.put(`/subscriptions/${subscriptionId}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating subscription:', error)
      throw error
    }
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId) => {
    try {
      const response = await api.post(`/subscriptions/${subscriptionId}/cancel`)
      return response.data
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    }
  },

  // Get subscription features
  getSubscriptionFeatures: async (subscriptionId) => {
    try {
      const response = await api.get(`/subscriptions/${subscriptionId}/features`)
      return response.data
    } catch (error) {
      console.error('Error fetching subscription features:', error)
      throw error
    }
  },

  // Get organization subscription
  getOrganizationSubscription: async (organizationId) => {
    try {
      const response = await api.get(`/subscriptions/organization/${organizationId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching organization subscription:', error)
      throw error
    }
  },

  // ==================== Super Admin API ====================
  
  // Get all organizations (Super Admin only) - alias for getOrganizations
  getAllOrganizations: async () => {
    try {
      const response = await api.get('/organizations')
      return response.data
    } catch (error) {
      console.error('Error fetching organizations:', error)
      throw error
    }
  },

  // Get platform stats (Super Admin only)
  getPlatformStats: async () => {
    try {
      // This endpoint might need to be created on backend or use aggregated org stats
      const response = await api.get('/organizations')
      // Calculate stats from organizations
      const orgs = Array.isArray(response.data) ? response.data : []
      const stats = {
        totalOrganizations: orgs.length,
        totalUsers: orgs.reduce((sum, org) => sum + (org.current_users || 0), 0),
        activeSubscriptions: orgs.filter(org => org.subscription_status === 'active').length,
        revenue: orgs.reduce((sum, org) => {
          const tierPrices = { basic: 29, professional: 99, enterprise: 299 }
          return sum + (tierPrices[org.subscription_tier] || 0)
        }, 0)
      }
      return stats
    } catch (error) {
      console.error('Error fetching platform stats:', error)
      throw error
    }
  },
}

export default api