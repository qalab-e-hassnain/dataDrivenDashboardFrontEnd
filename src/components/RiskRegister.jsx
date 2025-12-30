import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import './RiskRegister.css'

const RiskRegister = ({ projectId }) => {
  const [risks, setRisks] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    status: null,
    category: null,
    min_risk_score: null // Show all risks by default
  })
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedRisk, setSelectedRisk] = useState(null)
  const [mitigationActions, setMitigationActions] = useState([])

  useEffect(() => {
    if (projectId) {
      fetchRisks()
      fetchSummary()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, filters])

  const fetchRisks = async (useFilters = true) => {
    setLoading(true)
    setError(null)
    try {
      // Build params - only include filters if useFilters is true and they have values
      const params = useFilters 
        ? Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== null && v !== '')
          )
        : {}
      
      const data = await apiService.getRisks(projectId, params)
      
      // Handle different response formats
      let risksArray = []
      if (Array.isArray(data)) {
        risksArray = data
      } else if (data && Array.isArray(data.risks)) {
        risksArray = data.risks
      } else if (data && Array.isArray(data.data)) {
        risksArray = data.data
      }
      
      // Remove duplicates based on risk ID (keep first occurrence)
      const seenIds = new Set()
      const uniqueRisks = risksArray.filter((risk) => {
        const riskId = risk.id || risk._id || risk.risk_id
        if (!riskId) {
          // If no ID, create a composite key from title + description + category
          const compositeKey = `${risk.title || ''}_${risk.description || ''}_${risk.category || ''}`
          if (seenIds.has(compositeKey)) {
            return false
          }
          seenIds.add(compositeKey)
          return true
        }
        if (seenIds.has(riskId)) {
          return false
        }
        seenIds.add(riskId)
        return true
      })
      
      if (risksArray.length !== uniqueRisks.length) {
        console.log(`Removed ${risksArray.length - uniqueRisks.length} duplicate risk(s)`)
      }
      
      setRisks(uniqueRisks)
    } catch (err) {
      console.error('Failed to fetch risks:', err)
      setError('Failed to load risks. Please try again.')
      setRisks([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const data = await apiService.getRiskSummary(projectId)
      // Only update if we got valid data
      if (data && typeof data.total_risks === 'number') {
        setSummary(data)
      }
    } catch (err) {
      console.error('Failed to fetch risk summary:', err)
    }
  }

  const handleCreateRisk = async (riskData) => {
    try {
      await apiService.createRisk(projectId, riskData)
      setShowCreateForm(false)
      // Clear filters to show all risks including the new one
      setFilters({
        status: null,
        category: null,
        min_risk_score: null
      })
      // Wait a bit for backend to process, then refresh
      setTimeout(async () => {
        await fetchRisks()
        await fetchSummary()
      }, 1000)
    } catch (err) {
      console.error('Failed to create risk:', err)
      // Re-throw the full error object so form can parse validation errors
      throw err
    }
  }

  const handleAutoDetect = async () => {
    try {
      setLoading(true)
      const result = await apiService.autoDetectRisks(projectId)
      const detectedCount = result.detected_count || result.risks?.length || 0
      
      // Clear filters to show all risks including newly detected ones
      setFilters({
        status: null,
        category: null,
        min_risk_score: null
      })
      
      // Wait a bit for backend to process, then refresh
      setTimeout(async () => {
        await fetchRisks()
        await fetchSummary()
        if (detectedCount > 0) {
          alert(`Auto-detected ${detectedCount} new risk${detectedCount > 1 ? 's' : ''}.`)
        } else {
          alert('No new risks detected.')
        }
      }, 1500)
    } catch (err) {
      console.error('Failed to auto-detect risks:', err)
      setLoading(false)
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to auto-detect risks. Please try again.'
      alert(errorMessage)
    }
  }

  const handleViewMitigation = async (riskId) => {
    try {
      const data = await apiService.getMitigationActions(riskId)
      setMitigationActions(data.mitigation_actions || [])
      setSelectedRisk(riskId)
    } catch (err) {
      console.error('Failed to fetch mitigation actions:', err)
      alert('Failed to load mitigation actions.')
    }
  }

  const getRiskScoreGradient = (score) => {
    if (score >= 0.7) return 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)' // High/Critical
    if (score >= 0.5) return 'linear-gradient(135deg, #fd7e14 0%, #f59e0b 100%)' // Medium-High
    if (score >= 0.3) return 'linear-gradient(135deg, #ffc107 0%, #ffd54f 100%)' // Low-Medium
    return 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' // Low
  }

  const getStatusGradient = (status) => {
    const gradients = {
      identified: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      analyzed: 'linear-gradient(135deg, #ffc107 0%, #ffd54f 100%)',
      mitigated: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      closed: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
      occurred: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)'
    }
    return gradients[status] || 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)'
  }

  if (loading && risks.length === 0) {
    return <div className="risk-register-loading">Loading risks...</div>
  }

  return (
    <div className="risk-register">
      <div className="risk-register-header">
        <h2>Risk Register</h2>
        <div className="risk-register-actions">
          <button onClick={handleAutoDetect} className="btn-auto-detect">
            Auto-Detect Risks
          </button>
          <button onClick={() => setShowCreateForm(true)} className="btn-create">
            Create Risk
          </button>
        </div>
      </div>

      {summary && (
        <div className="risk-summary-cards">
          <div className="summary-card">
            <div className="summary-value">{summary.total_risks || 0}</div>
            <div className="summary-label">Total Risks</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{summary.by_priority?.high || 0}</div>
            <div className="summary-label">High Priority</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{summary.by_priority?.medium || 0}</div>
            <div className="summary-label">Medium Priority</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">
              {summary.average_risk_score ? (summary.average_risk_score * 100).toFixed(1) : 0}%
            </div>
            <div className="summary-label">Avg Risk Score</div>
          </div>
        </div>
      )}

      <div className="risk-filters">
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value || null })}
        >
          <option value="">All Statuses</option>
          <option value="identified">Identified</option>
          <option value="analyzed">Analyzed</option>
          <option value="mitigated">Mitigated</option>
          <option value="closed">Closed</option>
          <option value="occurred">Occurred</option>
        </select>
        <select
          value={filters.category || ''}
          onChange={(e) => setFilters({ ...filters, category: e.target.value || null })}
        >
          <option value="">All Categories</option>
          <option value="schedule">Schedule</option>
          <option value="cost">Cost</option>
          <option value="quality">Quality</option>
          <option value="resource">Resource</option>
          <option value="technical">Technical</option>
          <option value="external">External</option>
          <option value="organizational">Organizational</option>
        </select>
        <input
          type="number"
          min="0"
          max="1"
          step="0.1"
          value={filters.min_risk_score || ''}
          onChange={(e) => setFilters({ ...filters, min_risk_score: parseFloat(e.target.value) || null })}
          placeholder="Min Risk Score"
        />
      </div>

      {error && <div className="risk-error">{error}</div>}

      <div className="risks-list">
        {risks.length === 0 ? (
          <div className="no-risks">No risks found. Create a new risk or use auto-detect.</div>
        ) : (
          risks.map((risk, index) => {
            const riskId = risk.id || risk._id || risk.risk_id || `risk-${index}`
            return (
            <div key={riskId} className="risk-card">
              <div className="risk-card-header">
                <h3>{risk.title}</h3>
                <div className="risk-badges">
                  <span
                    className="risk-score-badge"
                    style={{ background: getRiskScoreGradient(risk.risk_score) }}
                  >
                    {(risk.risk_score * 100).toFixed(0)}%
                  </span>
                  <span
                    className="status-badge"
                    style={{ background: getStatusGradient(risk.status) }}
                  >
                    {risk.status}
                  </span>
                  <span className="category-badge">{risk.category}</span>
                </div>
              </div>
              <p className="risk-description">{risk.description}</p>
              <div className="risk-details">
                <div>
                  <strong>Probability:</strong> {risk.probability} | <strong>Impact:</strong> {risk.impact}
                </div>
                {risk.potential_cost_impact && (
                  <div>
                    <strong>Cost Impact:</strong> PKR {risk.potential_cost_impact.toLocaleString()}
                  </div>
                )}
                {risk.potential_schedule_impact_days && (
                  <div>
                    <strong>Schedule Impact:</strong> {risk.potential_schedule_impact_days} days
                  </div>
                )}
              </div>
              <div className="risk-actions">
                <button onClick={() => handleViewMitigation(risk.id || risk._id || risk.risk_id)} className="btn-mitigation">
                  View Mitigation Actions
                </button>
              </div>
            </div>
            )
          })
        )}
      </div>

      {showCreateForm && (
        <CreateRiskForm
          projectId={projectId}
          onSubmit={handleCreateRisk}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {selectedRisk && mitigationActions.length > 0 && (
        <MitigationActionsModal
          riskId={selectedRisk}
          actions={mitigationActions}
          onClose={() => {
            setSelectedRisk(null)
            setMitigationActions([])
          }}
        />
      )}
    </div>
  )
}

