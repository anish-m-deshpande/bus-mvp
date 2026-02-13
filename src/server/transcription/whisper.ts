import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

const WHISPER_PATH = process.env.WHISPER_PATH || "whisper.cpp/main";
const WHISPER_MODEL_PATH = process.env.WHISPER_MODEL_PATH || "whisper.cpp/models/ggml-base.en.bin";
const FFMPEG_PATH = process.env.FFMPEG_PATH || "ffmpeg";

/**
 * Checks if a binary or file exists at the given path.
 */
function checkBinaryExists(filePath: string): boolean {
    if (filePath.includes("/") || filePath.includes("\\")) {
        return fs.existsSync(filePath);
    }
    return true;
}

/**
 * Converts audio to the format required by whisper.cpp (WAV, 16kHz, mono).
 */
async function convertToWav(inputPath: string): Promise<string> {
  if (!checkBinaryExists(FFMPEG_PATH)) {
    throw new Error(`FFmpeg not found at "${FFMPEG_PATH}".`);
  }

  const outputPath = path.join(os.tmpdir(), `whisper_input_${Date.now()}.wav`);
  console.log(`[FFmpeg] Converting ${inputPath} -> ${outputPath}`);
  
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(FFMPEG_PATH, [
      "-y", 
      "-i", inputPath,
      "-ar", "16000",
      "-ac", "1",
      "-c:a", "pcm_s16le",
      outputPath
    ]);

    ffmpeg.stderr.on("data", (data) => console.log(`[FFmpeg-log] ${data.toString().trim()}`));

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });

    ffmpeg.on("error", (err: any) => reject(new Error(`FFmpeg error: ${err.message}`)));
  });
}

/**
 * Transcribes a wav file using whisper.cpp with real-time logs and timeout.
 */
async function runWhisper(wavPath: string): Promise<string> {
  if (!checkBinaryExists(WHISPER_PATH)) {
    throw new Error(`Whisper.cpp binary not found at "${WHISPER_PATH}".`);
  }

  console.log(`[Whisper] Starting transcription: ${WHISPER_PATH} -m ${WHISPER_MODEL_PATH} -f ${wavPath}`);

  return new Promise((resolve, reject) => {
    const whisper = spawn(WHISPER_PATH, [
      "-m", WHISPER_MODEL_PATH,
      "-f", wavPath,
      "-nt"
    ]);

    let transcript = "";
    
    // Set a 2-minute safety timeout
    const timeout = setTimeout(() => {
        whisper.kill();
        reject(new Error("Transcription timed out after 120 seconds. Check CPU resources or model size."));
    }, 120000);

    whisper.stdout.on("data", (data) => {
      const text = data.toString();
      transcript += text;
      console.log(`[Whisper-out] ${text.trim()}`);
    });

    whisper.stderr.on("data", (data) => {
      console.log(`[Whisper-err] ${data.toString().trim()}`);
    });

    whisper.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve(transcript.trim());
      else reject(new Error(`Whisper.cpp exited with code ${code}`));
    });

    whisper.on("error", (err: any) => {
        clearTimeout(timeout);
        reject(new Error(`Whisper error: ${err.message}`));
    });
  });
}

/**
 * Full transcription pipeline: Convert -> Transcribe -> Cleanup
 */
export async function transcribeAudio(inputPath: string): Promise<string> {
  let wavPath: string | null = null;
  try {
    wavPath = await convertToWav(inputPath);
    return await runWhisper(wavPath);
  } catch (error) {
    console.error(`[Transcription] Failed:`, error);
    throw error;
  } finally {
    if (wavPath && fs.existsSync(wavPath)) {
      try {
        fs.unlinkSync(wavPath);
        console.log(`[Transcription] Cleaned up: ${wavPath}`);
      } catch (err) {}
    }
  }
}
