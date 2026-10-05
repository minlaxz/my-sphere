# ADR-0001: One owner for Board / Morph state

Date: 2026-10-05
Status: accepted

## Context

Opening a Board involved three files holding their own copy of "is a board open": `scene.ts` (`boardOpen`, `morphTarget`), `blog.ts` (`openId`), and `main.ts` wiring them together with a pair of callbacks (`onLabelClick` in, `onMorphOut` out) and a nullable `sceneApi` to break the cycle. The panel reveal was a hard-coded 430 ms timer that only coincidentally matched the 1.18 s morph.

## Decision

`src/board-state.ts` is the single owner of the Board state machine: `idle → morphing-in → open → morphing-out → idle`, with `morph` (0..1) advanced by the scene's frame loop via `tick(dt)`. Everyone else subscribes to phase changes or reads the current state. Nobody else stores a copy.

- The scene calls `board.open(id)` on a label click and reads `morph` each frame.
- The panel reacts to phases (`morphing-in` sets classes and ARIA, `open` renders content, `morphing-out` hides).
- The lamp pendant toggles on `isOpen()`.
- `MORPH_DURATION` and `PANEL_REVEAL` live in `board-state.ts` only.

## Consequences

- Timing is derived once. CSS transition durations in `style.css` still hard-code their own values; align them by hand if `MORPH_DURATION` changes.
- The state machine is a pure reducer with node tests (`npm test`). The scene and panel remain untested DOM/WebGL adapters.
- Under `prefers-reduced-motion` the panel reveal is no longer shortened to 60 ms. This is moot today because the scene disables all pointer listeners under reduced motion, so no Board can open. Fixing that belongs to a motion-policy change, not this one.
