import { create } from "zustand";

interface Voicemail {
  id: string;
  audioPath: string;
  transcription?: string | null;
  status: string;
  urgency?: string | null;
  category?: string | null;
  summary?: string | null;
  actionTaken?: string | null;
  recipientEmail?: string | null;
  createdAt: string;
}

interface VoicemailStore {
  voicemails: Voicemail[];
  isLoading: boolean;
  fetchVoicemails: () => Promise<void>;
  addVoicemail: (audioPath: string) => Promise<void>;
}

export const useVoicemailStore = create<VoicemailStore>((set, get) => ({
  voicemails: [],
  isLoading: false,
  fetchVoicemails: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch("/api/voicemails");
      const data = await response.json();
      set({ voicemails: data, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch voicemails:", error);
      set({ isLoading: false });
    }
  },
  addVoicemail: async (audioPath: string) => {
    try {
      const response = await fetch("/api/voicemails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioPath }),
      });
      const newVoicemail = await response.json();
      set({ voicemails: [newVoicemail, ...get().voicemails] });
      
      // Ideally we'd poll or use WebSockets to update status as it transcribes
      // For this MVP, we'll just re-fetch after a bit or let the user refresh
    } catch (error) {
      console.error("Failed to add voicemail:", error);
    }
  },
}));
