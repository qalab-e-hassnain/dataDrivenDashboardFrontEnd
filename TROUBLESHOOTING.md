# Troubleshooting Guide

## Issue: Dashboard Stuck in Loading State

### Problem
The dashboard shows a loading spinner indefinitely and never displays data.

### Solutions Applied

1. **Added Request Timeouts**
   - All API requests now have a 10-second timeout
   - If a request times out, the dashboard automatically falls back to mock data
   - Prevents infinite loading states

2. **Default Project ID**
   - Dashboard now starts with a default project ID (`690df6a30b3253c94d959c05`)
   - Prevents waiting for projects API to respond before loading data
   - Projects dropdown will update once projects are loaded

3. **Better Error Handling**
   - Each API call has individual error handling
   - Failed API calls return `null` instead of throwing errors
   - Dashboard continues to load even if some APIs fail
   - Shows mock data if no API data is available

4. **Timeout Fallback**
   - 15-second overall timeout for dashboard data loading
   - Automatically switches to mock data if timeout is reached
   - Shows warning toast notification

### How It Works Now

1. **Dashboard Loads**
   - Starts with default project ID immediately
   - Begins fetching data right away
   - Doesn't wait for projects API

2. **API Calls**
   - Each API call has 10-second timeout
   - Failed calls don't block other calls
   - Dashboard uses whatever data is available

3. **Fallback Behavior**
   - If API times out → uses mock data
   - If API fails → uses mock data
   - If no data received → uses mock data
   - Always shows something to the user

### Testing

1. **Check Browser Console**
   - Open developer tools (F12)
   - Check Console tab for errors
   - Look for API timeout or error messages

2. **Check Network Tab**
   - Open developer tools
   - Go to Network tab
   - See which API calls are failing
   - Check response times

3. **Verify API Connection**
   ```bash
   curl https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api/projects
   ```

### Common Issues

#### CORS Errors
- **Symptom:** Console shows CORS errors
- **Solution:** API needs to allow requests from your domain
- **Check:** API CORS configuration

#### Network Errors
- **Symptom:** Network tab shows failed requests
- **Solution:** Check internet connection, verify API URL
- **Check:** API server status

#### Timeout Errors
- **Symptom:** Requests timing out after 10 seconds
- **Solution:** API might be slow or unavailable
- **Result:** Dashboard automatically uses mock data

#### 404 Errors
- **Symptom:** API returns 404 Not Found
- **Solution:** Verify project ID exists in database
- **Check:** Use valid project ID from API

### Debugging Steps

1. **Open Browser Console**
   ```javascript
   // Check API base URL
   console.log(import.meta.env.VITE_API_BASE_URL)
   ```

2. **Test API Manually**
   ```bash
   # Test projects endpoint
   curl https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api/projects
   
   # Test specific project
   curl https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api/projects/690df6a30b3253c94d959c05
   ```

3. **Check Dashboard State**
   - Open React DevTools
   - Check Dashboard component state
   - Verify projectId is set
   - Check loading state

### Expected Behavior

1. **Fast Loading** (API Working)
   - Dashboard loads in 1-3 seconds
   - Real data from API displays
   - No error messages

2. **Slow Loading** (API Slow)
   - Dashboard loads in 5-10 seconds
   - Some data might be missing
   - Warning toast appears

3. **Fallback Loading** (API Failing)
   - Dashboard loads in 15 seconds max
   - Mock data displays
   - Warning toast appears
   - Error banner shows

### Still Having Issues?

1. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear browser cache
   - Try incognito/private mode

2. **Check API Status**
   - Visit API root: https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/
   - Check API docs: https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/docs

3. **Verify Environment**
   - Check `.env` file exists (optional)
   - Verify API URL is correct
   - Check network connectivity

4. **Check Console Logs**
   - Look for specific error messages
   - Check network request details
   - Verify response formats

### Quick Fixes

#### Force Mock Data
If you want to test with mock data only, modify `src/services/api.js`:
```javascript
// Temporarily disable API calls
const API_BASE_URL = null // This will cause all calls to fail and use mock data
```

#### Increase Timeout
If API is slow but working, increase timeout in `src/services/api.js`:
```javascript
timeout: 30000, // 30 seconds instead of 10
```

#### Use Different Project
If default project doesn't exist, change in `src/components/Dashboard.jsx`:
```javascript
const [projectId, setProjectId] = useState('YOUR_PROJECT_ID')
```
