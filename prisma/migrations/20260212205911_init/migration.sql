-- CreateTable
CREATE TABLE "Voicemail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "audioPath" TEXT NOT NULL,
    "transcription" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "urgency" TEXT,
    "category" TEXT,
    "summary" TEXT,
    "actionTaken" TEXT,
    "recipientEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
