import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { RoutingDecision, RoutingDecisionSchema, IncidentExtracted } from "@/lib/schemas";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "empty",
  baseURL: process.env.OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `
You are a senior fleet logistics manager. You need to choose the best facility from a shortlist of 3 candidates to handle a reported bus incident.

shortlist_candidates will include: facility_id, name, distance_miles, and capabilities.

Rules:
1. You MUST choose exactly one of the 3 candidates provided in the shortlist.
2. Consider the incident category and the facility capabilities carefully.
3. While distance is important, a specialized facility slightly further away might be better than a general one closer.
4. If a "State Ops Desk" is in the list and the incident has high safety risk, favor it for coordination.
5. Provide a clear, one-sentence rationale for your choice.

IMPORTANT: RETURN ONLY A PURE JSON OBJECT code block.
`;

export async function refineRoutingDecision(
  incident: IncidentExtracted,
  candidates: Array<{ id: string; name: string; distance: number; capabilities: string[] }>
): Promise<RoutingDecision> {
  // Check for placeholder key
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("your-api-key")) {
    throw new Error("Missing OpenAI API Key. Please update your .env file.");
  }

  const prompt = `
  INCIDENT:
  Category: ${incident.issue_category}
  Symptoms: ${incident.symptoms.join(", ")}
  Safety Flags: ${incident.safety_flags.join(", ")}
  Location: ${incident.location_text} (${incident.city}, ${incident.state})

  SHORTLIST CANDIDATES:
  ${candidates.map((c, i) => `${i+1}. ${c.name} (ID: ${c.id}) - ${c.distance.toFixed(1)} miles away. Capabilities: ${c.capabilities.join(", ")}`).join("\n  ")}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("LLM failed to provide routing decision");

    const parsed = JSON.parse(content);
    
    // Normalize LLM output to match our schema fields
    return RoutingDecisionSchema.parse({
      matched_facility_id: parsed.matched_facility_id || parsed.facility_id,
      distance_miles: parsed.distance_miles || candidates.find(c => c.id === (parsed.matched_facility_id || parsed.facility_id))?.distance,
      rationale: parsed.rationale
    });

  } catch (error: any) {
    console.error("[LLM/Route] Error:", error);
    if (error.status === 401) {
        throw new Error("Invalid OpenAI API Key.");
    }
    // Simple fallback: choose the first one (nearest)
    return {
      matched_facility_id: candidates[0]?.id || null,
      distance_miles: candidates[0]?.distance || null,
      rationale: "Automated routing to nearest capable facility (LLM fallback)."
    };
  }
}
