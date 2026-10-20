# Work archive

Edit `works.json` for the shared project list, metadata and preview asset filenames. Run `npm run dev` or `npm run build` to regenerate pages.

The archive template and temporary detail template live in `scripts/build-projects.mjs`. Generated `index.html` files are overwritten by the generator; edit the template instead.

To expand an individual project, add `projects/<slug>/story.html` with the story section HTML. The generator preserves this file and uses it instead of the placeholder text. When publishing a finished detail page, update the generator's robots metadata to allow indexing for completed stories.

Use stable slugs to preserve incoming links. Artwork lives in `assets/projects/`; current previews are concepts. Grid and Index share filtering via `archive.js`; visual styles are scoped in `archive.css`.

Completed projects can provide `projects/<slug>/product.html` for their full authored content. These pages are indexable and do not show the placeholder story. The non-REI pages use shared editorial styles in `archive.css`; video buttons use `media.js` to load a YouTube privacy-enhanced player only after a visitor clicks. Keep the external video link as a fallback.

`works.json` supports `previewCaption`, `previewAlt`, and a null year for an unconfirmed date. PosturKu links to the Indonesian Figma prototype. Sisa Waktu Bersama is the single Poseid music entry, with the graduation credits, duo photo, and solo guitar clip together.

## Drowsiness camera demo

The original Android presentation remains at `/projects/drowsiness-detector/`. A separate new demo is at `/projects/drowsiness-detector/demo/`, with its own Vite entry. Its matching Python/browser source and automated tests are at https://github.com/Reiandraa/drowsiness-detector-demo . Preserve the MIT license and SOURCES.md attribution when syncing the seven demo files.

The guided sample uses synthetic measurements without a camera or model download. Camera inference runs in a classic worker, bundled by Vite, with MediaPipe 1.1.1 and a checksum-verified Google model. Frames are never recorded or uploaded. Capture is opt-in and releases on Stop, page exit, or tab hiding. The model-only check processes a blank frame and does not request a camera. A live Mac camera trial is still pending; successful model checks do not validate fatigue detection or driving safety.

## REI product page and browser demo

REI uses `rei/product.html` and `rei/product.css` instead of the generic concept
detail page. Edit those sources, then regenerate with `node scripts/build-projects.mjs`.
Its published product page is indexable; other unfinished concept details retain
their existing noindex metadata.

The independent demo is at `/projects/rei/demo/`. Its Vite entry is included in
`vite.config.js`. It uses fictional, bundled messages and prewritten summaries.
It does not import the desktop app, contact a model, connect email, accept keys,
or persist data. All changes disappear on reset or refresh. Do not add real
inbox exports, personal data, credentials, or native profile files.

Demo interaction tests use Node's test runner and jsdom 25. With jsdom installed
in the development environment, run:

```sh
node --test projects/rei/demo/demo.test.mjs tests/stage.test.mjs
```

For an existing external jsdom install, set `REI_DEMO_TEST_PACKAGE` to that
project's absolute `package.json` path. This is a test-only module-resolution
override; the production demo has no dependencies.

Before deploying, run the normal `npm ci` and `npm run build` for this site's
locked toolchain, check desktop and mobile layouts, and verify both trailing-
slash routes on the existing host. The local offline compatibility build is
not a substitute for the host's Vite 8 build.
