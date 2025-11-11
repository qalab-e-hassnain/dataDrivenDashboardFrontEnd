# User Management & Subscription System

## Overview

This document describes the frontend implementation of the User Management & Subscription System for the AI-Driven Project Management Dashboard.

## Features

### 1. User Roles
- **Super Admin**: Platform-level controller with full access
- **Org Admin**: Organization-level administrator
- **Project Manager**: Project-level overseer
- **Team Member**: Active project contributor
- **Viewer**: Read-only access for stakeholders

### 2. Subscription Tiers
- **Basic**: Core features for startups & small teams ($29/month)
- **Professional**: AI features for mid-sized teams ($99/month)
- **Enterprise**: Full AI capabilities for large organizations ($299/month)

### 3. Components Structure

```
src/
├── contexts/
│   └── AuthContext.jsx          # Authentication & authorization context
├── components/
│   ├── UserManagement/
│   │   └── UserList.jsx        # User management interface
│   ├── Subscription/
│   │   └── SubscriptionPlans.jsx # Subscription management
│   ├── Admin/
│   │   ├── SuperAdminDashboard.jsx # Super admin interface
│   │   └── OrgAdminDashboard.jsx   # Org admin interface
│   ├── Navigation.jsx          # Main navigation bar
│   └── ProtectedRoute.jsx      # Route protection component
├── pages/
│   ├── DashboardPage.jsx        # Main dashboard
│   ├── AdminPage.jsx            # Admin pages router
│   └── LoginPage.jsx           # Login page
└── hooks/
    └── usePermissions.js        # Permission checking hook
```

## Usage

### Authentication

The `AuthContext` provides authentication state and methods:

```jsx
import { useAuth } from './contexts/AuthContext'

function MyComponent() {
  const { user, login, logout, hasRole, hasPermission } = useAuth()
  
  // Check role
  if (hasRole('Super Admin')) {
    // Show super admin features
  }
  
  // Check permission
  if (hasPermission('manage_users')) {
    // Show user management
  }
}
```

### Permission Checking

Use the `usePermissions` hook for convenient permission checks:

```jsx
import { usePermissions } from './hooks/usePermissions'

function MyComponent() {
  const { 
    isSuperAdmin, 
    canManageUsers, 
    canViewAIInsights,
    hasAIRecommendations 
  } = usePermissions()
  
  // Use permissions to conditionally render features
}
```

### Protected Routes

Protect routes with role, permission, or feature requirements:

```jsx
import ProtectedRoute from './components/ProtectedRoute'

<ProtectedRoute requiredRole="Org Admin">
  <OrgAdminDashboard />
</ProtectedRoute>

<ProtectedRoute requiredPermission="manage_billing">
  <SubscriptionPlans />
</ProtectedRoute>

<ProtectedRoute requiredFeature="ai_recommendations">
  <AIForecasting />
</ProtectedRoute>
```

### Role-Based UI

Conditionally show/hide features based on role and tier:

```jsx
import { usePermissions } from './hooks/usePermissions'

function Dashboard() {
  const { canAccessAIFeatures, hasAIRecommendations } = usePermissions()
  
  return (
    <div>
      {/* Always visible */}
      <KPICards />
      
      {/* Only if user has AI access and subscription tier supports it */}
      {canAccessAIFeatures && hasAIRecommendations && (
        <AIForecasting />
      )}
    </div>
  )
}
```

## API Integration

The system expects the following API endpoints:

### Authentication
- `POST /api/auth/login` - User login

### User Management
- `GET /api/organizations/{orgId}/users` - Get organization users
- `POST /api/users` - Create user
- `PATCH /api/users/{userId}/role` - Update user role
- `DELETE /api/users/{userId}` - Delete user

### Organization
- `GET /api/organizations/{orgId}` - Get organization
- `PATCH /api/organizations/{orgId}` - Update organization

### Subscription
- `POST /api/organizations/{orgId}/subscription` - Update subscription tier

### Super Admin
- `GET /api/admin/organizations` - Get all organizations
- `GET /api/admin/stats` - Get platform statistics

## Permission Matrix

| Action | Super Admin | Org Admin | Project Manager | Team Member | Viewer |
|--------|------------|-----------|-----------------|-------------|--------|
| Manage Organizations | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Billing | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Projects | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Tasks | ✅ | ✅ | ✅ | ✅ | ❌ |
| View AI Insights | ✅ | ✅ | ✅ | Tier-based | ❌ |
| View Reports | ✅ | ✅ | ✅ | Tier-based | ✅ |

## Subscription Tier Features

| Feature | Basic | Professional | Enterprise |
|---------|-------|--------------|------------|
| Core Project Management | ✅ | ✅ | ✅ |
| Standard Dashboards | ✅ | ✅ | ✅ |
| AI Task Recommendations | ❌ | ✅ | ✅ |
| Workload Analytics | ❌ | ✅ | ✅ |
| Sprint Forecasting | ❌ | ✅ | ✅ |
| Advanced Dashboards | ❌ | ✅ | ✅ |
| Full AI Capabilities | ❌ | ❌ | ✅ |
| Anomaly Detection | ❌ | ❌ | ✅ |
| Unlimited Integrations | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |

## Setup

1. **Install dependencies** (if not already installed):
```bash
npm install
```

2. **Configure API base URL** in `.env.local`:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

3. **Start development server**:
```bash
npm run dev
```

## Testing

For testing without a backend, the system will:
- Use mock data when API calls fail
- Allow login with any credentials (demo mode)
- Show appropriate access denied messages for restricted features

## Next Steps

1. **Backend Integration**: Connect to your backend API endpoints
2. **JWT Token Handling**: Implement proper token refresh and expiration
3. **SSO/OAuth**: Add support for SSO/OAuth for Professional/Enterprise tiers
4. **Audit Logs**: Display audit logs for admins
5. **Email Notifications**: Add email notifications for user invitations and role changes

