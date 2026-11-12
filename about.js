// ===== The "About" page: the sentence builds itself while the page keeps moving to the left =====
// HI my name is.. ELANA · and I am a... VISUAL DESIGNER · and creator of... VISION
// (Figma: Frame 184; the words are in about-words.js).
//
// THE RULES:
//   1. While you scroll, the page always moves from right to left, at the pace of the scroll.
//      All the words lie on one long strip, in the order of the sentence, and slide with it.
//   2. As soon as a letter of the next word has come onto the screen (there is space for it), shapes start
//      jumping in to build it: the letter furthest to the right first. Both words keep sliding to the left.
//   3. When a word reaches the left edge, its shapes spread: they jump off to build the letters that are
//      being made. Shapes that no letter needs right then slide out at the left edge. Missing shapes come in
//      from the left edge.
//   4. A small text ("I am a...") shows up once the word before it is written out AND it has come close to
//      the middle of the screen, like a typewriter: first only its bar shows, blinking; then the scrolling types
//      the letters one by one (stop scrolling and it stops, and the bar blinks). The first one ("!..", right
//      after HI) has its bar from the start.
//   5. The word after a small text only starts to build a moment after that small text has appeared.
// The words and small texts lie on the strip exactly as in Frame 184, with HI starting where Figma "Desktop - 5" shows it.
// Figma "Desktop - 5": the whole sentence got smaller (61.76 per cell instead of 67.93) and sits in the
// middle of the screen (its top at y 450 of 1024). The numbers here stay those of Frame 184 ("about units");
// the page draws them ABOUT_SCALE times as big (also in styles.css, .about --u: keep the two the same).
// The words' middle is kept in the middle of the screen, on any screen.

const ABOUT_SCALE = 0.9092;              // 61.76 / 67.93
const SCREEN_W = 1440 / ABOUT_SCALE;     // the screen's width in about units
const WORD_Y = 0;          // the top of the words (about units, measured from the words' top)
const WORD_MID = 67.93;    // the middle of the words (half their height): it lies in the middle of the screen
const OUTSIDE_X = -160;    // just outside the left edge: where new shapes come in from
const SCREEN_RIGHT = SCREEN_W - 17; // a letter can be built once it is fully on the screen (17 from the right edge)
const EDGE_X = 300;        // a shape that slides to here (the left part of the screen) starts to spread
const SCROLL_PER_PIXEL = 3;   // how many pixels you scroll for the page to move one (Figma) pixel

// ----- Where everything lies on the strip (Figma pixels): as in Frame 184, HI starting in the middle of the screen -----
const START_X = 593.46 / ABOUT_SCALE;   // where HI starts (Figma "Desktop - 5": x 593.46)
const WORD_STRIP_X = ABOUT_WORDS.map((w) => START_X + w.x);

// The page has moved all the way once the last word (VISION) stands in the middle of the screen
// (or a little further, if its last shape lands later: see the end of the plan)
const LAST = ABOUT_WORDS.length - 1;
let TOTAL_MOVE = WORD_STRIP_X[LAST] + ABOUT_WORDS[LAST].width / 2 - SCREEN_W / 2;

// Each small text belongs to the word before it (it shows up once that word is built)
const TEXT_APPEAR = 185;       // how far you scroll while a small text is typed (it is done within this)
const SCREEN_MIDDLE = SCREEN_W / 2;   // the middle of the screen
const LETTER_WIDTH = 7.4;      // about how wide one letter of a small text is (about units), to find its middle
const WORD_AFTER_TEXT = 40;    // how far the page moves after a small text has appeared, before the next word starts
const TEXTS = ABOUT_TEXTS.map((t) => ({
  ...t,
  y: WORD_Y,
  stripX: START_X + t.x,
  after: ABOUT_WORDS.reduce((last, w, k) => (w.x < t.x ? k : last), 0),
}));
// When the page has moved far enough for the middle of each small text to be in the middle of the screen
// (TYPE_EARLY: how far before the middle the typing starts; 0 = right when it reaches the middle)
const TYPE_EARLY = 0;          // about units
TEXTS.forEach((t) => { t.atMiddle = t.stripX + (t.text.length * LETTER_WIDTH) / 2 - SCREEN_MIDDLE - TYPE_EARLY; });
// "my name is.." (after HI, which is there from the start) appears like the others: once it nears the middle
TEXTS.forEach((t) => { if (t.after === 0) t.appear = t.atMiddle; });
TEXTS[0].appear = 0;   // "!.." types itself as soon as the page opens

