// Illustrative scenario: recorded outputs only. No business logic lives in this deck.
// Gate values are schematic openings for the animation, not model inputs.
window.VG_DATA = {
  reveal: {
    stream: 0.875,
    states: [
      { a: 0.625, b: 0.516, uplift: 0 },       // today
      { a: 0.625, b: 0.79, uplift: 58400 },    // utilization 77% -> 82% alone
      { a: 0.74, b: 0.516, uplift: 0 },        // approvals 37 -> 20 days alone
      { a: 0.74, b: 0.79, uplift: 119600 },    // both together
      { a: 0.74, b: 0.79, uplift: 119600 }
    ],
    interaction: 61200
  },
  // Added operating profit per year by utilization (%), as breakpoints.
  knee: {
    slow: [[77, 0], [79, 58400], [86, 58400]],
    fast: [[77, 0], [81.1, 119600], [86, 119600]],
    stop: { slow: 79, fast: 81.1 },
    perPoint: 29200
  }
};
