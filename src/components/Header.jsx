import React, { useState, useEffect, useRef } from 'react'
import { apiService } from '../services/api'
import './Header.css'

function Header({ projectId, onProjectChange, onRefresh, refreshing = false, onUploadSuccess }) {
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [selectedProjectName, setSelectedProjectName] = useState('')
  const [projectsError, setProjectsError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  // Update selected project name when projectId or projects change
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const selected = projects.find(p => p.id === projectId)
      if (selected) {
        setSelectedProjectName(selected.name || selected.id)
      }
    }
  }, [projectId, projects])

  const fetchProjects = async (showError = true) => {
    try {
      setLoadingProjects(true)
      setProjectsError(null)
      console.log('Fetching projects from API...')
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
      
      const response = await Promise.race([
        apiService.getAllProjects(),
        timeoutPromise
      ])
      
      console.log('Projects API response:', response)
      console.log('Response type:', typeof response)
      console.log('Is array:', Array.isArray(response))
      
      // Handle different response formats
      let projectsData = null
      
      if (Array.isArray(response)) {
        // Direct array response
        projectsData = response
      } else if (response && typeof response === 'object') {
        // Check if response is wrapped in an object
        if (response.data && Array.isArray(response.data)) {
          projectsData = response.data
        } else if (response.projects && Array.isArray(response.projects)) {
          projectsData = response.projects
        } else if (response.items && Array.isArray(response.items)) {
          projectsData = response.items
        } else if (response.results && Array.isArray(response.results)) {
          projectsData = response.results
        } else {
          // Try to extract array from object values
          const values = Object.values(response)
          const arrayValue = values.find(v => Array.isArray(v))
          if (arrayValue) {
            projectsData = arrayValue
          }
        }
      }
      
      console.log('Extracted projects data:', projectsData)
      console.log('Number of projects:', projectsData?.length || 0)
      
      if (projectsData && Array.isArray(projectsData) && projectsData.length > 0) {
        // Filter out any invalid entries and ensure all have id
        const validProjects = projectsData.filter(p => p && (p.id || p._id))
        console.log('Valid projects:', validProjects.length)
        
        // Normalize project data (handle both 'id' and '_id' fields)
        const normalizedProjects = validProjects.map(p => ({
          id: p.id || p._id,
          name: p.name || p.title || p.project_name || p.id || p._id,
          ...p
        }))
        
        console.log('Normalized projects:', normalizedProjects)
        console.log('Setting projects:', normalizedProjects.length, 'projects')
        setProjects(normalizedProjects)
        setProjectsError(null)
        
        // If no project is selected or selected project doesn't exist, select the first one
        const currentProjectExists = projectId && normalizedProjects.some(p => p.id === projectId)
        if (!projectId || !currentProjectExists) {
          if (normalizedProjects[0]?.id) {
            console.log('Selecting first project:', normalizedProjects[0])
            onProjectChange(normalizedProjects[0].id)
            setSelectedProjectName(normalizedProjects[0].name || normalizedProjects[0].id)
          }
        } else {
          // Update project name if project is already selected
          const currentProject = normalizedProjects.find(p => p.id === projectId)
          if (currentProject) {
            setSelectedProjectName(currentProject.name || currentProject.id)
          }
        }
      } else {
        // Check if response is empty array
        if (Array.isArray(response) && response.length === 0) {
          const errorMsg = 'API returned empty projects array. No projects found in database.'
          console.warn(errorMsg)
          if (showError) {
            setProjectsError('No projects in database')
          }
          setProjects([])
        } else {
          const errorMsg = `No valid projects found. Response: ${JSON.stringify(response).substring(0, 200)}`
          console.warn(errorMsg)
          console.warn('Full response:', response)
          if (showError) {
            setProjectsError('Invalid API response format')
          }
          setProjects([])
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config?.url,
      })
      
      // Check for CORS error
      if (error.message && error.message.includes('CORS')) {
        setProjectsError('CORS error: API not allowing requests from this domain')
      } else if (error.response) {
        // API responded with error status
        const status = error.response.status
        const statusText = error.response.statusText
        setProjectsError(`API Error: ${status} ${statusText}`)
      } else if (error.message === 'Request timeout') {
        setProjectsError('Request timeout: API took too long to respond')
      } else {
        setProjectsError(error.message || 'Failed to load projects')
      }
      
      setProjects([])
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleProjectSelect = (e) => {
    const newProjectId = e.target.value
    if (newProjectId && newProjectId !== projectId) {
      const selectedProject = projects.find(p => p.id === newProjectId)
      if (selectedProject) {
        setSelectedProjectName(selectedProject.name || selectedProject.id)
      }
      onProjectChange(newProjectId)
    }
  }

  const handleUploadClick = () => {
    if (!projectId) {
      alert('Please select a project first')
      return
    }
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!projectId) {
      alert('Please select a project first')
      return
    }

    // Check file type
    const fileName = file.name.toLowerCase()
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
    const isCSV = fileName.endsWith('.csv')

    if (!isExcel && !isCSV) {
      alert('Please select an Excel (.xlsx, .xls) or CSV (.csv) file')
      return
    }

    // Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 10MB`)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    console.log('Starting file upload...')
    console.log('File:', file.name)
    console.log('File size:', file.size, 'bytes')
    console.log('File type:', file.type)
    console.log('Project ID:', projectId)

    try {
      // Progress callback
      const handleProgress = (progress) => {
        setUploadProgress(Math.min(progress, 99)) // Keep at 99% until complete
      }

      let response
      if (isExcel) {
        console.log('Uploading as Excel file...')
        response = await apiService.uploadExcelFile(projectId, file, handleProgress)
      } else {
        console.log('Uploading as CSV file...')
        response = await apiService.uploadCSVFile(projectId, file, handleProgress)
      }

      console.log('Upload successful:', response)
      
      // Ensure progress is at 100% on completion
      setUploadProgress(100)
      
      // Show success message
      const successMessage = response?.message || `File "${file.name}" uploaded successfully!`
      if (onUploadSuccess) {
        onUploadSuccess(successMessage, 'success')
      }

      // Refresh dashboard data after successful upload
      if (onRefresh) {
        setTimeout(() => {
          console.log('Refreshing dashboard data after upload...')
          onRefresh()
        }, 1500)
      }
    } catch (error) {
      console.error('Upload error:', error)
      console.error('Error response:', error.response)
      
      let errorMessage = 'Failed to upload file'
      
      if (error.response) {
        // Server responded with error
        const status = error.response.status
        const data = error.response.data
        
        if (status === 413) {
          errorMessage = 'File too large. Maximum size is 10MB.'
        } else if (status === 415) {
          errorMessage = 'Unsupported file type. Please upload Excel or CSV files only.'
        } else if (status === 400) {
          errorMessage = data?.detail || data?.message || 'Invalid file format or missing required data.'
        } else if (status === 404) {
          errorMessage = 'Upload endpoint not found. Please check API configuration.'
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.'
        } else {
          errorMessage = data?.detail || data?.message || `Upload failed: ${status} ${error.response.statusText}`
        }
      } else if (error.request) {
        // Request made but no response
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Upload timeout. File may be too large or network is slow.'
        } else if (error.message && (error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
          errorMessage = 'Network error. This could be due to:\n- CORS policy blocking the request\n- Server is unreachable\n- Please check your internet connection'
        } else if (error.code === 'ERR_NETWORK') {
          errorMessage = 'Network error. Unable to connect to server. Please check:\n- Your internet connection\n- If the API server is running\n- CORS settings on the server'
        } else {
          errorMessage = `Network error: ${error.message || 'No response from server. Please check your connection.'}`
        }
      } else {
        // Error in request setup
        if (error.message && error.message.includes('CORS')) {
          errorMessage = 'CORS error: The server is not allowing file uploads from this domain. Please contact the API administrator.'
        } else {
          errorMessage = error.message || 'Failed to upload file'
        }
      }
      
      // Log detailed error for debugging
      console.error('Upload failed with error:', {
        message: error.message,
        code: error.code,
        response: error.response,
        request: error.request,
      })
      
      if (onUploadSuccess) {
        onUploadSuccess(errorMessage, 'error')
      } else {
        alert(errorMessage)
      }
    } finally {
      setUploading(false)
      // Don't reset progress immediately - let user see 100% briefly
      setTimeout(() => {
        setUploadProgress(0)
      }, 1000)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="dashboard-header">
      <div className="header-content">
        <div className="header-left">
          <div className="header-title-section">
            <h1 className="header-title">🚀 AI-Driven Project Management Dashboard</h1>
            <p className="header-subtitle">Advanced Analytics & Predictive Insights</p>
          </div>
        </div>
        <div className="header-right">
          <div className="project-selector-wrapper">
            <select 
              id="project-select"
              className="project-selector"
              value={projectId || ''}
              onChange={handleProjectSelect}
              disabled={loadingProjects || refreshing}
            >
              {loadingProjects ? (
                <option value="">Loading projects...</option>
              ) : projects.length > 0 ? (
                <>
                  {projects.map((project) => {
                    const projectIdValue = project.id || project._id
                    const projectName = project.name || project.title || project.project_name || projectIdValue
                    return (
                      <option key={projectIdValue} value={projectIdValue}>
                        {projectName}
                      </option>
                    )
                  })}
                </>
              ) : (
                <>
                  <option value={projectId || ''} disabled>
                    {projectsError ? 'Error loading projects' : 'No projects available'}
                  </option>
                  {projectId && (
                    <option value={projectId}>
                      {selectedProjectName || projectId}
                    </option>
                  )}
                </>
              )}
            </select>
          </div>
          {projectsError && (
            <div className="projects-error-tooltip" title={projectsError}>
              <span className="projects-error-icon">⚠️</span>
              <div className="projects-error-message">{projectsError}</div>
            </div>
          )}
          <div className="upload-button-wrapper">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={uploading || !projectId}
            />
            <button 
              className={`upload-button ${uploading ? 'uploading' : ''}`} 
              onClick={handleUploadClick}
              disabled={uploading || loadingProjects || !projectId}
              title={projectId ? "Upload Excel or CSV file to selected project" : "Please select a project first"}
            >
              {uploading ? `Uploading... ${uploadProgress}%` : '📁 Upload Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