// ----- Plan every jump, once, by playing the whole page through in small steps -----
// "moved" = how far the page has moved to the left (Figma pixels). A shape that rests on the strip at x
// is seen at x - moved.
const JUMP_LENGTH = 150;   // how far the page moves while one shape jumps
const FIRST_JUMP = 25;     // at first HI only slides with the page
const STARTING_GAPS = [30, 24, 19, 15, 12, 10];   // the first shapes set off slowly, then faster
const JUMP_GAP = 10;       // after that: how far the page moves between two shapes setting off

// Every shape on the page: where it rests on the strip, and its jumps
const shapes = [];
// The letters of every word, with the places that still need a shape
const letters = ABOUT_WORDS.map((word, k) => {
  const byLetter = [];
  word.pieces.forEach(([shape, x, y]) => {
    // the letter a shape belongs to: shapes that start within the same letter box
    const left = WORD_STRIP_X[k] + x;
    let letter = byLetter.find((l) => left >= l.left - 1 && left < l.left + 130);
    if (!letter) { letter = { left, right: left, places: [] }; byLetter.push(letter); }
    letter.places.push({ shape, x: left, y: WORD_Y + y });
    letter.right = Math.max(letter.right, left + ABOUT_SHAPES[shape][0]);
  });
  return byLetter;
});

// HI is already there
letters[0].forEach((letter) => {
  letter.places.forEach((p) => shapes.push({ shape: p.shape, home: { x: p.x, y: p.y }, rest: { x: p.x, y: p.y }, word: 0, jumps: [], free: Infinity }));
  letter.done = true;
});

const lastLanding = ABOUT_WORDS.map(() => 0);   // when the last letter of each word is built
const wordWritten = ABOUT_WORDS.map(() => 0);   // when every shape of each word has landed
const lateLetters = [];                          // letters that would not be ready in time (should stay empty)

(function plan() {
  let word = 1;          // the word being built
  // ELANA only starts a moment after "my name is.." has appeared
  let nextJump = Math.max(FIRST_JUMP,
    ...TEXTS.filter((t) => t.appear !== undefined).map((t) => t.appear + TEXT_APPEAR + WORD_AFTER_TEXT));
  let jumpsSoFar = 0;
  for (let moved = 0; moved <= TOTAL_MOVE + 1000; moved += 1) {
    // Shapes that have slid to the left edge are free to spread
    shapes.forEach((s) => {
      const landed = !s.jumps.length || s.jumps[s.jumps.length - 1].land <= moved;
      if (s.free === Infinity && landed && s.rest.x - moved <= EDGE_X) s.free = moved;
    });
    if (word > LAST || moved < nextJump) continue;

    // The letters of the word that are fully on the screen and not finished yet; the rightmost first
    const open = letters[word].filter((l) => !l.done && l.right - moved <= SCREEN_RIGHT).sort((a, b) => b.left - a.left);
    if (!open.length) continue;
    const letter = open[0];

    // Prefer a place whose shape is waiting at the left edge (from an earlier word, never from this one)
    const waiting = shapes.filter((s) => s.free <= moved && s.word < word && s.rest.x - moved > -60);
    let placeIndex = letter.places.findIndex((p) => waiting.some((s) => s.shape === p.shape));
    if (placeIndex === -1) placeIndex = 0;
    const [place] = letter.places.splice(placeIndex, 1);
    const land = moved + JUMP_LENGTH;
    const from = waiting.filter((s) => s.shape === place.shape).sort((a, b) => a.rest.x - b.rest.x)[0];

    if (from) {
      // A shape from a word at the left edge spreads to this place
      from.jumps.push({ start: moved, land, from: { x: from.rest.x, y: from.rest.y, onStrip: true }, to: place });
      from.rest = { x: place.x, y: place.y };
      from.word = word;
      from.free = Infinity;
    } else {
      // A new shape comes in from the left edge
      shapes.push({ shape: place.shape, home: null, rest: { x: place.x, y: place.y }, word, free: Infinity,
        jumps: [{ start: moved, land, from: { x: OUTSIDE_X, y: place.y, onStrip: false }, to: place }] });
    }

    if (!letter.places.length) {
      letter.done = true;
      if (land > letter.left - 17) lateLetters.push(ABOUT_WORDS[word].text + " letter at " + Math.round(letter.left));
      const lastLetter = letters[word].reduce((a, b) => (b.left > a.left ? b : a));
      if (letter === lastLetter) lastLanding[word] = land;
    }
    wordWritten[word] = Math.max(wordWritten[word], land);
    nextJump = moved + (jumpsSoFar < STARTING_GAPS.length ? STARTING_GAPS[jumpsSoFar] : JUMP_GAP);
    jumpsSoFar += 1;

    if (letters[word].every((l) => l.done)) {
      // The word is finished. If a small text comes after it, that text appears now (once it nears the middle
      // of the screen), and the next word waits until a moment after it has appeared.
      TEXTS.filter((t) => t.after === word).forEach((t) => {
        t.appear = Math.max(wordWritten[word], t.atMiddle);
        nextJump = Math.max(nextJump, t.appear + TEXT_APPEAR + WORD_AFTER_TEXT);
      });
      word += 1;
    }
  }
})();

