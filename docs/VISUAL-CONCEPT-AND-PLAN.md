# ValueGram Profit: visual concept and delivery plan

Companion to [PRESENTATION-SCRIPT.md](PRESENTATION-SCRIPT.md).

## 1. What the visual idea must do

The goal is a picture the audience can still redraw from memory a month later, which brings the algorithm back to mind every time they look at their own work. It has to show *how* the algorithm behaves without revealing *how it is built*.

### Evaluation criteria

| # | Criterion | Weight | Question it answers |
|---|---|---:|---|
| 1 | Memorability | 25 | Can someone sketch it from memory a month later? Is it simple, concrete and unexpected? |
| 2 | Truth to the mechanism | 20 | Does it actually encode constraints, marginal value, stopping points, interaction and measured outcomes, or is it decoration? |
| 3 | Carries the whole story | 15 | Can one visual world hold all 24 slides, from problem through engine to roadmap? |
| 4 | Reveal power | 15 | Can it stage the "$0 alone, $119,600 together" surprise? |
| 5 | Brand ownership | 10 | Does it become *ValueGram's* image, tied to the name? |
| 6 | Executive credibility | 10 | Does it feel serious to a CFO and an investor, not like a game or a cliché? |
| 7 | Feasibility | 5 | Can it run smoothly in a browser on a projector and a laptop, without a build step? |

### Candidates scored (1 to 5 per criterion, weighted to 100)

| Idea | Mem | Truth | Story | Reveal | Brand | Cred | Feas | **Score** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| **A. ValueGram monitor:** an ECG-style line that pulses with value | 5 | 2 | 3 | 4 | 5 | 4 | 5 | **77** |
| **B. Flow and gates:** work flowing through constraint gates, like a hydraulic economy machine | 3 | 5 | 4 | 4 | 2 | 4 | 4 | **75** |
| **C. Lock and two keys:** one key turns nothing, two open the vault | 4 | 3 | 1 | 5 | 1 | 3 | 5 | **63** |
| **D. Value terrain:** a 3D landscape of ridges and cliffs | 3 | 4 | 2 | 3 | 2 | 4 | 2 | **60** |
| **E. Organization constellation:** a glowing network of goals | 1 | 2 | 4 | 2 | 2 | 3 | 4 | **45** |
| **F. Iceberg of hidden value** | 3 | 1 | 2 | 2 | 1 | 2 | 5 | **42** |
| **G. Gray to Gold:** flow and gates, read out on the ValueGram monitor (A + B) | 5 | 5 | 5 | 5 | 5 | 4 | 3 | **96** |

**Why each loses or wins**
- **A** is unforgettable and owns the name, but a line on its own shows *that* value changed, not *why*.
- **B** explains the mechanism perfectly; there is real precedent in economics for hydraulic models of an economy. But plumbing alone feels mechanical and has no brand.
- **C** is perfect for one slide (the interaction reveal) and useless for the other 23. It survives as a single spoken metaphor.
- **D** is mathematically honest but too abstract for executives, and heavy to render.
- **E** looks like every AI deck. **F** is a cliché that encodes nothing.
- **G** combines the strongest mechanism (B) with the strongest memory hook (A). The audience sees the cause (flow hitting a gate) and the effect (the heartbeat) at the same time.

## 2. The chosen idea: Gray to Gold

> **Activity is gray. Value is gold.**

The deck is not a series of slides. It is **one continuous world**, a single living canvas the camera moves through, with the text layer on top. Everything in it follows one strict visual language, so that by slide 6 the audience reads the picture without being told.

### The visual grammar (never broken)

| What you see | What it means |
|---|---|
| **Gray particles** | Activity: tasks, effort, hours, work completed |
| **Gates** (luminous apertures) | Constraints: capacity, approvals, demand. The **glowing gate** is the binding one. |
| **Gray turning gold** | Activity that passes the binding gate and becomes economic value |
| **Hollow gold** (outline glow) | *Modeled* value: expected, not yet realized |
| **Solid gold** | *Proven* value: recorded in the books |
| **Opacity** | Strength of evidence: faint is an estimate, solid is a controlled test |
| **The ValueGram** (heart-monitor line along the bottom) | The business's economic pulse: flat means no value, a spike means value unlocked |
| **Ice blue** | The instruments (AI and statistics). They measure and explain; they are never the money. |
| **Red**, used exactly once | "Missed" in the Value Ledger |

The hollow-versus-solid gold rule matters for honesty: the audience always sees whether a number is modeled or proven, without needing a footnote.

### The four moments that make it unforgettable

1. **The Flatline (slide 6).** The approvals gate widens. Gray particles pour through and pile up behind the capacity gate. Nothing turns gold, and the ValueGram goes flat for two full seconds of silence. Then both gates move together: a gold surge, the monitor spikes, and **$61,200** appears in the gap between "the sum" and "together". A flatline is a universal, emotional image; nobody forgets it. The slide 3 callback ("that was the approvals team") lands here.
2. **The Knee (slide 7).** The presenter drives utilization live with the arrow keys. Gold flows and the counter climbs $29,200 per point, until at 79% the gate hands over: the flow turns gray again and the line levels. Add faster approvals and the knee slides to 81.1%. Live control makes investors trust what they see.
3. **The Gold Cap (slide 11).** Three initiatives pour gold into one vessel sized to the profit the books recorded. The overflow evaporates, which shows "no double counting" without a word.
4. **The Mirror (slide 24).** The final scene is a generic organization, almost entirely gray, with one thin gold thread. The last question: *"How much of your work is gray?"* This is the lasting hook: from then on the audience sees their own dashboards in gray and gold.

### Memory devices
- **Rule of three:** "Activity is gray. Value is gold." appears at the opening (slide 2), at the reveal (slide 6) and at the close (slide 24).
- **Callback:** slide 3 (100% done, $0 profit) is explained on slide 6.
- **One sound, optional:** a soft heartbeat tone and a flatline tone, synthesized in the browser and off by default (the presenter turns it on with `S`).
- **Leave-behind:** a one-page PDF of the Gray to Gold image with a QR code to the deck.

### How each act uses the world
- **Act I:** a gray world. Activity everywhere, the ValueGram flat.
- **Act II:** gates appear and the first gold flows: goals become cases, the constraint, the reveal, the knee, Deal Desk (a new gold stream displacing an existing one), Monday List, AI, the Ledger.
- **Act III:** the camera pulls back and the machine becomes a cutaway. Five layers light in sequence (finance, optimization, statistics, AI, evidence), drawn as structure and responsibilities only.
- **Act IV:** the ValueGram line forks into many possible futures (uncertainty), stretches across a timeline (capital and time), and multiplies into a grid of industry worlds.
- **Finale:** the camera returns to the opening shot, then the Mirror.

## 3. Disclosure safeguards (built into the code)

- The animation plays **precomputed output keyframes** (for example 562.1 → 576.7 → 592 days sold). No business formula, parameter or rule is written in the JavaScript. The repository is public, so the page source can be read.
- Speaker notes follow the same disclosure rule as the slides.
- The QA step runs a forbidden-terms scan over `site/` and fails the build on internal names, vendor and library names, model identifiers, schema terms and "OMR".

## 4. Technical design

Plain HTML, CSS and JavaScript with no build step, the same approach as Revenue-Orchestrator but its own engine and look.

```
Profit/
├─ site/                     source deck
│  ├─ index.html             24 slide text layers + notes
│  └─ assets/
│     ├─ tokens.css          colors, type, motion timing
│     ├─ deck.css            layout, 16:9 scaling, text animation
│     ├─ deck.js             navigation, steps, deep links, fullscreen, touch, presenter view
│     ├─ stage.js            the single Canvas world: particles, gates, gold, camera
│     ├─ monitor.js          the ValueGram line
│     ├─ scenes.js           per-slide state: camera, gates, flow, gold mode
│     ├─ keyframes.js        illustrative output values only
│     └─ sound.js            optional synthesized tones
├─ public/                   what GitHub Pages serves (copy of site/, or the password-gated build)
├─ scripts/
│  ├─ check-disclosure.mjs   forbidden-terms scan
│  ├─ export-pdf.mjs         Playwright → PDF backup deck
│  └─ build-protected.mjs    optional password gate
├─ .github/workflows/pages.yml
└─ docs/
```

- **Rendering:** one Canvas 2D world with pooled particles (about 3,000), a pixel-ratio cap of 2 and frame-rate-independent motion. It pauses when the tab is hidden. With `prefers-reduced-motion`, each step renders as a still frame.
- **Navigation:** `→`/`Space`/click for the next step, `←` back, `F` fullscreen, `#n` deep links, swipe on touch, `↑`/`↓` for live control on slide 7, `S` for sound, `P` for a presenter window with notes, a timer and the next slide (kept in sync between windows).
- **Type and color:** a sharp sans for text and a refined serif for the big statements. Near-black background, cool gray, a warm gold. Contrast is checked for projectors, where gold on gray washes out first.
- **Fonts and assets:** self-hosted, so the deck works offline in a meeting room.

## 5. Delivery plan

| Milestone | Delivers | You review |
|---|---|---|
| **M0 · Decisions** | Your answers to the five questions below | — |
| **M1 · Proof of the idea** | The engine (stage, monitor, gates, gold) and slides 5 to 7 (constraint, Flatline, Knee) live on GitHub Pages | Whether the core moment has the intended impact. This is the biggest risk, so it is tested first. |
| **M2 · Acts I and II** | Slides 1 to 12, with the slide 3 callback and the Gold Cap | Story flow and pacing |
| **M3 · Acts III, IV and finale** | Architecture cutaway, technical slides, roadmap futures, pilot, the Mirror | Technical depth versus disclosure |
| **M4 · Polish and QA** | Motion timing, presenter view, sound, PDF backup, README | Full run-through |
| **M5 · Publish and rehearse** | Final link, one-page leave-behind, rehearsal notes with timings | Sign-off |

### QA before each publish
- Playwright screenshots of every slide and every step at 1920×1080, 1366×768 and phone width, with no console errors
- Smoothness check (target 60 fps) with a heavy particle load
- Every dollar figure checked against the verified scenario: $58,400 / $0 / $119,600 / $61,200 / $29,200 / 79% / 81.1%
- Forbidden-terms scan passes; no "OMR" anywhere
- Keyboard, touch, deep links, fullscreen and reduced-motion all work
- A timed rehearsal pass: about 20 minutes for 24 slides

### Publishing on GitHub
- `keevin227/Profit` is **public**, and its default branch is currently `claude/laughing-archimedes-mguyiv`.
- A workflow (`.github/workflows/pages.yml`) deploys `public/` to GitHub Pages on every push to the default branch.
- One manual setting on your side: **Settings → Pages → Source: GitHub Actions**.
- Live address: **https://keevin227.github.io/Profit/** (deep links such as `…/Profit/#6` open the reveal directly).
- Optional password gate, as in Revenue-Orchestrator: it protects the link, not the public source. Because the deck is designed to disclose nothing, an open link is safe; the gate only controls who can watch it.
- Later, if you want a `main` branch, a single pull request moves it and the workflow follows the default branch.

## 6. Decisions needed

1. Approve **Gray to Gold** as the visual concept.
2. Length: **24 slides** (about 20 minutes) or a tighter **18**.
3. Link: **open**, or **password-gated**.
4. Sound: optional and off by default (recommended), always on, or none.
5. Live control on slide 7: **yes** (recommended) or a fixed animation.
