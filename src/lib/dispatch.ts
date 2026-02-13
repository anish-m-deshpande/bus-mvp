// src/lib/dispatch.ts

/**
 * Checks for missing critical data in extraction and generates follow-up questions.
 */
export function analyzeMissingInfo(extraction: any) {
  const missing = [];
  const followUps = [];

  if (!extraction.bus_id) {
    missing.push("Bus / Fleet ID");
    followUps.push("Can you confirm your bus or fleet number?");
  }
  
  if (!extraction.city && !extraction.state) {
    missing.push("Precise Location");
    followUps.push("What is your current intersection or closest landmark?");
  }

  if (extraction.driveable === "unknown") {
    missing.push("Vehicle Driveability");
    followUps.push("Is the vehicle safe to move to a shoulder or nearby lot?");
  }

  if (extraction.passengers_onboard === "unknown") {
    missing.push("Passenger Count");
    followUps.push("How many passengers are currently on your bus?");
  }

  if (!extraction.callback_number) {
    missing.push("Callback Number");
    followUps.push("What is a good phone number to reach you at directly?");
  }

  return { missing, followUps };
}
