import React, { useState } from 'react'
import { apiService } from '../services/api'
import './CreateProjectModal.css'

function CreateProjectModal({ isOpen, onClose, onProjectCreated, onUploadSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    budget: '',
    estimated_cost: '',
    start_date: '',
    end_date: '',
    planned_end_date: '',
  })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [creating, setCreating] = useState(false)
  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Check file type
    const fileName = selectedFile.name.toLowerCase()
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
    const isCSV = fileName.endsWith('.csv')

    if (!isExcel && !isCSV) {
      setErrors(prev => ({
        ...prev,
        file: 'Please select an Excel (.xlsx, .xls) or CSV (.csv) file'
      }))
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (selectedFile.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        file: `File size (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 10MB`
      }))
      return
    }

    setFile(selectedFile)
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.file
      return newErrors
    })
  }

  const validateForm = () => {
    const newErrors = {}

    // Validate name (required, not empty/whitespace, max 200 chars)
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    } else if (formData.name.trim().length > 200) {
      newErrors.name = 'Project name cannot exceed 200 characters'
    }

    // Validate description max length (if provided)
    if (formData.description && formData.description.length > 5000) {
      newErrors.description = 'Description cannot exceed 5000 characters'
    }

    // Validate dates if provided
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date)
      const end = new Date(formData.end_date)
      if (end < start) {
        newErrors.end_date = 'End date cannot be earlier than start date'
      }
    }

    if (formData.start_date && formData.planned_end_date) {
      const start = new Date(formData.start_date)
      const plannedEnd = new Date(formData.planned_end_date)
      if (plannedEnd < start) {
        newErrors.planned_end_date = 'Planned end date cannot be earlier than start date'
      }
    }

    // Validate numeric fields (must be >= 0)
    if (formData.budget) {
      const budgetValue = parseFloat(formData.budget)
      if (isNaN(budgetValue)) {
        newErrors.budget = 'Budget must be a valid number'
      } else if (budgetValue < 0) {
        newErrors.budget = 'Budget cannot be negative'
      }
    }

    if (formData.estimated_cost) {
      const costValue = parseFloat(formData.estimated_cost)
      if (isNaN(costValue)) {
        newErrors.estimated_cost = 'Estimated cost must be a valid number'
      } else if (costValue < 0) {
        newErrors.estimated_cost = 'Estimated cost cannot be negative'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setCreating(true)
    setUploading(false)
    setUploadProgress(0)

    try {
      // Prepare project data (only include fields that have values)
      const projectData = {
        name: formData.name.trim(),
      }

      if (formData.description.trim()) {
        projectData.description = formData.description.trim()
      }

      if (formData.status) {
        projectData.status = formData.status
      }

      if (formData.budget) {
        projectData.budget = parseFloat(formData.budget)
      }

      if (formData.estimated_cost) {
        projectData.estimated_cost = parseFloat(formData.estimated_cost)
      }

      if (formData.start_date) {
        projectData.start_date = formData.start_date
      }

      if (formData.end_date) {
        projectData.end_date = formData.end_date
      }

      if (formData.planned_end_date) {
        projectData.planned_end_date = formData.planned_end_date
      }

      console.log('Creating project with data:', projectData)

      // Create the project
      const newProject = await apiService.createProject(projectData)
      console.log('Project created successfully:', newProject)

      const projectId = newProject.id || newProject._id || newProject.project_id

      if (!projectId) {
        throw new Error('Project created but no ID returned')
      }

      // If file is selected, upload it
      if (file) {
        setUploading(true)
        setUploadProgress(0)

        try {
          const handleProgress = (progress) => {
            setUploadProgress(Math.min(progress, 99))
          }

          const fileName = file.name.toLowerCase()
          const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')

          let uploadResponse
          if (isExcel) {
            uploadResponse = await apiService.uploadExcelFile(projectId, file, handleProgress)
          } else {
            uploadResponse = await apiService.uploadCSVFile(projectId, file, handleProgress)
          }

          setUploadProgress(100)
          console.log('File uploaded successfully:', uploadResponse)

          if (onUploadSuccess) {
            onUploadSuccess(`Project "${formData.name}" created and file "${file.name}" uploaded successfully!`, 'success')
          }
        } catch (uploadError) {
          console.error('File upload error:', uploadError)
          // Project was created but file upload failed
          const errorMessage = uploadError.response?.data?.detail || uploadError.message || 'Failed to upload file'
          if (onUploadSuccess) {
            onUploadSuccess(`Project "${formData.name}" created, but file upload failed: ${errorMessage}`, 'warning')
          }
        } finally {
          setUploading(false)
        }
      } else {
        // No file to upload, just show success
        if (onUploadSuccess) {
          onUploadSuccess(`Project "${formData.name}" created successfully!`, 'success')
        }
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        status: 'planning',
        budget: '',
        estimated_cost: '',
        start_date: '',
        end_date: '',
        planned_end_date: '',
      })
      setFile(null)
      setErrors({})

      // Notify parent component
      if (onProjectCreated) {
        onProjectCreated(newProject)
      }

      // Close modal
      onClose()
    } catch (error) {
      console.error('Error creating project:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response,
        request: error.request
      })
      
      const newErrors = {}
      let generalErrorMessage = ''
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status
        const data = error.response.data
        const detail = data?.detail
        
        console.log(`Error response status: ${status}`, data)
        
        if (status === 400) {
          // Validation errors (400 Bad Request)
          // Handle Pydantic validation errors (array format)
          if (Array.isArray(detail)) {
            // Pydantic returns array of validation errors
            detail.forEach((validationError) => {
              const field = validationError.loc && validationError.loc.length > 1 
                ? validationError.loc[validationError.loc.length - 1] 
                : validationError.loc?.[0] || 'unknown'
              const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              const message = validationError.msg || validationError.message || 'Invalid value'
              
              // Map field names to form field names
              const formFieldMap = {
                'name': 'name',
                'description': 'description',
                'budget': 'budget',
                'estimated cost': 'estimated_cost',
                'estimated_cost': 'estimated_cost',
                'start date': 'start_date',
                'start_date': 'start_date',
                'end date': 'end_date',
                'end_date': 'end_date',
                'planned end date': 'planned_end_date',
                'planned_end_date': 'planned_end_date'
              }
              
              const formField = formFieldMap[field] || formFieldMap[fieldName.toLowerCase()] || field
              newErrors[formField] = `${fieldName}: ${message}`
            })
            
            // If no field-specific errors extracted, show general message
            if (Object.keys(newErrors).length === 0) {
              generalErrorMessage = 'Validation failed. Please check all fields.'
            }
          } else if (typeof detail === 'string') {
            // Single error message string
            generalErrorMessage = detail
            
            // Try to extract field-specific errors from message
            if (detail.toLowerCase().includes('name')) {
              if (detail.toLowerCase().includes('empty') || detail.toLowerCase().includes('whitespace')) {
                newErrors.name = 'Project name cannot be empty or only whitespace'
              } else if (detail.toLowerCase().includes('exist') || detail.toLowerCase().includes('duplicate')) {
                newErrors.name = 'A project with this name already exists. Please use a unique project name.'
              } else if (detail.toLowerCase().includes('200') || detail.toLowerCase().includes('length') || detail.toLowerCase().includes('character')) {
                newErrors.name = 'Project name cannot exceed 200 characters'
              } else {
                newErrors.name = detail
              }
            } else if (detail.toLowerCase().includes('date')) {
              if (detail.toLowerCase().includes('end') && detail.toLowerCase().includes('start')) {
                newErrors.end_date = detail
                newErrors.planned_end_date = detail
              } else if (detail.toLowerCase().includes('end date')) {
                newErrors.end_date = detail
              } else {
                generalErrorMessage = detail
              }
            } else if (detail.toLowerCase().includes('budget')) {
              if (detail.toLowerCase().includes('negative')) {
                newErrors.budget = 'Budget cannot be negative'
              } else {
                newErrors.budget = detail
              }
            } else if (detail.toLowerCase().includes('cost')) {
              if (detail.toLowerCase().includes('negative')) {
                newErrors.estimated_cost = 'Estimated cost cannot be negative'
              } else {
                newErrors.estimated_cost = detail
              }
            }
          } else {
            // Other format
            generalErrorMessage = data?.message || detail || 'Invalid project data. Please check all fields.'
          }
          
        } else if (status === 409) {
          // Conflict - Duplicate name
          const duplicateMessage = detail || data?.message || 'A project with this name already exists. Please use a unique project name.'
          newErrors.name = duplicateMessage
          generalErrorMessage = duplicateMessage
          
        } else if (status === 503) {
          // Service Unavailable - Database connection/timeout errors
          generalErrorMessage = 'Service temporarily unavailable. Please try again in a few moments.'
          
        } else if (status === 500) {
          // Internal Server Error - Generic database or server errors
          generalErrorMessage = detail || data?.message || 'Server error occurred. Please try again later.'
          
        } else {
          // Other error statuses
          generalErrorMessage = detail || data?.message || `Failed to create project: ${error.response.statusText || status}`
        }
        
      } else if (error.request) {
        // Request was made but no response received (timeout, network error, CORS)
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          generalErrorMessage = 'Request timed out. The server may be busy. Please try again.'
        } else if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
          generalErrorMessage = 'Network error. Unable to connect to server. Please check your internet connection.'
        } else {
          generalErrorMessage = 'Unable to reach the server. Please try again later.'
        }
        
      } else {
        // Error setting up the request
        generalErrorMessage = error.message || 'Failed to create project. Please try again.'
      }
      
      // Set errors (field-specific errors take precedence, then general message)
      if (Object.keys(newErrors).length > 0) {
        if (generalErrorMessage && !newErrors.submit) {
          newErrors.submit = generalErrorMessage
        }
        setErrors(newErrors)
      } else {
        setErrors({ submit: generalErrorMessage || 'Failed to create project. Please try again.' })
      }
      
      // Show error toast if callback provided
      if (onUploadSuccess) {
        const displayMessage = Object.values(newErrors).join(' ') || generalErrorMessage || 'Failed to create project'
        onUploadSuccess(displayMessage, 'error')
      }
    } finally {
      setCreating(false)
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const handleClose = () => {
    if (creating || uploading) {
      return // Prevent closing while creating/uploading
    }
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      budget: '',
      estimated_cost: '',
      start_date: '',
      end_date: '',
      planned_end_date: '',
    })
    setFile(null)
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Project</h2>
          <button 
            className="modal-close-button" 
            onClick={handleClose}
            disabled={creating || uploading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Project Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Enter project name (max 200 characters)"
              maxLength={200}
              disabled={creating || uploading}
              required
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
            {formData.name.length > 0 && (
              <span className="character-count">{formData.name.length}/200</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`form-input form-textarea ${errors.description ? 'error' : ''}`}
              placeholder="Enter project description (optional, max 5000 characters)"
              maxLength={5000}
              rows="3"
              disabled={creating || uploading}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
            {formData.description.length > 0 && (
              <span className="character-count">{formData.description.length}/5000</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-input form-select"
                disabled={creating || uploading}
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="start_date" className="form-label">
                Start Date
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className={`form-input ${errors.start_date ? 'error' : ''}`}
                disabled={creating || uploading}
              />
              {errors.start_date && <span className="error-message">{errors.start_date}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="budget" className="form-label">
                Budget
              </label>
              <input
                type="number"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                className={`form-input ${errors.budget ? 'error' : ''}`}
                placeholder="Enter budget amount"
                min="0"
                step="0.01"
                disabled={creating || uploading}
              />
              {errors.budget && <span className="error-message">{errors.budget}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="estimated_cost" className="form-label">
                Estimated Cost
              </label>
              <input
                type="number"
                id="estimated_cost"
                name="estimated_cost"
                value={formData.estimated_cost}
                onChange={handleInputChange}
                className={`form-input ${errors.estimated_cost ? 'error' : ''}`}
                placeholder="Enter estimated cost"
                min="0"
                step="0.01"
                disabled={creating || uploading}
              />
              {errors.estimated_cost && <span className="error-message">{errors.estimated_cost}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="end_date" className="form-label">
                End Date
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className={`form-input ${errors.end_date ? 'error' : ''}`}
                disabled={creating || uploading}
              />
              {errors.end_date && <span className="error-message">{errors.end_date}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="planned_end_date" className="form-label">
                Planned End Date
              </label>
              <input
                type="date"
                id="planned_end_date"
                name="planned_end_date"
                value={formData.planned_end_date}
                onChange={handleInputChange}
                className={`form-input ${errors.planned_end_date ? 'error' : ''}`}
                disabled={creating || uploading}
              />
              {errors.planned_end_date && <span className="error-message">{errors.planned_end_date}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="file" className="form-label">
              Upload Project File (Optional)
            </label>
            <div className="file-upload-wrapper">
              <input
                type="file"
                id="file"
                name="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="file-input"
                disabled={creating || uploading}
              />
              <label htmlFor="file" className="file-upload-label">
                {file ? (
                  <span className="file-name">📄 {file.name}</span>
                ) : (
                  <span className="file-placeholder">Choose Excel or CSV file...</span>
                )}
              </label>
            </div>
            {errors.file && <span className="error-message">{errors.file}</span>}
            {file && (
              <button
                type="button"
                className="file-remove-button"
                onClick={() => setFile(null)}
                disabled={creating || uploading}
              >
                Remove
              </button>
            )}
          </div>

          {errors.submit && (
            <div className="error-banner">
              {errors.submit}
            </div>
          )}

          {(creating || uploading) && (
            <div className="progress-indicator">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress || (creating ? 50 : 0)}%` }}
                />
              </div>
              <span className="progress-text">
                {uploading ? `Uploading file... ${uploadProgress}%` : 'Creating project...'}
              </span>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={handleClose}
              disabled={creating || uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={creating || uploading}
            >
              {creating || uploading ? 'Processing...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProjectModal

