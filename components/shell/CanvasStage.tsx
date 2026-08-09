/**
 * A route whose content *is* the canvas.
 *
 * The graph, a room and the floor plan are the three screens that show a place
 * rather than describe one, and all three used to sit in the same padded,
 * width-capped column as the reading routes — a `64vh` box under a heading,
 * with the interesting part occupying maybe a third of the window. This gives
 * them exactly what is left of the viewport instead, and the chrome that used
 * to push them down floats over them.
 *
 * Sized against `--shell-header` rather than a repeated `4rem`, so the top
 * bar's height and every canvas that has to fit beneath it are one number.
 * Immersive mode sets that token to zero (see `app/globals.css`), which is the
 * whole of how the canvas grows to the full window.
 *
 * `svh`, not `vh`: on a phone `100vh` is the *largest* the viewport gets, so a
 * `100vh - 4rem` canvas overflows behind the browser's own bar and the page
 * scrolls a little in a way nothing on screen explains.
 *
 * A Server Component. Every route's static HTML has to contain the real
 * interface, not a client boundary around a spinner.
 */
export function CanvasStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[calc(100svh-var(--shell-header))] w-full overflow-hidden">
      {children}
    </div>
  );
}
