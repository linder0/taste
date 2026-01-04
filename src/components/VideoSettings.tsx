"use client";

import { ToggleButton, SparklesIcon, BoltIcon } from "@/components/ui";

export type SpeedMode = "standard" | "turbo";

interface VideoSettingsProps {
  duration: 2 | 5 | 10;
  aspectRatio: "16:9" | "9:16";
  speedMode: SpeedMode;
  onDurationChange: (duration: 2 | 5 | 10) => void;
  onAspectRatioChange: (ratio: "16:9" | "9:16") => void;
  onSpeedModeChange: (mode: SpeedMode) => void;
  disabled?: boolean;
}

export function VideoSettings({
  duration,
  aspectRatio,
  speedMode,
  onDurationChange,
  onAspectRatioChange,
  onSpeedModeChange,
  disabled,
}: VideoSettingsProps) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6">
      {/* Duration */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Duration</label>
        <div className="flex gap-2">
          <ToggleButton active={duration === 2} onClick={() => onDurationChange(2)} disabled={disabled}>
            2s
          </ToggleButton>
          <ToggleButton active={duration === 5} onClick={() => onDurationChange(5)} disabled={disabled}>
            5s
          </ToggleButton>
          <ToggleButton active={duration === 10} onClick={() => onDurationChange(10)} disabled={disabled}>
            10s
          </ToggleButton>
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Aspect Ratio</label>
        <div className="flex gap-2">
          <ToggleButton active={aspectRatio === "16:9"} onClick={() => onAspectRatioChange("16:9")} disabled={disabled}>
            <span className="flex items-center gap-2">
              <span className={`w-5 h-3 rounded-sm border-2 ${aspectRatio === "16:9" ? "border-background" : "border-current"}`} />
              16:9
            </span>
          </ToggleButton>
          <ToggleButton active={aspectRatio === "9:16"} onClick={() => onAspectRatioChange("9:16")} disabled={disabled}>
            <span className="flex items-center gap-2">
              <span className={`w-3 h-5 rounded-sm border-2 ${aspectRatio === "9:16" ? "border-background" : "border-current"}`} />
              9:16
            </span>
          </ToggleButton>
        </div>
      </div>

      {/* Speed Mode */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Speed</label>
        <div className="flex gap-2">
          <ToggleButton
            active={speedMode === "turbo"}
            onClick={() => onSpeedModeChange("turbo")}
            disabled={disabled}
            activeClass="bg-emerald-600 text-white"
          >
            <span className="flex items-center gap-2">
              <BoltIcon />
              Turbo
            </span>
          </ToggleButton>
          <ToggleButton active={speedMode === "standard"} onClick={() => onSpeedModeChange("standard")} disabled={disabled}>
            <span className="flex items-center gap-2">
              <SparklesIcon />
              Quality
            </span>
          </ToggleButton>
        </div>
        <p className="text-xs text-muted">
          {speedMode === "turbo"
            ? "⚡ ~30-60 seconds • Good quality"
            : "✨ ~2-5 minutes • Best quality"}
        </p>
      </div>
    </div>
  );
}
