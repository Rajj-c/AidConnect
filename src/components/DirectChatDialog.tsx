import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DirectMessage, subscribeToDirectMessages, sendDirectMessage } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle, Send, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ngoId: string;
  volunteerId: string;
  recipientName: string;
}

export function DirectChatDialog({ open, onOpenChange, ngoId, volunteerId, recipientName }: Props) {
  const { user, userRole } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !ngoId || !volunteerId) return;
    return subscribeToDirectMessages(ngoId, volunteerId, setMessages);
  }, [open, ngoId, volunteerId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user || !ngoId || !volunteerId) return;
    setSending(true);
    try {
      await sendDirectMessage(
        ngoId,
        volunteerId,
        user.uid,
        user.displayName || "Unknown",
        text.trim()
      );
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b bg-slate-50/50">
          <DialogTitle className="flex items-center gap-2 text-base font-headline">
            <MessageCircle className="h-5 w-5 text-primary" />
            Chat with {recipientName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4 bg-slate-50/30" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <p className="text-center text-xs text-muted-foreground mt-4">
                No messages yet. Send a message to start the conversation!
              </p>
            )}
            {messages.map((m) => {
              const isMe = m.senderId === user?.uid;
              return (
                <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] text-muted-foreground mb-1 ml-1">{m.senderName}</span>
                  <div
                    className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm ${
                      isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-slate-100 text-slate-800 rounded-bl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <form onSubmit={handleSend} className="p-3 border-t bg-white flex gap-2">
          <Input
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
            className="rounded-full bg-slate-50"
          />
          <Button type="submit" size="icon" disabled={!text.trim() || sending} className="rounded-full shrink-0">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
