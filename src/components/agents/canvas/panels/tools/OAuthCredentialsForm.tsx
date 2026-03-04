"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface RequiredField {
  name: string;
  displayName: string;
  description: string;
}

interface OAuthCredentialsFormProps {
  toolkitName: string;
  authScheme: string;
  requiredFields: RequiredField[];
  submitting: boolean;
  onSubmit: (credentials: Record<string, string>) => void;
  onCancel: () => void;
}

/** Whether a field name suggests it holds a secret value. */
function isSensitiveField(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes("secret") || lower.includes("password") || lower.includes("token");
}

export function OAuthCredentialsForm({
  toolkitName,
  authScheme,
  requiredFields,
  submitting,
  onSubmit,
  onCancel,
}: OAuthCredentialsFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const allFilled = requiredFields.every((f) => (values[f.name] ?? "").trim().length > 0);

  const handleSubmit = () => {
    if (!allFilled || submitting) return;
    onSubmit(values);
  };

  const schemeLabel =
    authScheme.toUpperCase() === "OAUTH2" ? "OAuth" :
    authScheme.toUpperCase() === "OAUTH1" ? "OAuth" :
    authScheme;

  return (
    <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {toolkitName} {schemeLabel} Credentials
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        This app requires your own developer credentials. Register an application
        with {toolkitName} and enter your credentials below.
      </p>

      {requiredFields.map((field) => {
        const sensitive = isSensitiveField(field.name);
        const visible = showPasswords[field.name] ?? false;

        return (
          <div key={field.name} className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">{field.displayName || field.name}</Label>
            <div className="relative">
              <Input
                type={sensitive && !visible ? "password" : "text"}
                placeholder={field.description || `Enter ${field.displayName || field.name}`}
                value={values[field.name] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                className="text-sm pr-9"
                disabled={submitting}
              />
              {sensitive && (
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords((prev) => ({ ...prev, [field.name]: !prev[field.name] }))
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            {field.description && (
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                {field.description}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-2 mt-1">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!allFilled || submitting}
          className="text-xs"
        >
          {submitting ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
              Connecting...
            </>
          ) : (
            "Connect"
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
          className="text-xs"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
