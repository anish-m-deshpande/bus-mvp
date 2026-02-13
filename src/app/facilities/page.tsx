"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Mail, Clock, ShieldCheck, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/facilities")
      .then(res => res.json())
      .then(data => {
        setFacilities(data);
        setIsLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Facility Directory</h1>
        <p className="text-slate-500">The authoritative network of maintenance hubs and operations desks used for routing.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[250px]">Facility Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Operating Hours</TableHead>
                        <TableHead>Service Capabilities</TableHead>
                        <TableHead>Contact</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({length: 5}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            </TableRow>
                        ))
                    ) : facilities.map((f) => (
                        <TableRow key={f.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="font-bold text-slate-900">
                                <div className="flex items-center gap-2">
                                    {f.name.toLowerCase().includes("ops desk") ? <ShieldCheck className="w-4 h-4 text-blue-600" /> : <Wrench className="w-4 h-4 text-slate-400" />}
                                    {f.name}
                                </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                    {f.city}, {f.state}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tight gap-1">
                                    <Clock className="w-3 h-3" /> {f.hours}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1.5 max-w-sm">
                                    {JSON.parse(f.capabilities || "[]").slice(0, 4).map((c: string) => (
                                        <Badge key={c} variant="secondary" className="text-[9px] px-1.5 py-0">
                                            {c}
                                        </Badge>
                                    ))}
                                    {JSON.parse(f.capabilities || "[]").length > 4 && (
                                        <span className="text-[10px] text-slate-400">+{JSON.parse(f.capabilities).length - 4} more</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-xs text-blue-600 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                                    {f.contact_email}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex gap-4 items-start">
            <div className="bg-blue-600 p-2 rounded-lg">< ShieldCheck className="w-6 h-6 text-white" /></div>
            <div>
                <p className="font-bold text-blue-900">Routing Intelligence</p>
                <p className="text-sm text-blue-800 leading-relaxed max-w-2xl">
                    The AI cross-references incoming incidents against this directory using three factors: <span className="font-bold underline decoration-blue-200">State Coverage</span>, <span className="font-bold underline decoration-blue-200">Exact Capability Match</span> (e.g. Brakes vs HVAC), and <span className="font-bold underline decoration-blue-200">Spatial Proximity</span>. Critical incidents bypass standard proximity logic and route directly to the designated State Ops Desk.
                </p>
            </div>
      </div>
    </div>
  );
}
