/**
 * Skeleton component for loading states
 */
import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  pulse?: boolean;
}

function Skeleton({ className, pulse = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-gray-200",
        pulse ? "animate-pulse" : "animate-shimmer",
        className
      )}
      {...props}
    />
  );
}

// Pre-built skeleton components for common use cases

function SkeletonText({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-4 w-full", className)} {...props} />;
}

function SkeletonTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-6 w-3/4", className)} {...props} />;
}

function SkeletonImage({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("aspect-square w-full rounded-2xl", className)} {...props} />;
}

function SkeletonButton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-10 w-24 rounded-full", className)} {...props} />;
}

function SkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-10 w-10 rounded-full", className)} {...props} />;
}

// Product card skeleton
function ProductCardSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-4",
        className
      )}
      {...props}
    >
      <SkeletonImage className="mb-4" />
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <SkeletonTitle className="mb-2" />
            <SkeletonText className="w-16" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        <SkeletonText />
        <SkeletonText className="w-3/4" />
        <div className="mt-4 flex items-center justify-between">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Product grid skeleton
function ProductGridSkeleton({
  count = 8,
  className,
  ...props
}: { count?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
      {...props}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Cart item skeleton
function CartItemSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-3xl bg-white p-4 sm:p-6",
        className
      )}
      {...props}
    >
      <Skeleton className="h-24 w-24 shrink-0 rounded-2xl" />
      <div className="flex flex-1 flex-col gap-2">
        <SkeletonTitle />
        <SkeletonText className="w-20" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonImage,
  SkeletonButton,
  SkeletonAvatar,
  ProductCardSkeleton,
  ProductGridSkeleton,
  CartItemSkeleton,
};
