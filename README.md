# XyPriss Vary Manipulation (xypriss-vary)

> [!NOTE]
> **Internalized Fork**: This module is a strictly typed TypeScript port of the original `vary` library. It has been internalized into the XyPriss ecosystem to reduce external dependency surfaces and ensure architectural consistency within XyPriss framework plugins.

## Overview

The `xypriss-vary` module provides utilities to manipulate the HTTP `Vary` header of a response. It ensures that header fields are appended correctly and that the `*` (asterisk) value is handled according to RFC standards.

## Installation

This module is distributed and managed via the XyPriss Package Manager.

```sh
xfpm install xypriss-vary
```

## Usage

Integrate the manipulation logic using ESM syntax.

```typescript
import http from "http";
import vary from "xypriss-vary";

http
  .createServer((req, res) => {
    // Mark that the response varies based on the User-Agent header
    vary(res, "User-Agent");

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("Operational");
  })
  .listen(3000);
```

### Low-level Append

You can also use the `append` function to manipulate header strings directly.

```typescript
import { append } from "xypriss-vary";

const header = "Accept, User-Agent";
const newVal = append(header, "Origin");
// newVal -> "Accept, User-Agent, Origin"
```

## Technical Implementation

- **Strict TypeScript Port**: Built from the ground up utilizing native TypeScript for optimal IDE support and compile-time safety.
- **Deterministic Token Parsing**: Implements a highly optimized, single-pass parser for `Vary` header tokens.
- **RFC Compliance**: Strictly follows field-name validation as per RFC 7230.

## License Declarations

Copyright © 2014-2017 Douglas Christopher Wilson  
Copyright © 2026 Nehonix Team  
Released under the MIT License.
