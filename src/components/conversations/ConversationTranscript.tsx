interface Message {
  role: string;
  content: string;
}

interface ConversationTranscriptProps {
  messages: Message[];
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
}

export function ConversationTranscript({
  messages,
  metadata,
  createdAt,
}: ConversationTranscriptProps) {
  return (
    <div className="space-y-6">
      {/* Metadata */}
      {metadata && Object.keys(metadata).length > 0 && (
        <div className="rounded-lg border bg-card p-4 space-y-1">
          {!!metadata.page_url && (
            <p className="text-xs text-muted-foreground">
              Page: {String(metadata.page_url)}
            </p>
          )}
          {createdAt && (
            <p className="text-xs text-muted-foreground">
              Started: {new Date(createdAt).toLocaleString()}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Messages: {messages.length}
          </p>
        </div>
      )}

      {/* Transcript */}
      <div className="space-y-3">
        {messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
