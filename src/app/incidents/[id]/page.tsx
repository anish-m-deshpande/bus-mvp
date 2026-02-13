"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
    Clock, 
    CheckCircle2, 
    Brain, 
    Navigation, 
    Send, 
    Copy, 
    MapPin, 
    Bus, 
    Activity,
    AlertCircle,
    User,
    PhoneCall,
    RefreshCcw,
    ChevronRight,
    FileText,
    HelpCircle,
    AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { analyzeMissingInfo } from "@/lib/dispatch";

export default function IncidentDetailPage() {
  const { id } = useParams();
  const [incident, setIncident] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchIncident = useCallback(async () => {
    try {
      const response = await fetch(`/api/incidents/${id}`);
      if (!response.ok) throw new Error("Failed to fetch incident");
      const data = await response.json();
      setIncident(data);
    } catch (err) {
      console.error(err);
      toast.error("Error loading incident details");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIncident();
  }, [fetchIncident]);

  const runExtraction = async () => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/incidents/${id}/extract`, { method: "POST" });
      if (!response.ok) throw new Error("Extraction failed");
      toast.success("AI Extraction complete");
      fetchIncident();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const runRouting = async () => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/incidents/${id}/route`, { method: "POST" });
      if (!response.ok) throw new Error("Routing failed");
      toast.success("Facility routing complete");
      fetchIncident();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const sendNotify = async () => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/incidents/${id}/notify`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error("Notification failed");
      toast.success("Facility notified successfully");
      if (data.previewUrl) {
          window.open(data.previewUrl, '_blank');
      }
      fetchIncident();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-500">Loading incident...</div>;
  if (!incident) return <div className="p-12 text-center text-slate-500">Incident not found</div>;

  const extraction = incident.issueCategory ? {
      issue_category: incident.issueCategory,
      confidence: incident.confidence,
      city: incident.city,
      state: incident.state,
      location_text: incident.locationText,
      driveable: incident.driveable,
      passengers_onboard: incident.passengersOnboard,
      bus_id: incident.busId,
      callback_number: incident.callbackNumber,
      safety_flags: JSON.parse(incident.safetyFlags || "[]"),
      symptoms: JSON.parse(incident.symptoms || "[]")
  } : null;

  const demoInsights = extraction ? analyzeMissingInfo(extraction) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
            <div className="bg-slate-100 p-3 rounded-full">
                <Bus className="w-8 h-8 text-slate-600" />
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-slate-900">{incident.audioFilename}</h1>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">{incident.id}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{new Date(incident.createdAt).toLocaleString()}</span>
                    <span className="flex items-center gap-1.5 capitalize"><Activity className="w-3.5 h-3.5" />Status: <span className="font-semibold text-slate-700">{incident.status}</span></span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            {!extraction && (
                <Button onClick={runExtraction} disabled={isActionLoading} className="bg-blue-600">
                    {isActionLoading ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
                    Extract Data
                </Button>
            )}
            {extraction && !incident.matchedFacilityId && (
                <Button onClick={runRouting} disabled={isActionLoading} className="bg-blue-600">
                    {isActionLoading ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Navigation className="w-4 h-4 mr-2" />}
                    Run Routing
                </Button>
            )}
            {incident.matchedFacilityId && incident.status !== 'notified' && (
                <Button onClick={sendNotify} disabled={isActionLoading} className="bg-emerald-600 hover:bg-emerald-700">
                    {isActionLoading ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Notify Facility
                </Button>
            )}
            {incident.status === 'notified' && (
                 <Badge variant="outline" className="h-10 px-4 bg-emerald-50 text-emerald-700 border-emerald-200 gap-2">
                    <CheckCircle2 className="w-4 h-4" /> FACILITY NOTIFIED
                 </Badge>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="transcript" className="w-full">
            <TabsList className="bg-white border w-full justify-start h-12 p-1 gap-1">
              <TabsTrigger value="transcript" className="data-[state=active]:bg-slate-100 px-6">Transcript</TabsTrigger>
              <TabsTrigger value="extracted" className="data-[state=active]:bg-slate-100 px-6" disabled={!extraction}>Extracted</TabsTrigger>
              <TabsTrigger value="routing" className="data-[state=active]:bg-slate-100 px-6" disabled={!incident.matchedFacilityId}>Routing</TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-slate-100 px-6">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle>Voice Transcription</CardTitle>
                    <CardDescription>Generated locally via Whisper.cpp</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                        navigator.clipboard.writeText(incident.transcriptText);
                        toast.success("Copied to clipboard");
                    }}>
                    <Copy className="w-4 h-4 mr-2" /> Copy
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed text-slate-700 italic border-l-4 border-slate-200 pl-6 py-2">
                    "{incident.transcriptText || "No transcript generated yet."}"
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="extracted" className="mt-4 space-y-6">
              {extraction && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm uppercase tracking-wider text-slate-500">Incident Classification</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 font-medium">Issue Category</span>
                                <Badge className="text-md py-1 px-4">{extraction.issue_category}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 font-medium">AI Confidence</span>
                                <span className="font-bold text-blue-600">{(extraction.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-400 uppercase">Symptoms</span>
                                <div className="flex flex-wrap gap-2">
                                    {extraction.symptoms.map((s: string) => (
                                        <Badge key={s} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{s}</Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm uppercase tracking-wider text-slate-500">Machine Status & Safety</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-lg border text-center">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Driveable</p>
                                    <p className="font-bold capitalize">{extraction.driveable}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border text-center">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Passengers</p>
                                    <p className="font-bold capitalize">{extraction.passengers_onboard}</p>
                                </div>
                             </div>
                             <Separator />
                             <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-400 uppercase">Safety Flags</span>
                                <div className="flex flex-wrap gap-2">
                                    {extraction.safety_flags.length > 0 ? extraction.safety_flags.map((f: string) => (
                                        <Badge key={f} variant="destructive" className="uppercase font-bold text-[10px]">{f}</Badge>
                                    )) : <span className="text-sm text-slate-400">None detected</span>}
                                </div>
                             </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                         <CardHeader className="pb-3"><CardTitle className="text-sm uppercase tracking-wider text-slate-500">Identified Metadata</CardTitle></CardHeader>
                         <CardContent>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <div className="flex items-center gap-3">
                                     <MapPin className="text-slate-400" />
                                     <div>
                                         <p className="text-[10px] uppercase text-slate-400 font-bold">Extracted Location</p>
                                         <p className="font-medium">
                                             {extraction.city || incident.city || "Unknown City"}, 
                                             {extraction.state || incident.state || ""}
                                         </p>
                                         <p className="text-xs text-slate-500 italic">{extraction.location_text}</p>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <Bus className="text-slate-400" />
                                     <div>
                                         <p className="text-[10px] uppercase text-slate-400 font-bold">Bus ID / Fleet #</p>
                                         <p className="font-medium text-lg">{extraction.bus_id || "Unknown"}</p>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <PhoneCall className="text-slate-400" />
                                     <div>
                                         <p className="text-[10px] uppercase text-slate-400 font-bold">Callback Number</p>
                                         <p className="font-medium">{extraction.callback_number || "None provided"}</p>
                                     </div>
                                 </div>
                             </div>
                         </CardContent>
                    </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="routing" className="mt-4 space-y-4">
               {incident.matchedFacility && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <Card className="border-blue-200 bg-blue-50/30">
                           <CardHeader>
                               <CardTitle className="flex items-center gap-2">
                                   <Navigation className="w-5 h-5 text-blue-600" />
                                   Routed Facility
                               </CardTitle>
                           </CardHeader>
                           <CardContent className="space-y-4">
                               <div>
                                   <h3 className="text-xl font-bold text-slate-900">{incident.matchedFacility.name}</h3>
                                   <p className="text-slate-600">{incident.matchedFacility.address}</p>
                                   <p className="text-slate-600">{incident.matchedFacility.city}, {incident.matchedFacility.state} {incident.matchedFacility.zip}</p>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="bg-white p-3 rounded-lg border shadow-sm">
                                       <p className="text-[10px] uppercase text-slate-400 font-bold">Distance</p>
                                       <p className="font-bold text-blue-700 text-lg">{incident.distanceMiles?.toFixed(1)} miles</p>
                                   </div>
                                   <div className="bg-white p-3 rounded-lg border shadow-sm">
                                       <p className="text-[10px] uppercase text-slate-400 font-bold">Hours</p>
                                       <p className="font-bold text-slate-700">{incident.matchedFacility.hours}</p>
                                   </div>
                               </div>
                               <div className="bg-white p-3 rounded-lg border shadow-sm">
                                   <p className="text-[10px] uppercase text-slate-400 font-bold flex items-center gap-1.5 mb-1"><Send className="w-3 h-3" /> Contact Email</p>
                                   <p className="font-medium text-slate-800">{incident.matchedFacility.contact_email}</p>
                               </div>
                           </CardContent>
                       </Card>

                       <Card>
                           <CardHeader>
                               <CardTitle className="flex items-center gap-2">
                                   <Brain className="w-5 h-5 text-purple-600" />
                                   Dispatcher Rationale
                               </CardTitle>
                               <CardDescription>AI-generated logic for this routing choice</CardDescription>
                           </CardHeader>
                           <CardContent>
                               <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-purple-500 text-slate-700 leading-relaxed">
                                   {incident.rationale}
                               </div>
                               <div className="mt-6">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Capabilities Verified</p>
                                    <div className="flex flex-wrap gap-2">
                                        {JSON.parse(incident.matchedFacility.capabilities || "[]").map((c: string) => (
                                            <Badge key={c} variant="outline" className="bg-blue-50/50 text-[10px]">{c}</Badge>
                                        ))}
                                    </div>
                               </div>
                           </CardContent>
                       </Card>
                   </div>
               )}
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
                <Card>
                    <CardHeader><CardTitle>Incident History</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="px-6 pb-6 pt-0 space-y-0 text-sm">
                            <div className="flex gap-4 pb-6 relative">
                                <div className="absolute left-[7px] top-[24px] bottom-0 w-px bg-slate-200" />
                                <div className="w-4 h-4 rounded-full bg-emerald-500 mt-1.5 z-10 border-2 border-white shadow-sm" />
                                <div>
                                    <p className="font-bold text-slate-900">Incident Initialized</p>
                                    <p className="text-slate-500">Audio uploaded as "{incident.audioFilename}"</p>
                                    <p className="text-[11px] text-slate-400 mt-1">{new Date(incident.createdAt).toLocaleTimeString()}</p>
                                </div>
                            </div>
                            {incident.transcriptText && (
                                <div className="flex gap-4 pb-6 relative">
                                    <div className="absolute left-[7px] top-[24px] bottom-0 w-px bg-slate-200" />
                                    <div className="w-4 h-4 rounded-full bg-blue-500 mt-1.5 z-10 border-2 border-white shadow-sm" />
                                    <div>
                                        <p className="font-bold text-slate-900">Transcription Complete</p>
                                        <p className="text-slate-500 text-xs truncate max-w-md">Transcript generated via local Whisper process.</p>
                                    </div>
                                </div>
                            )}
                            {extraction && (
                                <div className="flex gap-4 pb-6 relative">
                                    <div className="absolute left-[7px] top-[24px] bottom-0 w-px bg-slate-200" />
                                    <div className="w-4 h-4 rounded-full bg-purple-500 mt-1.5 z-10 border-2 border-white shadow-sm" />
                                    <div>
                                        <p className="font-bold text-slate-900">AI Extraction Complete</p>
                                        <p className="text-slate-500 text-xs">Extraction into category "{extraction.issue_category}" with {extraction.safety_flags.length} flags.</p>
                                    </div>
                                </div>
                            )}
                             {incident.matchedFacilityId && (
                                <div className="flex gap-4 pb-6 relative">
                                    <div className="absolute left-[7px] top-[24px] bottom-0 w-px bg-slate-200" />
                                    <div className="w-4 h-4 rounded-full bg-orange-500 mt-1.5 z-10 border-2 border-white shadow-sm" />
                                    <div>
                                        <p className="font-bold text-slate-900">Routing Decision Made</p>
                                        <p className="text-slate-500 text-xs">Matched to {incident.matchedFacility.name}.</p>
                                    </div>
                                </div>
                            )}
                            {incident.status === 'notified' && (
                                <div className="flex gap-4 relative">
                                    <div className="w-4 h-4 rounded-full bg-emerald-500 mt-1.5 z-10 border-2 border-white shadow-sm" />
                                    <div>
                                        <p className="font-bold text-slate-900">Facility Notified</p>
                                        <p className="text-slate-500 text-xs">Outbound email sent to dispatch queue.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
            {extraction && demoInsights && (demoInsights.missing.length > 0 || extraction.confidence < 0.8) && (
                 <Card className="border-amber-200 bg-amber-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase text-amber-800 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Confidence & Missing Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {extraction.confidence < 0.8 && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-amber-900/60 uppercase">Low Extraction Confidence</p>
                                <p className="text-xs text-amber-800">The AI is unsure about some classifications. Manual verification recommended.</p>
                            </div>
                        )}
                        {demoInsights.missing.length > 0 && (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[10px] font-bold text-amber-900/60 uppercase mb-1">Missing Elements</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {demoInsights.missing.map(m => (
                                            <Badge key={m} variant="outline" className="bg-white/50 border-amber-300 text-amber-900 text-[10px]">{m}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <Separator className="bg-amber-200" />
                                <div>
                                    <p className="text-[10px] font-bold text-amber-900/60 uppercase mb-2">Suggested Follow-ups</p>
                                    <ul className="space-y-2">
                                        {demoInsights.followUps.map((f, i) => (
                                            <li key={i} className="text-xs text-amber-900 flex gap-2">
                                                <HelpCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-600" />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </CardContent>
                 </Card>
            )}

            <Card>
                <CardHeader><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase text-slate-400 font-black">Status</p>
                        <Badge variant="outline" className="w-full justify-center capitalize py-1">{incident.status}</Badge>
                    </div>
                    {extraction && (
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase text-slate-400 font-black">Issue</p>
                            <p className="text-sm font-bold text-slate-700">{extraction.issue_category}</p>
                        </div>
                    )}
                    {incident.matchedFacility && (
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase text-slate-400 font-black">Route</p>
                            <p className="text-sm font-bold text-blue-600">{incident.matchedFacility.name}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-sm">Pipeline Steps</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-emerald-500" /> Transcribe</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5"><Brain className={`w-3.5 h-3.5 ${extraction ? 'text-emerald-500' : 'text-slate-300'}`} /> Extract</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${extraction ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5"><Navigation className={`w-3.5 h-3.5 ${incident.matchedFacilityId ? 'text-emerald-500' : 'text-slate-300'}`} /> Route</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${incident.matchedFacilityId ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5"><Send className={`w-3.5 h-3.5 ${incident.status === 'notified' ? 'text-emerald-500' : 'text-slate-300'}`} /> Notify</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${incident.status === 'notified' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
