import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const docId = form.get("docId") as string | null;
    const filename = form.get("filename") as string | null;
    if (!file || !docId || !filename) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const path = `${docId}/${filename}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("doc-assets")
      .upload(path, file, { upsert: true, contentType: (file as any).type || "application/octet-stream" });
    if (upErr) throw upErr;

    const { data } = supabaseAdmin.storage.from("doc-assets").getPublicUrl(path);
    let url = data.publicUrl as string | undefined;
    if (!url) {
      const signed = await supabaseAdmin.storage.from("doc-assets").createSignedUrl(path, 60 * 60 * 24 * 365);
      url = signed.data?.signedUrl;
    }
    return NextResponse.json({ url, path });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}