// The page ends once the last word is finished
TOTAL_MOVE = Math.max(TOTAL_MOVE, wordWritten[LAST] + 20);
if (TOTAL_MOVE > WORD_STRIP_X[LAST] + ABOUT_WORDS[LAST].width / 2 - SCREEN_W / 2 + 1) {
  console.warn("VISION is built late, so it ends a little left of the middle", Math.round(TOTAL_MOVE));
}

// Each jump: how high (higher for longer jumps, always over the small texts)
shapes.forEach((s) => s.jumps.forEach((j) => {
  const fromScreen = j.from.onStrip ? j.from.x - j.start : j.from.x;
  j.height = Math.min(360, 110 + 0.3 * Math.abs(j.to.x - j.land - fromScreen));
}));

// ----- Draw -----
const stage = document.getElementById("about-stage");
const about = document.getElementById("about");
const piecesBox = document.getElementById("about-pieces");
const SVG_NS = "http://www.w3.org/2000/svg";

// Close every outline (some shapes, like the triangles, are drawn without their last side)
const closed = (d) => d.replace(/([^Zz\s])\s*M/g, "$1 Z M").replace(/([^Zz\s])\s*$/, "$1 Z");

shapes.forEach((s) => {
  const [w, h, d] = ABOUT_SHAPES[s.shape];
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "about-piece");
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.style.setProperty("--w", w);
  svg.style.setProperty("--h", h);
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", closed(d));   // closed, so its thin outline goes all the way round (no white line)
  svg.appendChild(path);
  piecesBox.appendChild(svg);
  s.el = svg;
});

const textEls = TEXTS.map((t) => {
  const p = document.createElement("p");
  p.className = "about-text";
  p.setAttribute("aria-label", t.text);
  // the typed letters (filled in by the typewriter), then the bold "|" that blinks like a typing cursor
  const typed = document.createElement("span");
  typed.setAttribute("aria-hidden", "true");
  const cursor = document.createElement("span");
  cursor.className = "about-text-cursor flow-edge-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.textContent = "|";
  p.append(typed, cursor);
  p.typed = typed;
  stage.insertBefore(p, piecesBox);
  return p;
});


