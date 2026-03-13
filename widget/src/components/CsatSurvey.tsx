import { h } from "preact";
import { useState } from "preact/hooks";
import { getContrastColor } from "../contrast";

interface CsatSurveyProps {
  primaryColor: string;
  isDark: boolean;
  onSubmit: (rating: number, feedback: string) => void;
  onDismiss: () => void;
}

export function CsatSurvey({ primaryColor, isDark, onSubmit, onDismiss }: CsatSurveyProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (rating === 0) return;
    setSubmitted(true);
    onSubmit(rating, feedback.trim());
  }

  if (submitted) {
    return (
      <div style={{
        padding: "24px 20px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
      }}>
        <span style={{ fontSize: "32px" }}>{"🎉"}</span>
        <p style={{
          fontSize: "15px",
          fontWeight: 600,
          color: isDark ? "#f3f4f6" : "#1a1a2e",
        }}>
          Thank you for your feedback!
        </p>
        <button
          onClick={onDismiss}
          style={{
            marginTop: "8px",
            padding: "8px 20px",
            borderRadius: "12px",
            border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
            background: "transparent",
            color: isDark ? "#9ca3af" : "#6b7280",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    );
  }

  const stars = [1, 2, 3, 4, 5];
  const activeRating = hoveredRating || rating;

  return (
    <div style={{
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    }}>
      <p style={{
        fontSize: "14px",
        fontWeight: 600,
        color: isDark ? "#f3f4f6" : "#1a1a2e",
        textAlign: "center",
      }}>
        How was your experience?
      </p>

      <div role="group" aria-label="Satisfaction rating" style={{
        display: "flex",
        justifyContent: "center",
        gap: "8px",
      }}>
        {stars.map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            aria-label={`Rate ${star} out of 5 stars`}
            aria-pressed={rating === star}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "28px",
              padding: "4px",
              transition: "transform 0.15s",
              transform: activeRating >= star ? "scale(1.15)" : "scale(1)",
              filter: activeRating >= star ? "none" : "grayscale(1) opacity(0.4)",
            }}
          >
            {"⭐"}
          </button>
        ))}
      </div>

      {rating > 0 && (
        <textarea
          placeholder="Any additional feedback? (optional)"
          value={feedback}
          onInput={(e) => setFeedback((e.target as HTMLTextAreaElement).value)}
          rows={2}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "12px",
            border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
            background: isDark ? "#1f2937" : "#fff",
            color: isDark ? "#f3f4f6" : "#1a1a2e",
            fontSize: "13px",
            fontFamily: "inherit",
            outline: "none",
            resize: "none",
            boxSizing: "border-box",
          }}
        />
      )}

      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        <button
          onClick={onDismiss}
          style={{
            padding: "8px 16px",
            borderRadius: "12px",
            border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
            background: "transparent",
            color: isDark ? "#9ca3af" : "#6b7280",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          style={{
            padding: "8px 20px",
            borderRadius: "12px",
            border: "none",
            background: rating > 0 ? primaryColor : isDark ? "#374151" : "#e5e7eb",
            color: rating > 0 ? getContrastColor(primaryColor) : isDark ? "#6b7280" : "#9ca3af",
            fontSize: "13px",
            fontWeight: 600,
            cursor: rating > 0 ? "pointer" : "default",
            opacity: rating > 0 ? 1 : 0.6,
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
