import React, { useState } from 'react'
import SuperAdminDashboard from '../components/Admin/SuperAdminDashboard'
import OrgAdminDashboard from '../components/Admin/OrgAdminDashboard'
import UserList from '../components/UserManagement/UserList'
import SubscriptionPlans from '../components/Subscription/SubscriptionPlans'
import ProtectedRoute from '../components/ProtectedRoute'
import { useAuth } from '../contexts/AuthContext'

function AdminPage({ page }) {
  const { organization } = useAuth()

  switch (page) {
    case 'super':
      return (
        <ProtectedRoute requiredRole="Super Admin">
          <SuperAdminDashboard />
        </ProtectedRoute>
      )
    case 'org':
      return (
        <ProtectedRoute requiredRole="Org Admin" fallbackRole="Super Admin">
          <OrgAdminDashboard />
        </ProtectedRoute>
      )
    case 'users':
      return (
        <ProtectedRoute requiredPermission="manage_users">
          <UserList organizationId={organization?.id} />
        </ProtectedRoute>
      )
    case 'subscription':
      return (
        <ProtectedRoute requiredPermission="manage_billing">
          <SubscriptionPlans />
        </ProtectedRoute>
      )
    default:
      return <div>Page not found</div>
  }
}

export default AdminPage