const CreateRiskForm = ({ projectId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'schedule',
    probability: 'medium',
    impact: 'medium',
    potential_schedule_impact_days: '',
    potential_cost_impact: '',
    earliest_occurrence_date: '',
    latest_occurrence_date: '',
    mitigation_strategy: '',
    mitigation_actions: [''],
    mitigation_owner: '',
    mitigation_deadline: '',
    contingency_plan: '',
    contingency_cost: '',
    identified_by: ''
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Helper function to format date to ISO 8601
  const formatDateForAPI = (dateString) => {
    if (!dateString) return undefined
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return undefined
      return date.toISOString()
    } catch (err) {
      return undefined
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError('Title is required')
        setSubmitting(false)
        return
      }
      if (!formData.description.trim()) {
        setError('Description is required')
        setSubmitting(false)
        return
      }

      // Validate date range
      if (formData.earliest_occurrence_date && formData.latest_occurrence_date) {
        const earliest = new Date(formData.earliest_occurrence_date)
        const latest = new Date(formData.latest_occurrence_date)
        if (latest < earliest) {
          setError('Latest occurrence date must be after earliest occurrence date')
          setSubmitting(false)
          return
        }
      }

      // Prepare data with proper formatting
      const data = {
        project_id: projectId, // Required by API
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        probability: formData.probability,
        impact: formData.impact,
        potential_schedule_impact_days: formData.potential_schedule_impact_days 
          ? parseFloat(formData.potential_schedule_impact_days) 
          : undefined,
        potential_cost_impact: formData.potential_cost_impact 
          ? parseFloat(formData.potential_cost_impact) 
          : undefined,
        earliest_occurrence_date: formatDateForAPI(formData.earliest_occurrence_date),
        latest_occurrence_date: formatDateForAPI(formData.latest_occurrence_date),
        mitigation_strategy: formData.mitigation_strategy.trim() || undefined,
        mitigation_actions: formData.mitigation_actions
          .filter(a => a && a.trim() !== '')
          .map(a => a.trim()),
        mitigation_owner: formData.mitigation_owner.trim() || undefined,
        mitigation_deadline: formatDateForAPI(formData.mitigation_deadline),
        contingency_plan: formData.contingency_plan.trim() || undefined,
        contingency_cost: formData.contingency_cost 
          ? parseFloat(formData.contingency_cost) 
          : undefined,
        identified_by: formData.identified_by.trim() || undefined
      }

      // Remove undefined values (but keep project_id even if somehow undefined, as it's required)
      Object.keys(data).forEach(key => {
        if (key !== 'project_id' && (data[key] === undefined || data[key] === '')) {
          delete data[key]
        }
      })
      
      // Ensure project_id is always included
      if (!data.project_id && projectId) {
        data.project_id = projectId
      }

      await onSubmit(data)
    } catch (err) {
      // Parse API validation errors
      let errorMessage = 'Failed to create risk. Please check all fields and try again.'
      
      if (err.response?.data) {
        const errorData = err.response.data
        
        // Handle validation errors (array format)
        if (Array.isArray(errorData.detail)) {
          const validationErrors = errorData.detail.map(error => {
            const field = error.loc && error.loc.length > 1 ? error.loc[error.loc.length - 1] : 'field'
            const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            return `${fieldName}: ${error.msg}`
          })
          errorMessage = `Validation errors:\n${validationErrors.join('\n')}`
        } 
        // Handle single error message
        else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail)
        }
        // Handle error message field
        else if (errorData.message) {
          errorMessage = errorData.message
        }
      } 
      // Handle network/other errors
      else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const addMitigationAction = () => {
    setFormData({
      ...formData,
      mitigation_actions: [...formData.mitigation_actions, '']
    })
  }

  const removeMitigationAction = (index) => {
    setFormData({
      ...formData,
      mitigation_actions: formData.mitigation_actions.filter((_, i) => i !== index)
    })
  }

  const updateMitigationAction = (index, value) => {
    const newActions = [...formData.mitigation_actions]
    newActions[index] = value
    setFormData({ ...formData, mitigation_actions: newActions })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content create-risk-modal">
        <h3>Create New Risk</h3>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Enter risk title"
            />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              placeholder="Enter detailed risk description"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="schedule">Schedule</option>
                <option value="cost">Cost</option>
                <option value="quality">Quality</option>
                <option value="resource">Resource</option>
                <option value="technical">Technical</option>
                <option value="external">External</option>
                <option value="organizational">Organizational</option>
              </select>
            </div>
            <div className="form-group">
              <label>Probability *</label>
              <select
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                required
              >
                <option value="very_low">Very Low (0-20%)</option>
                <option value="low">Low (21-40%)</option>
                <option value="medium">Medium (41-60%)</option>
                <option value="high">High (61-80%)</option>
                <option value="very_high">Very High (81-100%)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Impact *</label>
              <select
                value={formData.impact}
                onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                required
              >
                <option value="very_low">Very Low</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="very_high">Very High</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Schedule Impact (days)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.potential_schedule_impact_days}
                onChange={(e) => setFormData({ ...formData, potential_schedule_impact_days: e.target.value })}
                placeholder="e.g., 5.0"
              />
            </div>
            <div className="form-group">
              <label>Cost Impact (PKR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.potential_cost_impact}
                onChange={(e) => setFormData({ ...formData, potential_cost_impact: e.target.value })}
                placeholder="e.g., 10000.0"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Earliest Occurrence Date</label>
              <input
                type="date"
                value={formData.earliest_occurrence_date}
                onChange={(e) => setFormData({ ...formData, earliest_occurrence_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Latest Occurrence Date</label>
              <input
                type="date"
                value={formData.latest_occurrence_date}
                onChange={(e) => setFormData({ ...formData, latest_occurrence_date: e.target.value })}
                min={formData.earliest_occurrence_date || undefined}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Mitigation Strategy</label>
            <textarea
              value={formData.mitigation_strategy}
              onChange={(e) => setFormData({ ...formData, mitigation_strategy: e.target.value })}
              rows={3}
              placeholder="Describe the planned mitigation approach"
            />
          </div>
          <div className="form-group">
            <label>
              Mitigation Actions
              <button 
                type="button" 
                onClick={addMitigationAction} 
                className="btn-add-action"
                title="Add another action"
              >
                + Add Action
              </button>
            </label>
            {formData.mitigation_actions.map((action, index) => (
              <div key={index} className="mitigation-action-input">
                <input
                  type="text"
                  value={action}
                  onChange={(e) => updateMitigationAction(index, e.target.value)}
                  placeholder={`Mitigation action ${index + 1}`}
                />
                {formData.mitigation_actions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMitigationAction(index)}
                    className="btn-remove-action"
                    title="Remove this action"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mitigation Owner</label>
              <input
                type="text"
                value={formData.mitigation_owner}
                onChange={(e) => setFormData({ ...formData, mitigation_owner: e.target.value })}
                placeholder="Person responsible for mitigation"
              />
            </div>
            <div className="form-group">
              <label>Mitigation Deadline</label>
              <input
                type="date"
                value={formData.mitigation_deadline}
                onChange={(e) => setFormData({ ...formData, mitigation_deadline: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contingency Plan</label>
              <textarea
                value={formData.contingency_plan}
                onChange={(e) => setFormData({ ...formData, contingency_plan: e.target.value })}
                rows={2}
                placeholder="Plan if risk occurs"
              />
            </div>
            <div className="form-group">
              <label>Contingency Cost (PKR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.contingency_cost}
                onChange={(e) => setFormData({ ...formData, contingency_cost: e.target.value })}
                placeholder="e.g., 5000.0"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Identified By</label>
            <input
              type="text"
              value={formData.identified_by}
              onChange={(e) => setFormData({ ...formData, identified_by: e.target.value })}
              placeholder="Person who identified the risk"
            />
          </div>
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Risk'}
            </button>
            <button 
              type="button" 
              onClick={onCancel} 
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const MitigationActionsModal = ({ riskId, actions, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Mitigation Actions</h3>
        <ul className="mitigation-actions-list">
          {actions.map((action, index) => (
            <li key={index}>{action}</li>
          ))}
        </ul>
        <div className="form-actions">
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  )
}

export default RiskRegister

