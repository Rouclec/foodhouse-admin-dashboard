"use client";

import { useState, useCallback } from "react";

interface UseCursorPaginationOptions {
  initialStartKey?: string;
  pageSize?: number;
}

interface PaginationState {
  currentPage: number;
  startKey: string | undefined;
  pageHistory: (string | undefined)[];
}

export function useCursorPagination({
  initialStartKey,
  pageSize = 10,
}: UseCursorPaginationOptions = {}) {
  const [paginationState, setPaginationState] = useState<PaginationState>({
    currentPage: 1,
    startKey: initialStartKey,
    pageHistory: [initialStartKey],
  });

  const goToNextPage = useCallback((nextStartKey: string) => {
    setPaginationState((prev) => ({
      currentPage: prev.currentPage + 1,
      startKey: nextStartKey,
      pageHistory: [...prev.pageHistory, nextStartKey],
    }));
  }, []);

  const goToPreviousPage = useCallback(() => {
    setPaginationState((prev) => {
      if (prev.currentPage <= 1) return prev;

      const newPageHistory = [...prev.pageHistory];
      newPageHistory.pop(); // Remove current page
      const previousStartKey = newPageHistory[newPageHistory.length - 1];

      return {
        currentPage: prev.currentPage - 1,
        startKey: previousStartKey,
        pageHistory: newPageHistory,
      };
    });
  }, []);

  const goToFirstPage = useCallback(() => {
    setPaginationState({
      currentPage: 1,
      startKey: initialStartKey,
      pageHistory: [initialStartKey],
    });
  }, [initialStartKey]);

  const canGoToPrevious = paginationState.currentPage > 1;
  const canGoToNext = (hasNextPage: boolean) => hasNextPage;

  return {
    currentPage: paginationState.currentPage,
    startKey: paginationState.startKey,
    pageSize,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    canGoToPrevious,
    canGoToNext,
  };
}
