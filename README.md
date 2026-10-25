# ValueGram Profit

**Activity is gray. Value is gold.** A 14-scene animated presentation of the ValueGram Profit algorithm: what every decision is worth before you choose, and what it delivered afterward.

- **Live presentation:** https://keevin227.github.io/Profit/
- **PDF backup:** [site/ValueGram-Profit.pdf](site/ValueGram-Profit.pdf)
- **Concept and plan:** [docs/VISUAL-CONCEPT-AND-PLAN.md](docs/VISUAL-CONCEPT-AND-PLAN.md)

## The idea

The deck is one continuous living world, not a set of slides. One visual rule runs through all of it:

| What you see | What it means |
|---|---|
| Gray particles | Activity: tasks, effort, work completed |
| Gates | Limits on the business; the glowing one is the binding limit |
| Hollow gold | Modeled value, expected but not yet proven |
| Solid gold | Proven value, recorded in the books |
| The ValueGram line | The business's economic heartbeat: flat means no value created |
| Ice blue | The instruments (AI and statistics), never the money |

## Presenting

| Key | Action |
|---|---|
| `→` `Space` `Enter` / click | Next step |
| `←` / click on the left third | Previous step |
| `↑` `↓` `A` | Live control on scene 5 (utilization, approvals) |
| `F` | Fullscreen |
| `S` | Sound on/off (off by default) |
| `P` | Presenter window with notes, timer and next scene |
| `Home` / `End` | First / last scene |
| `?` | Help |

Deep links open any moment directly: `#4` is the reveal, `#4.2` is the flatline. Swipe works on touch screens.

Run locally:

```sh
cd site && python3 -m http.server 8000   # open http://localhost:8000
```

## Structure

```
site/                    the deck (plain HTML, CSS, JS; no build step)
  index.html             14 scenes, on-screen text and speaker notes
  presenter.html         presenter view
  assets/stage.js        the living canvas: particles, the ValueGram monitor
  assets/scenes.js       one animated scene per slide
  assets/keyframes.js    illustrative output values only
  assets/deck.js         navigation, steps, deep links, presenter sync
scripts/
  check-disclosure.mjs   blocks internal or implementation terms from being published
  export-pdf.cjs         renders the PDF backup (needs Playwright)
docs/                    script, concept evaluation and delivery plan
```

## Disclosure rule

The deck names disciplines, method families, inputs and outputs. It never contains formulas, parameters, thresholds, schemas, vendor or library names, or model identifiers. The animation replays recorded results; no business logic lives in the code. This repository is public, so the page source can be read; `scripts/check-disclosure.mjs` runs before every publish and fails it on a forbidden term.

All figures come from an illustrative ship-repair scenario in the product's engine tests. They are modeled annual uplift, not customer results, and exclude implementation costs.

## Publishing

Every push to `main` that touches `site/` runs [`.github/workflows/pages.yml`](.github/workflows/pages.yml): the disclosure check, then deployment to GitHub Pages. One-time setting: **Settings → Pages → Source: GitHub Actions**.

After changing the deck, refresh the PDF backup with `node scripts/export-pdf.cjs`.

## Credits

Fonts: [Inter](https://github.com/rsms/inter) and [Instrument Serif](https://github.com/Instrument/instrument-serif), both under the SIL Open Font License (see `site/assets/fonts/`).
