/**
 * Format currency values
 */
export const formatCurrency = (value, currency = 'PKR') => {
  if (typeof value === 'number') {
    if (value >= 1000000000) {
      return `${currency} ${(value / 1000000000).toFixed(2)}B`
    } else if (value >= 1000000) {
      return `${currency} ${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `${currency} ${(value / 1000).toFixed(2)}K`
    }
    return `${currency} ${value.toFixed(2)}`
  }
  return value
}

/**
 * Format percentage values
 */
export const formatPercentage = (value) => {
  if (typeof value === 'number') {
    return `${value.toFixed(0)}%`
  }
  return value
}

/**
 * Format date values
 */
export const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch (error) {
    return dateString
  }
}

/**
 * Format time ago (e.g., "2 hours ago")
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return ''
  // If it's already formatted (like "2 hours ago"), return as is
  if (typeof timestamp === 'string' && timestamp.includes('ago')) {
    return timestamp
  }
  
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
  } catch (error) {
    return timestamp
  }
}

/**
 * Format large numbers with commas
 */
export const formatNumber = (value) => {
  if (typeof value === 'number') {
    return value.toLocaleString('en-US')
  }
  return value
}
