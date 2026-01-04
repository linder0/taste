# Kling Video Generator

A Next.js web app that transforms images into cinematic videos using PiAPI's Kling AI.

## Features

- **Dual image input** - Upload files or paste URLs
- **Prompt presets** - Quick templates for cinematic, portrait, nature, action styles
- **Duration control** - 5 or 10 second clips
- **Aspect ratio** - 16:9 (landscape) or 9:16 (vertical/portrait)
- **Real-time progress** - Polling with progress indicator
- **Video download** - Preview and download generated videos

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure API keys

Edit `.env.local` and add your API keys:

```
PIAPI_API_KEY=your_actual_api_key_here
IMGBB_API_KEY=your_imgbb_api_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

- **PiAPI key:** Get at [piapi.ai](https://piapi.ai) (required for video generation)
- **imgbb key:** Get at [api.imgbb.com](https://api.imgbb.com/) (required for file uploads, free)

> **Note:** File uploads require imgbb because PiAPI needs publicly accessible image URLs. Alternatively, use "Paste URL" mode with images already hosted online.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Styling:** Tailwind CSS v4
- **API:** PiAPI Kling (image-to-video)
- **Storage:** Local filesystem (dev mode)

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Main generator UI
│   └── api/
│       ├── upload/        # Image upload endpoint
│       ├── generate/      # Create video task
│       └── status/        # Poll task status
├── components/
│   ├── ImageInput.tsx     # Upload + URL input
│   ├── PromptEditor.tsx   # Prompt with presets
│   ├── VideoSettings.tsx  # Duration + aspect ratio
│   ├── GenerationProgress.tsx
│   └── VideoPlayer.tsx
└── lib/
    └── piapi.ts           # API client
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/upload` | POST | Upload image file |
| `/api/generate` | POST | Start video generation |
| `/api/status/[taskId]` | GET | Check generation status |

## License

MIT
