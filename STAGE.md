# Stage / Kelir prototype

`stage.js` owns interaction and navigation. Tune `OPEN_DISTANCE` (750px), `CLOSE_SECONDS` and `OPEN_SECONDS` (0.6s each) at the top. Existing homepage animation and cursor code are unchanged.

`public/stage-boot.js` runs before paint, checks session entry and a short-lived destination marker, and holds the initial brown cover until the controller is ready. It fails open after eight seconds if the module cannot load. `stage.css` places the two panels at z-index 20000, above the existing cursor at 10000.

Only same-tab, same-origin links crossing the homepage boundary animate. Homepage section anchors, modified clicks, downloads, external URLs and inner-to-inner links stay native. The destination waits for load/fonts (bounded to three seconds for unavailable external resources), then reveals. Browser Back/Forward restores an unlocked page.

The intro accepts wheel, touch, arrow/page keys, and an Enter/skip button. Tab, Enter or Escape bypass it. Reduced motion bypasses the intro and automatic transitions. Storage failures fall back to ordinary navigation.

To replay the intro, open the homepage in a fresh private browser session or clear `reiandraaStageEntered` in that tab's sessionStorage and refresh. Refresh in an entered session should not replay it.

Validation: `node --test tests/stage.test.mjs` and `npm run build`. Touch events are covered in controller tests; also check swipe feel on a physical phone before final release.

## Refinement

Panels now contain mirrored responsive SVG paths. Their inner edges gather with opening progress and return to fully rectangular coverage at zero, with the existing center overlap retained.

After first-entry completion, a separate handoff state keeps the Hero at zero while consuming the opening input. Wheel events reset a 160ms quiet-gap detector (browsers expose no standard wheel gesture-end event); touch waits for touchend/cancel, and keyboard waits for keyup. This is event-stream separation, not a fixed post-animation pause. Check the quiet-gap setting with physical Mac trackpad hardware before release.
