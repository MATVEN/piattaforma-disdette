// src/components/StatusTimelineExpandedSkeleton.tsx
// Skeleton loading state for timeline

'use client'

export function StatusTimelineExpandedSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Skeleton entries */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative pl-6">
          {/* Vertical line */}
          {i < 3 && (
            <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200" />
          )}
          
          {/* Status dot */}
          <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-gray-200" />
          
          {/* Content */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-3 bg-gray-100 rounded w-48" />
            <div className="h-3 bg-gray-100 rounded w-40" />
          </div>
        </div>
      ))}
    </div>
  )
}