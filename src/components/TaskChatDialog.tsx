"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToTaskMessages, sendTaskMessage, TaskDoc, TaskMessage } from "@/lib/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  task: TaskDoc;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskChatDialog({ task, open, onOpenChange }: Props) {
  const { user, userRole } = useAuth();
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!task.id || !open) return;
    return subscribeToTaskMessages(task.id, setMessages);
  }, [task.id, open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim() || !user || !task.id) return;
    setSending(true);
    try {
      await sendTaskMessage(task.id, {
        senderId: user.uid,
        senderName: user.displayName ?? "User",
        senderRole: userRole as "NGO" | "Volunteer" | "Admin",
        text: text.trim(),
        read: false,
      });
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg flex flex-col h-[80vh] max-h-[600px] p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <DialogTitle className="font-headline text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            {task.title}
          </DialogTitle>
          {task.assignedVolunteerName && (
            <p className="text-xs text-muted-foreground">
              Chat with {task.assignedVolunteerName}
            </p>
          )}
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <MessageCircle className="h-10 w-10 opacity-20" />
              <p className="text-sm">No messages yet. Start the conversation.</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.senderId === user?.uid;
              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <Avatar className="h-7 w-7 shrink-0 mt-1">
                    <AvatarFallback className={`text-[10px] font-bold ${isMe ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600"}`}>
                      {msg.senderName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[75%] space-y-0.5 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                    <div className={`px-3 py-2 rounded-2xl text-sm ${
                      isMe
                        ? "bg-primary text-white rounded-tr-sm"
                        : "bg-slate-100 text-slate-800 rounded-tl-sm"
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1">
                      {msg.senderName} ·{" "}
                      {msg.timestamp
                        ? formatDistanceToNow((msg.timestamp as any).toDate?.() ?? msg.timestamp, { addSuffix: true })
                        : "Just now"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-3 border-t shrink-0 flex gap-2">
          <Input
            placeholder="Type a message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!text.trim() || sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
