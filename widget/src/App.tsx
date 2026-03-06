import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Launcher } from "./components/Launcher";
import { ChatPanel } from "./components/ChatPanel";
import type { WidgetConfig, ConfigResponse } from "./types";

interface AppProps {
  channelId: string;
  apiOrigin: string;
}

export function App({ channelId, apiOrigin }: AppProps) {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
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

  // Silent degradation
  if (configError || !config) return null;

  const position = config.position || "right";

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
        />
      ) : null}
      <Launcher
        config={config}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      />
    </div>
  );
}
