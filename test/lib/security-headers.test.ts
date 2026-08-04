import { describe, expect, it } from "vitest";
import {
  contentSecurityPolicy,
  metaContentSecurityPolicy,
  securityHeaders,
} from "@/lib/security-headers";

const directives = (policy: string) =>
  new Map(
    policy.split(";").map((part) => {
      const [name, ...rest] = part.trim().split(/\s+/);
      return [name, rest.join(" ")];
    }),
  );

describe("content security policy", () => {
  it("locks every fetch directive to our own origin", () => {
    const found = directives(contentSecurityPolicy());
    for (const name of ["default-src", "connect-src", "font-src"]) {
      expect(found.get(name)).toBe("'self'");
    }
  });

  it("forbids plugins and a rewritten base URI", () => {
    const found = directives(contentSecurityPolicy());
    expect(found.get("object-src")).toBe("'none'");
    expect(found.get("base-uri")).toBe("'self'");
  });

  it("blocks framing in the header form", () => {
    expect(directives(contentSecurityPolicy()).get("frame-ancestors")).toBe(
      "'none'",
    );
  });

  it("omits frame-ancestors from the meta form, which ignores it", () => {
    // Leaving it in would imply a protection the browser does not apply.
    expect(metaContentSecurityPolicy()).not.toContain("frame-ancestors");
  });

  it("never allows a remote script origin", () => {
    const scriptSrc = directives(contentSecurityPolicy()).get("script-src")!;
    expect(scriptSrc).not.toMatch(/https?:\/\//);
    expect(scriptSrc).not.toContain("*");
  });

  it("keeps the two forms otherwise identical", () => {
    const header = directives(contentSecurityPolicy());
    const meta = directives(metaContentSecurityPolicy());
    header.delete("frame-ancestors");
    expect([...meta.entries()].sort()).toEqual([...header.entries()].sort());
  });
});

describe("security headers", () => {
  const byKey = new Map(securityHeaders().map((h) => [h.key, h.value]));

  it.each([
    ["Content-Security-Policy", /default-src/],
    ["X-Content-Type-Options", /^nosniff$/],
    ["X-Frame-Options", /^DENY$/],
    ["Referrer-Policy", /^no-referrer$/],
    ["Permissions-Policy", /camera=\(\)/],
  ])("sends %s", (key, pattern) => {
    expect(byKey.get(key)).toMatch(pattern);
  });
});
