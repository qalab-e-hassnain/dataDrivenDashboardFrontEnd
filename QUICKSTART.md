# Quick Start Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Azure API (Optional)

The dashboard is pre-configured with the Azure API URL:
```
https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api
```

If you want to use a different API URL, create a `.env` file:

```bash
VITE_API_BASE_URL=https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api
```

**Note:** The dashboard will automatically connect to the Azure API. If the API is unavailable, it will fall back to mock data.

## Step 3: Start Development Server

```bash
npm run dev
```

The dashboard will open at `http://localhost:3000`

## Step 4: View the Dashboard

The dashboard will automatically load with mock data. You'll see:

1. **Header** - Project selector and refresh button
2. **KPI Cards** - Four key performance indicators
3. **EVM Chart** - Earned Value Management visualization
4. **Workforce Analytics** - Workforce metrics and charts
5. **Inventory Management** - Stock levels
6. **AI Forecasting** - Predictions and forecasts
7. **Project Timeline** - Task progress and critical path
8. **AI Alerts** - Recommendations and alerts
9. **Export Actions** - Export buttons at the bottom

## API Integration

### Expected API Response Formats

#### KPI Data
```json
{
  "spi": 0.92,
  "cpi": 1.05,
  "completion": 68,
  "aiConfidence": 87
}
```

#### EVM Data
```json
{
  "months": ["Month 1", "Month 2", ...],
  "pv": [0.2, 0.4, ...],
  "ev": [0.18, 0.35, ...],
  "ac": [0.17, 0.33, ...]
}
```

#### Workforce Data
```json
{
  "total": 247,
  "active": 203,
  "productivity": 87,
  "utilization": 92,
  "weeklyData": [
    { "week": "Week 1", "productivity": 85, "utilization": 88 },
    ...
  ]
}
```

#### Inventory Data
```json
[
  {
    "name": "Cement (50kg bags)",
    "quantity": "1,450 units",
    "status": "Low Stock"
  },
  ...
]
```

#### Forecasts Data
```json
{
  "completionDate": "Feb 18, 2026",
  "completionConfidence": 87,
  "dataPoints": 1247,
  "finalCost": "Rs1.95B",
  "costConfidence": 84,
  "costVariance": 3,
  "predictions": [
    "Resource shortage likely in Week 8",
    ...
  ]
}
```

#### Timeline Data
```json
[
  {
    "task": "Foundation Work",
    "progress": 100,
    "status": "Complete"
  },
  ...
]
```

#### Alerts Data
```json
[
  {
    "type": "critical",
    "title": "Critical Delay Detected",
    "message": "Structural framework is 8 days behind schedule...",
    "timestamp": "2 hours ago"
  },
  ...
]
```

## Troubleshooting

### Dashboard shows "Loading..." indefinitely
- Check browser console for errors
- Verify API endpoints are correct
- Check CORS settings on Azure API

### Charts not displaying
- Ensure Recharts is installed: `npm install recharts`
- Check browser console for errors

### API calls failing
- Verify Azure API URL in `.env` file
- Check network tab in browser developer tools
- Ensure API endpoints match expected format

## Next Steps

1. Connect to your Azure APIs by updating the `.env` file
2. Customize colors and styling in component CSS files
3. Add authentication if needed
4. Implement export functionality
5. Add more features as needed

## Support

For issues, check the browser console and network tab for error messages.
