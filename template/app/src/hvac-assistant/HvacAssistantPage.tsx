import {
  askHvacAssistant,
  getHvacKnowledgeBase,
  useQuery,
} from "wasp/client/operations";

import { AlertTriangle, Loader2, Phone, MessageSquare } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../client/components/ui/alert";
import { Button } from "../client/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../client/components/ui/card";
import { Input } from "../client/components/ui/input";
import { Label } from "../client/components/ui/label";
import { Textarea } from "../client/components/ui/textarea";
import { cn } from "../client/utils";

type Channel = "receptionist" | "chatbot";

type ChatTurn = {
  role: "user" | "assistant";
  text: string;
  sources?: string[];
  isEmergency?: boolean;
};

export function HvacAssistantPage() {
  const { data: kb } = useQuery(getHvacKnowledgeBase);
  const [channel, setChannel] = useState<Channel>("chatbot");
  const [shopName, setShopName] = useState("Sunshine HVAC");
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSend() {
    const text = message.trim();
    if (!text || isLoading) return;
    setTurns((t) => [...t, { role: "user", text }]);
    setMessage("");
    setIsLoading(true);
    try {
      const res = await askHvacAssistant({ message: text, channel, shopName });
      setTurns((t) => [
        ...t,
        {
          role: "assistant",
          text: res.reply,
          sources: res.sources,
          isEmergency: res.isEmergency,
        },
      ]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong.";
      setTurns((t) => [
        ...t,
        { role: "assistant", text: `⚠️ ${msg}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="py-10 lg:mt-10">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
            HVAC AI Assistant
          </h2>
          <p className="text-muted-foreground mt-2">
            RAG-grounded receptionist & chatbot. Every answer is drawn from the{" "}
            <code>data/hvac-knowledge</code> base and cites its source.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Controls + KB status */}
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <ChannelButton
                      active={channel === "receptionist"}
                      onClick={() => setChannel("receptionist")}
                      icon={<Phone className="h-4 w-4" />}
                      label="Receptionist"
                    />
                    <ChannelButton
                      active={channel === "chatbot"}
                      onClick={() => setChannel("chatbot")}
                      icon={<MessageSquare className="h-4 w-4" />}
                      label="Chatbot"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop">Shop name</Label>
                  <Input
                    id="shop"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Knowledge base</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-1 text-sm">
                <p>{kb?.skills.length ?? 0} skills loaded</p>
                <p>{kb?.docs.length ?? 0} documents indexed</p>
                <ul className="mt-2 max-h-48 space-y-1 overflow-auto">
                  {kb?.docs.map((d) => (
                    <li key={d.id} className="truncate font-mono text-xs">
                      {d.id}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Chat */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {channel === "receptionist"
                  ? "Phone Receptionist"
                  : "Web / SMS Chatbot"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 flex min-h-[280px] flex-col gap-3 rounded-md p-4">
                {turns.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    Try: "How much for AC repair?" or "I smell gas near my
                    furnace."
                  </p>
                )}
                {turns.map((turn, i) => (
                  <ChatBubble key={i} turn={turn} />
                ))}
                {isLoading && (
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> thinking…
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Type a customer message…"
                  rows={2}
                />
                <Button onClick={() => void handleSend()} disabled={isLoading}>
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChannelButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-input text-muted-foreground hover:bg-muted",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ChatBubble({ turn }: { turn: ChatTurn }) {
  if (turn.role === "user") {
    return (
      <div className="self-end rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
        {turn.text}
      </div>
    );
  }
  return (
    <div className="max-w-[90%] space-y-2 self-start">
      {turn.isEmergency && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Safety trigger detected</AlertTitle>
          <AlertDescription>
            This message matches an emergency pattern — the skill escalates to a
            human instead of booking.
          </AlertDescription>
        </Alert>
      )}
      <div className="bg-background rounded-lg border px-3 py-2 text-sm whitespace-pre-wrap">
        {turn.text}
      </div>
      {turn.sources && turn.sources.length > 0 && (
        <div className="text-muted-foreground flex flex-wrap gap-1 text-xs">
          <span>Grounded in:</span>
          {turn.sources.map((s) => (
            <code key={s} className="bg-muted rounded px-1 py-0.5">
              {s}
            </code>
          ))}
        </div>
      )}
    </div>
  );
}
