import OpenAI from "openai";
import { IncidentExtracted, IncidentExtractedSchema } from "@/lib/schemas";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "empty",
  baseURL: process.env.OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `
You are an expert dispatcher for a transit fleet. Your task is to analyze a voicemail transcript from a bus driver reporting an issue and extract structured data.

Allowed Issue Categories:
Doors, Brakes, EngineOverheat, Electrical, SteeringSuspension, TiresWheels, ADAEquipment, HVAC, CommsITS, AccidentIncident, SafetySecurityMedical, Other

Rules:
1. issue_category: Choose ONLY from the Allowed Issue Categories list above.
2. confidence: Rate your confidence in the extraction from 0 to 1.
3. symptoms: List physical observations (e.g., "smoke", "grinding noise", "warning light").
4. driveable / passengers_onboard: Use "yes", "no", or "unknown".
5. safety_flags: Identify critical flags: "smoke", "fire", "brakes_failure", "collision", "medical", "aggressive_passenger". If none, return empty array.
6. callback_number / bus_id: Extract only if explicitly mentioned. NEVER invent or assume these.
7. city / state: Extract location if mentioned.
8. location_text: Keep the original phrasing of where they are.

IMPORTANT: RETURN ONLY A PURE JSON OBJECT. NO MARKDOWN.

Examples:
- Driver: "Hey this is Mike on bus 402, I'm in Boston near South Station. My brakes are feeling soft and I have a full load of passengers. I can't drive this."
  Output: { "bus_id": "402", "city": "Boston", "location_text": "near South Station", "issue_category": "Brakes", "driveable": "no", "passengers_onboard": "yes", "safety_flags": ["brakes_failure"], "confidence": 0.9, "state": "MA", "symptoms": ["soft brakes"], "callback_number": null }
`;

export async function extractIncidentData(transcript: string): Promise<IncidentExtracted> {
  // Check for placeholder key
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("your-api-key")) {
    throw new Error("Missing OpenAI API Key. Please set OPENAI_API_KEY in your .env file.");
  }

  try {
    const response = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this transcript and return JSON: "${transcript}"` },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error("Failed to get response from LLM");
    }

    const parsed = JSON.parse(content);
    return IncidentExtractedSchema.parse(parsed);
    
  } catch (error: any) {
    console.error("[LLM/Extract] Error:", error);
    if (error.status === 401) {
        throw new Error("Invalid OpenAI API Key. Please check your credentials.");
    }
    throw error;
  }
}
