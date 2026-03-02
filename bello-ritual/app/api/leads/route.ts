import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const nombre = String(body?.nombre ?? "").trim();
    const correo = String(body?.correo ?? "").trim();
    const telefono = String(body?.telefono ?? "").trim();
    const canal = String(body?.canal ?? "web").trim() || "web";
    const mensaje = String(body?.mensaje ?? "").trim();

    // Evita leads totalmente vacíos
    if (!nombre && !correo && !telefono && !mensaje) {
      return NextResponse.json({ ok: false, error: "DATOS_VACIOS" }, { status: 400 });
    }

    const lead = await prisma.leads.create({
      data: {
        nombre: nombre || "(sin nombre)",
        correo: correo || "",
        telefono: telefono || "",
        canal,
        mensaje: mensaje || "",
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (e) {
    console.error("[POST /api/leads]", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}