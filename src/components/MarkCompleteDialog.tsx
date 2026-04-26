"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkCompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteerName?: string;
  taskTitle: string;
  onConfirm: (rating: number, comment: string) => Promise<void>;
}

export function MarkCompleteDialog({
  open,
  onOpenChange,
  volunteerName,
  taskTitle,
  onConfirm,
}: MarkCompleteDialogProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];
  const COLORS = ["", "text-red-500", "text-orange-400", "text-yellow-400", "text-blue-500", "text-green-500"];

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm(rating || 3, comment);
      setRating(0);
      setComment("");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  const display = hovered || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCheck className="h-5 w-5 text-orange-500" />
            Mark Task as Completed
          </DialogTitle>
          <DialogDescription className="text-left">
            <span className="font-medium text-slate-700">"{taskTitle}"</span>
            {volunteerName && (
              <> — assigned to <span className="font-semibold text-primary">{volunteerName}</span></>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {volunteerName && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">
                Rate {volunteerName}'s performance
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={cn(
                        "h-9 w-9 transition-colors",
                        star <= display
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-100 text-slate-300"
                      )}
                    />
                  </button>
                ))}
                {display > 0 && (
                  <span className={cn("ml-2 text-sm font-bold", COLORS[display])}>
                    {LABELS[display]}
                  </span>
                )}
              </div>
              {rating === 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Optional — skip to mark complete without a rating
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-slate-700">Feedback / Notes <span className="font-normal text-muted-foreground">(optional)</span></p>
            <Textarea
              placeholder={`How did ${volunteerName || "the task"} go? Any notes for the record...`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="text-sm resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              : <><CheckCheck className="h-4 w-4" /> Confirm Complete</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
