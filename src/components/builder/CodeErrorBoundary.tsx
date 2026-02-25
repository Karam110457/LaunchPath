"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: string | null;
}

/**
 * Error boundary for dynamically rendered JSX code.
 * Catches runtime errors and shows a styled error message
 * instead of crashing the entire page.
 */
export class CodeErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error: error.message };
  }

  componentDidCatch(error: Error) {
    console.error("[CodeErrorBoundary]", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="flex items-center justify-center size-12 rounded-full bg-red-500/10 mb-4">
            <AlertTriangle className="size-6 text-red-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Preview Error
          </h3>
          <p className="text-xs text-muted-foreground max-w-md font-mono break-all">
            {this.state.error}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
