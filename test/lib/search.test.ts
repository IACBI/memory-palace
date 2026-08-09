import { describe, expect, it } from "vitest";
import { mergeRanges, searchPalace, tokenize } from "@/lib/search";
import { makeObject, makeRoom } from "../factories";

describe("searchPalace", () => {
  it("returns nothing for an empty or whitespace query", () => {
    const rooms = [makeRoom({ name: "The Study" })];
    expect(searchPalace("", rooms, [])).toEqual({ rooms: [], objects: [] });
    expect(searchPalace("   ", rooms, [])).toEqual({ rooms: [], objects: [] });
  });

  it("ranks exact title above prefix above substring", () => {
    const exact = makeObject({ title: "log" });
    const prefix = makeObject({ title: "log book" });
    const substring = makeObject({ title: "the captain's log" });

    const { objects } = searchPalace("log", [], [substring, prefix, exact]);
    expect(objects.map((r) => r.object.id)).toEqual([
      exact.id,
      prefix.id,
      substring.id,
    ]);
  });

  it("ranks a title match above a tag match above a content match", () => {
    const byTitle = makeObject({ title: "yeast", content: "", tags: [] });
    const byTag = makeObject({ title: "aaa", content: "", tags: ["yeast"] });
    const byContent = makeObject({
      title: "bbb",
      content: "feed the yeast",
      tags: [],
    });

    const { objects } = searchPalace("yeast", [], [byContent, byTag, byTitle]);
    expect(objects.map((r) => r.object.id)).toEqual([
      byTitle.id,
      byTag.id,
      byContent.id,
    ]);
  });

  it("is case-insensitive", () => {
    const object = makeObject({ title: "Fermentation Log" });
    expect(searchPalace("FERMENTATION", [], [object]).objects).toHaveLength(1);
  });

  it("breaks score ties by most recently updated", () => {
    const older = makeObject({
      title: "log",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const newer = makeObject({
      title: "log",
      updatedAt: "2026-06-01T00:00:00.000Z",
    });
    const { objects } = searchPalace("log", [], [older, newer]);
    expect(objects.map((r) => r.object.id)).toEqual([newer.id, older.id]);
  });

  it("resolves the room name for each object hit, and null when unfiled", () => {
    const room = makeRoom({ id: "r1", name: "The Laboratory" });
    const filed = makeObject({ title: "log", roomId: "r1" });
    const unfiled = makeObject({ title: "log", roomId: "missing" });

    const { objects } = searchPalace("log", [room], [filed, unfiled]);
    const names = new Map(objects.map((r) => [r.object.id, r.roomName]));
    expect(names.get(filed.id)).toBe("The Laboratory");
    expect(names.get(unfiled.id)).toBeNull();
  });

  it("matches rooms on name and description", () => {
    const byName = makeRoom({ name: "Cellar", description: "" });
    const byDescription = makeRoom({
      name: "Attic",
      description: "the cellar door",
    });
    const { rooms } = searchPalace("cellar", [byName, byDescription], []);
    expect(rooms.map((r) => r.room.id)).toEqual([byName.id, byDescription.id]);
  });

  it("matches a link object on its url and a file object on its file name", () => {
    const link = makeObject({
      title: "aaa",
      type: "link",
      url: "https://example.com/brewing",
    });
    const file = makeObject({
      title: "bbb",
      type: "file",
      fileName: "brewing.pdf",
    });
    const { objects } = searchPalace("brewing", [], [link, file]);
    expect(objects).toHaveLength(2);
  });

  it("excludes zero-score entries entirely", () => {
    const miss = makeObject({ title: "aaa", content: "bbb", tags: [] });
    expect(searchPalace("zzz", [], [miss]).objects).toEqual([]);
  });
});

describe("tokenize", () => {
  it("lowercases and splits on any run of whitespace", () => {
    expect(tokenize("  Ferment   LOG\tnotes ")).toEqual([
      "ferment",
      "log",
      "notes",
    ]);
  });

  it("returns nothing for an empty query", () => {
    expect(tokenize("   ")).toEqual([]);
  });
});

describe("mergeRanges", () => {
  it("sorts and coalesces overlapping and touching ranges", () => {
    expect(
      mergeRanges([
        { start: 6, end: 9 },
        { start: 0, end: 3 },
        { start: 2, end: 5 },
      ]),
    ).toEqual([
      { start: 0, end: 5 },
      { start: 6, end: 9 },
    ]);
  });

  it("does not mutate its input", () => {
    const input = [{ start: 0, end: 3 }];
    expect(mergeRanges(input)[0]).not.toBe(input[0]);
  });
});

describe("multi-word queries", () => {
  /** The defect this was written for: the whole query was one substring. */
  it("finds a title whose words each start with a token", () => {
    const object = makeObject({ title: "Fermentation log", content: "" });
    const { objects } = searchPalace("ferment log", [], [object]);
    expect(objects).toHaveLength(1);
  });

  it("requires every token to match, so more words narrow the results", () => {
    const both = makeObject({ title: "Sourdough starter log" });
    const one = makeObject({ title: "Sourdough recipe" });

    expect(searchPalace("sourdough", [], [both, one]).objects).toHaveLength(2);
    const narrowed = searchPalace("sourdough log", [], [both, one]);
    expect(narrowed.objects.map((r) => r.object.id)).toEqual([both.id]);
  });

  it("matches tokens spread across different fields", () => {
    const object = makeObject({
      title: "Fermentation log",
      tags: ["kitchen"],
      content: "",
    });
    expect(
      searchPalace("fermentation kitchen", [], [object]).objects,
    ).toHaveLength(1);
  });

  it("ranks the query as a phrase above the same words reordered", () => {
    const phrase = makeObject({ title: "Fermentation log" });
    const scattered = makeObject({ title: "Log of fermentation" });
    const { objects } = searchPalace(
      "fermentation log",
      [],
      [scattered, phrase],
    );
    expect(objects.map((r) => r.object.id)).toEqual([phrase.id, scattered.id]);
  });

  it("collapses repeated whitespace rather than searching for it", () => {
    const object = makeObject({ title: "Fermentation log" });
    expect(
      searchPalace("  fermentation    log ", [], [object]).objects,
    ).toHaveLength(1);
  });
});

describe("fuzzy fallback", () => {
  it("finds a title when letters are dropped from the query", () => {
    const object = makeObject({ title: "Fermentation", content: "", tags: [] });
    expect(searchPalace("frmnt", [], [object]).objects).toHaveLength(1);
  });

  it("always ranks a fuzzy hit below a record containing the text", () => {
    const real = makeObject({ title: "frm handbook", content: "", tags: [] });
    const fuzzy = makeObject({ title: "Fermentation", content: "", tags: [] });
    const { objects } = searchPalace("frm", [], [fuzzy, real]);
    expect(objects.map((r) => r.object.id)).toEqual([real.id, fuzzy.id]);
  });

  it("does not fuzzy-match tokens shorter than three characters", () => {
    // Otherwise nearly every title is a subsequence of nearly every query.
    const object = makeObject({ title: "Fermentation", content: "", tags: [] });
    expect(searchPalace("fn", [], [object]).objects).toEqual([]);
  });
});

describe("match ranges", () => {
  it("reports where in the title each token matched", () => {
    const object = makeObject({ title: "Fermentation log" });
    const [result] = searchPalace("log", [], [object]).objects;
    expect(result.matches).toEqual([{ start: 13, end: 16 }]);
  });

  it("reports one range per token, in order", () => {
    const object = makeObject({ title: "Fermentation log" });
    const [result] = searchPalace("log ferment", [], [object]).objects;
    expect(result.matches).toEqual([
      { start: 0, end: 7 },
      { start: 13, end: 16 },
    ]);
  });

  it("reports ranges for room names too", () => {
    const room = makeRoom({ name: "The Laboratory", description: "" });
    const [result] = searchPalace("lab", [room], []).rooms;
    expect(result.matches).toEqual([{ start: 4, end: 7 }]);
  });

  it("reports no ranges for a fuzzy hit, so nothing misleading is marked", () => {
    const object = makeObject({ title: "Fermentation", content: "", tags: [] });
    const [result] = searchPalace("frmnt", [], [object]).objects;
    expect(result.matches).toEqual([]);
  });

  it("indexes the original casing, not the lowercased copy", () => {
    const object = makeObject({ title: "The FERMENTATION Log" });
    const [result] = searchPalace("fermentation", [], [object]).objects;
    const { start, end } = result.matches[0];
    expect(object.title.slice(start, end)).toBe("FERMENTATION");
  });
});

describe("the folded-text cache", () => {
  /**
   * Fields are lowercased once per record and kept, keyed by identity. That is
   * only sound because the store replaces a record on every edit — so these
   * pin the assumption rather than the optimisation.
   */
  it("does not serve a stale result for an edited record", () => {
    const before = makeObject({ title: "Fermentation log", tags: [] });
    expect(searchPalace("kimchi", [], [before]).objects).toHaveLength(0);

    const after = { ...before, title: "Kimchi log" };
    expect(searchPalace("kimchi", [], [after]).objects).toHaveLength(1);
    // The original object is untouched and still does not match.
    expect(searchPalace("kimchi", [], [before]).objects).toHaveLength(0);
  });

  it("keeps records apart rather than folding one over another", () => {
    const study = makeRoom({ name: "The Study", description: "quiet" });
    const lab = makeRoom({ name: "The Laboratory", description: "loud" });

    expect(
      searchPalace("quiet", [study, lab], []).rooms.map((r) => r.room.id),
    ).toEqual([study.id]);
    expect(
      searchPalace("loud", [study, lab], []).rooms.map((r) => r.room.id),
    ).toEqual([lab.id]);
  });

  it("searches every field of a record it has already folded", () => {
    const object = makeObject({
      title: "Notes",
      content: "Sourdough starter",
      tags: ["Baking"],
      url: "https://example.com/Levain",
    });

    // Fold it once on the title, then reach for each cached field in turn.
    expect(searchPalace("notes", [], [object]).objects).toHaveLength(1);
    for (const query of ["sourdough", "baking", "levain"]) {
      expect(searchPalace(query, [], [object]).objects).toHaveLength(1);
    }
  });
});
