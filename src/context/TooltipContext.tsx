'use client'

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react'

interface TooltipPosition {
  top: number
  left: number
  placement: 'top' | 'bottom' | 'left' | 'right'
}

interface TooltipState {
  id: string
  content: string
  position: TooltipPosition
  dismissable: boolean
}

interface TooltipContextType {
  activeTooltip: TooltipState | null
  showTooltip: (tooltip: TooltipState) => void
  hideTooltip: () => void
  dismissedTooltips: string[]
  dismissTooltip: (id: string) => void
  isTooltipDismissed: (id: string) => boolean
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined)

const STORAGE_KEY = 'DisdEasy_dismissed_tooltips'

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [activeTooltip, setActiveTooltip] = useState<TooltipState | null>(null)
  const [dismissedTooltips, setDismissedTooltips] = useState<string[]>(() => {
    // Load dismissed tooltips from localStorage on mount
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const showTooltip = useCallback((tooltip: TooltipState) => {
    
    // Don't show if already dismissed
    if (dismissedTooltips.includes(tooltip.id)) {
      return
    }
    setActiveTooltip(tooltip)
  }, [dismissedTooltips])

  const hideTooltip = useCallback(() => {
    setActiveTooltip(null)
  }, [])

  const dismissTooltip = useCallback((id: string) => {
    
    // Add to dismissed list
    const updated = [...dismissedTooltips, id]
    setDismissedTooltips(updated)
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save dismissed tooltips:', error)
    }
    
    // Hide if currently showing
    if (activeTooltip?.id === id) {
      setActiveTooltip(null)
    }
  }, [dismissedTooltips, activeTooltip])

  const isTooltipDismissed = useCallback((id: string) => {
    return dismissedTooltips.includes(id)
  }, [dismissedTooltips])

  const value = useMemo<TooltipContextType>(() => ({
    activeTooltip,
    showTooltip,
    hideTooltip,
    dismissedTooltips,
    dismissTooltip,
    isTooltipDismissed,
  }), [activeTooltip, showTooltip, hideTooltip, dismissedTooltips, dismissTooltip, isTooltipDismissed])

  return (
    <TooltipContext.Provider value={value}>
      {children}
    </TooltipContext.Provider>
  )
}

export function useTooltip() {
  const context = useContext(TooltipContext)
  if (!context) {
    throw new Error('useTooltip must be used within TooltipProvider')
  }
  return context
}