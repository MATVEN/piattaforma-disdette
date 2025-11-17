/**
 * Custom Hook: useInfiniteScroll
 * Gestisce il caricamento progressivo dei dati con infinite scroll
 * 
 * Features:
 * - Paginazione automatica
 * - Gestione loading states
 * - Prevenzione fetch duplicati
 * - Type-safe
 */

import { useState, useCallback } from 'react';

interface UseInfiniteScrollOptions<T> {
  /**
   * Funzione che fetcha i dati per una specifica pagina
   * Deve ritornare { data: T[], count: number, hasMore: boolean }
   */
  fetchFunction: (page: number, pageSize: number) => Promise<{
    data: T[];
    count: number;
    hasMore: boolean;
  }>;
  
  /**
   * Numero di items per pagina
   * Default: 10
   */
  pageSize?: number;
  
  /**
   * Callback opzionale per gestire errori
   */
  onError?: (error: Error) => void;
}

interface UseInfiniteScrollReturn<T> {
  /** Array di items caricati */
  items: T[];
  
  /** Indica se sta caricando la prima pagina */
  isLoading: boolean;
  
  /** Indica se sta caricando pagine successive */
  isLoadingMore: boolean;
  
  /** Indica se ci sono altre pagine da caricare */
  hasMore: boolean;
  
  /** Errore eventuale */
  error: string | null;
  
  /** Totale items nel database */
  totalCount: number;
  
  /** Funzione per caricare la pagina successiva */
  loadMore: () => Promise<void>;
  
  /** Funzione per resettare e ricaricare dall'inizio */
  refresh: () => Promise<void>;
}

export function useInfiniteScroll<T>({
  fetchFunction,
  pageSize = 10,
  onError,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  /**
   * Carica una pagina di dati
   * Se isFirstLoad = true, sostituisce i dati esistenti
   * Altrimenti li aggiunge alla lista
   */
  const fetchPage = useCallback(async (pageNumber: number, isFirstLoad = false) => {
    // Previeni fetch duplicati
    if (!isFirstLoad && (isLoadingMore || !hasMore)) {
      return;
    }

    try {
      if (isFirstLoad) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      setError(null);

      const result = await fetchFunction(pageNumber, pageSize);

      if (isFirstLoad) {
        // Prima pagina: sostituisci tutto
        setItems(result.data);
      } else {
        // Pagine successive: aggiungi alla lista
        setItems(prev => [...prev, ...result.data]);
      }

      setHasMore(result.hasMore);
      setTotalCount(result.count);
      setPage(pageNumber);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante il caricamento';
      setError(errorMessage);
      
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [fetchFunction, pageSize, isLoadingMore, hasMore, onError]);

  /**
   * Carica la pagina successiva
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    await fetchPage(page + 1, false);
  }, [page, hasMore, isLoadingMore, fetchPage]);

  /**
   * Reset e ricarica dall'inizio
   * Utile per refresh dopo modifiche
   */
  const refresh = useCallback(async () => {
    setPage(1);
    setHasMore(true);
    setError(null);
    await fetchPage(1, true);
  }, [fetchPage]);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    totalCount,
    loadMore,
    refresh,
  };
}