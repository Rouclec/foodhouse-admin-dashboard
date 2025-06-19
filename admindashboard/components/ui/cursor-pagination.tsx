"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft } from "lucide-react";

interface CursorPaginationProps {
  currentPage: number;
  nextKey: string | undefined; // Changed from hasNextPage to nextKey
  canGoToPrevious: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onFirstPage: () => void;
  isLoading?: boolean;
  itemsPerPage?: number;
  totalItemsOnPage?: number;
}

export function CursorPagination({
  currentPage,
  nextKey,
  canGoToPrevious,
  onPreviousPage,
  onNextPage,
  onFirstPage,
  isLoading = false,
  itemsPerPage,
  totalItemsOnPage,
}: CursorPaginationProps) {
  // Check if we can go to next page (nextKey exists and is not empty)
  const hasNextPage = nextKey !== undefined && nextKey !== "";

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-muted-foreground">
          Page {currentPage}
          {itemsPerPage && totalItemsOnPage && (
            <span className="ml-1">
              ({totalItemsOnPage} of {itemsPerPage} items)
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onFirstPage}
          disabled={!canGoToPrevious || isLoading}
          className={`h-8 w-8 p-0 cursor-pointer ${!canGoToPrevious && "cursor-not-allowed"}`}
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">Go to first page</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={!canGoToPrevious || isLoading}
          className={`h-8 w-8 p-0 cursor-pointer ${!canGoToPrevious && "cursor-not-allowed"}`}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Go to previous page</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!hasNextPage || isLoading}
          className={`h-8 w-8 p-0 cursor-pointer ${!hasNextPage && "cursor-not-allowed"}`}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Go to next page</span>
        </Button>
      </div>
    </div>
  );
}
