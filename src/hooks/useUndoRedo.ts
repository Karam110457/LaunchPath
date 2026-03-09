"use client";

import { useCallback, useRef, useState } from "react";

export interface UndoEntry {
  label: string;
  undo: () => Promise<void> | void;
  redo: () => Promise<void> | void;
}

const MAX_STACK = 50;

export function useUndoRedo() {
  const [past, setPast] = useState<UndoEntry[]>([]);
  const [future, setFuture] = useState<UndoEntry[]>([]);
  const busyRef = useRef(false);

  const push = useCallback((entry: UndoEntry) => {
    setPast((prev) => {
      const next = [...prev, entry];
      if (next.length > MAX_STACK) next.shift();
      return next;
    });
    setFuture([]);
  }, []);

  const undo = useCallback(async (): Promise<boolean> => {
    if (busyRef.current) return false;
    const entry = past[past.length - 1];
    if (!entry) return false;
    busyRef.current = true;
    try {
      await entry.undo();
      setPast((p) => p.slice(0, -1));
      setFuture((f) => [...f, entry]);
      return true;
    } catch (err) {
      console.error("Undo failed:", err);
      return false;
    } finally {
      busyRef.current = false;
    }
  }, [past]);

  const redo = useCallback(async (): Promise<boolean> => {
    if (busyRef.current) return false;
    const entry = future[future.length - 1];
    if (!entry) return false;
    busyRef.current = true;
    try {
      await entry.redo();
      setFuture((f) => f.slice(0, -1));
      setPast((p) => [...p, entry]);
      return true;
    } catch (err) {
      console.error("Redo failed:", err);
      return false;
    } finally {
      busyRef.current = false;
    }
  }, [future]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const undoLabel = past.length > 0 ? past[past.length - 1].label : "";
  const redoLabel = future.length > 0 ? future[future.length - 1].label : "";

  return { push, undo, redo, canUndo, canRedo, undoLabel, redoLabel };
}
