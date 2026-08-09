import { cn } from "@/lib/cn";

/**
 * The recurring raised surface: dashboard panels, room chambers, object cards,
 * library rows.
 *
 * This markup was previously copy-pasted into four screens, which is how three
 * of them ended up with slightly different hover treatments. Server-renderable
 * — no hooks, no handlers.
 */
export function Card({
  as: Tag = "div",
  interactive = false,
  className,
  children,
  ...props
}: {
  as?: "div" | "li" | "article" | "section";
  /** Adds the hover lift. Only for cards that are themselves a link or button. */
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={cn(
        "rounded-lg border border-border-hair bg-surface transition-quiet",
        // Depth only — no transform. A card that moves on hover drags its
        // text through a subpixel repaint on every frame, and there are up to
        // a few dozen of these on a screen.
        interactive &&
          "hover:border-border-strong hover:bg-surface-2 hover:shadow-raise",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
