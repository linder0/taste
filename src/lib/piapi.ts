const PIAPI_BASE_URL = "https://api.piapi.ai/api/v1";

export interface CreateTaskInput {
  imageUrl: string;
  prompt: string;
  duration: 2 | 5 | 10;
  aspectRatio: "16:9" | "9:16";
  mode?: "standard" | "turbo";
  negativePrompt?: string;
}

export interface TaskResponse {
  taskId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  videoUrl?: string;
  error?: string;
}

interface PiAPIError {
  code?: number;
  raw_message?: string;
  message?: string;
  detail?: unknown;
}

interface PiAPIResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    status?: string;
    output?: {
      video_url?: string;
    };
    error?: PiAPIError | string;
    progress?: number;
  };
}

function extractErrorMessage(error: PiAPIError | string | undefined): string | undefined {
  if (!error) return undefined;
  if (typeof error === "string") return error;
  // Extract the most useful message from the error object
  return error.raw_message || error.message || "Unknown error occurred";
}

function getApiKey(): string {
  const apiKey = process.env.PIAPI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    throw new Error("PIAPI_API_KEY is not configured. Please add your API key to .env.local");
  }
  return apiKey;
}

export async function createImageToVideoTask(input: CreateTaskInput): Promise<TaskResponse> {
  const apiKey = getApiKey();

  const response = await fetch(`${PIAPI_BASE_URL}/task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "kling",
      task_type: "image_to_video",
      input: {
        image_url: input.imageUrl,
        prompt: input.prompt,
        negative_prompt: input.negativePrompt || "extra limbs, face distortion, morphing, warping, deformed hands, blurry, low quality",
        duration: input.duration,
        aspect_ratio: input.aspectRatio,
        mode: input.mode || "turbo",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PiAPI request failed: ${response.status} - ${errorText}`);
  }

  const data: PiAPIResponse = await response.json();

  if (data.code !== 200 && data.code !== 0) {
    throw new Error(`PiAPI error: ${data.message}`);
  }

  return {
    taskId: data.data.task_id,
    status: "pending",
  };
}

export async function getTaskStatus(taskId: string): Promise<TaskResponse> {
  const apiKey = getApiKey();

  const response = await fetch(`${PIAPI_BASE_URL}/task/${taskId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PiAPI request failed: ${response.status} - ${errorText}`);
  }

  const data: PiAPIResponse = await response.json();

  if (data.code !== 200 && data.code !== 0) {
    throw new Error(`PiAPI error: ${data.message}`);
  }

  const statusMap: Record<string, TaskResponse["status"]> = {
    pending: "pending",
    processing: "processing",
    completed: "completed",
    success: "completed",
    failed: "failed",
    error: "failed",
  };

  const status = statusMap[data.data.status?.toLowerCase() || "pending"] || "pending";

  return {
    taskId,
    status,
    progress: data.data.progress,
    videoUrl: data.data.output?.video_url,
    error: extractErrorMessage(data.data.error),
  };
}

export async function pollTaskUntilComplete(
  taskId: string,
  onProgress?: (status: TaskResponse) => void,
  maxAttempts = 120,
  intervalMs = 5000
): Promise<TaskResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getTaskStatus(taskId);

    if (onProgress) {
      onProgress(status);
    }

    if (status.status === "completed" || status.status === "failed") {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Task polling timed out");
}
