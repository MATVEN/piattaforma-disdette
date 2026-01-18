// src/hooks/useStatusPolling.ts
// Smart polling hook for status updates

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { DISDETTA_STATUS, type DisdettaStatus } from '@/types/enums'

interface UseStatusPollingOptions {
  enabled: boolean // Start/stop polling
  interval?: number // Polling interval in ms (default: 30000 = 30s)
  onUpdate?: () => void // Callback quando c'è update
}

interface DisdettaToPolling {
  id: number
  currentStatus: DisdettaStatus
}

export function useStatusPolling({
    enabled,
    interval = 30000, // 30 seconds default
    onUpdate,
}: UseStatusPollingOptions) {
    const [isPolling, setIsPolling] = useState(false)
    const [trigger, setTrigger] = useState(0)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const disdettesToPoll = useRef<Set<number>>(new Set())

    // Add disdetta to polling list (stable reference)
    const addDisdetta = useCallback((id: number, status: DisdettaStatus) => {
        const terminalStates: DisdettaStatus[] = [DISDETTA_STATUS.SENT, DISDETTA_STATUS.FAILED]
        if (!terminalStates.includes(status)) {
            const sizeBefore = disdettesToPoll.current.size
            disdettesToPoll.current.add(id)
            const sizeAfter = disdettesToPoll.current.size
            
            // Trigger ONLY when going from 0 to 1+ (start polling)
            if (sizeBefore === 0 && sizeAfter > 0) {
                setTrigger(prev => prev + 1)
            }
        }
    }, [])

    // Remove disdetta from polling list (stable reference)
    const removeDisdetta = useCallback((id: number) => {
        disdettesToPoll.current.delete(id)
    }, [])

    // Clear all (stable reference)
    const clear = useCallback(() => {
        disdettesToPoll.current.clear()
    }, [])

    // Start polling
    useEffect(() => {
        if (!enabled || disdettesToPoll.current.size === 0) {
            return
        }

        setIsPolling(true)

        const poll = async () => {
            // Check online status
            if (!navigator.onLine) {
                return
            }

            // Poll each disdetta
            const ids = Array.from(disdettesToPoll.current)

            try {
                // Fetch current status for each
                // We'll call the refresh function from parent
                if (onUpdate) {
                onUpdate()
                }
            } catch (error) {
                console.error('Polling error:', error)
            }
        }

        // Set interval
        intervalRef.current = setInterval(poll, interval)

        return () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }
        setIsPolling(false)
        }
    }, [enabled, interval, onUpdate, trigger])

    return {
        isPolling,
        addDisdetta,
        removeDisdetta,
        clear,
    }
}