"use client";

import { useState } from "react";
import { Spinner, SparklesIcon } from "@/components/ui";

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  imageUrl?: string;
  disabled?: boolean;
}

const PRESET_PROMPTS = [
  { label: "Gentle sway", prompt: "Gentle swaying motion, soft breeze effect, subtle movement" },
  { label: "Zoom in", prompt: "Slow cinematic zoom in, focus on subject, dramatic reveal" },
  { label: "Pan right", prompt: "Smooth camera pan from left to right, steady movement" },
  { label: "Float up", prompt: "Gentle floating upward motion, dreamy ethereal feel" },
  { label: "Breathe", prompt: "Subtle breathing motion, living portrait effect, gentle pulse" },
  { label: "Hair flow", prompt: "Hair flowing in the wind, natural movement, dynamic" },
  { label: "Water ripple", prompt: "Water rippling effect, reflections moving, serene" },
  { label: "Sparkle", prompt: "Magical sparkles and light particles, enchanting glow" },
];

export function PromptEditor({ value, onChange, imageUrl, disabled }: PromptEditorProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [refinementInput, setRefinementInput] = useState("");
  const [showRefinement, setShowRefinement] = useState(false);
  const [lastAiPrompt, setLastAiPrompt] = useState("");

  const handleAnalyzeImage = async (refinement?: string) => {
    if (!imageUrl) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          previousPrompt: lastAiPrompt || undefined,
          refinement: refinement || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze image");
      }

      onChange(data.prompt);
      setLastAiPrompt(data.prompt);
      setShowRefinement(true);
      setRefinementInput("");
    } catch (err) {
      console.error("Failed to analyze image:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRefine = () => {
    if (refinementInput.trim()) {
      handleAnalyzeImage(refinementInput.trim());
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        Animation Prompt
      </label>

      {/* Preset prompts */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_PROMPTS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.prompt)}
            disabled={disabled}
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-hover text-muted hover:bg-surface-elevated hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Textarea with suggest button */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Describe how you want the image to animate..."
          rows={3}
          className="w-full px-4 py-3 pr-28 rounded-xl bg-surface-hover border border-border text-foreground placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none resize-none text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        />
        {imageUrl && (
          <button
            type="button"
            onClick={() => handleAnalyzeImage()}
            disabled={disabled || isAnalyzing}
            className="absolute right-2 top-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? (
              <>
                <Spinner size="xs" />
                <span className="hidden sm:inline">thinking...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">suggest</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* AI Refinement input */}
      {showRefinement && lastAiPrompt && (
        <div className="relative">
          <input
            type="text"
            value={refinementInput}
            onChange={(e) => setRefinementInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRefine()}
            disabled={disabled || isAnalyzing}
            placeholder="Refine prompt: 'more dramatic', 'add wind'..."
            className="w-full px-3 py-2 pr-16 rounded-lg bg-surface-hover border border-border text-foreground placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          />
          <button
            type="button"
            onClick={handleRefine}
            disabled={disabled || isAnalyzing || !refinementInput.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs font-medium text-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? "..." : "refine →"}
          </button>
        </div>
      )}
    </div>
  );
}
