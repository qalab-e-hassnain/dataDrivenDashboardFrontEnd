# Azure API Configuration

## API Base URL

The dashboard is configured to use the Azure Cloud API:

**Base URL:** `https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/`

**API Endpoint:** `https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api`

## API Documentation

You can access the API documentation at:
- Swagger UI: `https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/docs`
- Root endpoint: `https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/`

## Available Endpoints

Based on the API response, the following endpoints are available:

- **Projects:** `/api/projects`
- **Tasks:** `/api/tasks`
- **Inventory:** `/api/inventory`
- **Workforce:** `/api/workforce`
- **Upload:** `/api/upload`
- **Gantt:** `/api/gantt`
- **Critical Path:** `/api/critical-path`
- **EVM:** `/api/evm`
- **Forecast:** `/api/forecast`
- **Anomaly:** `/api/anomaly`
- **Alerts:** `/api/alerts`
- **Reports:** `/api/reports`

## Configuration

### Default Configuration

The dashboard is pre-configured with the Azure API URL in `src/services/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api'
```

### Environment Variable Override

To override the default URL, create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api
```

## Testing the API

### Test API Connection

You can test the API connection using curl:

```bash
curl https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/
```

Expected response:
```json
{
  "message": "Welcome to the Project Management Dashboard API",
  "version": "1.0.0",
  "docs": "/docs",
  "endpoints": {
    "projects": "/api/projects",
    "tasks": "/api/tasks",
    ...
  }
}
```

### Test Projects Endpoint

```bash
curl https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api/projects
```

### Test Specific Project

```bash
curl https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api/projects/690df6a30b3253c94d959c05
```

## CORS Configuration

The Azure API should have CORS enabled to allow requests from your dashboard. If you encounter CORS errors, ensure the API server allows requests from your dashboard domain.

## Authentication

If the API requires authentication, you may need to:
1. Add authentication headers to API requests
2. Implement token management
3. Handle authentication errors

## Troubleshooting

### Connection Issues

1. **Check API Status:**
   ```bash
   curl https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/
   ```

2. **Check CORS Settings:**
   - Verify the API allows requests from your domain
   - Check browser console for CORS errors

3. **Check Network Tab:**
   - Open browser developer tools
   - Check Network tab for failed requests
   - Verify request URLs are correct

### Common Errors

- **404 Not Found:** Verify the endpoint URL is correct
- **CORS Error:** Check API CORS configuration
- **500 Internal Server Error:** Check API server logs
- **Network Error:** Verify API is accessible

## Next Steps

1. ✅ API URL is configured
2. ✅ Dashboard is ready to connect
3. Test the dashboard with real API data
4. Verify all endpoints are working
5. Check data transformation is correct
6. Test export functionality
7. Verify alerts and anomalies are displayed

## Support

For API issues, check:
- API documentation: `https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/docs`
- Browser console for errors
- Network tab for request/response details
