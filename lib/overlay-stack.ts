/**
 * A LIFO stack of dismissable overlays sharing one window-level key listener.
 *
 * Overlays used to each listen for Escape themselves, some on `window` and
 * some via React synthetic events from a portal. Those do not compose: with a
 * confirmation dialog open on top of the object editor, one Escape could close
 * both. Routing every Escape to the top of this stack makes the behaviour
 * deterministic, and testable without simulating portal event routing.
 */

type DismissHandler = () => void;

const stack: DismissHandler[] = [];
let listening = false;

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key !== "Escape" || event.isComposing) return;
  const top = stack[stack.length - 1];
  if (!top) return;
  event.preventDefault();
  event.stopPropagation();
  top();
}

/**
 * Registers `handler` as the topmost overlay. Returns an unregister function;
 * call it on unmount or when the overlay closes.
 */
export function pushOverlay(handler: DismissHandler): () => void {
  stack.push(handler);
  if (!listening && typeof window !== "undefined") {
    // Capture phase, so the top overlay wins before anything below it reacts.
    window.addEventListener("keydown", handleKeyDown, true);
    listening = true;
  }
  return () => {
    const index = stack.lastIndexOf(handler);
    if (index !== -1) stack.splice(index, 1);
    if (stack.length === 0 && listening && typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKeyDown, true);
      listening = false;
    }
  };
}

/** Number of overlays currently open. Exposed for tests. */
export function overlayDepth(): number {
  return stack.length;
}

/** Clears the stack. Test-only escape hatch. */
export function resetOverlayStack(): void {
  stack.length = 0;
  if (listening && typeof window !== "undefined") {
    window.removeEventListener("keydown", handleKeyDown, true);
    listening = false;
  }
}
