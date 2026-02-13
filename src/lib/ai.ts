import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "empty",
  baseURL: process.env.OPENAI_BASE_URL, // Generic OpenAI-compatible base URL
});

export const TriageResultSchema = z.object({
  urgency: z.enum(["high", "medium", "low"]),
  category: z.enum(["billing", "support", "sales", "other"]),
  summary: z.string(),
  actionTaken: z.string(),
  recipientEmail: z.string().email().optional(),
});

export type TriageResult = z.infer<typeof TriageResultSchema>;

export async function triageVoicemail(transcription: string): Promise<TriageResult> {
  const prompt = `
    You are an AI voicemail triage assistant. Analyze the following voicemail transcription and categorize it.
    
    Transcription: "${transcription}"
    
    Provide the output in JSON format with the following fields:
    - urgency: "high", "medium", or "low"
    - category: "billing", "support", "sales", or "other"
    - summary: A brief summary of the message
    - actionTaken: What was done with this message (e.g., "Routed to Support", "Sent to Billing")
    - recipientEmail: An email address where this should be routed (invent a reasonable one based on category if needed for demo, e.g., support@example.com)
  `;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that outputs JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    return TriageResultSchema.parse(parsed);
  } catch (error) {
    console.error("Error during triage:", error);
    return {
      urgency: "medium",
      category: "other",
      summary: "Failed to summarize transcription.",
      actionTaken: "Flagged for manual review",
      recipientEmail: "manual-review@example.com",
    };
  }
}
