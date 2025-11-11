import React, { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import './SubscriptionPlans.css'

function SubscriptionPlans() {
  const { organization, updateOrganization, hasPermission } = useAuth()
  const [plans, setPlans] = useState([
    {
      id: 'basic',
      name: 'Basic',
      price: 29,
      period: 'month',
      description: 'Perfect for startups & small teams',
      features: [
        'Core project & task management',
        'Standard dashboards',
        'File sharing',
        'Manual reporting',
        'Up to 10 team members',
        'Basic support'
      ],
      limits: {
        projects: 5,
        users: 10,
        storage: '10GB'
      }
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 99,
      period: 'month',
      description: 'Ideal for mid-sized teams',
      features: [
        'Everything in Basic',
        'AI task recommendations',
        'Predictive workload analytics',
        'Sprint forecasting',
        'Advanced dashboards',
        'Up to 50 team members',
        'Priority support'
      ],
      limits: {
        projects: 25,
        users: 50,
        storage: '100GB'
      },
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      period: 'month',
      description: 'For large organizations',
      features: [
        'Everything in Professional',
        'Full AI capabilities',
        'Anomaly detection',
        'Unlimited integrations',
        'API access',
        'Unlimited team members',
        'Dedicated support',
        'Custom integrations'
      ],
      limits: {
        projects: 'Unlimited',
        users: 'Unlimited',
        storage: '1TB'
      }
    }
  ])
  const [loading, setLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState(null)

  useEffect(() => {
    if (organization) {
      setCurrentPlan(organization.subscription_tier || 'basic')
    }
  }, [organization])

  const handleUpgrade = async (planId) => {
    if (!hasPermission('manage_billing')) {
      alert('You don\'t have permission to manage subscriptions')
      return
    }

    if (!window.confirm(`Are you sure you want to upgrade to ${planId} plan?`)) {
      return
    }

    try {
      setLoading(true)
      // Get current subscription
      const subscription = await apiService.getOrganizationSubscription(organization.id)
      
      // Update subscription tier
      const response = await apiService.updateSubscription(subscription.id, { 
        tier: planId,
        status: 'active'
      })
      
      // Update organization with new tier
      updateOrganization({ ...organization, subscription_tier: planId })
      alert('Subscription updated successfully!')
    } catch (error) {
      console.error('Failed to update subscription:', error)
      alert('Failed to update subscription. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canManageBilling = hasPermission('manage_billing')

  return (
    <div className="subscription-plans-container">
      <div className="plans-header">
        <div>
          <h2 className="section-title">💳 Subscription Plans</h2>
          <p className="section-subtitle">Choose the plan that fits your team's needs</p>
        </div>
        {organization && (
          <div className="current-plan-badge">
            <span className="badge-label">Current Plan:</span>
            <span className="badge-value">{organization.subscription_tier || 'Basic'}</span>
          </div>
        )}
      </div>

      <div className="plans-grid">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id
          const isUpgrade = !isCurrentPlan && canManageBilling
          
          return (
            <div 
              key={plan.id} 
              className={`plan-card ${plan.popular ? 'popular' : ''} ${isCurrentPlan ? 'current' : ''}`}
            >
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              {isCurrentPlan && <div className="current-badge">Current Plan</div>}
              
              <div className="plan-header">
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
                <div className="plan-price">
                  <span className="price-amount">${plan.price}</span>
                  <span className="price-period">/{plan.period}</span>
                </div>
              </div>

              <div className="plan-features">
                <h4 className="features-title">Features:</h4>
                <ul className="features-list">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="plan-limits">
                <div className="limit-item">
                  <span className="limit-label">Projects:</span>
                  <span className="limit-value">{plan.limits.projects}</span>
                </div>
                <div className="limit-item">
                  <span className="limit-label">Users:</span>
                  <span className="limit-value">{plan.limits.users}</span>
                </div>
                <div className="limit-item">
                  <span className="limit-label">Storage:</span>
                  <span className="limit-value">{plan.limits.storage}</span>
                </div>
              </div>

              <div className="plan-actions">
                {isCurrentPlan ? (
                  <button className="btn-current" disabled>
                    Current Plan
                  </button>
                ) : isUpgrade ? (
                  <button 
                    className="btn-upgrade"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Upgrade Plan'}
                  </button>
                ) : (
                  <button className="btn-disabled" disabled>
                    Contact Sales
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {organization && (
        <div className="billing-info">
          <h3>Billing Information</h3>
          <div className="billing-details">
            <div className="billing-item">
              <span className="billing-label">Current Plan:</span>
              <span className="billing-value">{organization.subscription_tier || 'Basic'}</span>
            </div>
            <div className="billing-item">
              <span className="billing-label">Status:</span>
              <span className="billing-value">
                {organization.subscription_status || 'Active'}
              </span>
            </div>
            <div className="billing-item">
              <span className="billing-label">Billing Email:</span>
              <span className="billing-value">
                {organization.billing_email || 'Not configured'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionPlans

