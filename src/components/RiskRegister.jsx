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
    min_risk_score: 0.5
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

  const fetchRisks = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== null && v !== '')
      )
      const data = await apiService.getRisks(projectId, params)
      setRisks(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch risks:', err)
      setError('Failed to load risks. Please try again.')
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
      // Wait a bit for backend to process, then refresh
      setTimeout(async () => {
        await fetchRisks()
        await fetchSummary()
      }, 500)
    } catch (err) {
      console.error('Failed to create risk:', err)
      alert('Failed to create risk. Please try again.')
    }
  }

  const handleAutoDetect = async () => {
    try {
      const result = await apiService.autoDetectRisks(projectId)
      if (result.risks && result.risks.length > 0) {
        // Wait a bit for backend to process, then refresh
        setTimeout(async () => {
          await fetchRisks()
          await fetchSummary()
        }, 500)
        alert(`Auto-detected ${result.detected_count} new risks.`)
      } else {
        alert('No new risks detected.')
      }
    } catch (err) {
      console.error('Failed to auto-detect risks:', err)
      alert('Failed to auto-detect risks. Please try again.')
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
          risks.map((risk) => (
            <div key={risk.id} className="risk-card">
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
                <button onClick={() => handleViewMitigation(risk.id)} className="btn-mitigation">
                  View Mitigation Actions
                </button>
              </div>
            </div>
          ))
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
    mitigation_strategy: '',
    mitigation_actions: [],
    mitigation_owner: '',
    mitigation_deadline: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      potential_schedule_impact_days: formData.potential_schedule_impact_days ? parseFloat(formData.potential_schedule_impact_days) : undefined,
      potential_cost_impact: formData.potential_cost_impact ? parseFloat(formData.potential_cost_impact) : undefined,
      mitigation_actions: formData.mitigation_actions.filter(a => a.trim() !== ''),
      mitigation_deadline: formData.mitigation_deadline || undefined
    }
    onSubmit(data)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Create New Risk</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
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
                <option value="very_low">Very Low</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="very_high">Very High</option>
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
                value={formData.potential_schedule_impact_days}
                onChange={(e) => setFormData({ ...formData, potential_schedule_impact_days: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Cost Impact (PKR)</label>
              <input
                type="number"
                value={formData.potential_cost_impact}
                onChange={(e) => setFormData({ ...formData, potential_cost_impact: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Mitigation Strategy</label>
            <textarea
              value={formData.mitigation_strategy}
              onChange={(e) => setFormData({ ...formData, mitigation_strategy: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Create Risk</button>
            <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
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

