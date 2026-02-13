import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendFacilityNotification } from "@/server/notify/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Fetch Incident with matched facility
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: { matchedFacility: true }
    });

    if (!incident || !incident.matchedFacility) {
      return NextResponse.json({ error: "Incident or matched facility not found" }, { status: 404 });
    }

    // 2. Extract base URL for the app
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const appUrl = `${protocol}://${host}`;

    // 3. Send Notification
    const result = await sendFacilityNotification({
      to: incident.matchedFacility.contact_email,
      incidentId: incident.id,
      issueCategory: incident.issueCategory || "Unknown",
      city: incident.city || "Unknown",
      state: incident.state || "Unknown",
      distance: incident.distanceMiles || 0,
      locationText: incident.locationText || "Unknown Location",
      driveable: incident.driveable,
      passengers: incident.passengersOnboard,
      safetyFlags: JSON.parse(incident.safetyFlags || "[]"),
      callbackNumber: incident.callbackNumber,
      busId: incident.busId,
      transcript: incident.transcriptText || "No transcript available",
      appUrl
    });

    // 4. Update status
    await prisma.incident.update({
      where: { id },
      data: { status: "notified" }
    });

    return NextResponse.json({ 
        ok: true, 
        messageId: result.messageId, 
        previewUrl: result.previewUrl 
    });

  } catch (error: any) {
    console.error(`[API/Notify] Error:`, error);
    return NextResponse.json({ error: "Notification failed", details: error.message }, { status: 500 });
  }
}
