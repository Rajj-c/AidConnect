"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  subscribeToDonationLeads, subscribeToNeedReports,
  convertDonationLeadToTask, convertNeedReportToTask,
  updateDonationLeadStatus, updateNeedReportStatus,
  DonationLead, NeedReport, getNGOProfile,
} from "@/lib/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gift, AlertTriangle, User, MapPin, Phone, Clock,
  ClipboardList, CheckCircle2, XCircle, Loader2, Inbox,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLOR: Record<string, string> = {
  New: "bg-blue-100 text-blue-700",
  Reviewed: "bg-yellow-100 text-yellow-700",
  TaskCreated: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function LeadsPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [donations, setDonations] = useState<DonationLead[]>([]);
  const [needs, setNeeds] = useState<NeedReport[]>([]);
  const [ngoName, setNgoName] = useState("");
  const [converting, setConverting] = useState<string | null>(null);

  useEffect(() => {
    if (userRole !== "NGO" || !user) { router.replace("/dashboard"); return; }
    getNGOProfile(user.uid).then(p => { if (p) setNgoName(p.orgName); });
    const u1 = subscribeToDonationLeads(user.uid, setDonations);
    const u2 = subscribeToNeedReports(user.uid, setNeeds);
    return () => { u1(); u2(); };
  }, [user, userRole, router]);

  const newDonations = donations.filter(d => d.status === "New").length;
  const newNeeds = needs.filter(n => n.status === "New").length;

  async function handleConvertDonation(lead: DonationLead) {
    if (!lead.id) return;
    setConverting(lead.id);
    try {
      await convertDonationLeadToTask(lead, ngoName);
      toast({ title: "Task Created ✓", description: `Collection task created for ${lead.donorName}. Check Tasks tab.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setConverting(null);
    }
  }

  async function handleConvertNeed(report: NeedReport) {
    if (!report.id) return;
    setConverting(report.id);
    try {
      await convertNeedReportToTask(report, ngoName);
      toast({ title: "Task Created ✓", description: `Assistance task created for ${report.contactName}. Check Tasks tab.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setConverting(null);
    }
  }

  async function handleRejectDonation(id: string) {
    await updateDonationLeadStatus(id, "Rejected");
    toast({ title: "Lead dismissed" });
  }

  async function handleRejectNeed(id: string) {
    await updateNeedReportStatus(id, "Rejected");
    toast({ title: "Report dismissed" });
  }

  function timeAgo(ts: any) {
    if (!ts?.toDate) return "Time not recorded";
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      }).format(ts.toDate());
    } catch { return "recently"; }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Inbox className="h-7 w-7 text-primary" /> Community Leads
        </h1>
        <p className="text-muted-foreground mt-1">
          Field reports submitted by your volunteers — review and convert to tasks.
        </p>
      </div>

      <Tabs defaultValue="donations">
        <TabsList className="bg-white border shadow-sm w-full">
          <TabsTrigger value="donations" className="flex-1 gap-2">
            <Gift className="h-4 w-4 text-blue-500" /> Donation Leads
            {newDonations > 0 && (
              <span className="rounded-full bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5">{newDonations}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="needs" className="flex-1 gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" /> Need Reports
            {newNeeds > 0 && (
              <span className="rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5">{newNeeds}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── Donation Leads ─── */}
        <TabsContent value="donations" className="mt-4">
          {donations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed text-muted-foreground">
              <Gift className="h-10 w-10 mx-auto mb-3 opacity-30 text-blue-400" />
              <p className="font-medium">No donation leads yet</p>
              <p className="text-sm mt-1">When a volunteer spots a donor, it'll appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {donations.map(lead => (
                <Card key={lead.id} className="border-none shadow-sm bg-white overflow-hidden">
                  <div className="h-1 bg-blue-400 w-full" />
                  <CardContent className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-[10px] border-0 ${STATUS_COLOR[lead.status]}`}>{lead.status}</Badge>
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{lead.itemType}</Badge>
                        </div>
                        <h3 className="font-bold text-slate-900">{lead.donorName}</h3>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" />{timeAgo(lead.createdAt)}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-sm text-slate-600">
                      {lead.donorPhone && (
                        <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" />{lead.donorPhone}</div>
                      )}
                      <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" />{lead.donorAddress}</div>
                    </div>

                    {/* Quantity & availability */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Quantity</p>
                        <p className="font-bold text-blue-700 text-sm">{lead.estimatedQuantity}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Available</p>
                        <p className="font-bold text-slate-700 text-sm">{lead.availability}</p>
                      </div>
                    </div>

                    {lead.notes && (
                      <p className="text-xs text-muted-foreground italic bg-slate-50 rounded-lg p-2.5 border">"{lead.notes}"</p>
                    )}

                    <p className="text-[10px] text-muted-foreground">Reported by <span className="font-semibold">{lead.reportedByName}</span></p>

                    {/* Actions */}
                    {lead.status === "New" && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm" variant="outline"
                          className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleRejectDonation(lead.id!)}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Dismiss
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleConvertDonation(lead)}
                          disabled={converting === lead.id}
                        >
                          {converting === lead.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <ClipboardList className="h-3.5 w-3.5" />
                          }
                          Create Collection Task
                        </Button>
                      </div>
                    )}
                    {lead.status === "TaskCreated" && (
                      <div className="flex items-center gap-2 pt-2 border-t text-green-600 text-xs font-semibold">
                        <CheckCircle2 className="h-4 w-4" /> Task created from this lead
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Need Reports ─── */}
        <TabsContent value="needs" className="mt-4">
          {needs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30 text-red-400" />
              <p className="font-medium">No need reports yet</p>
              <p className="text-sm mt-1">When a volunteer spots someone in need, it'll appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {needs.map(report => (
                <Card key={report.id} className="border-none shadow-sm bg-white overflow-hidden">
                  <div className={`h-1 w-full ${report.urgency === "High" ? "bg-red-400" : report.urgency === "Medium" ? "bg-yellow-400" : "bg-green-400"}`} />
                  <CardContent className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-[10px] border-0 ${STATUS_COLOR[report.status]}`}>{report.status}</Badge>
                          <Badge className={`text-[10px] border-0 ${report.urgency === "High" ? "bg-red-100 text-red-700" : report.urgency === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                            {report.urgency} urgency
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">{report.category}</Badge>
                        </div>
                        <h3 className="font-bold text-slate-900">{report.contactName}</h3>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" />{timeAgo(report.createdAt)}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-sm text-slate-600">
                      {report.contactPhone && (
                        <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" />{report.contactPhone}</div>
                      )}
                      <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" />{report.address}</div>
                    </div>

                    {/* People count & description */}
                    <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                      <p className="text-[10px] font-bold text-red-400 uppercase mb-1">{report.numberOfPeople} people affected</p>
                      <p className="text-sm text-slate-700">{report.description}</p>
                    </div>

                    {report.notes && (
                      <p className="text-xs text-muted-foreground italic bg-slate-50 rounded-lg p-2.5 border">"{report.notes}"</p>
                    )}

                    <p className="text-[10px] text-muted-foreground">Reported by <span className="font-semibold">{report.reportedByName}</span></p>

                    {/* Actions */}
                    {report.status === "New" && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm" variant="outline"
                          className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleRejectNeed(report.id!)}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Dismiss
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs flex-1 bg-red-600 hover:bg-red-700"
                          onClick={() => handleConvertNeed(report)}
                          disabled={converting === report.id}
                        >
                          {converting === report.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <ClipboardList className="h-3.5 w-3.5" />
                          }
                          Create Assistance Task
                        </Button>
                      </div>
                    )}
                    {report.status === "TaskCreated" && (
                      <div className="flex items-center gap-2 pt-2 border-t text-green-600 text-xs font-semibold">
                        <CheckCircle2 className="h-4 w-4" /> Task created from this report
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
