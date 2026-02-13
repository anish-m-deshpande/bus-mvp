import { z } from "zod";

export const IssueCategoryEnum = z.enum([
  "Doors",
  "Brakes",
  "EngineOverheat",
  "Electrical",
  "SteeringSuspension",
  "TiresWheels",
  "ADAEquipment",
  "HVAC",
  "CommsITS",
  "AccidentIncident",
  "SafetySecurityMedical",
  "Other"
]);

export type IssueCategory = z.infer<typeof IssueCategoryEnum>;

export const IncidentExtractedSchema = z.object({
  city: z.string().nullable(),
  state: z.string().nullable(),
  location_text: z.string().nullable(),
  issue_category: IssueCategoryEnum,
  confidence: z.number(),
  symptoms: z.array(z.string()),
  driveable: z.enum(["yes", "no", "unknown"]),
  passengers_onboard: z.enum(["yes", "no", "unknown"]),
  safety_flags: z.array(z.string()),
  callback_number: z.string().nullable(),
  bus_id: z.string().nullable(),
});

export type IncidentExtracted = z.infer<typeof IncidentExtractedSchema>;

export const RoutingDecisionSchema = z.object({
  matched_facility_id: z.string().nullable(),
  distance_miles: z.number().nullable(),
  rationale: z.string().nullable(),
});

export type RoutingDecision = z.infer<typeof RoutingDecisionSchema>;
