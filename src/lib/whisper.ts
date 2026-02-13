import { spawn } from "child_process";
import path from "path";
import fs from "fs";

/**
 * Executes local whisper.cpp binary to transcribe audio.
 * Expects whisper.cpp to be compiled and available in the project or system path.
 * In a real MVP, we'd bundle the binary or provide instructions to download it.
 */
export async function transcribeAudio(audioPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // whisper.cpp usage: ./main -m models/ggml-base.en.bin -f audio.wav -nt
    const whisperPath = process.env.WHISPER_PATH || "whisper.cpp/main";
    const modelPath = process.env.WHISPER_MODEL_PATH || "whisper.cpp/models/ggml-base.en.bin";

    if (!fs.existsSync(audioPath)) {
      return reject(new Error(`Audio file not found at ${audioPath}`));
    }

    const args = ["-m", modelPath, "-f", audioPath, "-nt"];
    
    console.log(`Executing: ${whisperPath} ${args.join(" ")}`);
    
    const whisper = spawn(whisperPath, args);

    let transcription = "";
    let errorOutput = "";

    whisper.stdout.on("data", (data) => {
      transcription += data.toString();
    });

    whisper.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    whisper.on("close", (code) => {
      if (code === 0) {
        resolve(transcription.trim());
      } else {
        reject(new Error(`Whisper process exited with code ${code}. Error: ${errorOutput}`));
      }
    });

    whisper.on("error", (err) => {
      reject(new Error(`Failed to start Whisper process: ${err.message}`));
    });
  });
}
