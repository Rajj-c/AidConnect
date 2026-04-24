"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, X, Send, Loader2 } from "lucide-react";
import { volunteerAssistant } from "@/ai/flows/volunteer-assistant-flow";

export function VolunteerChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'model', content: string}[]>([
    { role: 'model', content: "Hello! I'm your AI Field Assistant. Do you need help with your mission, logistics, or dealing with an emergency?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput("");
    const newHistory = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const res = await volunteerAssistant({ message: userMsg, history: messages });
      setMessages([...newHistory, { role: 'model', content: res.reply }]);
    } catch (e) {
      setMessages([...newHistory, { role: 'model', content: "Connection error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl z-50 border-4 border-white animate-bounce shadow-primary/20"
          size="icon"
        >
          <Bot className="h-8 w-8" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[340px] sm:w-[380px] h-[550px] shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-5 border-none">
          <CardHeader className="p-4 bg-primary text-primary-foreground rounded-t-xl flex flex-row items-center justify-between space-y-0 shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-headline">Field Assistant AI</CardTitle>
                <p className="text-xs text-primary-foreground/80 font-medium">Always here to help</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20 hover:text-white" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" ref={scrollRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && <div className="h-8 w-8 mt-1 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-primary" /></div>}
                <div className={`p-3.5 rounded-2xl max-w-[80%] text-[13px] shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-white border text-foreground rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 mt-1 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-primary" /></div>
                <div className="p-3.5 rounded-2xl bg-white border text-foreground rounded-bl-sm flex items-center gap-2 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-[13px] text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-3 border-t bg-white rounded-b-xl">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex w-full gap-2 items-center">
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Ask for field advice..." 
                className="flex-1 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-10 rounded-full px-4"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="rounded-full h-10 w-10 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
