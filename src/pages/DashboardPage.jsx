import React from 'react'
import { useParams } from 'react-router-dom'
import Dashboard from '../components/Dashboard'

function DashboardPage() {
  const { projectId } = useParams()
  
  return <Dashboard projectIdFromRoute={projectId} />
}

export default DashboardPage

