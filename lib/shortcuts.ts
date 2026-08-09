/**
 * Every keyboard shortcut the palace responds to, grouped by where it applies.
 *
 * This is the only place shortcuts are described. The `?` cheatsheet and the
 * Settings page both render this list, so a shortcut cannot be documented in
 * one and forgotten in the other.
 *
 * Scope matters and used to be wrong: arrow keys and Delete were listed as if
 * they worked anywhere, when both belong to a focused object card. A shortcut
 * documented in the wrong scope is worse than one left undocumented — the user
 * presses it, nothing happens, and the app looks broken.
 */

/** Where a shortcut applies. */
export type ShortcutScope =
  "global" | "canvas" | "room" | "graph" | "palette" | "editor";

/**
 * The platform-dependent modifier: `Ctrl` everywhere, `⌘` on Apple hardware.
 * Written as a token in the data and resolved at render time.
 */
export const MOD = "Mod";

export interface Shortcut {
  /**
   * The key combinations that trigger it. Keys within a chord are pressed
   * together; separate chords are alternatives ("Enter or Space").
   */
  chords: readonly (readonly string[])[];
  label: string;
}

export interface ShortcutGroup {
  scope: ShortcutScope;
  title: string;
  /** When the group's shortcuts are live. */
  hint: string;
  shortcuts: readonly Shortcut[];
}

export const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
  {
    scope: "global",
    title: "Anywhere",
    hint: "Available on every screen.",
    shortcuts: [
      { chords: [[MOD, "K"]], label: "Open the command palette" },
      { chords: [["?"]], label: "Show these shortcuts" },
      { chords: [[MOD, "Z"]], label: "Undo the last change" },
      { chords: [[MOD, "Shift", "Z"]], label: "Redo" },
      { chords: [["Esc"]], label: "Close the topmost dialog or panel" },
    ],
  },
  {
    scope: "canvas",
    title: "Full-screen canvases",
    hint: "On the palace, a room and the graph.",
    shortcuts: [
      { chords: [["F"]], label: "Fill the screen with the canvas" },
      { chords: [["Esc"]], label: "Leave full screen" },
    ],
  },
  {
    scope: "room",
    title: "Room canvas",
    hint: "With an object card focused.",
    shortcuts: [
      { chords: [["←", "↑", "↓", "→"]], label: "Move the object" },
      { chords: [["Shift", "←↑↓→"]], label: "Move in larger steps" },
      { chords: [["Enter"], ["Space"]], label: "Open the object" },
      { chords: [["L"]], label: "Start a connection from this object" },
      {
        chords: [["Enter"]],
        label: "Land the connection on this object",
      },
      { chords: [["Esc"]], label: "Cancel the connection" },
      { chords: [["Delete"], ["Backspace"]], label: "Delete the object" },
    ],
  },
  {
    scope: "graph",
    title: "Knowledge graph",
    hint: "With the graph canvas focused.",
    shortcuts: [
      { chords: [["←"], ["→"]], label: "Previous or next node" },
      {
        chords: [["↑"], ["↓"]],
        label: "Step through the current node's connections",
      },
      { chords: [["Enter"], ["Space"]], label: "Open the highlighted node" },
      { chords: [["Esc"]], label: "Clear the highlight" },
      { chords: [["Shift", "←↑↓→"]], label: "Pan the view" },
      { chords: [["+"], ["−"]], label: "Zoom in or out" },
      { chords: [["0"]], label: "Fit everything on screen" },
      {
        chords: [[MOD, "scroll"]],
        label: "Zoom — a plain scroll moves the page",
      },
    ],
  },
  {
    scope: "palette",
    title: "Command palette",
    hint: "While the palette is open.",
    shortcuts: [
      { chords: [["↑"], ["↓"]], label: "Move through the results" },
      { chords: [["Enter"]], label: "Open the selected result" },
    ],
  },
  {
    scope: "editor",
    title: "Object editor",
    hint: "While the editor panel is open.",
    shortcuts: [
      { chords: [["Enter"]], label: "Add the typed tag" },
      { chords: [["Backspace"]], label: "Remove the last tag, if none typed" },
      { chords: [["Esc"]], label: "Close the editor" },
    ],
  },
];

/** Whether the shortcut sheet should say `⌘` rather than `Ctrl`. */
export function isApplePlatform(userAgent: string): boolean {
  return /Mac|iPhone|iPad|iPod/i.test(userAgent);
}

/** Substitutes the platform modifier into a chord for display. */
export function resolveChord(
  chord: readonly string[],
  apple: boolean,
): string[] {
  return chord.map((key) =>
    key === MOD ? (apple ? "⌘" : "Ctrl") : key === "Shift" && apple ? "⇧" : key,
  );
}

/**
 * Whether a keystroke belongs to whatever the user is typing into.
 *
 * Every global shortcut checks this first: inside a text field the browser's
 * own behaviour (undo, `?` as a character) is the correct one.
 */
export function isEditingText(target: EventTarget | null): boolean {
  if (typeof HTMLElement === "undefined") return false;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Whether an event should open the cheatsheet.
 *
 * `?` needs Shift on most layouts but not all — AZERTY and several others put
 * it on an unshifted key — so the printed character is what is tested, not the
 * modifier. Combinations with Ctrl/Cmd/Alt belong to the browser or the OS.
 */
export function isHelpKey(event: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  return event.key === "?";
}
