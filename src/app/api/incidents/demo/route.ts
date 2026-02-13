import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { transcript, label } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    // Create Incident record directly from transcript
    const incident = await prisma.incident.create({
      data: {
        audioFilename: `demo_${label || Date.now()}.txt`,
        transcriptText: transcript,
        status: "new",
      },
    });

    return NextResponse.json({
      incident_id: incident.id,
      transcript_text: transcript,
    });

  } catch (error: any) {
    console.error(`[API/Demo] Error:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
