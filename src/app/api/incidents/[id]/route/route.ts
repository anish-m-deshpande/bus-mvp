import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { geocodeLocation, GeocodeResult } from "@/server/geo/geocode";
import { calculateHaversineDistance } from "@/server/geo/distance";
import { refineRoutingDecision } from "@/server/llm/refineRouting";
import { IncidentExtractedSchema, RoutingDecision } from "@/lib/schemas";
import { Facility } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Get Incident and ensure extraction exists
    const incident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!incident || !incident.issueCategory) {
      return NextResponse.json({ error: "Incident or extracted data not found" }, { status: 404 });
    }

    const extraction = IncidentExtractedSchema.parse({
      city: incident.city,
      state: incident.state,
      location_text: incident.locationText,
      issue_category: incident.issueCategory,
      confidence: incident.confidence,
      symptoms: JSON.parse(incident.symptoms || "[]"),
      driveable: incident.driveable,
      passengers_onboard: incident.passengersOnboard,
      safety_flags: JSON.parse(incident.safetyFlags || "[]"),
      callback_number: incident.callbackNumber,
      bus_id: incident.busId,
    });

    // 2. Geocode incident location
    console.log(`[API/Route] Geocoding incident: ${id}`);
    const incidentGeo: GeocodeResult | null = await geocodeLocation(extraction.city, extraction.state, extraction.location_text);
    
    if (!incidentGeo) {
        return NextResponse.json({ error: "Could not geocode incident location" }, { status: 400 });
    }

    // Use geocoded state if available, fallback to extracted state
    const targetState = incidentGeo.state || extraction.state || "";

    // 3. Fetch all facilities
    const allFacilities: Facility[] = await prisma.facility.findMany();

    // 4. Escalation Override (Critical Safety Flags)
    const CRITICAL_FLAGS = ["fire", "smoke", "brakes_failure", "collision", "medical"];
    const hasCriticalFlag = extraction.safety_flags.some(f => CRITICAL_FLAGS.includes(f.toLowerCase()));

    if (hasCriticalFlag) {
        const opsDesk = allFacilities.find((f: Facility) => 
            f.name.toLowerCase().includes("ops desk") && 
            (f.state.toUpperCase() === targetState.toUpperCase() || targetState === "")
        );

        if (opsDesk) {
            console.log(`[API/Route] Critical flag detected. Escalating to Ops Desk: ${opsDesk.name}`);
            const decision: RoutingDecision = {
                matched_facility_id: opsDesk.id,
                distance_miles: calculateHaversineDistance(incidentGeo.lat, incidentGeo.lon, opsDesk.lat, opsDesk.lon),
                rationale: "Safety override: Incident escalated to State Ops Desk due to critical safety flags."
            };
            await persistRouting(id, decision);
            return NextResponse.json(decision);
        }
    }

    // 5. Filter and Rank Facilities
    let candidates = allFacilities
        .filter((f: Facility) => {
            // Must support the issue category
            const caps: string[] = JSON.parse(f.capabilities);
            const supportsIssue = caps.includes(extraction.issue_category);
            
            // Must be in state or covered state (if state is known)
            const coverage: string[] = JSON.parse(f.coverage_states);
            const coversState = !targetState || f.state === targetState || coverage.includes(targetState);
            
            return supportsIssue && coversState;
        })
        .map((f: Facility) => ({
            id: f.id,
            name: f.name,
            distance: calculateHaversineDistance(incidentGeo.lat, incidentGeo.lon, f.lat, f.lon),
            capabilities: JSON.parse(f.capabilities) as string[]
        }))
        .sort((a, b) => a.distance - b.distance);

    // 5.5 Fallback: If no matches in state/coverage, just take closest capable facilities anywhere
    if (candidates.length === 0) {
        console.log(`[API/Route] No regional candidates found for ${targetState}. Falling back to proximity-only.`);
        candidates = allFacilities
            .filter((f: Facility) => {
                const caps: string[] = JSON.parse(f.capabilities);
                return caps.includes(extraction.issue_category);
            })
            .map((f: Facility) => ({
                id: f.id,
                name: f.name,
                distance: calculateHaversineDistance(incidentGeo.lat, incidentGeo.lon, f.lat, f.lon),
                capabilities: JSON.parse(f.capabilities) as string[]
            }))
            .sort((a, b) => a.distance - b.distance);
    }

    const topCandidates = candidates.slice(0, 3);

    if (topCandidates.length === 0) {
        return NextResponse.json({ error: "No capable facilities found globally for this issue" }, { status: 404 });
    }

    // 6. LLM Refinement
    console.log(`[API/Route] Refining route with LLM for incident: ${id}`);
    const decision = await refineRoutingDecision(extraction, topCandidates);

    // 7. Save to DB
    await persistRouting(id, decision);

    return NextResponse.json(decision);

  } catch (error: any) {
    console.error(`[API/Route] Error:`, error);
    return NextResponse.json({ error: "Routing failed", details: error.message }, { status: 500 });
  }
}

async function persistRouting(id: string, decision: RoutingDecision) {
    await prisma.incident.update({
        where: { id },
        data: {
            matchedFacilityId: decision.matched_facility_id,
            distanceMiles: decision.distance_miles,
            rationale: decision.rationale,
            status: "notified"
        }
    });
}
