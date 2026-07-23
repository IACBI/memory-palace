/**
 * Wraps every routed page so it remounts on navigation, giving each screen a
 * quiet rise-and-fade entrance. The animation is neutralised automatically
 * when the user (or their OS) prefers reduced motion — see globals.css.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
