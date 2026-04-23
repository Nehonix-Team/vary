# XyPriss Vary Manipulation — `xypriss-vary`

> [!NOTE]
> **Internalized Fork**: This module is a strictly typed TypeScript port of the original `vary` library. It has been internalized into the XyPriss ecosystem to reduce external dependency surfaces and ensure architectural consistency within XyPriss framework plugins.

---

## Overview

`xypriss-vary` provides utilities to safely build and manipulate the HTTP `Vary` response header. It handles deduplication, wildcard semantics, and RFC 7230 field-name validation so your middleware never produces a malformed `Vary` value.

---

## Installation

```sh
xfpm install xypriss-vary
```

---

## Usage

### Basic — mark a response as varying on one field

```typescript
import http from "http";
import vary from "xypriss-vary";

http
  .createServer((req, res) => {
    vary(res, "Accept-Encoding");

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("Operational");
  })
  .listen(3000);
```

### Multiple fields at once

```typescript
vary(res, ["Accept", "User-Agent", "Origin"]);
// Vary: Accept, User-Agent, Origin
```

### Calling vary multiple times (duplicates are skipped)

Multiple calls on the same `res` are safe. Fields already present in the header (case-insensitive) are silently ignored.

```typescript
vary(res, "Accept");
vary(res, "Accept"); // no-op — already present
vary(res, "accept"); // no-op — case-insensitive match
// Vary: Accept
```

### Wildcard

```typescript
vary(res, "*");
// Vary: *   (signals the response is uncacheable)
```

Once `*` is set, any further `vary()` calls on the same response are no-ops.

---

## Low-level `append`

Use `append` when you need to manipulate the header value as a plain string, without touching a `ServerResponse` directly (useful in unit tests, proxies, or string-based header pipelines).

```typescript
import { append } from "xypriss-vary";

append("Accept, User-Agent", "Origin");
// → "Accept, User-Agent, Origin"

append("Accept", ["Accept", "Cookie"]);
// → "Accept, Cookie"   (Accept already present — skipped)

append("Accept", "*");
// → "*"

append("*", "Origin");
// → "*"   (wildcard already set — unchanged)
```

---

## API

### `vary(res, field)`

| Parameter | Type                 | Description                                                                |
| --------- | -------------------- | -------------------------------------------------------------------------- |
| `res`     | `ServerResponse`     | The active HTTP response to mutate.                                        |
| `field`   | `string \| string[]` | A single field name, a comma-separated string, or an array of field names. |

**Returns** `void`.

**Throws**

- `TypeError` — if `res` is falsy or does not expose `getHeader`/`setHeader`.
- `TypeError` — if `field` is falsy or an empty array.
- `TypeError` — if any field name is invalid per RFC 7230 §3.2 (with the offending name included in the message).

---

### `append(header, field)` _(named export)_

| Parameter | Type                 | Description                                           |
| --------- | -------------------- | ----------------------------------------------------- |
| `header`  | `string`             | Current `Vary` header value (may be an empty string). |
| `field`   | `string \| string[]` | Field name(s) to append.                              |

**Returns** `string` — the updated header value.

**Throws**

- `TypeError` — if `header` is not a string.
- `TypeError` — if `field` is falsy or an empty array.
- `TypeError` — if any field name is invalid per RFC 7230 §3.2.

---

## Error Handling

All validation happens **before** any mutation, so a `TypeError` on an invalid field name leaves the response header untouched.

```typescript
try {
  vary(res, "invalid header!"); // space and ! are not allowed
} catch (e) {
  // TypeError: field argument contains an invalid header name: "invalid header!"
  // res Vary header is unchanged
}
```

---

## Technical Implementation

- **Strict TypeScript port** — no runtime dependencies; full compile-time safety.
- **Pure `append` function** — decoupled from `ServerResponse`, independently testable.
- **Single-pass parser** — the internal `parse()` function scans the header string once using character codes, with no regex and no intermediate allocations.
- **Validation before mutation** — all field names are validated upfront; a bad name aborts the entire call without partial side effects.
- **RFC 7230 §3.2 compliant** — field-name validation enforces the token character set exactly.

---

## Changelog

See [HISTORY.md](./HISTORY.md) for a detailed list of changes and security fixes.
