"use client";

import { createContext, useContext } from "react";

interface TipsContextValue {
  /** Whether helper tips are globally visible (user toggle). */
  showTips: boolean;
  setShowTips: (v: boolean) => void;
  /** Reset all dismissed tips so they reappear. */
  resetDismissed: () => void;
}

export const TipsContext = createContext<TipsContextValue>({
  showTips: true,
  setShowTips: () => {},
  resetDismissed: () => {},
});

export function useTips() {
  return useContext(TipsContext);
}
