import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transcribeAudio } from "@/server/transcription/whisper";
import path from "path";
import fs from "fs";
import os from "os";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Save uploaded file to temp directory
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}_${audioFile.name}`);
    fs.writeFileSync(tempFilePath, buffer);

    console.log(`[API/Transcribe] Saved upload to: ${tempFilePath}`);

    // Create Incident record first
    const incident = await prisma.incident.create({
      data: {
        audioFilename: audioFile.name,
        status: "new",
      },
    });

    // Run transcription
    let transcriptText = "";
    try {
      transcriptText = await transcribeAudio(tempFilePath);
      
      // Update Incident with transcript
      await prisma.incident.update({
        where: { id: incident.id },
        data: { transcriptText },
      });

    } catch (transError: any) {
      console.error(`[API/Transcribe] Transcription failed:`, transError);
      return NextResponse.json({ 
        error: "Transcription failed", 
        incident_id: incident.id,
        details: transError.message 
      }, { status: 500 });
    } finally {
      // Cleanup uploaded file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

    return NextResponse.json({
      incident_id: incident.id,
      transcript_text: transcriptText,
    });

  } catch (error: any) {
    console.error(`[API/Transcribe] Error:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
