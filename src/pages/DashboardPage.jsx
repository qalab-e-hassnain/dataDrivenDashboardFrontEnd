import React from 'react'
import Dashboard from '../components/Dashboard'
import { usePermissions } from '../hooks/usePermissions'

function DashboardPage() {
  const { canViewReports, canAccessAIFeatures } = usePermissions()

  return (
    <div className="dashboard-page">
      <Dashboard />
    </div>
  )
}

export default DashboardPage

