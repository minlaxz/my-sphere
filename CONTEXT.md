# Domain glossary

Terms used in code, issues, and commits. One word, one meaning.

- **Sphere**: the particle cloud at the centre of the page. Idle state of the scene.
- **Label**: one of the five orbiting sprites (`idea`, `about`, `github`, `linkedin`, `blog`). Defined in `src/labels.ts`. Clicking a label opens its Board.
- **Board**: the flat square the Sphere morphs into, plus the panel shown on top of it. One Board per Label. The `blog` Board lists Posts; every other Board shows a single article.
- **Morph**: the transition between Sphere and Board, a number from 0 (sphere) to 1 (board). Takes `MORPH_DURATION` seconds each way.
- **Phase**: where the Board state machine is: `idle`, `morphing-in`, `open`, `morphing-out`. Owned by `src/board-state.ts`. "Open" means the panel is revealed, which happens at `PANEL_REVEAL` of the Morph, not at the end.
- **Post**: one blog entry in `src/labels.ts` (`POSTS`). Searchable by title, summary, tags.
- **Lamp**: the pendant light and halo ring above the Sphere. Its output follows interaction and latches to full while a Board is open.

Avoid: "modal", "overlay", "panel" as a synonym for Board (panel is only the DOM element inside a Board); "animation" for Morph.