// Smooth start and end of a jump (0 → 1)
function ease(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function clamp01(t) {
  return Math.min(1, Math.max(0, t));
}

// Where a shape is seen (screen x and Figma y) when the page has moved this far
function shapePosition(s, moved) {
  // Before its first jump: in HI (on the strip), or waiting outside the left edge
  let rest = s.home;
  if (!rest) {
    const first = s.jumps[0];
    if (moved < first.start) return [OUTSIDE_X, first.from.y];
  }
  for (const j of s.jumps) {
    if (moved < j.start) break;
    if (moved < j.land) {
      const p = ease((moved - j.start) / (j.land - j.start));
      const fromX = j.from.onStrip ? j.from.x - moved : j.from.x;
      const toX = j.to.x - moved;
      const x = fromX + (toX - fromX) * p;
      const y = j.from.y + (j.to.y - j.from.y) * p - j.height * Math.sin(Math.PI * p);   // up and down again
      return [x, y];
    }
    rest = j.to;
  }
  return [rest.x - moved, rest.y];
}

// The page is as long as the scrolling needs: one screen to stand on, plus the scrolling for the whole move
function setPageHeight() {
  const u = stage.clientWidth / 1440 * ABOUT_SCALE;
  about.style.height = `${window.innerHeight + (TOTAL_MOVE + EXTRA_MOVE) * SCROLL_PER_PIXEL * u}px`;
}

function draw() {
  const u = stage.clientWidth / 1440 * ABOUT_SCALE;   // one about unit, in screen pixels
  const screenH = stage.clientHeight;
  const fromBottom = (y) => screenH / 2 + (y - WORD_MID) * u;   // about y → screen y (the words' middle in the middle)
  const scrolled = Math.min(TOTAL_MOVE + EXTRA_MOVE, Math.max(0, window.scrollY / u / SCROLL_PER_PIXEL));
  const moved = Math.min(TOTAL_MOVE, scrolled);   // the shapes stop with VISION in the middle; the texts go on

  shapes.forEach((s) => {
    const [x, y] = shapePosition(s, moved);
    const seen = x > -200 && x < SCREEN_W + 60;        // shapes far off the screen are not drawn
    s.el.style.display = seen ? "" : "none";
    if (seen) s.el.style.transform = `translate(${x * u}px, ${fromBottom(y)}px)`;
  });

  TEXTS.forEach((text, i) => {
    // It is typed out once the word before it is written out and it nears the middle of the screen
    // (worked out in the plan); "!.." right away
    typeTo(i, moved);
    textEls[i].style.transform = `translate(${(text.stripX - scrolled) * u}px, ${fromBottom(text.y)}px)`;
  });
  placeMorph(moved, u, screenH);
}


// ----- At the end: hovering VISION makes its shapes bubble out like liquid -----
// Where the mouse is, the shapes near it soften into round, wobbly drops and float away from the mouse;
// how far they float swells and shrinks, so they keep breaking off from the word and flowing back into it.
// The bubbling shapes are drawn through a "goo" filter (soften, then cut sharp again), so drops that come
// close melt together like liquid, and pull apart again; the shapes far from the mouse stay sharp. When the mouse leaves, everything flows back.
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const MORPH_POINTS = 140;    // points on each shape's outline
const REACH = 520;          // how far from the mouse shapes still react (about units)
const GOO = 18;             // how soft the liquid edges are (when the effect is fully on); it grows with the melt
const EASE_IN = 1.0;        // how quickly a shape melts when the mouse comes near (smooth, no popping)
const EASE_BACK = 0.9;      // how it melts back into its shape when the mouse goes away (together with FOLLOW_BACK)
const SPREAD = 0.65;        // how much bigger a shape grows as it melts (so the putty flows together: more goo than gaps)
const BREATHE = 0.1;        // how much a drop keeps swelling and shrinking
const OOZE_SPREAD = 0.35;   // how much later the far side of a shape starts to melt

const morphSvg = document.createElementNS(SVG_NS, "svg");   // the liquid drawing, over the shapes
morphSvg.setAttribute("class", "about-morph");
morphSvg.setAttribute("aria-hidden", "true");
stage.appendChild(morphSvg);
const morphDefs = document.createElementNS(SVG_NS, "defs");
morphSvg.appendChild(morphDefs);
morphDefs.innerHTML = '<filter id="about-goo" x="-50%" y="-150%" width="200%" height="400%">' +
  '<feGaussianBlur in="SourceGraphic" stdDeviation="0"/>' +
  '<feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 60 -27"/>' +
  '<feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -14"/></filter>';   // cut twice: soft round shapes with crisp edges, also where drops just touch
const gooBlur = morphDefs.querySelector("feGaussianBlur");
const liquid = document.createElementNS(SVG_NS, "g");
liquid.setAttribute("filter", "url(#about-goo)");
morphSvg.appendChild(liquid);

// Points along an outline d, moved by [dx, dy]
function outlinePoints(d, dx, dy) {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", closed(d));   // all the way round, so the melting shape starts exactly as the shape
  morphDefs.appendChild(path);
  const length = path.getTotalLength();
  const points = [];
  for (let i = 0; i < MORPH_POINTS; i++) {
    const p = path.getPointAtLength((length * i) / MORPH_POINTS);
    points.push([p.x + dx, p.y + dy]);
  }
  path.remove();
  return points;
}
const pathFrom = (points) => "M" + points.map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L") + "Z";
// A closed outline drawn with soft curves through its points (no corners between them)
function curvePath(points) {
  const n = points.length, f = (v) => v.toFixed(2);
  let d = "M" + f(points[0][0]) + " " + f(points[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
    d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " +
         f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1]);
  }
  return d + "Z";
}
// Smooth an outline: each point moves towards the middle of its neighbours (several times), by `amount`
function smoothed(points, amount, passes) {
  let pts = points;
  for (let k = 0; k < passes; k++) {
    const n = pts.length;
    pts = pts.map((p, i) => {
      const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
      return [p[0] + ((a[0] + b[0]) / 2 - p[0]) * 0.5, p[1] + ((a[1] + b[1]) / 2 - p[1]) * 0.5];
    });
  }
  return points.map((p, i) => [p[0] + (pts[i][0] - p[0]) * amount, p[1] + (pts[i][1] - p[1]) * amount]);
}
const smooth = (v) => { const c = Math.min(1, Math.max(0, v)); return c * c * (3 - 2 * c); };

// VISION's shapes where they stand at the end of the page, each with its outline and its drop
const visionBox = { x0: WORD_STRIP_X[LAST] - TOTAL_MOVE, x1: WORD_STRIP_X[LAST] + ABOUT_WORDS[LAST].width - TOTAL_MOVE, y0: WORD_Y, y1: WORD_Y + 135.86 };
const drops = shapes.filter((sh) => {
  const [x, y] = shapePosition(sh, TOTAL_MOVE);
  return x >= visionBox.x0 - 1 && x < visionBox.x1 - 1 && Math.abs(y - WORD_Y) < 140;
}).map((sh, n) => {
  const [w, h, d] = ABOUT_SHAPES[sh.shape];
  const [x, y] = shapePosition(sh, TOTAL_MOVE);
  const from = outlinePoints(d, x, y);
  const middle = [from.reduce((a, p) => a + p[0], 0) / from.length, from.reduce((a, p) => a + p[1], 0) / from.length];
  const path = document.createElementNS(SVG_NS, "path");
  liquid.appendChild(path);
  return {
    el: sh.el, path, from, middle,
    angles: from.map((p) => Math.atan2(p[1] - middle[1], p[0] - middle[0])),
    radius: 0.5 * Math.sqrt(w * h) * 0.92,   // a round drop about as big as the shape
    phase: n * 2.39,                          // each drop wobbles its own way
    out: 0,                                   // 0 = the shape in place, 1 = a drop floated away
  };
});

