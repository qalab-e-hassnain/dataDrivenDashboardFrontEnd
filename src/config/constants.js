/**
 * Application Constants and Configuration
 */

export const API_ENDPOINTS = {
  KPI: '/kpi',
  EVM: '/evm',
  WORKFORCE: '/workforce',
  INVENTORY: '/inventory',
  AI_FORECASTS: '/ai-forecasts',
  TIMELINE: '/timeline',
  ALERTS: '/alerts',
  DASHBOARD: '/dashboard',
  EXPORT: '/export',
}

export const PROJECT_STATUS = {
  COMPLETE: 'Complete',
  CRITICAL: 'Critical',
  IN_PROGRESS: 'In Progress',
  STARTED: 'Started',
  NOT_STARTED: 'Not Started',
}

export const ALERT_TYPES = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success',
}

export const INVENTORY_STATUS = {
  LOW_STOCK: 'Low Stock',
  ADEQUATE: 'Adequate',
  MODERATE: 'Moderate',
}

export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 3000,
  LONG: 5000,
}

export const COLORS = {
  PRIMARY: '#667eea',
  PRIMARY_DARK: '#764ba2',
  SUCCESS: '#10b981',
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
}

export const GRADIENTS = {
  PURPLE: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  GREEN: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  BLUE: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  PINK: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
}
