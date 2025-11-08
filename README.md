# AI-Driven Project Management Dashboard

A modern, data-driven dashboard built with React.js for project management with AI-powered analytics and forecasting capabilities.

## Features

- **KPI Cards**: Schedule Performance Index (SPI), Cost Performance Index (CPI), Project Completion, and AI Confidence Score
- **Week Timeline**: Visual timeline showing project weeks with key metrics
- **Earned Value Management (EVM)**: Interactive charts showing Planned Value, Earned Value, and Actual Cost
- **Workforce Analytics**: Real-time workforce metrics with productivity and utilization tracking
- **Inventory Management**: Stock levels and status monitoring
- **AI Forecasting & Predictions**: Machine learning-powered predictions for project completion and costs
- **Project Timeline**: Visual timeline with critical path analysis
- **AI Alerts & Recommendations**: Intelligent alerts and optimization suggestions
- **Export Functionality**: Export data to Excel, PDF, and Email
- **Loading States**: Skeleton loaders for better UX during data fetching
- **Error Handling**: Error boundary component for graceful error handling
- **Toast Notifications**: Real-time notifications for user actions
- **Refresh Indicator**: Visual feedback when refreshing data

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory and add your Azure API URL (optional - default is already configured):
```
VITE_API_BASE_URL=https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api
```

**Note:** The dashboard is already configured with the Azure API URL by default. You only need to create a `.env` file if you want to use a different API URL.

3. Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:3000`

## API Integration

The dashboard is configured to integrate with Azure Cloud APIs. Update the `API_BASE_URL` in `src/services/api.js` or set it in your `.env` file.

### Expected API Endpoints

The dashboard expects the following API endpoints:

- `GET /api/kpi/{projectId}` - Get KPI data
- `GET /api/evm/{projectId}` - Get Earned Value Management data
- `GET /api/workforce/{projectId}` - Get workforce analytics data
- `GET /api/inventory/{projectId}` - Get inventory data
- `GET /api/ai-forecasts/{projectId}` - Get AI forecasts
- `GET /api/timeline/{projectId}` - Get project timeline
- `GET /api/alerts/{projectId}` - Get AI alerts
- `GET /api/dashboard/{projectId}` - Get all dashboard data (optional)
- `GET /api/export/{projectId}/{type}` - Export data (Excel, PDF, Email)

### Mock Data

If the API is not available, the dashboard will automatically use mock data for demonstration purposes.

## Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx          # Main dashboard container
│   ├── Header.jsx             # Dashboard header with project selector
│   ├── WeekTimeline.jsx       # Week timeline component
│   ├── KPICards.jsx           # KPI metrics cards
│   ├── EVMSection.jsx         # Earned Value Management chart
│   ├── WorkforceAnalytics.jsx # Workforce metrics and charts
│   ├── InventoryManagement.jsx # Inventory list
│   ├── AIForecasting.jsx      # AI predictions section
│   ├── ProjectTimeline.jsx    # Timeline and critical path
│   ├── AIAlerts.jsx           # Alerts and recommendations
│   ├── ExportActions.jsx      # Export buttons
│   ├── LoadingSkeleton.jsx    # Loading skeleton components
│   ├── ErrorBoundary.jsx      # Error boundary component
│   ├── Toast.jsx              # Toast notification component
│   └── ToastContainer.jsx     # Toast container
├── services/
│   └── api.js                 # API service layer
├── utils/
│   └── formatters.js          # Utility functions for formatting
├── config/
│   └── constants.js           # Application constants
├── App.jsx                    # Root component
└── main.jsx                   # Entry point
```

## Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Recharts** - Charting library
- **Axios** - HTTP client for API calls

## Customization

### Changing Colors

Update the CSS variables in component CSS files to match your brand colors. The main gradient used is:
- Primary: `#667eea` to `#764ba2`

### Adding New Components

1. Create a new component file in `src/components/`
2. Import and use it in `Dashboard.jsx`
3. Add corresponding API endpoint in `src/services/api.js`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deployment

### Deploy to Azure Static Web Apps (Free Tier)

This project is configured for deployment to Azure Static Web Apps. Follow the detailed deployment guide in [DEPLOYMENT.md](./DEPLOYMENT.md).

**Quick Steps:**
1. Push code to GitHub (see [PUSH_TO_GITHUB.md](./PUSH_TO_GITHUB.md))
2. Create Azure Static Web App resource
3. Connect to your GitHub repository
4. Configure build settings (output: `dist`)
5. Set environment variables in Azure Portal
6. Deploy!

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## License

MIT

## Support

For issues and questions, please contact the development team.