let mouse = null;          // the mouse in about units (null = not on VISION)
let softMouse = null;      // the mouse, followed softly
let wake = [0, 0];         // how the mouse is moving (about units per second, smoothed)
let liquidOn = false;      // the liquid drawing is showing
let liquidLast = null;
// A flowing current, like water around a hand: every point of every shape is carried by it on its own
// (not whole shapes), so the goo stretches, smears and curls. Around the mouse the water is pushed away,
// curls into swirls on both sides as the mouse moves, and is dragged along behind it; a slow undercurrent
// keeps the melted goo drifting. Each point follows the current a little late, each by its own amount.
const FLOW_RADIUS = 150;     // how wide the mouse presses into the putty (about units)
const PUSH = 125;            // how far the putty is pushed away where the mouse presses
const SWIRL = 55;            // how much it curls around the mouse while the mouse moves
const DRAG = 0.55;           // how much it is smooshed along with the mouse as it moves
const DRAG_MAX = 210;
const UNDERCURRENT = 8;      // a very slow drifting of the melted putty
const FOLLOW_IN = 1.0;       // how quickly points follow the current (each a bit quicker or slower)
const FOLLOW_BACK = 0.9;     // how they flow back: all together, gently (see the two-step easing below)
const SEPARATE = 0;          // (pieces do not fly apart: the word turns into putty in place)
const STIR_RADIUS = 200;     // bubbles this close to the mouse are stirred by it
const STIR_PUSH = 0;         // (no whole pieces thrown around: the mouse smooshes the putty itself)
const STIR_DRAG = 0;
const STIR_MAX = 220;
const HOT_SPREAD = 0.35;     // how much more the putty under the mouse swells
const HOVER_PAD = 220;       // the spot that feels the mouse reaches this far around VISION (the putty is smooshed out there)
drops.forEach((dr, n) => {
  dr.share = 0.45 + 0.9 * (0.5 + 0.5 * Math.sin(n * 12.9898 + 4.1));   // its own share of the drifting apart
  dr.shift = [0, 0]; dr.hot = 0;
  dr.disp = dr.from.map(() => [0, 0]);
  dr.midDisp = dr.from.map(() => [0, 0]);   // a step between the current and the point: makes every move start and end softly
  // each point's own delay (smoothly different along the edge, so the edge trails like liquid)
  dr.lag = dr.from.map((p, i) => 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(i * 0.21 + n * 1.7)) + 0.35 * (0.5 + 0.5 * Math.sin(i * 0.067 + n)));
});

function current(p, time, activity) {
  let x = 0, y = 0;
  if (softMouse) {
    const dx = p[0] - softMouse[0], dy = p[1] - softMouse[1];
    const r = Math.hypot(dx, dy) || 1, nx = dx / r, ny = dy / r;
    const fall = Math.exp(-((r / FLOW_RADIUS) ** 2));
    // pushed away from the mouse
    x += nx * PUSH * fall; y += ny * PUSH * fall;
    // curling round it while it moves: the two sides turn opposite ways, like eddies behind a hand
    const speed = Math.hypot(wake[0], wake[1]);
    if (speed > 1) {
      const side = Math.sign(wake[0] * dy - wake[1] * dx);
      const curl = SWIRL * fall * Math.min(1, speed / 300) * side;
      x += -ny * curl; y += nx * curl;
    }
    // dragged along behind it
    const fall2 = Math.exp(-((r / (FLOW_RADIUS * 1.5)) ** 2));
    let wx = wake[0] * DRAG * fall2, wy = wake[1] * DRAG * fall2;
    const wl = Math.hypot(wx, wy);
    if (wl > DRAG_MAX) { wx *= DRAG_MAX / wl; wy *= DRAG_MAX / wl; }
    x += wx; y += wy;
  }
  // the slow undercurrent (only where the goo has melted)
  x += UNDERCURRENT * activity * Math.sin(p[1] * 0.013 + p[0] * 0.004 + time * 0.35);
  y += UNDERCURRENT * activity * Math.cos(p[0] * 0.011 - p[1] * 0.005 - time * 0.3);
  return [x, y];
}

