"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  volunteerId: string;
  onSubmit: (feedback: { rating: number; success: boolean; note: string }) => Promise<void>;
}

export function FeedbackDialog({ open, onOpenChange, taskTitle, onSubmit }: FeedbackDialogProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (rating === 0 || success === null) return;
    setLoading(true);
    try {
      await onSubmit({ rating, success, note });
      onOpenChange(false);
      // reset
      setRating(0);
      setSuccess(null);
      setNote("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg">Task Feedback</DialogTitle>
          <DialogDescription className="text-sm">{taskTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Outcome */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Task Outcome</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSuccess(true)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all",
                  success === true
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border hover:border-accent/50"
                )}
              >
                <CheckCircle2 className="h-5 w-5" /> Successful
              </button>
              <button
                onClick={() => setSuccess(false)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all",
                  success === false
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border hover:border-destructive/50"
                )}
              >
                <XCircle className="h-5 w-5" /> Could not complete
              </button>
            </div>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Rate the experience</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      star <= (hovered || rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-muted-foreground">
                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="feedback-note" className="text-sm font-semibold">Additional notes <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="feedback-note"
              placeholder="Any observations, challenges, or suggestions..."
              className="min-h-[80px] resize-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || success === null || loading}
            className="gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
