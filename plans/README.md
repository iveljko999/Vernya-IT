# Animation plans

Plans produced by the `improve-animations` skill. Each is self-contained — an
executor needs nothing beyond the plan file itself.

| # | Title | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Slow position drift on the dark-theme body gradient](001-dark-gradient-drift.md) | LOW | DONE |

## Execution order

Only one plan exists — no ordering or dependency constraints apply.

## Notes

- Plan 001 touches `css/style.css` only, inside the existing `:root[data-theme="dark"] body` rule plus two new blocks immediately after it. Safe to execute independently of any other in-flight work on the site.
