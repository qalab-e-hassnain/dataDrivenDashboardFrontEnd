# Fixing "No data received from API" Error After Azure Deployment

If you're seeing "No data received from API. Using mock data for demonstration" after deploying to Azure Static Web Apps, follow these steps:

## Issue Diagnosis

The error occurs when:
1. **CORS is not configured** on your Azure API to allow requests from your Static Web App domain
2. **Environment variables are not set** in Azure Static Web Apps
3. **Some API endpoints are failing** (check Network tab in browser DevTools)

## Solution 1: Configure CORS on Your Azure API

Your Azure API needs to allow requests from your Static Web App domain.

### Step 1: Get Your Static Web App URL

1. Go to Azure Portal → Your Static Web App
2. Copy the URL (e.g., `https://your-app-name.azurestaticapps.net`)

### Step 2: Update CORS in Your Azure API

You need to update your Azure API backend to allow CORS from your Static Web App domain.

#### If using Azure App Service (Python/FastAPI):

Add CORS middleware to your API:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app-name.azurestaticapps.net",  # Your Static Web App URL
        "http://localhost:3000",  # For local development
        "http://localhost:5173",  # For Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### If using Azure Functions:

Update `host.json`:

```json
{
  "version": "2.0",
  "extensions": {
    "http": {
      "customHeaders": {
        "Access-Control-Allow-Origin": "https://your-app-name.azurestaticapps.net",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    }
  }
}
```

#### Alternative: Allow All Origins (Not Recommended for Production)

If you want to allow all origins temporarily for testing:

```python
allow_origins=["*"]  # ⚠️ Only for testing!
```

## Solution 2: Set Environment Variables in Azure Static Web Apps

### Step 1: Access Configuration

1. Go to Azure Portal
2. Navigate to your Static Web App
3. Click on **"Configuration"** in the left menu
4. Click on **"Application settings"** tab

### Step 2: Add Environment Variable

1. Click **"+ Add"** button
2. Add the following:

   **Name:** `VITE_API_BASE_URL`
   
   **Value:** `https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api`

3. Click **"OK"**
4. Click **"Save"** at the top
5. Wait for the app to restart (usually takes 1-2 minutes)

### Step 3: Verify

1. Go to your Static Web App URL
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for the API base URL in logs (should show your Azure API URL)
5. Check Network tab to see if API calls are being made

## Solution 3: Check API Endpoints

### Verify API is Accessible

1. Open browser and go to:
   ```
   https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api/projects/
   ```

2. You should see a JSON response with projects

3. If you get a CORS error, that confirms CORS needs to be configured

### Check Network Tab in Browser

1. Open your deployed app
2. Press F12 to open DevTools
3. Go to **Network** tab
4. Look for API requests:
   - Red X = Request failed
   - 200 OK = Request succeeded but might have CORS issues
   - CORS error = API doesn't allow your domain

## Solution 4: Update API Base URL in Code (Fallback)

If environment variables don't work, you can hardcode the API URL as a fallback (already done in code, but verify):

Check `src/services/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api'
```

This fallback should work even without environment variables, but CORS must still be configured.

## Solution 5: Enable CORS for All Azure Static Web Apps Domains

If you want to allow requests from any Azure Static Web App:

```python
allow_origins=[
    "https://*.azurestaticapps.net",  # All Azure Static Web Apps
    "http://localhost:3000",
]
```

**Note:** Some CORS implementations don't support wildcards in subdomains. In that case, you need to add each domain explicitly.

## Debugging Steps

### 1. Check Browser Console

1. Open your deployed app
2. Press F12 → Console tab
3. Look for error messages:
   - `CORS policy` = CORS issue
   - `Network Error` = Network/CORS issue
   - `Failed to fetch` = Network/CORS issue
   - `404` = Wrong API endpoint
   - `500` = Server error

### 2. Check Network Tab

1. Press F12 → Network tab
2. Filter by "Fetch/XHR"
3. Look for API requests:
   - Check request URL (should point to your Azure API)
   - Check response status (200 = success, but check CORS headers)
   - Check response headers for `Access-Control-Allow-Origin`

### 3. Test API Directly

Open these URLs in your browser to test:

```
https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api/projects/
https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api/evm/{projectId}
```

If these work in the browser but fail from your app, it's a CORS issue.

## Quick Fix Checklist

- [ ] CORS configured on Azure API to allow your Static Web App domain
- [ ] Environment variable `VITE_API_BASE_URL` set in Azure Static Web Apps
- [ ] API is accessible (test in browser)
- [ ] Browser console shows correct API URL
- [ ] Network tab shows API requests (even if they fail)
- [ ] Static Web App has been restarted after configuration changes

## Common Issues

### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution:** Configure CORS on your API to allow your Static Web App domain.

### Issue: Environment variables not working

**Solution:** 
1. Make sure variable name starts with `VITE_`
2. Restart the Static Web App after adding variables
3. Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: API returns 200 but data is null

**Solution:** 
1. Check API response format matches what frontend expects
2. Check browser console for data parsing errors
3. Verify API is returning valid JSON

### Issue: Some endpoints work, others don't

**Solution:**
1. Check each endpoint individually in browser
2. Verify all endpoints have CORS enabled
3. Check API logs for errors

## Still Having Issues?

1. **Check Azure API Logs:**
   - Go to Azure Portal → Your API App Service
   - Click on "Log stream" to see real-time logs
   - Look for CORS or request errors

2. **Check Static Web App Logs:**
   - Go to Azure Portal → Your Static Web App
   - Click on "Logs" to see deployment and runtime logs

3. **Test Locally:**
   - Run `npm run dev` locally
   - Check if API works from localhost
   - If it works locally but not in Azure, it's likely a CORS issue

4. **Contact API Administrator:**
   - Ask them to add your Static Web App domain to CORS allowed origins
   - Provide them with your Static Web App URL

## Expected Behavior After Fix

Once CORS and environment variables are configured:

1. ✅ Dashboard loads real data from API
2. ✅ No "No data received from API" error
3. ✅ Projects dropdown shows actual projects
4. ✅ All charts and metrics show real data
5. ✅ Browser console shows successful API calls
6. ✅ Network tab shows 200 OK responses with data

## Support

If you continue to have issues:
1. Check browser console for specific error messages
2. Check Network tab for failed requests
3. Verify CORS is configured correctly
4. Verify environment variables are set
5. Check API is accessible and returning data

