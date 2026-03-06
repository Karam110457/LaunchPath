import { h, render } from "preact";
import { App } from "./App";
import { WIDGET_CSS } from "./styles";

function init() {
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    "script[data-channel]"
  );
  const script = scripts[scripts.length - 1];
  if (!script) return;

  const channelId = script.getAttribute("data-channel");
  if (!channelId) return;

  // Derive API origin from the script's src URL
  const scriptSrc = script.getAttribute("src") || "";
  let apiOrigin: string;
  try {
    apiOrigin = new URL(scriptSrc, window.location.href).origin;
  } catch {
    apiOrigin = window.location.origin;
  }

  // Create host element
  const host = document.createElement("div");
  host.id = "lp-widget-host";
  host.style.cssText = "position:fixed;z-index:2147483646;pointer-events:none;";
  document.body.appendChild(host);

  // Attach shadow DOM
  const shadow = host.attachShadow({ mode: "open" });

  // Inject styles
  const styleEl = document.createElement("style");
  styleEl.textContent = WIDGET_CSS;
  shadow.appendChild(styleEl);

  // Mount point
  const mountPoint = document.createElement("div");
  mountPoint.id = "lp-widget-root";
  mountPoint.style.cssText = "pointer-events:auto;";
  shadow.appendChild(mountPoint);

  render(<App channelId={channelId} apiOrigin={apiOrigin} />, mountPoint);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
