// src/components/StatusTimeline.tsx
// Visual timeline showing disdetta status progression

'use client'

import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { 
  STATUS_ORDER, 
  STATUS_CONFIG,
  getStatusConfig,
  isStatusCompleted,
  type DisdettaStatus,
  type StatusHistoryEntry,
  formatTimestamp,
  getRelativeTime,
} from '@/types/statusHistory'

interface StatusTimelineProps {
  currentStatus: DisdettaStatus
  history: StatusHistoryEntry[]
  compact?: boolean // Compact mode for dashboard card
  className?: string
}

export function StatusTimeline({ 
  currentStatus, 
  history,
  compact = false,
  className = '' 
}: StatusTimelineProps) {
  
    // Get visible statuses (exclude FAILED from timeline, handle TEST_SENT)
    const visibleStatuses = currentStatus === 'TEST_SENT' 
        ? [...STATUS_ORDER.slice(0, -1), 'TEST_SENT' as DisdettaStatus]
        : STATUS_ORDER
  
    // Get history entry for each status
    const getHistoryForStatus = (status: DisdettaStatus): StatusHistoryEntry | undefined => {
        return history.find(h => h.status === status)
    }
    
    // Check if status is completed
    const isCompleted = (status: DisdettaStatus): boolean => {
        return isStatusCompleted(currentStatus, status)
    }
  
    // Check if status is current
    const isCurrent = (status: DisdettaStatus): boolean => {
        // Special case: CONFIRMED is shown as "in progress" on SENT step
        if (currentStatus === 'CONFIRMED' && status === 'SENT') {
            return true // Show SENT as current (in progress)
        }
        return currentStatus === status
    }

  return (
    <div className={`${className}`}>
      {/* Timeline */}
      <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
        {visibleStatuses.map((status, index) => {
          const config = getStatusConfig(status)
          const historyEntry = getHistoryForStatus(status)
          const completed = isCompleted(status)
          const current = isCurrent(status)
          const isLast = index === visibleStatuses.length - 1
          
          return (
            <div key={status} className="flex items-center flex-1">
              {/* Step */}
              <div className="flex flex-col items-center">
                {/* Circle */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                        ${compact ? 'w-8 h-8' : 'w-10 h-10'}
                        rounded-full flex items-center justify-center
                        transition-all duration-300
                    `}
                    style={{
                        backgroundColor: completed || current 
                        ? config.color === 'blue' ? '#3b82f6'
                        : config.color === 'yellow' ? '#eab308'
                        : config.color === 'green' ? '#22c55e'
                        : config.color === 'red' ? '#ef4444'
                        : '#6b7280'
                        : '#e5e7eb' // gray-200
                    }}
                >
                    {(() => {
                        const IconComponent = Icons[config.icon as keyof typeof Icons] as any
                        return IconComponent ? (
                            <IconComponent 
                                className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${
                                completed || current ? 'text-white' : 'text-gray-400'
                                }`}
                            />
                        ) : (
                            <span className={compact ? 'text-xs' : 'text-base'}>
                                {config.icon}
                            </span>
                        )
                    })()}
                </motion.div>
                
                {/* Label (non-compact only) */}
                {!compact && (
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${
                      completed || current ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {config.label}
                    </p>
                    {historyEntry && (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {getRelativeTime(historyEntry.timestamp)}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Connector line */}
              {!isLast && (
                <div className={`flex-1 ${compact ? 'h-0.5' : 'h-1'} mx-1 relative`}>
                  <div className="absolute inset-0 bg-gray-200 rounded-full" />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: completed ? '100%' : '0%' }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`absolute inset-y-0 left-0 rounded-full`}
                    style={{
                      backgroundColor: config.color === 'blue' ? '#3b82f6'
                        : config.color === 'yellow' ? '#eab308'
                        : config.color === 'green' ? '#22c55e'
                        : config.color === 'purple' ? '#a855f7'
                        : '#6b7280'
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}