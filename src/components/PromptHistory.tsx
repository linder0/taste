"use client";

import type { Clip, ClipVariation } from "@/types/project";

interface HistoryNode {
  id: string;
  prompt: string;
  isOriginal: boolean;
  children: HistoryNode[];
  variation?: ClipVariation;
}

interface PromptHistoryProps {
  clip: Clip;
  variations: ClipVariation[];
  selectedId: string;
  onSelect: (id: string, isOriginal: boolean) => void;
}

export function PromptHistory({
  clip,
  variations,
  selectedId,
  onSelect,
}: PromptHistoryProps) {
  // Build tree structure from variations
  const buildTree = (): HistoryNode => {
    const root: HistoryNode = {
      id: clip.id,
      prompt: clip.prompt,
      isOriginal: true,
      children: [],
    };

    // Create a map of variation id to node
    const nodeMap = new Map<string, HistoryNode>();
    nodeMap.set(clip.id, root);

    // Create nodes for all variations
    variations.forEach((v) => {
      const node: HistoryNode = {
        id: v.id,
        prompt: v.prompt,
        isOriginal: false,
        children: [],
        variation: v,
      };
      nodeMap.set(v.id, node);
    });

    // Build parent-child relationships
    variations.forEach((v) => {
      const node = nodeMap.get(v.id)!;
      const parentId = v.parent_variation_id || clip.id;
      const parentNode = nodeMap.get(parentId);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        // Fallback: attach to root if parent not found
        root.children.push(node);
      }
    });

    return root;
  };

  const tree = buildTree();

  const renderNode = (node: HistoryNode, depth: number = 0, isLast: boolean = true, prefix: string = "") => {
    const isSelected = node.id === selectedId;
    const connector = depth === 0 ? "" : (isLast ? "└─ " : "├─ ");
    const childPrefix = depth === 0 ? "" : prefix + (isLast ? "   " : "│  ");

    return (
      <div key={node.id}>
        <button
          onClick={() => onSelect(node.id, node.isOriginal)}
          className={`w-full text-left py-1.5 px-2 rounded transition-colors ${
            isSelected
              ? "bg-accent/20 text-accent"
              : "hover:bg-surface-hover text-foreground"
          }`}
        >
          <div className="flex items-start gap-1">
            <span className="text-muted font-mono text-xs whitespace-pre">{prefix}{connector}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  node.isOriginal ? "bg-accent" : "bg-surface-elevated border border-border"
                }`} />
                <span className={`text-xs font-medium truncate ${isSelected ? "text-accent" : ""}`}>
                  {node.isOriginal ? "Original" : "Variation"}
                </span>
                {isSelected && (
                  <span className="text-[10px] text-accent">←</span>
                )}
              </div>
              <p className="text-xs text-muted truncate mt-0.5 ml-3.5">{node.prompt}</p>
            </div>
          </div>
        </button>
        {node.children.length > 0 && (
          <div className="ml-0">
            {node.children.map((child, i) =>
              renderNode(child, depth + 1, i === node.children.length - 1, childPrefix)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-0.5">
      {renderNode(tree)}
    </div>
  );
}
