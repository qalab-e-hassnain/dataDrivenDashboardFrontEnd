import React from 'react'
import './WeekTimeline.css'

function WeekTimeline({ data }) {
  // Default to 7 weeks if no data provided
  const weeks = data || [
    { week: 1, value: 82 },
    { week: 2, value: 80 },
    { week: 3, value: null },
    { week: 4, value: null },
    { week: 5, value: null },
    { week: 6, value: null },
    { week: 7, value: null },
  ]

  return (
    <div className="week-timeline">
      <div className="week-timeline-header">
        <h3 className="week-timeline-title">Project Timeline</h3>
      </div>
      <div className="week-timeline-container">
        {weeks.map((item, index) => (
          <div key={index} className="week-item">
            {item.value && (
              <div className="week-value">{item.value}</div>
            )}
            <div className="week-label">Week {item.week}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default WeekTimeline
