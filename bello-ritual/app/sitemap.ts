import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
export const revalidate = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await prisma.blog_publicaciones.findMany({
    where: { estado: "PUBLICADO" },
    select: { slug: true, publicado_en: true, actualizado_en: true },
    orderBy: { publicado_en: "desc" },
  });

  const now = new Date();

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    ...posts.map((p) => ({
        url: `${BASE_URL}/blog/${p.slug}`,
        lastModified: p.actualizado_en ?? p.publicado_en ?? now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
        })),
  ];
}