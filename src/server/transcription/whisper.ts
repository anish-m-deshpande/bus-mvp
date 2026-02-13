import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "empty",
  baseURL: process.env.OPENAI_BASE_URL,
});

/**
 * Transcribes audio using OpenAI's Whisper API.
 * This replaces the local whisper.cpp/ffmpeg pipeline for better reliability and speed.
 */
export async function transcribeAudio(inputPath: string): Promise<string> {
  // Check for placeholder key
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("your-api-key")) {
    throw new Error("Missing OpenAI API Key. Please set OPENAI_API_KEY in your .env file.");
  }

  try {
    console.log(`[Transcription/API] Sending file to OpenAI: ${inputPath}`);
    
    // 1. Send the file directly to OpenAI
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(inputPath),
      model: "whisper-1",
      language: "en",
      response_format: "text"
    });

    // When response_format is "text", the response is a string
    const transcript = typeof response === "string" ? response : (response as any).text;

    if (!transcript) {
      throw new Error("Received empty transcription from OpenAI");
    }

    console.log(`[Transcription/API] Transcription successful.`);
    return transcript.trim();

  } catch (error: any) {
    console.error(`[Transcription/API] Error:`, error.message);
    if (error.status === 401) {
        throw new Error("Invalid OpenAI API Key. Please check your credentials.");
    }
    throw error;
  }
}
