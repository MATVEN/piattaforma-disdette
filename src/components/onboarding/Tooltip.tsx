'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, HelpCircle } from 'lucide-react'
import { useTooltip } from '@/context/TooltipContext'

interface TooltipProps {
  id: string
  content: string
  children: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'hover' | 'click'
  dismissable?: boolean
  showIcon?: boolean
  className?: string
}

export function Tooltip({
  id,
  content,
  children,
  placement = 'top',
  trigger = 'hover',
  dismissable = true,
  showIcon = true,
  className = '',
}: TooltipProps) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [actualPlacement, setActualPlacement] = useState(placement)
  
  const { 
    showTooltip, 
    hideTooltip, 
    dismissTooltip, 
    isTooltipDismissed,
    activeTooltip 
  } = useTooltip()

  // Don't show if dismissed
  const isDismissed = isTooltipDismissed(id)

  // Calculate tooltip position
  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    const spacing = 8 // Gap between trigger and tooltip
    let top = 0
    let left = 0
    let finalPlacement = placement

    // Calculate based on placement
    switch (placement) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - spacing
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        
        // If doesn't fit top, flip to bottom
        if (top < 0) {
          finalPlacement = 'bottom'
          top = triggerRect.bottom + spacing
        }
        break

      case 'bottom':
        top = triggerRect.bottom + spacing
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        
        // If doesn't fit bottom, flip to top
        if (top + tooltipRect.height > viewport.height) {
          finalPlacement = 'top'
          top = triggerRect.top - tooltipRect.height - spacing
        }
        break

      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        left = triggerRect.left - tooltipRect.width - spacing
        
        // If doesn't fit left, flip to right
        if (left < 0) {
          finalPlacement = 'right'
          left = triggerRect.right + spacing
        }
        break

      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        left = triggerRect.right + spacing
        
        // If doesn't fit right, flip to left
        if (left + tooltipRect.width > viewport.width) {
          finalPlacement = 'left'
          left = triggerRect.left - tooltipRect.width - spacing
        }
        break
    }

    // Ensure tooltip stays within viewport horizontally
    if (left < 8) left = 8
    if (left + tooltipRect.width > viewport.width - 8) {
      left = viewport.width - tooltipRect.width - 8
    }

    // Ensure tooltip stays within viewport vertically
    if (top < 8) top = 8
    if (top + tooltipRect.height > viewport.height - 8) {
      top = viewport.height - tooltipRect.height - 8
    }

    setPosition({ top, left })
    setActualPlacement(finalPlacement)
  }

  // Show tooltip
  const show = () => {
    if (isDismissed) return
    setIsVisible(true)
  }

  // Hide tooltip
  const hide = () => {
    setIsVisible(false)
    hideTooltip()
  }

  // Handle dismiss
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    dismissTooltip(id)
    hide()
  }

  // Update position when visible
  useEffect(() => {
    if (isVisible) {
      calculatePosition()
      
      // Recalculate on window resize
      const handleResize = () => calculatePosition()
      window.addEventListener('resize', handleResize)
      
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isVisible])

  // Sync with global tooltip state
  useEffect(() => {
    if (isVisible) {
      showTooltip({
        id,
        content,
        position: { ...position, placement: actualPlacement },
        dismissable,
      })
    }
  }, [isVisible, position, actualPlacement])

  // Handle trigger events
  const handleMouseEnter = () => {
    if (trigger === 'hover') show()
  }

  const handleMouseLeave = () => {
    if (trigger === 'hover') hide()
  }

  const handleClick = () => {
    if (trigger === 'click') {
      if (isVisible) hide()
      else show()
    }
  }

  // Don't render trigger icon if dismissed
  if (isDismissed && showIcon) {
    return <div className={className}>{children}</div>
  }

  return (
    <>
      {/* Trigger */}
      <div
        ref={triggerRef}
        className={`relative inline-flex items-center gap-2 ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
        
        {showIcon && !isDismissed && (
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex-shrink-0 cursor-help"
          >
            <HelpCircle className="h-4 w-4 text-primary-500 hover:text-primary-600 transition-colors" />
          </motion.div>
        )}
      </div>

      {/* Tooltip Portal */}
      <AnimatePresence>
        {isVisible && !isDismissed && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              zIndex: 9999,
            }}
            className="max-w-xs"
          >
            <div className="relative bg-gradient-to-br from-primary-600 to-primary-700 text-white text-sm rounded-lg shadow-2xl p-3 border border-primary-500">
              {/* Content */}
              <div className={dismissable && trigger === 'click' ? 'pr-6' : ''}>
                {content}
              </div>

              {/* Dismiss button - Only show for click trigger */}
              {dismissable && trigger === 'click' && (
                <button
                  onClick={handleDismiss}
                  className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label="Nascondi suggerimento"
                >
                  <X className="h-3 w-3" />
                </button>
              )}

              {/* Arrow */}
              <div
                className={`absolute w-2 h-2 bg-primary-600 rotate-45 ${
                  actualPlacement === 'top'
                    ? 'bottom-[-4px] left-1/2 -translate-x-1/2'
                    : actualPlacement === 'bottom'
                    ? 'top-[-4px] left-1/2 -translate-x-1/2'
                    : actualPlacement === 'left'
                    ? 'right-[-4px] top-1/2 -translate-y-1/2'
                    : 'left-[-4px] top-1/2 -translate-y-1/2'
                }`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}