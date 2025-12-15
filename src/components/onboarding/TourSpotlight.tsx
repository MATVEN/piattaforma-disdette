// components/onboarding/TourSpotlight.tsx
// Overlay with spotlight effect on target element

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SpotlightPosition } from '@/types/tour'

interface TourSpotlightProps {
  target: string // CSS selector
  isActive: boolean
  onClickOutside?: () => void
}

export function TourSpotlight({ target, isActive, onClickOutside }: TourSpotlightProps) {

  const [spotlight, setSpotlight] = useState<SpotlightPosition | null>(null)

  useEffect(() => {
    if (!isActive) {
      setSpotlight(null)
      return
    }

    const updateSpotlight = () => {
      const targetEl = document.querySelector(target)
      if (!targetEl) {
        setSpotlight(null)
        return
      }

      // Special handling for body element
      if (target === 'body') {
        // Don't show spotlight for body, just overlay
        setSpotlight(null)
        return
      }

      const rect = targetEl.getBoundingClientRect()
      setSpotlight({
        top: rect.top - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
      })
    }

    updateSpotlight()

    // Update on window resize or scroll
    window.addEventListener('resize', updateSpotlight)
    window.addEventListener('scroll', updateSpotlight, true)

    return () => {
      window.removeEventListener('resize', updateSpotlight)
      window.removeEventListener('scroll', updateSpotlight, true)
    }
  }, [target, isActive])

  if (!isActive) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only trigger if clicking directly on the overlay (not the spotlight area)
    if (e.target === e.currentTarget && onClickOutside) {
      onClickOutside()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed inset-0 z-50 pointer-events-auto"
        onClick={handleOverlayClick}
        style={{
          background: spotlight ? 'transparent' : 'rgba(0, 0, 0, 0.6)',
        }}
      >
        {spotlight ? (
          <>
            {/* SVG Mask for Spotlight */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <mask id="spotlight-mask">
                  {/* White background */}
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {/* Black cutout for spotlight */}
                  <motion.rect
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    x={spotlight.left}
                    y={spotlight.top}
                    width={spotlight.width}
                    height={spotlight.height}
                    rx="12"
                    fill="black"
                  />
                </mask>
              </defs>
              {/* Apply mask to create spotlight effect */}
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(0, 0, 0, 0.6)"
                mask="url(#spotlight-mask)"
              />
            </svg>

            {/* Spotlight border */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute border-2 border-indigo-400 rounded-xl pointer-events-none z-51"
              style={{
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
                boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.2)',
              }}
            />
          </>
        ) : null}
      </motion.div>
    </AnimatePresence>
  )
}