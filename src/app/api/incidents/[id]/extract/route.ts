import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractIncidentData } from "@/server/llm/extractIncident";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Get transcript from DB
    const incident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!incident || !incident.transcriptText) {
      return NextResponse.json({ error: "Incident or transcript not found" }, { status: 404 });
    }

    // 2. Call LLM to extract data
    console.log(`[API/Extract] Extracting data for incident: ${id}`);
    const extractedData = await extractIncidentData(incident.transcriptText);

    // 3. Save extracted JSON to DB
    // We map the Zod fields back to the database schema
    const updated = await prisma.incident.update({
      where: { id },
      data: {
        city: extractedData.city,
        state: extractedData.state,
        locationText: extractedData.location_text,
        issueCategory: extractedData.issue_category,
        confidence: extractedData.confidence,
        symptoms: JSON.stringify(extractedData.symptoms),
        driveable: extractedData.driveable,
        passengersOnboard: extractedData.passengers_onboard,
        safetyFlags: JSON.stringify(extractedData.safety_flags),
        callbackNumber: extractedData.callback_number,
        busId: extractedData.bus_id,
      },
    });

    return NextResponse.json(extractedData);

  } catch (error: any) {
    console.error(`[API/Extract] Error:`, error);
    return NextResponse.json({ error: "Extraction failed", details: error.message }, { status: 500 });
  }
}
