// src/components/StatusTimelineExpanded.tsx
// Detailed expanded view of status history with timestamps and metadata

'use client'

import * as Icons from 'lucide-react'
import {
  getStatusConfig,
  formatDuration,
  formatTimestamp,
  getRelativeTime
} from '@/types/enums'
import {
  type StatusTimelineData
} from '@/types/statusHistory'

interface StatusTimelineExpandedProps {
  timeline: StatusTimelineData
}

export function StatusTimelineExpanded({ timeline }: StatusTimelineExpandedProps) {
  const { history, currentStatus, estimatedCompletion } = timeline

  return (
    <div className="space-y-4">
      {/* Empty state */}
      {history.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Icons.Clock className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">
            Cronologia in costruzione
          </p>
          <p className="text-xs text-gray-500">
            Gli aggiornamenti di stato appariranno qui a breve
          </p>
        </div>
      ) : (
        <>
        {/* Timeline entries */}
        <div className="space-y-3">
          {history.map((entry, index) => {
            const config = getStatusConfig(entry.status)
            const isLast = index === history.length - 1

            return (
              <div key={entry.id} className="relative pl-6">
                {/* Vertical line */}
                {!isLast && (
                  <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200" />
                )}

                {/* Status dot */}
                <div
                  className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white"
                  style={{
                    backgroundColor: config.color === 'blue' ? '#3b82f6'
                      : config.color === 'yellow' ? '#eab308'
                      : config.color === 'green' ? '#22c55e'
                      : config.color === 'orange' ? '#f97316'
                      : config.color === 'purple' ? '#a855f7'
                      : config.color === 'red' ? '#ef4444'
                      : '#6b7280'
                  }}
                />

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const IconComponent = Icons[config.icon as keyof typeof Icons] as any
                      return IconComponent ? (
                        <IconComponent className="w-4 h-4 flex-shrink-0" style={{
                          color: config.color === 'blue' ? '#3b82f6'
                            : config.color === 'yellow' ? '#eab308'
                            : config.color === 'green' ? '#22c55e'
                            : config.color === 'orange' ? '#f97316'
                            : config.color === 'red' ? '#ef4444'
                            : '#6b7280'
                          }} 
                        />
                      ) : null
                    })()}
                    <span className="text-sm font-medium text-gray-900">
                      {config.label}
                    </span>
                    {entry.duration_seconds && (
                      <span className="text-xs text-gray-500">
                        ({formatDuration(entry.duration_seconds)})
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600">{config.description}</p>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Icons.Clock className="h-3 w-3" />
                    <span>{formatTimestamp(entry.timestamp)}</span>
                    <span>·</span>
                    <span>{getRelativeTime(entry.timestamp)}</span>
                  </div>

                  {/* Metadata (if any) */}
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(entry.metadata).map(([key, value]) => {
                        // Format key (camelCase → Title Case)
                        const formattedKey = key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (str) => str.toUpperCase())
                          .trim()
                        
                        // Format value
                        let formattedValue = String(value)
                        
                        // Special formatting
                        if (key === 'fileSize' && typeof value === 'number') {
                          // Bytes to MB
                          formattedValue = `${(value / 1024 / 1024).toFixed(2)} MB`
                        } else if (Array.isArray(value)) {
                          formattedValue = value.join(', ')
                        }
                        
                        return (
                          <div key={key} className="flex items-start gap-2 text-xs">
                            <span className="font-medium text-gray-700 min-w-[10px]">
                              {formattedKey}:
                            </span>
                            <span className="text-gray-600 flex-1">
                              {formattedValue}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Estimated completion */}
          {estimatedCompletion && (
            <div className="mt-4 p-3 bg-primary-50 rounded-lg flex items-start gap-2">
              <Icons.AlertCircle className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-primary-900">Tempo stimato</p>
                <p className="text-primary-700">
                  Completamento previsto: {formatTimestamp(estimatedCompletion)}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}