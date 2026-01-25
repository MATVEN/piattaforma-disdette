// components/onboarding/TourSpotlight.tsx
// Overlay with spotlight effect on target element
'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SpotlightPosition } from '@/types/tour'

interface TourSpotlightProps {
  target: string // CSS selector
  isActive: boolean
  onClickOutside?: () => void
}

export function TourSpotlight({ target, isActive, onClickOutside }: TourSpotlightProps) {

  const [spotlight, setSpotlight] = useState<SpotlightPosition | null>(null)
  const retryCountRef = useRef(0)

  useEffect(() => {
    if (!isActive) {
      setSpotlight(null)
      retryCountRef.current = 0
      return
    }

    const updateSpotlight = () => {
      const targetEl = document.querySelector(target)
      if (!targetEl) {
        setSpotlight(null)
        retryCountRef.current = 0
        return
      }
      // Special handling for body element
      if (target === 'body') {
        setSpotlight(null)
        retryCountRef.current = 0
        return
      }

      const rect = targetEl.getBoundingClientRect()
      // Caso speciale: se target è [href="/login"], includi anche [href="/register"]
      let finalRect = rect
      if (target === '[href="/login"]') {
        const registerEl = document.querySelector('[href="/register"]')
        if (registerEl) {
          const registerRect = registerEl.getBoundingClientRect()
          // Crea un rect che contenga entrambi
          const left = Math.min(rect.left, registerRect.left)
          const top = Math.min(rect.top, registerRect.top)
          const right = Math.max(rect.right, registerRect.right)
          const bottom = Math.max(rect.bottom, registerRect.bottom)
          finalRect = {
            left,
            top,
            right,
            bottom,
            width: right - left,
            height: bottom - top,
            x: left,
            y: top,
          } as DOMRect
        }
      }

      // Verifica che il rect sia valido (non zero da animazione)
      if (finalRect.width > 0 && finalRect.height > 0) {
        const spotlightData = {
          top: finalRect.top - 8,
          left: finalRect.left - 8,
          width: finalRect.width + 16,
          height: finalRect.height + 16,
        }
        setSpotlight(spotlightData)
        retryCountRef.current = 0
      } else {
        // Max 15 retry (2.25 secondi) per aspettare animazione menu
        if (retryCountRef.current < 15) {
          retryCountRef.current++
          setTimeout(updateSpotlight, 150)
        } else {
          setSpotlight(null)
          retryCountRef.current = 0
        }
      }
    }

    // Delay iniziale più lungo per dare tempo all'animazione menu
    const initialDelay = 200
    const timer = setTimeout(updateSpotlight, initialDelay)

    // Update on window resize or scroll
    window.addEventListener('resize', updateSpotlight)
    window.addEventListener('scroll', updateSpotlight, true)
    return () => {
      clearTimeout(timer)
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
        className="fixed inset-0 z-[55] pointer-events-auto"
        onClick={handleOverlayClick}
        style={{
          background: spotlight ? 'transparent' : 'rgba(0, 0, 0, 0.6)',
        }}
      >
        {spotlight ? (
          <>
            {/* SVG Mask for Spotlight */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-[55]">
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
              className="absolute border-2 border-primary-400 rounded-xl pointer-events-none z-[56]"
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