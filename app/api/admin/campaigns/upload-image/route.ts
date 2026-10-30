import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET   = "campaign-images";
const MAX_SIZE = 500 * 1024; // 500 KB
const ALLOWED  = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No image provided." }, { status: 400 });

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, or WebP files are accepted." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `File is ${(file.size / 1024).toFixed(0)} KB — max 500 KB.` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext    = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path   = `hero-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  /* Ensure bucket exists (ignore "already exists" error) */
  const { error: bucketErr } = await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
  if (bucketErr && !bucketErr.message.toLowerCase().includes("already exists")) {
    return NextResponse.json({ error: "Storage setup failed." }, { status: 500 });
  }

  const { data, error: upErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (upErr || !data) {
    return NextResponse.json({ error: upErr?.message || "Upload failed." }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl });
}
