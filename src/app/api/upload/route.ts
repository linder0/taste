import { NextRequest, NextResponse } from "next/server";

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Supported: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    // Upload to imgbb (free image hosting)
    if (!IMGBB_API_KEY) {
      return NextResponse.json(
        { error: "Image hosting not configured. Please add IMGBB_API_KEY to .env.local or use 'Paste URL' with a public image URL." },
        { status: 500 }
      );
    }

    const imgbbForm = new FormData();
    imgbbForm.append("key", IMGBB_API_KEY);
    imgbbForm.append("image", base64);

    const imgbbResponse = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: imgbbForm,
    });

    if (!imgbbResponse.ok) {
      const errorText = await imgbbResponse.text();
      console.error("imgbb error:", errorText);
      return NextResponse.json(
        { error: "Failed to upload image to hosting service" },
        { status: 500 }
      );
    }

    const imgbbData = await imgbbResponse.json();

    if (!imgbbData.success) {
      return NextResponse.json(
        { error: "Image hosting service rejected the upload" },
        { status: 500 }
      );
    }

    // Return the public URL from imgbb
    const imageUrl = imgbbData.data.url;

    return NextResponse.json({
      success: true,
      imageUrl,
      filename: imgbbData.data.image?.filename || file.name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
