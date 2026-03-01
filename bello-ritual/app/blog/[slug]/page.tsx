import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { Metadata } from "next";

export async function generateMetadata(
  { params }: { params: { slug: string } | Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  if (!slug) return { title: "Blog | Bello Ritual" };

  const post = await prisma.blog_publicaciones.findUnique({
    where: { slug },
    select: { 
        titulo: true,
        contenido: true,
        resumen: true, 
        estado: true,
        publicado_en: true,
        actualizado_en: true,
    },
  });

  if (!post || post.estado !== "PUBLICADO") {
    return { title: "Blog | Bello Ritual" };
  }

  return {
    title: `${post.titulo} | Bello Ritual`,
    description: post.resumen ?? undefined,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
  
}) {
  const { slug } = await Promise.resolve(params);
    if (!slug || typeof slug !== "string") notFound(); 

  const post = await prisma.blog_publicaciones.findUnique({
    where: { slug },
    select: {
      titulo: true,
      contenido: true,
      resumen: true,
      estado: true,
      publicado_en: true,
      actualizado_en: true,
    },
  });

  if (!post || post.estado !== "PUBLICADO") notFound();

  const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "http://localhost:3000").replace(/\/$/, "");

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.titulo,
  description: post.resumen ?? undefined,
  datePublished: post.publicado_en ? new Date(post.publicado_en).toISOString() : undefined,
  dateModified: post.actualizado_en
    ? new Date(post.actualizado_en).toISOString()
    : post.publicado_en
    ? new Date(post.publicado_en).toISOString()
    : undefined,
  mainEntityOfPage: `${BASE_URL}/blog/${slug}`,
  author: { "@type": "Organization", name: "Bello Ritual" },
  publisher: { "@type": "Organization", name: "Bello Ritual" },
};


  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
        <script
            id="json-ld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
      <Link href="/blog" className="text-sm hover:underline">
        ← Volver al blog
      </Link>

      <article className="mt-6">
        <h1 className="text-2xl font-bold">{post.titulo}</h1>

        <p className="mt-2 text-xs text-neutral-500">
          {post.publicado_en ? new Date(post.publicado_en).toLocaleString("es-CO") : ""}
        </p>

        {post.resumen ? (
          <p className="mt-4 text-sm text-neutral-700">{post.resumen}</p>
        ) : null}

        <div className="mt-6 whitespace-pre-wrap leading-7 text-neutral-800">
          {post.contenido}
        </div>
      </article>
    </main>
  );
}