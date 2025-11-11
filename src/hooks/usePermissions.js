import { useAuth } from '../contexts/AuthContext'

/**
 * Custom hook for checking permissions and tier access
 * Usage: const { canCreateProject, canViewAIInsights } = usePermissions()
 */
export const usePermissions = () => {
  const { hasPermission, hasTierAccess, canAccess, hasRole, hasAnyRole, organization } = useAuth()

  return {
    // Role checks
    isSuperAdmin: hasRole('Super Admin'),
    isOrgAdmin: hasRole('Org Admin'),
    isProjectManager: hasRole('Project Manager'),
    isTeamMember: hasRole('Team Member'),
    isViewer: hasRole('Viewer'),
    
    // Permission checks
    canManageOrganizations: hasPermission('manage_organizations'),
    canManageUsers: hasPermission('manage_users'),
    canManageBilling: hasPermission('manage_billing'),
    canCreateProjects: hasPermission('create_projects'),
    canAssignMembers: hasPermission('assign_members'),
    canCreateTasks: hasPermission('create_tasks'),
    canApproveTasks: hasPermission('approve_tasks'),
    canViewAIInsights: canAccess('view_ai_insights', 'ai_recommendations'),
    canViewReports: hasPermission('view_reports'),
    canConfigureIntegrations: hasPermission('configure_integrations'),
    canViewLogs: hasPermission('view_logs'),
    canExportData: canAccess('export_data', 'export_data'),
    
    // Tier-based feature access
    hasAIRecommendations: hasTierAccess('ai_recommendations'),
    hasWorkloadAnalytics: hasTierAccess('workload_analytics'),
    hasSprintForecasting: hasTierAccess('sprint_forecasting'),
    hasAdvancedDashboards: hasTierAccess('advanced_dashboards'),
    hasFullAICapabilities: hasTierAccess('full_ai_capabilities'),
    hasAnomalyDetection: hasTierAccess('anomaly_detection'),
    hasUnlimitedIntegrations: hasTierAccess('unlimited_integrations'),
    hasAPIAccess: hasTierAccess('api_access'),
    
    // Combined checks
    canAccessAIFeatures: canAccess('view_ai_insights', 'ai_recommendations'),
    canAccessAdvancedFeatures: canAccess('view_ai_insights', 'full_ai_capabilities'),
    
    // Organization info
    subscriptionTier: organization?.subscriptionTier || 'Basic',
    organizationName: organization?.name || '',
    
    // Helper functions
    hasAnyRole,
    canAccess,
  }
}

