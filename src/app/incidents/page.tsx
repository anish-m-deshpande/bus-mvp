"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Mic, Square, RefreshCcw, Headphones, ChevronRight, Sparkles, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function IncidentsListPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/incidents");
      const data = await response.json();
      setIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const clearAll = async () => {
      if (!confirm("Clear all data?")) return;
      // We don't have a clear all API, so we'll just mock local state cleanup for now
      // and instruct the user to reset DB if needed.
      setIncidents([]);
      toast.info("Dashboard cleared (local only)");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Fleet Incidents</h1>
          <p className="text-slate-500">Review and manage recent voicemail triages.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchIncidents}>
                <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-slate-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {incidents.length === 0 && !isLoading && (
            <div className="col-span-full p-12 text-center border-2 border-dashed rounded-xl bg-white space-y-4">
                 <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="text-slate-300 w-8 h-8" />
                 </div>
                 <p className="text-slate-500 font-medium">No incidents detected in the system.</p>
                 <Link href="/demo">
                    <Button variant="secondary">Go to Demo Hub</Button>
                 </Link>
            </div>
        )}
        {incidents.map((inc) => (
          <Link href={`/incidents/${inc.id}`} key={inc.id} className="group">
            <Card className="h-full hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-lg group-hover:text-blue-600 truncate max-w-[200px]">{inc.audioFilename}</CardTitle>
                        <CardDescription className="text-[10px] font-mono uppercase">{inc.id}</CardDescription>
                    </div>
                    <Badge className="capitalize">{inc.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    {inc.issueCategory ? (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 uppercase font-black tracking-tighter">Category</span>
                            <Badge variant="outline" className="text-[10px]">{inc.issueCategory}</Badge>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                             <span className="text-xs text-slate-500 uppercase font-black tracking-tighter">Category</span>
                             <span className="text-xs text-slate-300">Pending AI</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 uppercase font-black tracking-tighter">Timestamp</span>
                        <span className="text-xs font-medium text-slate-700">{new Date(inc.createdAt).toLocaleString()}</span>
                    </div>
                </div>
                {inc.transcriptText && (
                    <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2 rounded border">
                        "{inc.transcriptText}"
                    </p>
                )}
                {inc.matchedFacility && (
                    <div className="pt-2 border-t flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-bold text-slate-500 truncate">{inc.matchedFacility.name}</span>
                    </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
