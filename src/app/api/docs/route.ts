import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type SectionInput = { title: string; blocks: unknown[] };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
  const { ownerId, title, slug, visibility = "public", sections, coverUrl } = body as {
      ownerId?: string;
      title: string;
      slug?: string;
      visibility?: "public" | "unlisted" | "private";
      sections: SectionInput[];
    coverUrl?: string;
    };

    if (!title || !Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const safeSlug = (slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9\u3131-\uD79D]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // ensure owner
    let ownerIdFinal = ownerId;
    if (!ownerIdFinal) {
      // dev seed owner (service role only)
      const email = process.env.SEED_OWNER_EMAIL || "dev@textoverflow.local";
      const username = process.env.SEED_OWNER_USERNAME || "dev";
      const users = await supabaseAdmin.auth.admin.listUsers();
      ownerIdFinal = users.data.users.find((u) => u.email === email)?.id as string | undefined;
      if (!ownerIdFinal) {
        const created = await supabaseAdmin.auth.admin.createUser({ email, password: process.env.SEED_OWNER_PASSWORD || "dev-password-123", email_confirm: true });
        ownerIdFinal = created.data.user?.id as string | undefined;
      }
      if (!ownerIdFinal) throw new Error("owner_seed_failed");
      await supabaseAdmin.from("profiles").upsert({ id: ownerIdFinal, username }, { onConflict: "id" });
    }

    // ensure unique slug per owner: append -2, -3 ... if exists
    let candidate = safeSlug;
    {
      const { data: existList } = await supabaseAdmin
        .from("docs")
        .select("slug")
        .eq("owner_id", ownerIdFinal)
        .ilike("slug", `${safeSlug}%`);
      if (existList && existList.length > 0) {
        const used = new Set(existList.map((r: any) => r.slug));
        let n = 2;
        while (used.has(candidate)) candidate = `${safeSlug}-${n++}`;
      }
    }

    const { data: docIns, error: docErr } = await supabaseAdmin
      .from("docs")
      .insert({ owner_id: ownerIdFinal, title, slug: candidate, visibility, cover_url: coverUrl })
      .select("id, slug")
      .single();
    if (docErr || !docIns) throw docErr || new Error("doc_insert_failed");

    const docId = docIns.id as string;

    const sectionRows = sections.map((s, i) => ({
      doc_id: docId,
      idx: i,
      title: s.title,
      blocks: s.blocks,
    }));
    const { error: secErr } = await supabaseAdmin.from("doc_sections").insert(sectionRows);
    if (secErr) throw secErr;

    return NextResponse.json({ id: docId, slug: docIns.slug });
  } catch (e: any) {
    console.error("/api/docs POST error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("docs")
      .select("id, title, slug, cover_url, created_at, profiles(username)")
      .order("created_at", { ascending: false })
      .limit(24);
    if (error) throw error;
    return NextResponse.json({ docs: data });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}


