"use client";

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  xs: "w-3 h-3 border-2",
  sm: "w-4 h-4 border-2",
  md: "w-5 h-5 border-2",
  lg: "w-10 h-10 border-3",
};

export function Spinner({ size = "sm", className = "" }: SpinnerProps) {
  return (
    <div
      className={`${sizes[size]} border-current border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
}
