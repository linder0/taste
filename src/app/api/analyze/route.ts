import { NextRequest, NextResponse } from "next/server";

interface AnalyzeRequestBody {
  imageUrl: string;
  previousPrompt?: string;
  refinement?: string;
}

function getOpenAIKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Please add your API key to .env.local");
  }
  return apiKey;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequestBody = await request.json();

    if (!body.imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    const apiKey = getOpenAIKey();

    // Build the prompt based on whether this is initial analysis or refinement
    let systemPrompt: string;
    let userPrompt: string;

    if (body.previousPrompt && body.refinement) {
      // Refinement mode
      systemPrompt = `You are an expert at creating animation prompts for AI video generation from still images.
The user has an image and a previous animation prompt. They want to refine it based on their feedback.
Generate a new, improved animation prompt that incorporates their refinement request.
Keep the prompt concise (1-2 sentences) and focused on motion, camera movement, and atmosphere.
Only output the prompt text, nothing else.`;

      userPrompt = `Previous prompt: "${body.previousPrompt}"

User's refinement request: "${body.refinement}"

Look at the image and generate an improved animation prompt that addresses the user's feedback.`;
    } else {
      // Initial analysis mode
      systemPrompt = `You are an expert at analyzing images and creating animation prompts for AI video generation.
Analyze the image deeply:
1. Identify the subject matter and key visual elements
2. Recognize any cultural, symbolic, or artistic significance
3. Note the mood, lighting, and atmosphere
4. Consider what kind of motion would enhance this image naturally

Generate a creative, specific animation prompt (1-2 sentences) that would bring this image to life in an interesting way.
Focus on: camera movement, subject motion, atmospheric effects, and mood enhancement.
Only output the prompt text, nothing else.`;

      userPrompt = "Analyze this image and generate a creative animation prompt for an AI video generator.";
    }

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
            content: [
              {
                type: "text",
                text: userPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: body.imageUrl,
                  detail: "low",
                },
              },
            ],
          },
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      throw new Error("No prompt generated");
    }

    return NextResponse.json({
      success: true,
      prompt: generatedPrompt,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    const message = error instanceof Error ? error.message : "Failed to analyze image";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
