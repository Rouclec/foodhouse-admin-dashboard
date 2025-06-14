"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface LoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  setQueryLoading: (isLoading: boolean, message?: string) => void;
  isLoading: boolean;
  loadingMessage?: string;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(
    undefined
  );

  const showLoading = (message?: string) => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
    setLoadingMessage(undefined);
  };

  // New function specifically for React Query loading states
  const setQueryLoading = (loading: boolean, message?: string) => {
    if (loading) {
      setLoadingMessage(message);
      setIsLoading(true);
    } else {
      setIsLoading(false);
      setLoadingMessage(undefined);
    }
  };

  return (
    <LoadingContext.Provider
      value={{
        showLoading,
        hideLoading,
        setQueryLoading,
        isLoading,
        loadingMessage,
      }}
    >
      {children}
      {isLoading && <LoadingSpinner fullScreen text={loadingMessage} />}
    </LoadingContext.Provider>
  );
}

export function useLoadingContext() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoadingContext must be used within a LoadingProvider");
  }
  return context;
}
