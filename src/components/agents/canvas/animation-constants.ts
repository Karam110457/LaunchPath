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
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.03 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

/** Individual staggered item (tool card). */
export const STAGGER_ITEM = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15 } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.1 } },
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

/** Canvas node entrance — fade spring (no scale to avoid stale ReactFlow handle positions). */
export const NODE_ENTER = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { type: "spring" as const, stiffness: 350, damping: 22 },
};

/** Canvas node drag lift — scale + shadow while dragging. */
export const NODE_DRAG = {
  scale: 1.03,
  filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.15))",
};

/**
 * Canvas node exit — shrink + fade + blur.
 * Used as `animate` target when a node is marked _exiting.
 * Transition is embedded so it overrides the element's transition prop.
 * Duration (250ms) must match ANIMATED_EXIT_MS in AgentCanvasPage.
 */
export const NODE_EXIT = {
  opacity: 0,
  scale: 0.6,
  filter: "blur(6px)",
  transition: { duration: 0.25, ease: [0.4, 0, 1, 1] as const },
};

/** Helper tip slide-down entrance / slide-up exit. */
export const HELPER_TIP = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: [0.25, 0.8, 0.25, 1] as const },
};
