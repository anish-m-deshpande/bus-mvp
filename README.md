# AI-Powered Voicemail Triage MVP

An autonomous dispatcher agent that transcribes bus driver voicemails, extracts structured incident data using AI, and intelligently routes the issue to the nearest capable maintenance facility.

## 🚀 Quick Start (Demo Mode)

If you just want to see the AI in action without setting up local audio tools:

1. **Install and Setup:**
   ```bash
   npm install
   cp .env.example .env
   ```

2. **Configure AI Key (CRITICAL):**
   Open `.env` and replace `your-api-key-here` with your actual **OpenAI API Key**. The app will return errors if this is not set correctly.

3. **Initialize & Run:**
   ```bash
   npx prisma db push
   node prisma/seed.js
   npm run dev
   ```

4. **Run Demo:**
   Go to [http://localhost:3000/demo](http://localhost:3000/demo) and select a sample transcript.

---

## 🛠️ Full Installation (Local Audio Pipeline)

To use real mic recording and local transcription, you need **FFmpeg** and **Whisper.cpp**.

### 1. Prerequisites

- **Node.js 18+**
- **FFmpeg**: Required for processing raw audio.
  - Windows: `winget install ffmpeg`
  - macOS: `brew install ffmpeg`
  - *Note: If FFmpeg is not in your system PATH, set `FFMPEG_PATH` in your `.env`.*
- **Whisper.cpp**:
  - `git clone https://github.com/ggerganov/whisper.cpp`
  - `cd whisper.cpp && make` (This creates the `main` binary)
  - `bash ./models/download-ggml-model.sh base.en`

### 2. Environment Configuration

Update your `.env` file with paths to your local tools:

```env
DATABASE_URL="file:./dev.db"

# Path to your compiled whisper.cpp binary
WHISPER_PATH="/path/to/whisper.cpp/main"
WHISPER_MODEL_PATH="/path/to/whisper.cpp/models/ggml-base.en.bin"

# LLM Config (OpenAI or compatible)
OPENAI_API_KEY="sk-..."
LLM_MODEL="gpt-4o-mini"
```

### 3. Database Initialization

```bash
npx prisma generate
npx prisma db push
node prisma/seed.js
```

---

## 🏗️ The Architecture

### 1. Transcription (Local)
Raw audio (.webm/.wav) is captured in the browser and sent to the server. We use **FFmpeg** to convert it to 16kHz mono WAV, then invoke **whisper.cpp** via a child process. **No audio data ever leaves your server.**

### 2. Extraction (LLM)
The transcript is sent to an LLM with a highly specialized dispatcher prompt. It extracts:
- **Entities**: Bus ID, Location (City/State), Callback Number.
- **Urgency**: Safety flags (Fire, Smoke, Brakes), Symptoms, and Driveability.
- **Category**: Classified into the fleet maintenance taxonomy.

### 3. Spatial Routing
- **Geocoding**: Incident location is converted to coordinates via OpenStreetMap Nominatim.
- **Distance**: Calculated via the Haversine formula against the local `Facility` database.
- **Intelligence**: An AI dispatcher pass reviews the top 3 closest facilities and selects the best fit based on specialized capabilities (e.g., HVAC vs Braking systems).

### 4. Notification
Automated structured email notification sent to the maintenance facility via **Nodemailer**. (Defaults to Ethereal.email for safe demoing).

## 📂 Project Structure

- `src/server/transcription/`: Local Whisper.cpp integration logic.
- `src/server/llm/`: Extraction and routing refinement prompts.
- `src/server/geo/`: Geocoding and distance calculation.
- `src/app/api/`: Pipeline orchestration routes.
- `src/app/demo/`: Guided executive demonstration hub.
