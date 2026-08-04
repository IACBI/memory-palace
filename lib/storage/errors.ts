/**
 * Thrown when the browser refuses a write because the origin's storage quota
 * is full. Distinguished from other failures so the UI can tell the user their
 * work is no longer being saved instead of failing silently.
 */
export class StorageQuotaError extends Error {
  constructor(cause?: unknown) {
    super("Storage quota exceeded");
    this.name = "StorageQuotaError";
    this.cause = cause;
  }
}

/**
 * Thrown when stored data exists but cannot be read back — unparseable JSON,
 * or a document that no longer matches the schema. Distinguished from "nothing
 * saved yet" so the user can be warned rather than silently starting over.
 */
export class CorruptPalaceError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "CorruptPalaceError";
    this.cause = cause;
  }
}

/**
 * Recognises a quota failure across browsers.
 *
 * Duck-typed rather than `instanceof`-based: `DOMException` is not reliably an
 * `Error` subclass across engines and test environments, and Firefox uses its
 * own error name.
 */
export function isQuotaError(error: unknown): boolean {
  if (error instanceof StorageQuotaError) return true;
  if (typeof error !== "object" || error === null) return false;
  const { name, code } = error as { name?: unknown; code?: unknown };
  return (
    name === "QuotaExceededError" ||
    name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    // Safari private mode historically reported code 22 with a generic name.
    code === 22
  );
}
