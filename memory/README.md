# Playground memory

What we learn while working, kept current. Committed with the work, so git history is the archive: update notes in place and delete what is no longer true.

| File | Holds |
| --- | --- |
| [preferences.md](preferences.md) | The designer's taste and working preferences. Read at every session start, so keep it short (under 60 lines). |
| [ideas.md](ideas.md) | Ideas not built yet, with the date and the designer's words. |
| [experiments.md](experiments.md) | One section per experiment: brief, decisions, favourite commits, status. |
| [lessons.md](lessons.md) | Technical lessons and gotchas (TSL, performance, projection). |
| [moodboard/board.json](moodboard/board.json) | Mood board items (links, media, text, assets) with dates and descriptions. Use `npm run -s mood`, never hand-edit. |

## Rules

- One fact per bullet, dated (`2026-11-04`) when it may change. Quote the designer's words when the wording matters.
- Update in place. Remove a bullet that turned out wrong instead of adding a contradicting one.
- Link experiments by scene name (`src/scenes/<name>.ts`) and commits by short hash or tag.
- No secrets, no personal details beyond working preferences.
