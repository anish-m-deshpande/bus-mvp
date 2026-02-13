# AI-Powered Voicemail Triage MVP

An autonomous dispatcher agent that transcribes bus driver voicemails, extracts structured incident data using AI, and intelligently routes the issue to the nearest capable maintenance facility.

## 🚀 Quick Start

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure AI Key (REQUIRED):**
   Copy `.env.example` to `.env` and replace `your-api-key-here` with your actual **OpenAI API Key**.
   ```bash
   cp .env.example .env
   ```

3. **Initialize Database:**
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```

4. **Launch Application:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Transcription Pipeline

This system uses the **OpenAI Whisper API** for high-speed, reliable transcription. 

- **Supports:** `.webm`, `.wav`, `.mp3`, and `.m4a` native uploads.
- **Workflow:** Browser Recording → Multipart Upload → Whisper API → Structured Extraction → Routing.

---

## 🏗️ The Architecture

### 1. Intake
Drivers can record directly in the browser using the **MediaRecorder API** or upload existing audio files. Visual feedback including waveforms and timers are provided.

### 2. Transcription
Handled via `openai.audio.transcriptions`. This cloud-based approach ensures high accuracy across various accents and noisy background environments typical in transit scenarios.

### 3. Extraction (LLM)
The transcript is processed by an LLM to identify:
- **Entities**: Bus ID, City, State, Callback Number.
- **Risk Profile**: Safety flags (Fire, Smoke, Brakes), Symptoms, and Driveability.
- **Taxonomy**: Automatic classification into categories like HVAC, Electrical, or ADA Equipment.

### 4. Spatial Routing
- **Geocoding**: Incident location is resolved via OpenStreetMap Nominatim.
- **Matching**: Proximity calculation (Haversine) against a registry of facilities.
- **Refinement**: An AI dispatcher selects the best facility based on the specialized equipment required for the reported issue.

### 5. Notification
Automated HTML email alerts are sent to the matched facility via **Nodemailer**. (Defaults to Ethereal.email sandbox for testing).

## 📂 Project Structure

- `src/server/transcription/`: Whisper API integration.
- `src/server/llm/`: Extraction and routing refinement logic.
- `src/server/geo/`: Geocoding and distance utilities.
- `src/app/api/`: REST endpoints for the triage pipeline.
- `src/app/demo/`: Guided demonstration hub with multi-state personas.