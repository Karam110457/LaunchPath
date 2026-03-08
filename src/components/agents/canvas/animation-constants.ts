/**
 * Shared animation constants for the Agent Builder canvas.
 * Centralises timing, easing, and variant configs so every
 * panel, modal, and widget animates consistently.
 */

/** Right-side panels (NodeModal, VersionHistory, ChatWidget). */
export const PANEL_SLIDE = {
  initial: { x: 24, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 24, opacity: 0 },
  transition: { type: "spring" as const, stiffness: 400, damping: 30 },
};

/** Backdrops behind panels. */
export const FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};

/** Dropdown menus (chat conversation picker, context menus). */
export const DROPDOWN = {
  initial: { opacity: 0, scale: 0.95, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -4 },
  transition: { duration: 0.12 },
};

/** Parent container for staggered children (tool grids). */
export const STAGGER_CHILDREN = {
  animate: { transition: { staggerChildren: 0.03 } },
  exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
};

/** Individual staggered item (tool card). */
export const STAGGER_ITEM = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.15 },
};

/** Left catalog collapse / expand spring. */
export const CATALOG_SPRING = {
  type: "spring" as const,
  stiffness: 350,
  damping: 28,
};

/** New chat message slide-up. */
export const MESSAGE_ENTER = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: [0.25, 0.8, 0.25, 1] as const },
};

/** Accordion expand / collapse (version cards, etc.). */
export const ACCORDION = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto" as const, opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2, ease: [0.25, 0.8, 0.25, 1] as const },
};
