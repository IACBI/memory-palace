import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Highlight } from "@/components/ui/Highlight";
import { searchPalace } from "@/lib/search";
import { makeObject } from "../factories";

function marks(container: HTMLElement): string[] {
  return [...container.querySelectorAll("mark")].map((el) => el.textContent!);
}

describe("Highlight", () => {
  it("renders plain text when nothing matched", () => {
    const { container } = render(
      <Highlight text="Fermentation log" ranges={[]} />,
    );
    expect(container.textContent).toBe("Fermentation log");
    expect(marks(container)).toEqual([]);
  });

  it("marks each range and preserves the surrounding text", () => {
    const { container } = render(
      <Highlight
        text="Fermentation log"
        ranges={[
          { start: 0, end: 7 },
          { start: 13, end: 16 },
        ]}
      />,
    );
    expect(container.textContent).toBe("Fermentation log");
    expect(marks(container)).toEqual(["Ferment", "log"]);
  });

  it("marks a range that runs to the end without dropping characters", () => {
    const { container } = render(
      <Highlight text="log" ranges={[{ start: 0, end: 3 }]} />,
    );
    expect(container.textContent).toBe("log");
    expect(marks(container)).toEqual(["log"]);
  });

  it("ignores ranges that fall outside the text", () => {
    // A title edited after the search ran must not produce sliced nonsense.
    const { container } = render(
      <Highlight text="log" ranges={[{ start: 0, end: 99 }]} />,
    );
    expect(container.textContent).toBe("log");
  });

  it("highlights exactly what the search says it matched", () => {
    const object = makeObject({ title: "The Fermentation log" });
    const [result] = searchPalace("ferment log", [], [object]).objects;

    const { container } = render(
      <Highlight text={object.title} ranges={result.matches} />,
    );
    expect(container.textContent).toBe("The Fermentation log");
    expect(marks(container)).toEqual(["Ferment", "log"]);
  });
});
