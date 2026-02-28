import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  const token_hash = sha256(token);

  const ses = await prisma.admin_sesiones.findUnique({
    where: { token_hash },
    include: { usuarios_admin: true },
  });

  if (!ses) return NextResponse.json({ ok: false }, { status: 401 });
  if (new Date(ses.expira_en).getTime() < Date.now())
    return NextResponse.json({ ok: false }, { status: 401 });
  if (!ses.usuarios_admin?.activo)
    return NextResponse.json({ ok: false }, { status: 403 });

  return NextResponse.json({
    ok: true,
    admin: {
      id: ses.usuarios_admin.id,
      nombre: ses.usuarios_admin.nombre,
      correo: ses.usuarios_admin.correo,
    },
  });
}