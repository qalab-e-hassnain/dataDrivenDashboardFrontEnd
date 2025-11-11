import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiService } from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState(null)

  useEffect(() => {
    // Load user from localStorage or API
    const loadUser = async () => {
      try {
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
          const userData = JSON.parse(savedUser)
          setUser(userData)
          
          // Load organization data if available
          if (userData.organization_id) {
            try {
              const orgData = await apiService.getOrganization(userData.organization_id)
              setOrganization(orgData)
            } catch (error) {
              console.error('Failed to load organization:', error)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email, password) => {
    try {
      // Login returns { access_token, refresh_token, token_type }
      const authResponse = await apiService.login(email, password)
      
      // Get current user info
      const userData = await apiService.getCurrentUser()
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Load organization
      if (userData.organization_id) {
        try {
          const orgData = await apiService.getOrganization(userData.organization_id)
          setOrganization(orgData)
        } catch (error) {
          console.error('Failed to load organization:', error)
        }
      }
      
      return userData
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setOrganization(null)
      localStorage.removeItem('user')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const updateOrganization = (orgData) => {
    setOrganization(orgData)
  }

  // Permission checks
  const hasRole = (role) => {
    if (!user) return false
    // Normalize role for comparison (handle both snake_case and Title Case)
    const normalizeRole = (r) => {
      if (!r) return ''
      const roleMap = {
        'super_admin': 'Super Admin',
        'org_admin': 'Org Admin',
        'project_manager': 'Project Manager',
        'team_member': 'Team Member',
        'viewer': 'Viewer'
      }
      return roleMap[r.toLowerCase()] || r
    }
    return normalizeRole(user.role) === normalizeRole(role)
  }

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role)
  }

  const hasPermission = (permission) => {
    if (!user) return false
    
    // Normalize role (backend uses snake_case, frontend uses Title Case)
    const normalizeRole = (role) => {
      if (!role) return ''
      // Handle both formats: 'super_admin' and 'Super Admin'
      const roleMap = {
        'super_admin': 'Super Admin',
        'org_admin': 'Org Admin',
        'project_manager': 'Project Manager',
        'team_member': 'Team Member',
        'viewer': 'Viewer'
      }
      return roleMap[role.toLowerCase()] || role
    }
    
    const normalizedRole = normalizeRole(user.role)
    
    // Super Admin has all permissions
    if (normalizedRole === 'Super Admin') return true
    
    // Check role-based permissions
    const rolePermissions = {
      'Org Admin': [
        'manage_users', 'manage_billing', 'create_projects', 'assign_members',
        'create_tasks', 'approve_tasks', 'view_ai_insights', 'view_reports',
        'configure_integrations', 'view_logs', 'export_data'
      ],
      'Project Manager': [
        'create_projects', 'assign_members', 'create_tasks', 'approve_tasks',
        'view_ai_insights', 'view_reports', 'export_data'
      ],
      'Team Member': [
        'create_tasks', 'view_reports'
      ],
      'Viewer': [
        'view_reports'
      ]
    }
    
    const allowed = rolePermissions[normalizedRole] || []
    return allowed.includes(permission)
  }

  const hasTierAccess = (feature) => {
    if (!organization) return false
    
    const tierFeatures = {
      'Basic': ['view_reports', 'create_tasks', 'view_dashboards'],
      'Professional': [
        'view_reports', 'create_tasks', 'view_dashboards',
        'ai_recommendations', 'workload_analytics', 'sprint_forecasting', 'advanced_dashboards'
      ],
      'Enterprise': [
        'view_reports', 'create_tasks', 'view_dashboards',
        'ai_recommendations', 'workload_analytics', 'sprint_forecasting', 'advanced_dashboards',
        'full_ai_capabilities', 'anomaly_detection', 'unlimited_integrations', 'api_access'
      ]
    }
    
    const allowed = tierFeatures[organization.subscriptionTier] || []
    return allowed.includes(feature)
  }

  const canAccess = (permission, feature = null) => {
    const hasPerm = hasPermission(permission)
    if (!feature) return hasPerm
    
    // Check both permission and tier access
    return hasPerm && hasTierAccess(feature)
  }

  const value = {
    user,
    organization,
    loading,
    login,
    logout,
    updateUser,
    updateOrganization,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasTierAccess,
    canAccess,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

