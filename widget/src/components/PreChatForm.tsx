import { h } from "preact";
import { useState } from "preact/hooks";
import type { VisitorInfo } from "../types";
import { getContrastColor } from "../contrast";

interface PreChatFormProps {
  fields: ("name" | "email")[];
  primaryColor: string;
  isDark: boolean;
  onSubmit: (info: VisitorInfo) => void;
}

export function PreChatForm({ fields, primaryColor, isDark, onSubmit }: PreChatFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const contrastColor = getContrastColor(primaryColor);

  function handleSubmit(e: Event) {
    e.preventDefault();
    setError("");

    if (fields.includes("email") && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError("Please enter a valid email address");
        return;
      }
    }

    if (fields.includes("name") && !name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (fields.includes("email") && !email.trim()) {
      setError("Please enter your email");
      return;
    }

    onSubmit({
      name: name.trim() || undefined,
      email: email.trim() || undefined,
    });
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "12px",
    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
    background: isDark ? "#1f2937" : "#fff",
    color: isDark ? "#f3f4f6" : "#1a1a2e",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{
      padding: "24px 20px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      flex: 1,
      justifyContent: "center",
    }}>
      <div style={{
        textAlign: "center",
        marginBottom: "4px",
      }}>
        <p style={{
          fontSize: "15px",
          fontWeight: 600,
          color: isDark ? "#f3f4f6" : "#1a1a2e",
          marginBottom: "4px",
        }}>
          Before we start
        </p>
        <p style={{
          fontSize: "13px",
          color: isDark ? "#9ca3af" : "#6b7280",
        }}>
          Let us know how to reach you
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }} aria-label="Pre-chat form">
        {fields.includes("name") && (
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            style={inputStyle}
            aria-label="Your name"
            aria-required="true"
            autoComplete="name"
          />
        )}

        {fields.includes("email") && (
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
            style={inputStyle}
            aria-label="Your email"
            aria-required="true"
            autoComplete="email"
          />
        )}

        {error && (
          <p role="alert" style={{ fontSize: "12px", color: "#ef4444", textAlign: "center" }}>{error}</p>
        )}

        <button
          type="submit"
          aria-label="Start chat"
          style={{
            padding: "10px 20px",
            borderRadius: "12px",
            border: "none",
            background: primaryColor,
            color: contrastColor,
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            marginTop: "4px",
          }}
        >
          Start Chat
        </button>
      </form>
    </div>
  );
}
