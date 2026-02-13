"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Brain, Play, Sparkles, ChevronRight, Activity, Zap } from "lucide-react";
import { toast } from "sonner";
import samples from "@/data/demo_samples.json";

export default function DemoPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLaunchDemo = async () => {
    const sample = samples.find(s => s.id === selectedId);
    if (!sample) return;

    setIsProcessing(true);
    try {
      // 1. Create Incident from Sample
      const response = await fetch("/api/incidents/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: sample.transcript,
          label: sample.id
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const incidentId = data.incident_id;

      // 2. Run Pipeline automatically for demo
      toast.info("Step 1: AI Extraction...");
      await fetch(`/api/incidents/${incidentId}/extract`, { method: "POST" });
      
      toast.info("Step 2: Intelligent Routing...");
      await fetch(`/api/incidents/${incidentId}/route`, { method: "POST" });

      toast.success("Demo complete! Redirecting to dashboard...");
      router.push(`/incidents/${incidentId}`);

    } catch (error: any) {
      console.error(error);
      toast.error("Demo pipeline failed");
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12 animate-in fade-in duration-700">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" /> Guided Executive Demo
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Experience Autonomous Triage</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
          Skip the audio recording and see how our AI pipeline analyzes, categorizes, and routes complex fleet incidents in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-2 shadow-2xl ring-1 ring-slate-200">
          <CardHeader>
            <CardTitle>Select Incident Persona</CardTitle>
            <CardDescription>Choose a realistic, high-fidelity driver voicemail transcript.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Select onValueChange={setSelectedId} value={selectedId}>
                    <SelectTrigger className="h-12 text-md">
                        <SelectValue placeholder="Select a sample incident..." />
                    </SelectTrigger>
                    <SelectContent>
                        {samples.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedId && (
                <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-blue-500 animate-in slide-in-from-left-2 duration-300">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Simulated Transcript</p>
                    <p className="text-sm text-slate-700 italic leading-relaxed">
                        "{samples.find(s => s.id === selectedId)?.transcript}"
                    </p>
                </div>
            )}

            <Button 
                className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl gap-2 transition-all active:scale-[0.98]"
                disabled={!selectedId || isProcessing}
                onClick={handleLaunchDemo}
            >
                {isProcessing ? (
                    <Zap className="w-5 h-5 animate-pulse fill-white" />
                ) : (
                    <Play className="w-5 h-5 fill-current" />
                )}
                {isProcessing ? "Processing AI Pipeline..." : "Launch AI Pipeline"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
            <Card className="bg-slate-900 text-white border-none shadow-xl">
                <CardHeader>
                    <CardTitle className="text-blue-400 flex items-center gap-2">
                        <Brain className="w-5 h-5" /> Pipeline Sequence
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { step: "01", title: "Incident Creation", desc: "Digital record initialized with raw transcript." },
                        { step: "02", title: "Entity Extraction", desc: "LLM Identifies Bus ID, Location, Safety Flags, and Symptoms." },
                        { step: "03", title: "Spatial Routing", desc: "Geocoding and Haversine distance matching to capable facilities." },
                        { step: "04", title: "Rationalization", desc: "Secondary AI pass to verify facility capability vs incident needs." }
                    ].map((s, i) => (
                        <div key={i} className={`flex gap-4 items-start ${isProcessing && i < 2 ? 'opacity-100' : 'opacity-60'}`}>
                            <span className="text-xs font-black text-blue-500 pt-1">{s.step}</span>
                            <div>
                                <p className="text-sm font-bold">{s.title}</p>
                                <p className="text-xs text-slate-400">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-4">
                <div className="bg-blue-600 p-2 rounded-full">
                    <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-800 tracking-tight">Total Processing Time</p>
                    <p className="text-2xl font-black text-blue-600 tracking-tighter">~4.5 Seconds</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
