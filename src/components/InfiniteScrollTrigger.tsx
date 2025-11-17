/**
 * InfiniteScrollTrigger Component
 * Usa Intersection Observer per rilevare quando l'utente arriva in fondo alla lista
 * e triggera automaticamente il caricamento della pagina successiva
 */

'use client';

import { useEffect, useRef } from 'react';

interface InfiniteScrollTriggerProps {
  /**
   * Callback chiamato quando il trigger diventa visibile
   */
  onLoadMore: () => void;
  
  /**
   * Se true, il trigger è attivo e può chiamare onLoadMore
   */
  enabled: boolean;
  
  /**
   * Indica se sta già caricando (previene chiamate multiple)
   */
  isLoading?: boolean;
  
  /**
   * Componente da renderizzare (es: skeleton, spinner)
   * Default: semplice spinner
   */
  children?: React.ReactNode;
  
  /**
   * Threshold per Intersection Observer (0-1)
   * 1.0 = completamente visibile
   * Default: 0.1 (10% visibile)
   */
  threshold?: number;
}

export default function InfiniteScrollTrigger({
  onLoadMore,
  enabled,
  isLoading = false,
  children,
  threshold = 0.1,
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentTrigger = triggerRef.current;
    if (!currentTrigger || !enabled || isLoading) return;

    // Crea l'Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        // Se l'elemento diventa visibile
        const [entry] = entries;
        if (entry.isIntersecting && enabled && !isLoading) {
          onLoadMore();
        }
      },
      {
        threshold,
        rootMargin: '100px', // Inizia a caricare quando mancano 100px alla fine
      }
    );

    // Osserva il trigger
    observer.observe(currentTrigger);

    // Cleanup
    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
      observer.disconnect();
    };
  }, [onLoadMore, enabled, isLoading, threshold]);

  // Non renderizzare nulla se non è abilitato
  if (!enabled) return null;

  return (
    <div ref={triggerRef} className="py-8 text-center">
      {children || (
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
        </div>
      )}
    </div>
  );
}