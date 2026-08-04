import { describe, expect, it } from "vitest";
import { isSafeHref, normaliseHref } from "@/lib/storage/url";

describe("isSafeHref", () => {
  it.each([
    "https://example.com",
    "http://example.com/path?q=1#frag",
    "mailto:someone@example.com",
    "HTTPS://EXAMPLE.COM",
  ])("accepts %s", (value) => {
    expect(isSafeHref(value)).toBe(true);
  });

  it.each([
    ["javascript", "javascript:alert(1)"],
    ["uppercase javascript", "JavaScript:alert(1)"],
    ["data", "data:text/html,<script>alert(1)</script>"],
    ["blob", "blob:https://example.com/uuid"],
    ["vbscript", "vbscript:msgbox(1)"],
    ["file", "file:///etc/passwd"],
  ])("rejects %s", (_label, value) => {
    expect(isSafeHref(value)).toBe(false);
  });

  it("rejects a scheme hidden behind control characters", () => {
    // URL parsers strip these, turning it back into `javascript:`.
    expect(isSafeHref("java\tscript:alert(1)")).toBe(false);
    expect(isSafeHref("java\nscript:alert(1)")).toBe(false);
    expect(isSafeHref("\u0000javascript:alert(1)")).toBe(false);
  });

  it("rejects empty and missing values", () => {
    expect(isSafeHref(undefined)).toBe(false);
    expect(isSafeHref("")).toBe(false);
    expect(isSafeHref("   ")).toBe(false);
  });

  it("tolerates surrounding whitespace on an otherwise safe URL", () => {
    expect(isSafeHref("  https://example.com  ")).toBe(true);
  });

  it("treats a scheme-less value as safe — it resolves to our own origin", () => {
    expect(isSafeHref("example.com")).toBe(true);
    expect(isSafeHref("not a url at all")).toBe(true);
  });
});

describe("normaliseHref", () => {
  it("upgrades a bare host to https", () => {
    expect(normaliseHref("example.com")).toBe("https://example.com");
    expect(normaliseHref("example.com/path")).toBe("https://example.com/path");
  });

  it("leaves an explicit scheme alone", () => {
    expect(normaliseHref("http://example.com")).toBe("http://example.com");
    expect(normaliseHref("mailto:a@b.com")).toBe("mailto:a@b.com");
  });

  it("does not invent a host out of prose", () => {
    expect(normaliseHref("not a url at all")).toBe("not a url at all");
  });

  it("returns null for anything unsafe", () => {
    expect(normaliseHref("javascript:alert(1)")).toBeNull();
    expect(normaliseHref("data:text/html,x")).toBeNull();
    expect(normaliseHref(undefined)).toBeNull();
  });
});
