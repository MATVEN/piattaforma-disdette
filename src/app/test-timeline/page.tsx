'use client'

import { StatusTimeline } from '@/components/StatusTimeline'
import type { StatusHistoryEntry } from '@/types/statusHistory'

export default function TestTimelinePage() {
  // Mock data
  const history: StatusHistoryEntry[] = [
    {
      id: 1,
      disdetta_id: 1,
      status: 'PROCESSING',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1h ago
      duration_seconds: null,
      metadata: {},
      created_by: 'system'
    },
    {
      id: 2,
      disdetta_id: 1,
      status: 'PENDING_REVIEW',
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30min ago
      duration_seconds: 153,
      metadata: {},
      created_by: 'system'
    },
  ]

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Status Timeline Test</h1>
      
      {/* Test 1: PENDING_REVIEW */}
      <div className="bg-white p-6 rounded-xl border">
        <h2 className="text-lg font-semibold mb-4">State: PENDING_REVIEW</h2>
        <StatusTimeline 
          currentStatus="PENDING_REVIEW"
          history={history}
        />
      </div>
      
      {/* Test 2: CONFIRMED */}
      <div className="bg-white p-6 rounded-xl border">
        <h2 className="text-lg font-semibold mb-4">State: CONFIRMED</h2>
        <StatusTimeline 
          currentStatus="CONFIRMED"
          history={[
            ...history,
            {
              id: 3,
              disdetta_id: 1,
              status: 'CONFIRMED',
              timestamp: new Date().toISOString(),
              duration_seconds: 300,
              metadata: {},
              created_by: 'user'
            }
          ]}
        />
      </div>
      
      {/* Test 3: SENT */}
      <div className="bg-white p-6 rounded-xl border">
        <h2 className="text-lg font-semibold mb-4">State: SENT (Complete)</h2>
        <StatusTimeline 
          currentStatus="SENT"
          history={[
            ...history,
            {
              id: 3,
              disdetta_id: 1,
              status: 'CONFIRMED',
              timestamp: new Date(Date.now() - 600000).toISOString(),
              duration_seconds: 300,
              metadata: {},
              created_by: 'user'
            },
            {
              id: 4,
              disdetta_id: 1,
              status: 'SENT',
              timestamp: new Date().toISOString(),
              duration_seconds: 180,
              metadata: {},
              created_by: 'system'
            }
          ]}
        />
      </div>
      
      {/* Test 4: Compact mode */}
      <div className="bg-white p-6 rounded-xl border">
        <h2 className="text-lg font-semibold mb-4">Compact Mode</h2>
        <StatusTimeline 
          currentStatus="PENDING_REVIEW"
          history={history}
          compact
        />
      </div>
    </div>
  )
}