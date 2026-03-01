import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "http://localhost:3000").replace(/\/$/, "");

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await prisma.blog_publicaciones.findMany({
    where: { estado: "PUBLICADO" },
    orderBy: { publicado_en: "desc" },
    take: 50,
    select: {
      titulo: true,
      slug: true,
      resumen: true,
      publicado_en: true,
      actualizado_en: true,
    },
  });

  const itemsXml = posts
    .map((p) => {
      const link = `${BASE_URL}/blog/${p.slug}`;
      const pubDate = (p.publicado_en ?? new Date()).toUTCString();
      const updated = (p.actualizado_en ?? p.publicado_en ?? new Date()).toISOString();
      const title = esc(p.titulo);
      const desc = esc(p.resumen ?? "");

      return `
  <item>
    <title>${title}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${desc}</description>
    <atom:updated>${updated}</atom:updated>
  </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Bello Ritual | Blog</title>
  <link>${BASE_URL}/blog</link>
  <description>Publicaciones de Bello Ritual.</description>
  <language>es-CO</language>
  <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
  ${itemsXml}
</channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}