# Work archive

Edit `works.json` for the shared project list, metadata and preview asset filenames. Run `npm run dev` or `npm run build` to regenerate pages.

The archive template and temporary detail template live in `scripts/build-projects.mjs`. Generated `index.html` files are overwritten by the generator; edit the template instead.

To expand an individual project, add `projects/<slug>/story.html` with the story section HTML. The generator preserves this file and uses it instead of the placeholder text. When publishing a finished detail page, update the generator's robots metadata to allow indexing for completed stories.

Use stable slugs to preserve incoming links. Artwork lives in `assets/projects/`; current previews are concepts. Grid and Index share filtering via `archive.js`; visual styles are scoped in `archive.css`.
