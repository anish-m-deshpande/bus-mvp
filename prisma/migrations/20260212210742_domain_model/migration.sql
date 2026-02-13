/*
  Warnings:

  - You are about to drop the `Voicemail` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Voicemail";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lon" REAL NOT NULL,
    "coverage_states" TEXT NOT NULL,
    "capabilities" TEXT NOT NULL,
    "hours" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audioFilename" TEXT NOT NULL,
    "transcriptText" TEXT,
    "city" TEXT,
    "state" TEXT,
    "locationText" TEXT,
    "issueCategory" TEXT,
    "confidence" REAL,
    "symptoms" TEXT,
    "driveable" TEXT NOT NULL DEFAULT 'unknown',
    "passengersOnboard" TEXT NOT NULL DEFAULT 'unknown',
    "safetyFlags" TEXT,
    "callbackNumber" TEXT,
    "busId" TEXT,
    "matchedFacilityId" TEXT,
    "distanceMiles" REAL,
    "rationale" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    CONSTRAINT "Incident_matchedFacilityId_fkey" FOREIGN KEY ("matchedFacilityId") REFERENCES "Facility" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
