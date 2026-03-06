import { h } from "preact";
import { useState, useEffect, useCallback } from "preact/hooks";
import { Launcher } from "./components/Launcher";
import { ChatPanel } from "./components/ChatPanel";
import { GreetingBubble } from "./components/GreetingBubble";
import type { WidgetConfig, ConfigResponse } from "./types";
import { SIZE_MAP } from "./types";

interface AppProps {
  channelId: string;
  apiOrigin: string;
}

export function App({ channelId, apiOrigin }: AppProps) {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [greetingDismissed, setGreetingDismissed] = useState(false);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    fetch(`${apiOrigin}/api/widget/${channelId}/config`)
      .then((r) => {
        if (!r.ok) throw new Error("Config fetch failed");
        return r.json() as Promise<ConfigResponse>;
      })
      .then((data) => {
        setConfig(data.config);
        setToken(data.token);
        setAgentId(data.agentId);
      })
      .catch(() => setConfigError(true));
  }, [channelId, apiOrigin]);

  const handleOpenChat = useCallback(() => {
    setIsOpen(true);
    setGreetingDismissed(true);
  }, []);

  // Silent degradation
  if (configError || !config) return null;

  const position = config.position || "right";
  const size = SIZE_MAP[config.widgetSize || "default"];
  const hasGreeting = Boolean(config.greetingMessage?.trim());
  const showGreeting = hasGreeting && !isOpen && !greetingDismissed;

  return (
    <div class={`lp-position-${position}`}>
      {isOpen && token && agentId ? (
        <ChatPanel
          config={config}
          token={token}
          agentId={agentId}
          channelId={channelId}
          apiOrigin={apiOrigin}
          onClose={() => setIsOpen(false)}
          size={size}
        />
      ) : null}
      {showGreeting && (
        <GreetingBubble
          message={config.greetingMessage!}
          delay={config.greetingDelay ?? 3}
          position={position}
          isDark={config.theme === "dark"}
          isSharp={config.borderRadius === "sharp"}
          onDismiss={() => setGreetingDismissed(true)}
          onClick={handleOpenChat}
        />
      )}
      <Launcher
        config={config}
        isOpen={isOpen}
        onClick={() => (isOpen ? setIsOpen(false) : handleOpenChat())}
        size={size.launcher}
      />
    </div>
  );
}
