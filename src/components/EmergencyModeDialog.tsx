"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Zap, AlertTriangle, MapPin, Radio } from "lucide-react";

interface EmergencyModeDialogProps {
  onActivate: (type: string, region: string) => void;
}

export function EmergencyModeDialog({ onActivate }: EmergencyModeDialogProps) {
  const [open, setOpen] = useState(false);
  const [disasterType, setDisasterType] = useState("");
  const [region, setRegion] = useState("");

  function handleActivate() {
    if (!disasterType || !region) return;
    onActivate(disasterType, region);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-destructive hover:bg-destructive/90 gap-2 shadow-lg shadow-destructive/20">
          <Zap className="h-4 w-4" /> Emergency Mode
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-destructive/10 rounded-lg animate-pulse">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="font-headline text-xl text-destructive">
              Activate Emergency Mode
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed">
            This will <strong>override all normal operations</strong> and automatically
            prioritize life-critical needs. All volunteers will be notified immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg flex items-start gap-2 text-xs text-destructive">
            <Radio className="h-4 w-4 shrink-0 mt-0.5 animate-pulse" />
            Emergency broadcasts will be sent to all active volunteers in the selected region.
          </div>

          <div className="space-y-2">
            <Label>Disaster Type</Label>
            <Select onValueChange={setDisasterType}>
              <SelectTrigger><SelectValue placeholder="Select emergency type..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Flood">🌊 Flood</SelectItem>
                <SelectItem value="Earthquake">🌍 Earthquake</SelectItem>
                <SelectItem value="Fire">🔥 Fire</SelectItem>
                <SelectItem value="Medical Crisis">🏥 Medical Crisis</SelectItem>
                <SelectItem value="Food Emergency">🍱 Mass Food Emergency</SelectItem>
                <SelectItem value="Other">⚠️ Other Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="em-region">Affected Region</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="em-region"
                placeholder="e.g. Gachibowli, North Sector"
                className="pl-10"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="font-medium">Effects:</span>
            <Badge variant="destructive" className="text-[10px]">Override Priorities</Badge>
            <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Broadcast Alert</Badge>
            <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Life-Critical First</Badge>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            className="bg-destructive hover:bg-destructive/90 gap-2"
            onClick={handleActivate}
            disabled={!disasterType || !region}
          >
            <Zap className="h-4 w-4" /> Activate Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
