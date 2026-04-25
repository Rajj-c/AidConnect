"use client";

import { useEffect, useState } from "react";
import { subscribeToFieldEntries, TaskDoc, FieldEntry, CollectionEntry, DistributionEntry, ServiceEntry } from "@/lib/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, HeartHandshake, User, MapPin, Clock, Image as ImageIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  task: TaskDoc;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FieldEntriesDialog({ task, open, onOpenChange }: Props) {
  const [entries, setEntries] = useState<FieldEntry[]>([]);

  useEffect(() => {
    if (!task.id || !open) return;
    return subscribeToFieldEntries(task.id, setEntries);
  }, [task.id, open]);

  const summary = task.fieldSummary;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <DialogTitle className="font-headline text-base flex items-center gap-2">
            {task.taskType === "Collection" && <Package className="h-4 w-4 text-blue-600" />}
            {task.taskType === "Distribution" && <Truck className="h-4 w-4 text-green-600" />}
            {task.taskType === "Service" && <HeartHandshake className="h-4 w-4 text-purple-600" />}
            Field Logs — {task.title}
          </DialogTitle>
        </DialogHeader>

        {/* Summary Banner */}
        {summary && summary.totalEntries > 0 && (
          <div className="mx-5 my-3 bg-slate-50 rounded-xl border p-4 shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Running Total</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-black text-slate-800">{summary.totalEntries}</p>
                <p className="text-xs text-muted-foreground">Entries</p>
              </div>
              {(task.taskType === "Collection" || task.taskType === "Distribution") && (
                <div>
                  <p className="text-2xl font-black text-blue-600">{summary.totalItems}</p>
                  <p className="text-xs text-muted-foreground">Items</p>
                </div>
              )}
              <div>
                <p className="text-2xl font-black text-green-600">{summary.totalBeneficiaries}</p>
                <p className="text-xs text-muted-foreground">People</p>
              </div>
            </div>
          </div>
        )}

        {/* Entries list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
          {entries.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No field entries logged yet.</p>
            </div>
          ) : (
            entries.map((entry, i) => {
              const isCollection = entry.entryType === "Collection";
              const isDistribution = entry.entryType === "Distribution";
              const isService = entry.entryType === "Service";

              return (
                <div key={(entry as any).id ?? i} className="bg-white rounded-xl border p-4 space-y-3 shadow-sm">
                  {/* Entry header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-400">#{i + 1}</span>
                      {isCollection && (
                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 gap-1">
                          <Package className="h-3 w-3" /> Collection
                        </Badge>
                      )}
                      {isDistribution && (
                        <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 gap-1">
                          <Truck className="h-3 w-3" /> Distribution
                        </Badge>
                      )}
                      {isService && (
                        <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 gap-1">
                          <HeartHandshake className="h-3 w-3" /> Service
                        </Badge>
                      )}
                    </div>
                    {entry.loggedAt && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow((entry.loggedAt as any).toDate?.() ?? entry.loggedAt, { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  {/* Collection fields */}
                  {isCollection && (() => {
                    const col = entry as CollectionEntry;
                    return (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-700 col-span-2 font-semibold">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {col.donorName}
                          {col.donorPhone && <span className="text-slate-400 font-normal">· {col.donorPhone}</span>}
                        </div>
                        {col.donorAddress && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground col-span-2">
                            <MapPin className="h-3 w-3" /> {col.donorAddress}
                          </div>
                        )}
                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground">Item Type</p>
                          <p className="font-bold text-sm">{col.itemType}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground">Qty Collected</p>
                          <p className="font-bold text-sm text-blue-700">{col.quantity}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground">For People</p>
                          <p className="font-bold text-sm text-green-700">{col.beneficiaryCount}</p>
                        </div>
                        {col.condition && (
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground">Condition</p>
                            <p className="font-bold text-sm">{col.condition}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Distribution fields */}
                  {isDistribution && (() => {
                    const dis = entry as DistributionEntry;
                    return (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-700 col-span-2 font-semibold">
                          <User className="h-3.5 w-3.5 text-slate-400" />{dis.recipientName}
                          {dis.recipientArea && <span className="text-slate-400 font-normal">· {dis.recipientArea}</span>}
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground">Item Type</p>
                          <p className="font-bold text-sm">{dis.itemType}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground">Given</p>
                          <p className="font-bold text-sm text-green-700">{dis.quantityGiven}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2 text-center col-span-2">
                          <p className="text-xs text-muted-foreground">Beneficiaries</p>
                          <p className="font-bold text-sm text-blue-700">{dis.beneficiaryCount} people</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Service fields */}
                  {isService && (() => {
                    const svc = entry as ServiceEntry;
                    return (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-700 col-span-2 font-semibold">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />{svc.venue}
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground">Service</p>
                          <p className="font-bold text-xs text-purple-700">{svc.serviceType}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground">People Served</p>
                          <p className="font-bold text-sm text-green-700">{svc.peopleServedCount}</p>
                        </div>
                        {svc.durationMinutes && (
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="font-bold text-sm">{svc.durationMinutes} min</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Notes */}
                  {(entry as any).notes && (
                    <p className="text-xs text-muted-foreground italic bg-slate-50 rounded-lg p-2 border">
                      "{(entry as any).notes}"
                    </p>
                  )}

                  {/* Photo */}
                  {(entry as any).photo && (
                    <div className="rounded-xl overflow-hidden border">
                      <img src={(entry as any).photo} alt="Field photo" className="w-full h-36 object-cover" />
                    </div>
                  )}

                  {/* Logged by */}
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    Logged by <span className="font-semibold">{entry.loggedByName}</span>
                  </p>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
