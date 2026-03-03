import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

async function requireAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (!token) return false;

  const token_hash = sha256(token);
  const ses = await prisma.admin_sesiones.findFirst({
    where: { token_hash, expira_en: { gt: new Date() } },
    select: { id: true },
  });
  return Boolean(ses);
}

export async function POST(req: Request) {
  const ok = await requireAdminSession();
  if (!ok) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const paths: string[] = Array.isArray(body?.paths) ? body.paths : [];

  // Default: revalidar blog y feeds
  const toRevalidate = paths.length ? paths : ["/blog", "/sitemap.xml", "/feed.xml"];

  for (const p of toRevalidate) revalidatePath(p);

  return NextResponse.json({ ok: true, revalidated: toRevalidate });
}