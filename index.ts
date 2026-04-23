/*!
 * xypriss-vary
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * Copyright(c) 2026 Nehonix Team
 * MIT Licensed
 */

import { ServerResponse } from "http";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * RegExp matching a valid HTTP field-name as defined in RFC 7230 §3.2.
 *
 * A field-name is a token composed of visible ASCII characters excluding
 * delimiters.  The wildcard `*` is handled separately and is **not** matched
 * by this expression.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7230#section-3.2
 * @internal
 */
const FIELD_NAME_REGEXP = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Add one or more field names to the `Vary` response header.
 *
 * - If the header is already `*`, nothing changes (wildcard already covers
 *   all fields).
 * - If `field` contains `*`, the header is set to `*` unconditionally.
 * - Duplicate field names (case-insensitive) are silently skipped.
 *
 * @example
 * ```ts
 * import http from "http";
 * import vary from "xypriss-vary";
 *
 * http.createServer((req, res) => {
 *   vary(res, "Accept-Encoding");
 *   vary(res, ["Accept", "User-Agent"]);
 *
 *   res.statusCode = 200;
 *   res.end("OK");
 * }).listen(3000);
 * ```
 *
 * @param res   - The active `ServerResponse` to mutate.
 * @param field - A single field name, a comma-separated string of field names,
 *                or an array of field names.
 *
 * @throws {TypeError} If `res` is missing or does not expose `getHeader`/`setHeader`.
 * @throws {TypeError} If `field` is falsy.
 * @throws {TypeError} If any field name is invalid per RFC 7230 §3.2.
 *
 * @public
 */
export default function vary(
  res: ServerResponse,
  field: string | string[],
): void {
  if (
    !res ||
    typeof res.getHeader !== "function" ||
    typeof res.setHeader !== "function"
  ) {
    throw new TypeError(
      "argument res is required and must expose getHeader and setHeader",
    );
  }

  // Normalise the existing Vary value to a plain string.
  const raw = res.getHeader("Vary") ?? "";
  const existing = Array.isArray(raw) ? raw.join(", ") : String(raw);

  const next = append(existing, field);

  if (next) {
    res.setHeader("Vary", next);
  }
}

/**
 * Append one or more field names to an existing `Vary` header string.
 *
 * This function is **pure** — it does not touch any `ServerResponse` and is
 * safe to use in contexts where you only need to manipulate the header value
 * as a string (e.g. unit tests, proxies, string-based header builders).
 *
 * Rules applied:
 * 1. If `header` is already `*`, it is returned unchanged.
 * 2. If any value in `field` is `*`, `"*"` is returned immediately.
 * 3. Field names already present (case-insensitive) are not duplicated.
 * 4. New field names are appended in the order provided, preserving their
 *    original casing.
 *
 * @example
 * ```ts
 * import { append } from "xypriss-vary";
 *
 * append("Accept, User-Agent", "Origin");
 * // → "Accept, User-Agent, Origin"
 *
 * append("Accept", ["Accept", "Cookie"]);
 * // → "Accept, Cookie"   (Accept already present — skipped)
 *
 * append("Accept", "*");
 * // → "*"
 * ```
 *
 * @param header - The current `Vary` header value (may be an empty string).
 * @param field  - Field name(s) to append.  Accepts a single name, a
 *                 comma-separated string, or an array.
 * @returns The updated header string.
 *
 * @throws {TypeError} If `header` is not a string.
 * @throws {TypeError} If `field` is falsy or an empty array.
 * @throws {TypeError} If any field name is invalid per RFC 7230 §3.2.
 *
 * @public
 */
export function append(header: string, field: string | string[]): string {
  if (typeof header !== "string") {
    throw new TypeError("argument header must be a string");
  }

  if (!field || (Array.isArray(field) && field.length === 0)) {
    throw new TypeError("argument field is required");
  }

  // Normalise to an array of individual field names.
  const fields: string[] = Array.isArray(field) ? field : parse(String(field));

  // Validate every field name before mutating anything.
  for (const f of fields) {
    if (f !== "*" && !FIELD_NAME_REGEXP.test(f)) {
      throw new TypeError(
        `field argument contains an invalid header name: "${f}"`,
      );
    }
  }

  // Wildcard already set — nothing to do.
  if (header === "*") {
    return header;
  }

  // Any wildcard in the incoming fields wins immediately.
  if (fields.includes("*")) {
    return "*";
  }

  // Build the updated value, skipping duplicates (case-insensitive).
  const existing = parse(header.toLowerCase());
  let val = header;

  for (const f of fields) {
    if (!existing.includes(f.toLowerCase())) {
      existing.push(f.toLowerCase());
      val = val ? `${val}, ${f}` : f;
    }
  }

  return val;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Parse a comma-separated `Vary` header value into an array of trimmed tokens.
 *
 * The parser is a single-pass character scanner that avoids allocating
 * intermediate strings for whitespace and correctly handles multiple spaces
 * between tokens.
 *
 * @example
 * ```ts
 * parse("Accept,  User-Agent , Origin");
 * // → ["Accept", "User-Agent", "Origin"]
 * ```
 *
 * @param header - Raw `Vary` header string.
 * @returns Array of non-empty, trimmed field-name tokens.
 *
 * @internal
 */
function parse(header: string): string[] {
  const list: string[] = [];
  let start = 0;
  let end = 0;

  for (let i = 0, len = header.length; i < len; i++) {
    const code = header.charCodeAt(i);

    if (code === 0x20 /* SPACE */) {
      // Advance both cursors past leading/trailing whitespace.
      if (start === end) {
        start = end = i + 1;
      }
    } else if (code === 0x2c /* COMMA */) {
      list.push(header.substring(start, end));
      start = end = i + 1;
    } else {
      end = i + 1;
    }
  }

  // Capture the final token.
  list.push(header.substring(start, end));

  return list.filter(Boolean);
}
