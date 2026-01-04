"use client";

import { ReactNode } from "react";

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  activeClass?: string;
}

export function ToggleButton({
  active,
  onClick,
  disabled,
  children,
  activeClass = "bg-accent text-background",
}: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? activeClass
          : "bg-surface-hover text-foreground hover:bg-surface-elevated"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}
