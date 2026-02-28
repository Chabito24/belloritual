import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (token) {
    const token_hash = sha256(token);
    await prisma.admin_sesiones.deleteMany({ where: { token_hash } });
  }

  // borrar cookie
  cookieStore.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}