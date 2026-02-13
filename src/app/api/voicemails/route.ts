import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DEPRECATED: This route was for the initial Voicemail model.
 * The system now uses the /api/incidents routes.
 * Keeping a simplified version that returns incidents as "voicemails" 
 * to maintain compatibility with any remaining legacy code or until refactored.
 */

export async function GET() {
  try {
    const incidents = await prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(incidents);
  } catch (error: any) {
    console.error("API GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    // Return notice that this is deprecated
    return NextResponse.json({ 
        error: "Deprecated. Use /api/incidents/transcribe instead.",
        migration: "The domain model shifted from Voicemail to Incident/Facility."
    }, { status: 410 });
}
