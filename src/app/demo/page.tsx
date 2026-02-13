"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Play, Sparkles, Activity, Zap, Keyboard, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import samples from "@/data/demo_samples.json";

export default function DemoPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>("");
  const [customTranscript, setCustomTranscript] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLaunchPipeline = async (transcript: string, label: string) => {
    if (!transcript.trim()) {
        toast.error("Please provide a transcript first.");
        return;
    }

    setIsProcessing(true);
    try {
      // 1. Create Incident from Transcript
      const response = await fetch("/api/incidents/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          label
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
      toast.error("Demo pipeline failed: " + error.message);
      setIsProcessing(false);
    }
  };

  const handleSampleClick = () => {
      const sample = samples.find(s => s.id === selectedId);
      if (sample) handleLaunchPipeline(sample.transcript, sample.id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12 animate-in fade-in duration-700">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" /> Guided Executive Demo
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Experience Fleet Intelligence</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
          See how our pipeline transforms raw driver reports into structured data and precise routing decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
            <Card className="border-2 shadow-xl ring-1 ring-slate-200 overflow-hidden">
                <CardHeader className="bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        Option A: Sample Personas
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Select onValueChange={setSelectedId} value={selectedId}>
                            <SelectTrigger className="h-12 text-md">
                                <SelectValue placeholder="Choose a realistic sample..." />
                            </SelectTrigger>
                            <SelectContent>
                                {samples.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button 
                        className="w-full h-12 text-md font-bold bg-blue-600 hover:bg-blue-700 shadow-lg"
                        disabled={!selectedId || isProcessing}
                        onClick={handleSampleClick}
                    >
                        {isProcessing ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                        Launch Sample Pipeline
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-2 shadow-xl ring-1 ring-slate-200 overflow-hidden">
                <CardHeader className="bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2">
                        <Keyboard className="w-5 h-5 text-emerald-600" />
                        Option B: Custom Transcript
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <Textarea 
                        placeholder="Type or paste a driver voicemail transcript here... (e.g., 'Bus 104, I'm in Boston at the terminal and my AC is broken.')"
                        className="min-h-[120px] bg-white text-sm"
                        value={customTranscript}
                        onChange={(e) => setCustomTranscript(e.target.value)}
                        disabled={isProcessing}
                    />
                    <Button 
                        className="w-full h-12 text-md font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg"
                        disabled={!customTranscript.trim() || isProcessing}
                        onClick={() => handleLaunchPipeline(customTranscript, "custom")}
                    >
                        {isProcessing ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2 fill-current text-white" />}
                        Process Custom Input
                    </Button>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card className="bg-slate-900 border-none shadow-2xl text-white h-fit sticky top-24">
                <CardHeader>
                    <CardTitle className="text-blue-400 flex items-center gap-2">
                        <Activity className="w-5 h-5" /> Pipeline Workflow
                    </CardTitle>
                    <CardDescription className="text-slate-400 font-medium">Real-time processing steps</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-2 pb-8">
                    {[
                        { step: "01", title: "Incident Record Creation", desc: "Digital ingestion of the report." },
                        { step: "02", title: "AI Categorization", desc: "Classification into the fleet taxonomy." },
                        { step: "03", title: "Geo-Spatial Mapping", desc: "OSM-backed coordinate resolution." },
                        { step: "04", title: "Rationalized Routing", desc: "Expert selection of the best facility." }
                    ].map((s, i) => (
                        <div key={i} className={`flex gap-4 items-start ${isProcessing ? 'animate-pulse' : 'opacity-80'}`}>
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black">
                                {s.step}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-100">{s.title}</p>
                                <p className="text-xs text-slate-400">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                    <Separator className="bg-slate-800" />
                    <div className="flex items-center justify-between">
                         <Badge variant="outline" className="border-blue-500 text-blue-400">PIPELINE ONLINE</Badge>
                         {isProcessing && <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-pulse"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />PROCESSING...</span>}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

// Internal icon for button
function RefreshCcw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  )
}
