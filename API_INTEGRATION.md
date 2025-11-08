# API Integration Guide

This document explains how the dashboard integrates with the Azure Cloud API endpoints.

## API Base URL Configuration

The dashboard is pre-configured with the Azure API URL:

**Production Azure API:**
```
https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api
```

The API base URL is set in `src/services/api.js`. To use a different URL, create a `.env` file:

```env
VITE_API_BASE_URL=https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api
```

For local development:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## API Endpoints Used

### Projects API
- `GET /api/projects` - Get all projects (used in Header component)
- `GET /api/projects/{project_id}` - Get project details

### EVM Metrics API
- `GET /api/evm/project/{project_id}` - Get Earned Value Management metrics
  - Returns: `planned_value`, `earned_value`, `actual_cost`, `schedule_performance_index`, `cost_performance_index`, etc.

### Workforce API
- `GET /api/workforce/project/{project_id}` - Get workforce entries for project
  - Returns: Array of workforce entries with `worker_name`, `hours_worked`, `utilization_rate`, etc.

### Inventory API
- `GET /api/inventory/project/{project_id}` - Get inventory entries for project
  - Returns: Array of inventory entries with `item_name`, `stock_level`, `daily_usage`, etc.

### Forecast API
- `GET /api/forecast/project/{project_id}` - Get AI forecast data
  - Returns: `estimated_completion_date`, `estimated_total_cost`, `confidence`, `metrics_used`, etc.

### Tasks API
- `GET /api/tasks/project/{project_id}` - Get tasks for project
  - Returns: Array of tasks with `name`, `completion_percentage`, `status`, `is_critical`, etc.

### Alerts API
- `GET /api/alerts/project/{project_id}` - Get project alerts
  - Returns: Array of alerts with `alert_type`, `severity`, `title`, `message`, etc.

### Anomalies API
- `GET /api/anomaly/project/{project_id}` - Get all anomalies
  - Returns: `workforce_anomalies`, `inventory_anomalies`, `detected_at`

### Reports API
- `GET /api/reports/project/{project_id}/excel` - Export Excel report (returns blob)
- `GET /api/reports/project/{project_id}/pdf` - Export PDF report (returns blob)

## Data Transformation

The dashboard uses data transformation functions in `src/utils/dataTransformers.js` to convert API responses to the format expected by dashboard components.

### Transform Functions

1. **transformEVMMetrics** - Converts EVM API response to chart data format
2. **transformWorkforceData** - Converts workforce entries to metrics and weekly charts
3. **transformInventoryData** - Converts inventory entries to status list format
4. **transformForecastData** - Converts forecast API response to prediction cards format
5. **transformTasksToTimeline** - Converts tasks to timeline progress format
6. **transformAlerts** - Combines alerts and anomalies into unified alert format
7. **transformKPIData** - Extracts KPI metrics from EVM and forecast data

## Data Flow

1. **Dashboard Loads**
   - Header component fetches all projects from `/api/projects`
   - First project is automatically selected (or uses default)
   - Dashboard fetches all data for selected project

2. **Data Fetching**
   - Dashboard makes parallel API calls to all endpoints
   - Data is transformed using transformer functions
   - Transformed data is set in dashboard state
   - Components render with transformed data

3. **Project Change**
   - User selects different project from dropdown
   - Dashboard fetches new data for selected project
   - All components update with new data

4. **Refresh**
   - User clicks refresh button
   - Dashboard re-fetches all data
   - Loading indicator shows during refresh
   - Toast notification shows on completion

## Error Handling

- If API calls fail, dashboard falls back to mock data
- Error messages are displayed to user
- Toast notifications show warning when using mock data
- Console logs detailed error information for debugging

## Mock Data Fallback

If the API is not available or returns errors, the dashboard automatically uses mock data. This allows the dashboard to be developed and tested without a backend.

## Testing API Integration

### 1. Test with Local API
```bash
# Start your local API server
# Update .env file:
VITE_API_BASE_URL=http://localhost:8000/api

# Start dashboard
npm run dev
```

### 2. Test with Azure API
```bash
# Update .env file:
VITE_API_BASE_URL=https://your-azure-api.azurewebsites.net/api

# Start dashboard
npm run dev
```

### 3. Verify API Responses
- Open browser developer tools
- Check Network tab for API calls
- Verify response formats match expected structure
- Check console for any transformation errors

## Common Issues

### CORS Errors
If you see CORS errors, ensure your Azure API has CORS enabled for your dashboard domain.

### 404 Errors
- Verify API endpoints match exactly
- Check that project IDs are valid MongoDB ObjectIds
- Ensure API server is running

### Data Not Displaying
- Check browser console for errors
- Verify API responses match expected format
- Check data transformer functions for issues
- Verify project ID is correct

### Export Not Working
- Verify report endpoints are working
- Check blob response handling
- Verify file download permissions

## API Response Format Examples

### EVM Metrics Response
```json
{
  "planned_value": 53000.0,
  "earned_value": 17000.0,
  "actual_cost": 19500.0,
  "schedule_performance_index": 0.32,
  "cost_performance_index": 0.87,
  "budget_at_completion": 500000.0
}
```

### Forecast Response
```json
{
  "project_id": "690df6a30b3253c94d959c05",
  "estimated_completion_date": "2026-01-26T08:12:12",
  "estimated_total_cost": 573529.41,
  "confidence": "high",
  "metrics_used": {
    "spi": 0.25,
    "cpi": 0.87
  }
}
```

### Tasks Response
```json
[
  {
    "id": "690df6a30b3253c94d959c07",
    "name": "Site Preparation",
    "status": "completed",
    "completion_percentage": 100.0,
    "is_critical": false
  }
]
```

## Next Steps

1. Configure your API base URL in `.env` file
2. Test with your Azure API endpoints
3. Verify all data is displaying correctly
4. Customize data transformers if needed
5. Add error handling for specific cases
6. Optimize API calls if needed
7. Add caching if required
