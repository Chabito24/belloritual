// app/api/leads/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const nombre = String(body?.nombre ?? "").trim();
    const correoRaw = String(body?.correo ?? "").trim().toLowerCase();
    const correo = correoRaw ? correoRaw : null;

    const telefonoRaw = String(body?.telefono ?? "").trim();
    const telefono = telefonoRaw ? telefonoRaw : null;

    const canal = String(body?.canal ?? "web").trim();
    const mensajeRaw = String(body?.mensaje ?? "").trim();
    const mensaje = mensajeRaw ? mensajeRaw : null;

    if (!nombre) {
      return NextResponse.json({ ok: false, error: "NOMBRE_REQUERIDO" }, { status: 400 });
    }

    const lead = await prisma.leads.create({
      data: { nombre, correo, telefono, canal, mensaje },
    });

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (e) {
    console.error("[POST /api/leads]", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}