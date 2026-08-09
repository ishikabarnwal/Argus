# Vendored fonts

## general-sans-variable.woff2

**General Sans**, by the Indian Type Foundry — <https://www.fontshare.com/fonts/general-sans>

Variable, one axis: `wght` 200–700. Upright only; the italic file is not
vendored because nothing here sets italic display type.

Licensed under the **ITF Free Font License**, which permits self-hosting and
commercial use — <https://www.fontshare.com/licenses/itf-ffl>

### Why this one is vendored and the other three are not

Inter and JetBrains Mono install from `@fontsource-variable`, which is the
better mechanism: npm handles versioning, and the packages ship per-subset
files with `unicode-range` so a browser only downloads the subsets it needs.

General Sans is a Fontshare font, not a Google font, and has no npm package.
Fontshare serves it from a CDN behind opaque hashed URLs that carry no version
in them, so linking to it would put a third-party request in front of first
paint and break the project's no-CDN-at-runtime rule. Committing the file is
the only way to self-host it.

The consequence to know about: this is one file covering the whole character
set, so there is no `unicode-range` splitting. At 38 KB that is still well
under what Bricolage Grotesque cost across its three subset files (207 KB), so
it is a saving rather than a compromise.

To update it, re-download the `woff2` from the Fontshare CSS API and replace
this file — the `@font-face` in `src/styles/typography.css` points at it by
path and needs no change:

    curl "https://api.fontshare.com/v2/css?f%5B%5D=general-sans@1"
