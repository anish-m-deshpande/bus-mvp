"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Mic, Square, RefreshCcw, Headphones, ChevronRight, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function IntakePage() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioUrl(null);
      
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error(err);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("audio", audioBlob, "intake.webm");

    try {
      const response = await fetch("/api/incidents/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Transcription failed");

      toast.success("Transcription started successfully");
      router.push(`/incidents/${data.incident_id}`);

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to start pipeline");
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Intake Center</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">Capture driver voicemails to automatically trigger the FleetAI triage and routing pipeline.</p>
        
        <div className="pt-2">
            <Link href="/demo">
                <Button variant="secondary" className="gap-2 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
                   <Sparkles className="w-4 h-4" /> Try the Guided Demo with Sample Transcripts
                </Button>
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <Card className="md:col-span-3 border-2 shadow-2xl ring-1 ring-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Audio Capture</CardTitle>
                {isRecording && (
                    <Badge variant="destructive" className="animate-pulse flex items-center gap-1.5 px-2.5 py-0.5">
                        <div className="w-2 h-2 rounded-full bg-white" />
                        RECORDING {formatTime(recordingTime)}
                    </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-8">
                
                <div className="w-full h-32 bg-slate-100 rounded-xl flex items-end justify-center gap-1 p-4 overflow-hidden relative">
                    {!isRecording && !audioUrl && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">
                            Ready for radio or phone input.
                        </div>
                    )}
                    {isRecording && Array.from({length: 40}).map((_, i) => (
                        <div key={i} className="w-2 bg-blue-500 rounded-full animate-pulse" style={{ height: `${Math.random() * 80 + 10}%`, animationDelay: `${i * 0.05}s` }} />
                    ))}
                    {audioUrl && !isRecording && (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80">
                            <audio src={audioUrl} controls className="w-3/4" />
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  {!isRecording ? (
                    <Button 
                        size="lg" 
                        className="h-16 px-8 rounded-full bg-blue-600 hover:bg-blue-700 shadow-md font-bold"
                        onClick={startRecording}
                        disabled={isProcessing}
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button 
                        size="lg" 
                        variant="destructive" 
                        className="h-16 px-8 rounded-full shadow-md font-bold"
                        onClick={stopRecording}
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Stop Recording
                    </Button>
                  )}

                  <span className="text-slate-400 font-medium px-2">OR</span>

                  <div>
                    <input 
                        type="file" 
                        accept="audio/*" 
                        id="audio-upload" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                        disabled={isRecording || isProcessing}
                    />
                    <Button 
                        variant="outline" 
                        size="lg" 
                        className="h-16 px-8 rounded-full border-2 font-bold"
                        onClick={() => document.getElementById('audio-upload')?.click()}
                        disabled={isRecording || isProcessing}
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Upload File
                    </Button>
                  </div>
                </div>

                {audioBlob && (
                    <div className="w-full pt-8 mt-4 border-t flex items-center justify-between animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                <Headphones className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800">Actionable Audio Ready</p>
                                <p className="text-sm text-slate-500">File size: {(audioBlob.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>
                        <Button 
                            size="lg" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 shadow-lg"
                            onClick={handleTranscribe}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <RefreshCcw className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <ChevronRight className="w-5 h-5 mr-1" />
                            )}
                            Initialize Triage
                        </Button>
                    </div>
                )}
              </div>
            </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
            <Card className="bg-slate-900 border-none shadow-xl text-white">
                <CardHeader><CardTitle className="text-blue-400">Technical Specs</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                        <p><span className="font-bold">Local Transcription:</span> No audio leaves your server. Uses whisper.cpp (Small/English model).</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                        <p><span className="font-bold">Privacy First:</span> PII removal and fleet-specific entity extraction via LLM.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                        <p><span className="font-bold">Spatial Intelligence:</span> Automated facility routing based on capability and proximity.</p>
                    </div>
                </CardContent>
            </Card>

            <div className="p-6 bg-slate-200/50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center gap-2">
                 <AlertCircle className="w-8 h-8 text-slate-400" />
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">System Health</p>
                 <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">Pipeline Online</Badge>
            </div>
        </div>
      </div>
    </div>
  );
}
