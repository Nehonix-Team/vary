# 2.0.1 / 2026 (Nehonix fork)

- Full rewrite in strict TypeScript
- Improved input validation with descriptive error messages (invalid field name is now included in the `TypeError` message)
- Empty-array guard on `field` argument
- `res` validation checks for `getHeader`/`setHeader` duck-typing instead of a plain falsy check
- `parse()` rewritten with explicit character-code constants for readability

  # 1.1.2 / 2017-09-23

- perf: improve header token parsing speed

  # 1.1.1 / 2017-03-20

- perf: hoist regular expression

  # 1.1.0 / 2015-09-29

- Only accept valid field names in the `field` argument
  - Ensures the resulting string is a valid HTTP header value

  # 1.0.1 / 2015-07-08

- Fix setting empty header from empty `field`
- perf: enable strict mode
- perf: remove argument reassignments

  # 1.0.0 / 2014-08-10

- Initial release
