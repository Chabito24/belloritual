import Link from "next/link";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const items = await prisma.blog_publicaciones.findMany({
    where: { estado: "PUBLICADO" },
    orderBy: { publicado_en: "desc" },
    select: {
      id: true,
      titulo: true,
      slug: true,
      resumen: true,
      publicado_en: true,
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">Blog</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Solo se muestran publicaciones publicadas.
      </p>

      <section className="mt-8 grid gap-4">
        {items.length === 0 ? (
          <p className="text-neutral-600">Aún no hay publicaciones.</p>
        ) : (
          items.map((x) => (
            <article key={x.id} className="rounded-2xl border border-neutral-200 p-5">
              <div className="flex flex-col gap-1">
                <Link
                  href={`/blog/${x.slug}`}
                  className="text-lg font-semibold hover:underline"
                >
                  {x.titulo}
                </Link>

                <p className="text-xs text-neutral-500">
                  {x.publicado_en
                    ? new Date(x.publicado_en).toLocaleString("es-CO")
                    : ""}
                </p>

                {x.resumen ? (
                  <p className="mt-2 text-sm text-neutral-700">{x.resumen}</p>
                ) : null}
              </div>

              <div className="mt-3">
                <Link
                  href={`/blog/${x.slug}`}
                  className="text-sm font-medium hover:underline"
                >
                  Leer →
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}