function liquidFrame(now) {
  const dt = liquidLast === null ? 0 : Math.min(0.05, (now - liquidLast) / 1000);
  liquidLast = now;
  const time = now / 1000;
  // the mouse, followed softly (so quick mouse moves never make the goo jump), and how it is moving
  if (mouse) {
    if (!softMouse) softMouse = [mouse[0], mouse[1]];
    const f = Math.min(1, dt * 1.8);
    const before = [softMouse[0], softMouse[1]];
    softMouse[0] += (mouse[0] - softMouse[0]) * f;
    softMouse[1] += (mouse[1] - softMouse[1]) * f;
    if (dt > 0) {
      const g = Math.min(1, dt * 3);
      wake[0] += ((softMouse[0] - before[0]) / dt - wake[0]) * g;
      wake[1] += ((softMouse[1] - before[1]) / dt - wake[1]) * g;
    }
  } else {
    softMouse = null;
    if (dt > 0) { wake[0] *= 1 - Math.min(1, dt * 2); wake[1] *= 1 - Math.min(1, dt * 2); }
  }
  let most = 0, moving = 0;
  drops.forEach((dr) => {
    // how melted it wants to be: near the mouse a lot, far away not at all
    const far = softMouse ? Math.hypot(dr.middle[0] - softMouse[0], dr.middle[1] - softMouse[1]) : Infinity;
    // it stays melted while the mouse moves around (fading only slowly), so you can go and touch a bubble
    const near = softMouse ? smooth(1 - far / REACH) : 0;
    dr.peak = softMouse ? Math.max(near, (dr.peak || 0) - dt * 0.08) : 0;
    const want = dr.peak;
    // two steps of easing: it starts softly, glides, and settles softly (in and back)
    const rate = want > dr.out ? EASE_IN : EASE_BACK;
    dr.outMid = (dr.outMid || 0) + (want - (dr.outMid || 0)) * Math.min(1, dt * rate * 2);
    dr.out += (dr.outMid - dr.out) * Math.min(1, dt * rate * 2);
    if (dr.out < 0.004 && dr.outMid < 0.004 && want === 0) { dr.out = 0; dr.outMid = 0; }
    if (softMouse && !dr.touch && want > 0) dr.touch = [softMouse[0], softMouse[1]];   // where its melt starts
    // the bubbles drift apart: each one away from the mouse, each its own distance (so the word breaks into bubbles)
    // (its direction is chosen once, when it first breaks off, and then it stays: it does not run from the mouse)
    if (softMouse && !dr.away && want > 0.02) {
      let tx = dr.middle[0] - softMouse[0], ty = dr.middle[1] - softMouse[1];
      const tl = Math.hypot(tx, ty) || 1;
      dr.away = [tx / tl, ty / tl];
    }
    const away = dr.away || [0, 0];
    const goal = [away[0] * SEPARATE * dr.share * want, away[1] * SEPARATE * dr.share * want];
    dr.shiftMid = dr.shiftMid || [0, 0];
    const fs = Math.min(1, dt * 2 * (want > 0.01 ? FOLLOW_IN : FOLLOW_BACK));
    dr.shiftMid[0] += (goal[0] - dr.shiftMid[0]) * fs; dr.shiftMid[1] += (goal[1] - dr.shiftMid[1]) * fs;
    dr.shift[0] += (dr.shiftMid[0] - dr.shift[0]) * fs; dr.shift[1] += (dr.shiftMid[1] - dr.shift[1]) * fs;
    // stirred by the mouse: pushed away from it and dragged along its path, so bubbles run into each other
    // and melt together, then slowly drift back to their own places and pull apart again
    dr.stir = dr.stir || [0, 0];
    let sx = 0, sy = 0;
    if (softMouse) {
      const bx = dr.middle[0] + dr.shift[0], by = dr.middle[1] + dr.shift[1];
      const dx = bx - softMouse[0], dy = by - softMouse[1], dd = Math.hypot(dx, dy) || 1;
      const fall = Math.exp(-((dd / STIR_RADIUS) ** 2));
      sx = dx / dd * STIR_PUSH * fall + wake[0] * STIR_DRAG * fall;
      sy = dy / dd * STIR_PUSH * fall + wake[1] * STIR_DRAG * fall;
      const sl = Math.hypot(sx, sy);
      if (sl > STIR_MAX) { sx *= STIR_MAX / sl; sy *= STIR_MAX / sl; }
    }
    const stirring = sx * sx + sy * sy > dr.stir[0] * dr.stir[0] + dr.stir[1] * dr.stir[1];
    const fst = Math.min(1, dt * (stirring ? 1.4 : 0.45));
    dr.stir[0] += (sx - dr.stir[0]) * fst; dr.stir[1] += (sy - dr.stir[1]) * fst;
    // the bubble under the mouse swells and spreads more
    const cx = dr.middle[0] + dr.shift[0] + dr.stir[0], cy = dr.middle[1] + dr.shift[1] + dr.stir[1];
    const under = mouse && Math.hypot(mouse[0] - cx, mouse[1] - cy) < dr.radius * (1 + SPREAD) * 1.25 && dr.out > 0.2;
    dr.hot += ((under ? 1 : 0) - dr.hot) * Math.min(1, dt * (under ? 1.6 : 0.8));
    // every point follows the current, each a little late
    let biggest = 0;
    dr.from.forEach((p, i) => {
      const [tx, ty] = current(p, time, Math.min(1, dr.out));
      const d = dr.disp[i], m = dr.midDisp[i];
      const going = tx * tx + ty * ty > d[0] * d[0] + d[1] * d[1];
      // going out each point is a little late in its own way (the edge trails like liquid);
      // coming back they all go together, so the shape flows back smoothly, never lumpy
      const f = Math.min(1, dt * 2 * (going ? FOLLOW_IN * dr.lag[i] : FOLLOW_BACK));
      m[0] += (tx - m[0]) * f; m[1] += (ty - m[1]) * f;
      d[0] += (m[0] - d[0]) * f; d[1] += (m[1] - d[1]) * f;
      biggest = Math.max(biggest, Math.abs(d[0]) + Math.abs(d[1]));
    });
    dr.moved = biggest + Math.abs(dr.shift[0]) + Math.abs(dr.shift[1]) + Math.abs(dr.stir[0]) + Math.abs(dr.stir[1]);
    most = Math.max(most, dr.out);
    moving = Math.max(moving, biggest);
  });
  if (!liquidOn && (most > 0 || moving > 0.5)) { liquidOn = true; morphSvg.style.visibility = "visible"; }
  // the edges soften little by little as the shapes melt (not all at once)
  gooBlur.setAttribute("stdDeviation", (GOO * smooth(Math.min(1, Math.max(most, moving / 120)))).toFixed(2));
  drops.forEach((dr) => {
    const o = Math.min(1, dr.out);
    // only the shapes that are melting or carried by the current become liquid; the others stay sharp
    const active = o > 0.01 || dr.moved > 0.5;
    dr.el.style.visibility = active ? "hidden" : "";
    dr.path.style.visibility = active ? "visible" : "hidden";
    if (!active) return;
    // where the melt started on this shape: its points soften one after the other from there
    const t0 = dr.touch || dr.middle;
    const farthest = Math.max(...dr.from.map((p) => Math.hypot(p[0] - t0[0], p[1] - t0[1])), 1);
    const raw = dr.from.map((p, i) => {
      const a = dr.angles[i];
      // the soft, organic shape it melts into: a few gentle lobes, spreading out as it melts
      let r = dr.radius * (1 + 0.08 * Math.sin(2 * a + dr.phase) + 0.04 * Math.sin(3 * a + dr.phase * 1.3));   // a soft, nearly round lump
      r *= 1 + o * (SPREAD + BREATHE * Math.sin(time * 0.2 + dr.phase * 1.9)) + HOT_SPREAD * dr.hot;
      // under the mouse it bulges away from the mouse (it reacts to it)
      if (dr.hot > 0.01 && mouse) {
        const ma = Math.atan2(mouse[1] - dr.middle[1] - dr.shift[1] - dr.stir[1], mouse[0] - dr.middle[0] - dr.shift[0] - dr.stir[0]);
        r *= 1 - 0.35 * dr.hot * Math.max(0, Math.cos(a - ma)) + 0.25 * dr.hot * Math.max(0, -Math.cos(a - ma));
      }
      const bx = dr.middle[0] + Math.cos(a) * r, by = dr.middle[1] + Math.sin(a) * r;
      const late = OOZE_SPREAD * Math.hypot(p[0] - t0[0], p[1] - t0[1]) / farthest;
      const k = smooth((o * (1 + OOZE_SPREAD) - late) * 0.9);   // slow: the corners stay sharp at first
      // its place: softened, then carried by the current
      return [p[0] + (bx - p[0]) * k + dr.disp[i][0] + dr.shift[0] + dr.stir[0], p[1] + (by - p[1]) * k + dr.disp[i][1] + dr.shift[1] + dr.stir[1]];
    });
    // the more it has melted, the smoother and softer its edge (no rough bits), drawn with soft curves
    const melt = Math.min(1, Math.max(o, Math.min(1, dr.moved / 40)));
    dr.path.setAttribute("d", melt > 0.02 ? curvePath(smoothed(raw, melt, 6)) : pathFrom(raw));
  });
  if (most === 0 && moving < 0.5 && !mouse) {
    // everything is back: show the real shapes again and rest
    liquidOn = false; liquidLast = null;
    drops.forEach((dr) => { dr.el.style.visibility = ""; dr.path.style.visibility = "hidden"; dr.touch = null;
      dr.disp.forEach((d) => { d[0] = 0; d[1] = 0; }); dr.midDisp.forEach((d) => { d[0] = 0; d[1] = 0; }); dr.outMid = 0;
      dr.shift = [0, 0]; dr.shiftMid = [0, 0]; dr.away = null; dr.hot = 0; dr.peak = 0; dr.stir = [0, 0]; });
    morphSvg.style.visibility = "hidden";
  }
}
morphSvg.style.visibility = "hidden";

