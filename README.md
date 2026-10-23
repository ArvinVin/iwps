# IWPS · Indonesia Arena

Interactive 3D seat and POV simulator for Indonesia World Padel Show, 30 January 2027. Built with React, Vite and Three.js. Fonts are bundled locally.

## Development

Requires Node.js 20.19+ or 22.12+ (developed with Node 24).

```sh
npm ci
npm run dev
```

`npm run build` produces a static site in `dist/`, suitable for Cloudflare Pages (build command `npm run build`, output `dist`). `npm run preview` serves the production build.

## Features

- Orbit, top-down and seated POV camera modes; direct seat picking.
- Seven ticket categories, A/B blocks, row and seat selection.
- Shareable state: `?zone=gold&blk=B&row=6&seat=20&view=pov`.
- Eye-to-court centre and edge distances, and eye elevation, in metres.
- Mobile seat drawer, keyboard-accessible controls, reduced-motion camera transitions.
- 2D category map and working seat controls when WebGL is unavailable.

## Model accuracy

`src/model.js` is the source of truth for dimensions, categories, seat layout and measurements. The supplied floor envelope is 77 × 47 m and the padel court is 20 × 10 m. Bowl shape, seat numbering, block orientation, upper-gallery openings and zone placements are illustrative interpretations, not official venue data. The rounded rectangular bowl encloses the entire floor envelope. Rows offset along its outward normal by 0.85 m, rise 0.40 m, with an additional 1.20 m at each gallery transition. Seated eye height is 1.20 m. VIP rows sit on the floor. Seats are evenly distributed by sampled arc length with nominal 0.55 m pitch; their generated count is not the venue's published capacity.

All seats and geometry share the same metre-based coordinates. Distances are mathematically consistent with this model; actual venue accuracy requires a surveyed seating plan. The standard camera has a 44° vertical field of view. Spectator heads, standing audiences and event-specific obstructions are not simulated. Phase 1 prices are transcribed from the supplied poster and are not a ticket availability feed.

## Validation

```sh
npm test
npx playwright test
```

Browser checks use `/usr/bin/chromium` when available, otherwise install Playwright Chromium with `npx playwright install chromium`. They cover deep links, seat selection, POV transitions, mobile controls and WebGL fallback.
