/*!
 * xypriss-vary
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * Copyright(c) 2026 Nehonix Team
 * MIT Licensed
 */

import { ServerResponse } from "http";

/**
 * RegExp to match field-name in RFC 7230 sec 3.2
 */
const FIELD_NAME_REGEXP = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

/**
 * Mark that a request is varied on a header field.
 *
 * @param {ServerResponse} res
 * @param {string | string[]} field
 * @public
 */
export default function vary(
  res: ServerResponse,
  field: string | string[],
): void {
  if (!res || !res.getHeader || !res.setHeader) {
    throw new TypeError("res argument is required");
  }

  // get existing header
  const val = res.getHeader("Vary") || "";
  const header = Array.isArray(val) ? val.join(", ") : String(val);

  // set new header
  const newVal = append(header, field);
  if (newVal) {
    res.setHeader("Vary", newVal);
  }
}

/**
 * Append a field to a vary header.
 *
 * @param {string} header
 * @param {string | string[]} field
 * @return {string}
 * @public
 */
export function append(header: string, field: string | string[]): string {
  if (typeof header !== "string") {
    throw new TypeError("header argument is required");
  }

  if (!field) {
    throw new TypeError("field argument is required");
  }

  // get fields array
  const fields = !Array.isArray(field) ? parse(String(field)) : field;

  // assert on invalid field names
  for (let j = 0; j < fields.length; j++) {
    if (!FIELD_NAME_REGEXP.test(fields[j])) {
      throw new TypeError("field argument contains an invalid header name");
    }
  }

  // existing, unspecified vary
  if (header === "*") {
    return header;
  }

  // enumerate current values
  let val = header;
  const vals = parse(header.toLowerCase());

  // unspecified vary
  if (fields.indexOf("*") !== -1 || vals.indexOf("*") !== -1) {
    return "*";
  }

  for (let i = 0; i < fields.length; i++) {
    const fld = fields[i].toLowerCase();

    // append value (case-preserving)
    if (vals.indexOf(fld) === -1) {
      vals.push(fld);
      val = val ? val + ", " + fields[i] : fields[i];
    }
  }

  return val;
}

/**
 * Parse a vary header into an array.
 *
 * @param {string} header
 * @return {string[]}
 * @private
 */
function parse(header: string): string[] {
  let end = 0;
  const list: string[] = [];
  let start = 0;

  // gather tokens
  for (let i = 0, len = header.length; i < len; i++) {
    switch (header.charCodeAt(i)) {
      case 0x20 /*   */:
        if (start === end) {
          start = end = i + 1;
        }
        break;
      case 0x2c /* , */:
        list.push(header.substring(start, end));
        start = end = i + 1;
        break;
      default:
        end = i + 1;
        break;
    }
  }

  // final token
  list.push(header.substring(start, end));

  return list.filter(Boolean);
}
