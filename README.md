# AI-Powered Voicemail Triage MVP

This is an autonomous dispatcher agent that transcribes voicemails from bus drivers, extracts structured incident data using AI, and routes the issue to the nearest suitable maintenance facility.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your AI key (required):
   Copy .env.example to .env and replace `your-api-key-here` with your actual OpenAI API key.
   ```bash
   cp .env.example .env
   ```

3. Initialize the database:
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```

4. Run the application:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

---

## Transcription Pipeline

The system uses OpenAI's Whisper API for reliable transcription.

- Supports .webm, .wav, .mp3, and .m4a uploads.
- Workflow: Browser recording or upload → Whisper API → Structured extraction → Routing.

---

## Architecture

### Intake
Drivers can record audio directly in the browser with the MediaRecorder API or upload files. It provides visual feedback like waveforms and timers.

### Transcription
Handled by openai.audio.transcriptions for high accuracy, even with accents or background noise common in transit.

### Extraction (LLM)
The transcript is processed by a large language model to identify:
- Entities: Bus ID, City, State, Callback Number.
- Risk Profile: Safety flags (e.g., fire, smoke, brakes), symptoms, and driveability.
- Taxonomy: Classification into categories like HVAC, Electrical, or ADA equipment.

### Spatial Routing
- Geocoding: Resolves incident location using OpenStreetMap Nominatim.
- Matching: Calculates proximity (Haversine formula) to registered facilities.
- Refinement: AI selects the best facility based on the equipment needed for the issue.

### Notification
Sends automated HTML email alerts to the matched facility using Nodemailer (defaults to Ethereal.email for testing).

## Project Structure

- `src/server/transcription/`: Whisper API integration.
- `src/server/llm/`: Extraction and routing refinement.
- `src/server/geo/`: Geocoding and distance utilities.
- `src/app/api/`: REST endpoints for the triage pipeline.
- `src/app/demo/`: Demo hub with multi-state personas.

## LangSmith Tracing

This project includes LangSmith tracing for LLM calls in extraction and routing. With `LANGCHAIN_TRACING_V2=true` and your API key set, traces will appear automatically in your LangSmith dashboard (https://smith.langchain.com/).

To view traces:
1. Run the app: `npm run dev`
2. Trigger an incident via the demo interface.
3. Check your project (e.g., "Bus Project") in LangSmith for detailed logs, inputs, outputs, and performance metrics.
