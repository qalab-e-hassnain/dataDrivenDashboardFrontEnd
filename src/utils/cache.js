// Simple in-memory cache for API responses
// Cache expires after 5 minutes (300000ms)

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const cache = {
  criticalPath: new Map(),
  ganttData: new Map(),
}

const getCacheKey = (projectId, type) => `${type}_${projectId}`

export const getCachedData = (projectId, type) => {
  const key = getCacheKey(projectId, type)
  const cacheMap = cache[type] || cache.criticalPath
  
  if (!cacheMap.has(key)) {
    return null
  }
  
  const cached = cacheMap.get(key)
  const now = Date.now()
  
  // Check if cache is expired
  if (now - cached.timestamp > CACHE_DURATION) {
    cacheMap.delete(key)
    return null
  }
  
  return cached.data
}

export const setCachedData = (projectId, type, data) => {
  const key = getCacheKey(projectId, type)
  const cacheMap = cache[type] || cache.criticalPath
  
  cacheMap.set(key, {
    data,
    timestamp: Date.now(),
  })
}

export const clearCache = (projectId = null, type = null) => {
  if (projectId && type) {
    // Clear specific cache entry
    const key = getCacheKey(projectId, type)
    const cacheMap = cache[type]
    if (cacheMap) {
      cacheMap.delete(key)
    }
  } else if (projectId) {
    // Clear all cache for a project
    Object.keys(cache).forEach(cacheType => {
      const key = getCacheKey(projectId, cacheType)
      cache[cacheType].delete(key)
    })
  } else {
    // Clear all cache
    Object.keys(cache).forEach(cacheType => {
      cache[cacheType].clear()
    })
  }
}

export default {
  getCachedData,
  setCachedData,
  clearCache,
}

