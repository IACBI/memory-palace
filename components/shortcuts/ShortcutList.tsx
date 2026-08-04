"use client";

import { Fragment } from "react";
import { Kbd } from "@/components/ui/Kbd";
import { useApplePlatform } from "@/lib/hooks/use-apple-platform";
import { SHORTCUT_GROUPS, resolveChord, type Shortcut } from "@/lib/shortcuts";

function ShortcutKeys({ shortcut }: { shortcut: Shortcut }) {
  const apple = useApplePlatform();

  return (
    <span className="flex shrink-0 items-center gap-1">
      {shortcut.chords.map((chord, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <span className="px-0.5 text-[11px] text-muted">or</span>
          ) : null}
          {resolveChord(chord, apple).map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
        </Fragment>
      ))}
    </span>
  );
}

/**
 * The full shortcut reference, grouped by scope.
 *
 * Rendered by both the `?` cheatsheet and the Settings page from the same
 * data, so the two cannot drift.
 */
export function ShortcutList() {
  return (
    <div className="space-y-6">
      {SHORTCUT_GROUPS.map((group) => (
        <section key={group.scope}>
          <h3 className="text-xs tracking-widest text-text uppercase">
            {group.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted">{group.hint}</p>
          <ul className="mt-2.5 space-y-2">
            {group.shortcuts.map((shortcut) => (
              <li
                key={shortcut.label}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <span className="text-muted">{shortcut.label}</span>
                <ShortcutKeys shortcut={shortcut} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
