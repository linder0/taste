"use client";

import { ReactNode } from "react";

interface ErrorAlertProps {
  children: ReactNode;
  className?: string;
}

export function ErrorAlert({ children, className = "" }: ErrorAlertProps) {
  return (
    <div
      className={`px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm ${className}`}
    >
      {children}
    </div>
  );
}
