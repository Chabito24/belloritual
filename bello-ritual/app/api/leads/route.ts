import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nombre = (body?.nombre ?? "").toString().trim().slice(0, 80);
    const telefono = (body?.telefono ?? "").toString().trim().slice(0, 30);
    const mensaje = (body?.mensaje ?? "").toString().trim().slice(0, 2000);
    const canal = (body?.canal ?? "contacto").toString().trim().slice(0, 30);

    await prisma.leads.create({
      data: { nombre, telefono, mensaje, canal },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
  console.error(e);
  return NextResponse.json(
    { ok: false, error: e instanceof Error ? e.message : String(e) },
    { status: 500 }
  );
}
}
