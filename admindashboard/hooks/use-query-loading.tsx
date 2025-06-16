"use client"

import { useEffect } from "react"
import { useLoadingContext } from "@/app/contexts/loading-context"

interface UseQueryLoadingOptions {
  loadingMessage?: string
  enabled?: boolean // Allow disabling the global loading for specific queries
}

/**
 * Hook to connect React Query's loading state to the global loading context
 * Use this for fetch operations that should show a global loading spinner
 */
export function useQueryLoading(isLoading: boolean, options?: UseQueryLoadingOptions) {
  const { setQueryLoading } = useLoadingContext()
  const { loadingMessage, enabled = true } = options || {}

  useEffect(() => {
    if (enabled) {
      setQueryLoading(isLoading, loadingMessage)
    }
  }, [isLoading, loadingMessage, enabled, setQueryLoading])
}
