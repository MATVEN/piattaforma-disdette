// src/components/StatusTimeline.tsx
// Visual timeline showing disdetta status progression

'use client'

import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { 
  DISDETTA_STATUS, 
  STATUS_ORDER, 
  type DisdettaStatus, 
  isStatusCompleted, 
  getStatusConfig, 
  getRelativeTime
} from '@/types/enums'
import { 
  type StatusHistoryEntry,
} from '@/types/statusHistory'
import { Fragment } from 'react'

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
    const visibleStatuses = STATUS_ORDER
  
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
        if (currentStatus === DISDETTA_STATUS.CONFIRMED && status === DISDETTA_STATUS.SENT) {
            return true // Show SENT as current (in progress)
        }
        return currentStatus === status
    }

    // Helper: Get color based on current status (completed steps inherit current status color)
    const getStepColor = (status: DisdettaStatus, completed: boolean, current: boolean): string => {
      if (!completed && !current) {
        return '#e5e7eb' // gray-200 for future steps
      }
      
      const statusForColor =
        currentStatus === DISDETTA_STATUS.FOLLOWUP_1 || currentStatus === DISDETTA_STATUS.FOLLOWUP_2
          ? DISDETTA_STATUS.SENT
          : currentStatus

      // Completed or current: use status color
      const currentConfig = getStatusConfig(statusForColor)
      switch (currentConfig.color) {
        case 'blue': return '#3b82f6'
        case 'yellow': return '#eab308'
        case 'green': return '#22c55e'
        case 'orange': return '#f97316'
        case 'purple': return '#a855f7'
        case 'red': return '#ef4444'
        default: return '#6b7280'
      }
    }

  return (
    <div className={`w-full sm:max-w-[560px] ${className}`}>
      {/* Timeline */}
      <div className="w-full flex items-center">
        {visibleStatuses.map((status, index) => {
          const config = getStatusConfig(status)
          const historyEntry = getHistoryForStatus(status)
          const completed = isCompleted(status)
          const current = isCurrent(status)
          const isLast = index === visibleStatuses.length - 1
          const nextStatus = visibleStatuses[index + 1]
          const nextCompleted = nextStatus ? isCompleted(nextStatus) : false
          const nextCurrent = nextStatus ? isCurrent(nextStatus) : false

          return (
            <Fragment key={status}>
              {/* Icon */}
              <div className="flex flex-col items-center flex-shrink-0">
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
                    backgroundColor: getStepColor(status, completed, current),
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
                    <p
                      className={`text-xs font-medium ${
                        completed || current ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
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

              {/* Connector line (only if not last) */}
              {!isLast && (
                <div className={`flex-1 ${compact ? 'h-0.5' : 'h-1'} relative mx-4`}>
                  <div className="absolute inset-0 bg-gray-200 rounded-full" />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: nextCompleted || nextCurrent ? '100%' : '0%' }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      backgroundColor: getStepColor(nextStatus, nextCompleted, nextCurrent),
                    }}
                  />
                </div>
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}