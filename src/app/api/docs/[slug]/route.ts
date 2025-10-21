import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug;
    const { data: doc, error: dErr } = await supabaseAdmin
      .from("docs")
      .select("id, title, slug, cover_url, created_at")
      .eq("slug", slug)
      .single();
    if (dErr || !doc) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const { data: sections, error: sErr } = await supabaseAdmin
      .from("doc_sections")
      .select("idx, title, blocks")
      .eq("doc_id", doc.id)
      .order("idx", { ascending: true });
    if (sErr) throw sErr;

    return NextResponse.json({ doc, sections });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug;
    const body = await req.json();
    const { sections, blocks } = body as { sections?: any[]; blocks?: any[] };

    const { data: doc, error: dErr } = await supabaseAdmin
      .from("docs")
      .select("id")
      .eq("slug", slug)
      .single();
    if (dErr || !doc) return NextResponse.json({ error: "not_found" }, { status: 404 });

    if (sections && Array.isArray(sections) && blocks && Array.isArray(blocks)) {
      // 간단 구현: 기존 섹션 삭제 후 새로 삽입 (트랜잭션 필요하면 RPC 권장)
      await supabaseAdmin.from("doc_sections").delete().eq("doc_id", doc.id);
      // sections의 start/end 기준으로 분할 삽입
      const rows = sections.map((s: any, i: number) => ({
        doc_id: doc.id,
        idx: i,
        title: s.title,
        blocks: blocks.slice(s.start, s.end),
      }));
      const { error: insErr } = await supabaseAdmin.from("doc_sections").insert(rows);
      if (insErr) throw insErr;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}



