import { NextRequest, NextResponse } from "next/server";
import { getClip, getAllClipTags } from "@/lib/db";

interface SuggestRequestBody {
  currentPrompt: string;
  variationId?: string;
}

function getOpenAIKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Please add your API key to .env.local");
  }
  return apiKey;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: SuggestRequestBody = await request.json();
    const { currentPrompt, variationId } = body;

    if (!currentPrompt) {
      return NextResponse.json(
        { error: "Current prompt is required" },
        { status: 400 }
      );
    }

    // Get the original clip
    const clip = getClip(id);
    if (!clip) {
      return NextResponse.json(
        { error: "Clip not found" },
        { status: 404 }
      );
    }

    // Get all tags for this clip
    const allTags = getAllClipTags(id);
    
    // Filter tags for the relevant variation or original
    const relevantTags = variationId
      ? allTags.filter((t) => t.variation_id === variationId)
      : allTags.filter((t) => !t.variation_id);

    const apiKey = getOpenAIKey();

    // Build tag context
    const tagContext = relevantTags.length > 0
      ? `\n\nThe user has marked these issues at specific timestamps:\n${relevantTags.map((t) => `- ${t.timestamp.toFixed(1)}s: "${t.content}"`).join("\n")}`
      : "";

    const systemPrompt = `You are an expert at improving video generation prompts. 
You help users refine their prompts to get better AI-generated video results.

Given the original prompt, current prompt (may be the same), and any issues the user has marked at specific timestamps, suggest an improved prompt that:
1. Addresses the specific issues mentioned
2. Uses more precise, descriptive language
3. Adds negative guidance if certain unwanted behaviors were noted
4. Maintains the core intent of the original prompt

Output ONLY the improved prompt text, nothing else. Keep it concise (1-3 sentences).`;

    const userPrompt = `Original prompt: "${clip.prompt}"
Current prompt: "${currentPrompt}"${tagContext}

Based on the above, suggest an improved prompt that addresses any issues and produces a better result.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const suggestedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!suggestedPrompt) {
      throw new Error("No suggestion generated");
    }

    return NextResponse.json({
      success: true,
      suggestion: suggestedPrompt,
      basedOnTags: relevantTags.length,
    });
  } catch (error) {
    console.error("Suggest error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate suggestion";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

