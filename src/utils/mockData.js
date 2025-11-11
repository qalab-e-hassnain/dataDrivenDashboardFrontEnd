/**
 * Mock data for development and fallback scenarios
 */

export const getMockData = () => {
  return {
    project: {
      id: 'mock-project-1',
      name: 'Sample Project',
      status: 'In Progress',
    },
    kpi: {
      spi: 0.92,
      cpi: 1.05,
      completion: 68,
      daysRemaining: 32,
      aiConfidence: 87,
    },
    evm: {
      months: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'],
      pv: [0.1, 0.2, 0.35, 0.5, 0.65, 0.8],
      ev: [0.08, 0.18, 0.32, 0.48, 0.62, 0.76],
      ac: [0.09, 0.19, 0.33, 0.49, 0.63, 0.77],
    },
    workforce: {
      total: 247,
      active: 203,
      productivity: 87,
      utilization: 92,
      weeklyData: [
        { week: 'Week 1', productivity: 87, utilization: 92 },
        { week: 'Week 2', productivity: 89, utilization: 94 },
        { week: 'Week 3', productivity: 85, utilization: 90 },
        { week: 'Week 4', productivity: 88, utilization: 93 },
        { week: 'Week 5', productivity: 86, utilization: 91 },
        { week: 'Week 6', productivity: 90, utilization: 95 },
        { week: 'Week 7', productivity: 87, utilization: 92 },
      ],
    },
    inventory: [
      { id: 1, name: 'Cement', quantity: '1.4K 50kg bags', status: 'Adequate' },
      { id: 2, name: 'Steel Rebar', quantity: '45.2 tons', status: 'Adequate' },
      { id: 3, name: 'Bricks', quantity: '82.5 thousands', status: 'Adequate' },
      { id: 4, name: 'Sand', quantity: '156 cubic meters', status: 'Adequate' },
      { id: 5, name: 'Electrical Wiring', quantity: '3.2K meters', status: 'Adequate' },
      { id: 6, name: 'Plumbing Pipes', quantity: '890 meters', status: 'Adequate' },
    ],
    forecasts: {
      completionDate: 'Feb 18, 2026',
      completionConfidence: 87,
      dataPoints: 1247,
      finalCost: '₨1.95B',
      costConfidence: 84,
      costVariance: 3,
      predictions: [
        'Resource optimization recommended',
        'Monitor critical path tasks',
        'Review workforce utilization',
        'Track inventory levels closely',
      ],
    },
    timeline: [
      { task: 'Foundation Work', progress: 100, status: 'Complete' },
      { task: 'Structural Framework', progress: 75, status: 'In Progress' },
      { task: 'Electrical Installation', progress: 45, status: 'In Progress' },
      { task: 'Plumbing System', progress: 30, status: 'Started' },
      { task: 'Interior Finishing', progress: 0, status: 'Not Started' },
    ],
    alerts: [
      {
        id: 1,
        type: 'warning',
        title: 'Schedule Delay Detected',
        message: 'Project is 8% behind schedule. Consider resource reallocation.',
        timestamp: new Date().toISOString(),
      },
      {
        id: 2,
        type: 'info',
        title: 'Budget Under Control',
        message: 'Project is 5% under budget. Good cost management.',
        timestamp: new Date().toISOString(),
      },
    ],
  }
}

