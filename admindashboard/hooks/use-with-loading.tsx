"use client";

import { useLoadingContext } from "@/app/contexts/loading-context";
import { useToast } from "./use-toast";

// Define the type for the function parameter
type AsyncFunction<T = any> = () => Promise<T>;

// Define the type for the options parameter
interface LoadingOptions<T = any> {
  // Loading state options
  loadingMessage?: string;

  // Success message options
  successTitle?: string;
  successMessage?: string | ((result: T) => string);

  // Error handling options
  errorTitle?: string;
  errorMessage?: string;
  onError?: (error: unknown) => void;
}

export function useLoadingState() {
  // Use the centralized loading context instead of local state
  const { showLoading, hideLoading } = useLoadingContext();
  const { toast } = useToast();

  // Generic function that preserves the return type of the async function
  const withLoading = async <T,>(
    fn: AsyncFunction<T>,
    options: LoadingOptions<T> = {}
  ): Promise<T | undefined> => {
    try {
      // Use the context's showLoading function with the optional message
      showLoading(options.loadingMessage);

      const result = await fn();

      if (options.successMessage) {
        const message =
          typeof options.successMessage === "function"
            ? options.successMessage(result)
            : options.successMessage;

        toast({
          title: options.successTitle || "Success",
          description: message,
        });
      }

      return result;
    } catch (error) {
      console.error(error);

      toast({
        title: options.errorTitle || "Error",
        description:
          options.errorMessage || "An error occurred. Please try again.",
        variant: "destructive",
      });

      if (options.onError) {
        options.onError(error);
      }

      return undefined;
    } finally {
      // Hide the loading spinner when done
      hideLoading();
    }
  };

  return {
    withLoading,
  };
}
