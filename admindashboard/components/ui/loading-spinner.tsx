import { cn } from "@/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  text?: string;
  backdrop?: boolean;
}

export function LoadingSpinner({
  className,
  size = "md",
  fullScreen = false,
  text,
  backdrop = true,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        {backdrop && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
        )}
        <div className="flex flex-col items-center space-y-4 z-10">
          <Loader2
            className={cn(
              "animate-spin text-primary",
              sizeClasses[size],
              className
            )}
          />
          {text && <p className="text-sm text-muted-foreground">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && (
        <span className="ml-2 text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  );
}
