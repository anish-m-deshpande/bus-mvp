import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const incidents = await prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
      include: { matchedFacility: true }
    });
    return NextResponse.json(incidents);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