// The spot over VISION that feels the mouse (only at the very end of the page, when VISION stands still)
const visionHover = document.createElement("div");
visionHover.className = "about-letter-hover";
stage.appendChild(visionHover);
let liquidRunning = false;
function startLiquid() {
  if (REDUCED || liquidRunning) return;
  liquidRunning = true;
  requestAnimationFrame(function run(now) {
    liquidFrame(now);
    if (liquidOn || mouse) requestAnimationFrame(run); else liquidRunning = false;
  });
}
visionHover.addEventListener("mousemove", (event) => {
  const b = visionHover.getBoundingClientRect();
  const pad = HOVER_PAD;
  mouse = [visionBox.x0 - pad + ((event.clientX - b.left) / b.width) * (visionBox.x1 - visionBox.x0 + 2 * pad),
           visionBox.y0 - pad + ((event.clientY - b.top) / b.height) * (visionBox.y1 - visionBox.y0 + 2 * pad)];
  startLiquid();
});
visionHover.addEventListener("mouseleave", () => { mouse = null; });

// Called by draw(): the drawing and the hover spot follow the screen; they only work at the very end
function placeMorph(moved, u, screenH) {
  const atEnd = moved >= TOTAL_MOVE - 0.5;
  stage.classList.toggle("is-at-end", atEnd);
  if (!atEnd) mouse = null;
  const w = stage.clientWidth / u, h = screenH / u;
  morphSvg.setAttribute("viewBox", `0 ${(WORD_MID - h / 2).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
  const pad = HOVER_PAD;
  visionHover.style.left = (visionBox.x0 - pad) * u + "px";
  visionHover.style.top = screenH / 2 + (visionBox.y0 - pad - WORD_MID) * u + "px";
  visionHover.style.width = (visionBox.x1 - visionBox.x0 + 2 * pad) * u + "px";
  visionHover.style.height = (visionBox.y1 - visionBox.y0 + 2 * pad) * u + "px";
}

// ----- The typewriter: the bar blinks, the letters are typed one by one, then the bar blinks on -----
// The scrolling types it: once it is reached only its bar shows (blinking); then the further you scroll,
// the more letters are typed (scrolling back takes them away). When the scrolling stops, even in the
// middle of a word, the typing stops and the bar blinks. It is fully typed within TEXT_APPEAR, so always
// before the next word starts.
const BAR_FIRST = 15;       // how far you scroll with only the bar showing, before the first letter
const PER_LETTER = 10;      // how far you scroll for each letter (about units)
function typeTo(i, moved) {
  const el = textEls[i], t = TEXTS[i];
  const shown = t.appear !== undefined && moved >= t.appear;
  el.classList.toggle("is-shown", shown);
  const n = !shown ? 0 : Math.max(0, Math.min(t.text.length, Math.floor((moved - t.appear - BAR_FIRST) / PER_LETTER) + 1));
  if (el.typed.textContent.length !== n) {
    el.typed.textContent = t.text.slice(0, n);
    // while letters are being typed the bar stands still; a moment after the last change it blinks again
    el.classList.add("is-typing");
    clearTimeout(el.blinkTimer);
    el.blinkTimer = setTimeout(() => el.classList.remove("is-typing"), 250);
  }
}

// ----- The end: VISION stays in the middle, but the small texts keep moving with the scrolling until
// "and creator of..." has left the screen at the left (EXTRA_MOVE more) -----
const LAST_TEXT = TEXTS.length - 1;
const EXTRA_MOVE = Math.max(0, TEXTS[LAST_TEXT].stripX + TEXTS[LAST_TEXT].text.length * LETTER_WIDTH + 30 - TOTAL_MOVE);

// Draw again on every scroll and resize (at most once per screen frame)
let waiting = false;
function drawSoon() {
  if (waiting) return;
  waiting = true;
  requestAnimationFrame(() => {
    waiting = false;
    draw();
  });
}

window.addEventListener("scroll", drawSoon, { passive: true });
window.addEventListener("resize", () => {
  setPageHeight();
  drawSoon();
});
setPageHeight();
draw();
