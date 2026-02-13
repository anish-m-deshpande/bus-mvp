import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: { matchedFacility: true }
    });
    
    if (!incident) {
        return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }
    
    return NextResponse.json(incident);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
