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

const ABOUT_SCALE = 0.9291;              // 63.11 / 67.93: every piece on the site is one size (63.11 per cell)
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
const TYPE_EARLY = 420;        // about units: the typing starts while the text is still on the right of the screen
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
    // while it is being typed it stands still (the rest moves on); once typed it moves with the rest
    textEls[i].style.transform = `translate(${(text.stripX - scrolled + typingHold(i, scrolled)) * u}px, ${fromBottom(text.y)}px)`;
  });
  placeMorph(moved, u, screenH);
}


// ----- At the end: hovering a letter of VISION makes it ooze into its organic letter, like the project titles -----
// (the same as lab.js: every shape's outline slides, point by point, onto the letter's organic outline,
// melting together on the way like slime; the organic letters are Figma's Frame 199, in about-words.js: ABOUT_ORGANIC)
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const MORPH_POINTS = 120;                // points on each outline
const MORPH_TIME = REDUCED ? 1 : 1100;   // ms for a whole letter to change
const OOZE_SPREAD = 0.3;                 // how much later the far points start (part of the time)
const STAY_TIME = 700;                   // ms a letter stays organic after the mouse leaves
const GOO = 7;                           // how soft the shapes melt together halfway
const ORGANIC_SIZE = 0.93;               // the organic letters' size (so they are as tall, for their letter, as on the titles)

const morphSvg = document.createElementNS(SVG_NS, "svg");   // the drawing of the reshaping, over the shapes
morphSvg.setAttribute("class", "about-morph");
morphSvg.setAttribute("aria-hidden", "true");
stage.appendChild(morphSvg);
const morphDefs = document.createElementNS(SVG_NS, "defs");
morphSvg.appendChild(morphDefs);

// Points along an outline d (closed), moved by [dx, dy]
function outlinePoints(d, dx, dy) {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", closed(d));
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
function turning(points) {
  let area = 0;
  points.forEach((p, i) => { const q = points[(i + 1) % points.length]; area += p[0] * q[1] - q[0] * p[1]; });
  return Math.sign(area);
}
// Line up the organic points with the shape's points (same direction, nearest start), so points travel little
function lineUp(from, to) {
  if (turning(from) !== turning(to)) to = [...to].reverse();
  let best = 0, bestCost = Infinity;
  for (let shift = 0; shift < to.length; shift++) {
    let cost = 0;
    for (let i = 0; i < from.length; i++) {
      const q = to[(i + shift) % to.length];
      cost += (from[i][0] - q[0]) ** 2 + (from[i][1] - q[1]) ** 2;
    }
    if (cost < bestCost) { bestCost = cost; best = shift; }
  }
  return from.map((_, i) => to[(i + best) % to.length]);
}
const pathFrom = (points) => "M" + points.map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L") + "Z";
// thick and gooey: a slow start and a soft stop
const ooze = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
const middleOf = (pts) => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];

// VISION's letters (each letter's place and width in the word, Figma Frame 173 in about units: the I is half as wide),
// with the shapes that stand in each one at the end of the page
const VISION_LETTERS = [["V", 0, 135.86], ["I", 141.86, 67.93], ["S", 215.79, 135.86], ["I", 357.65, 67.93], ["O", 431.58, 139.94], ["N", 577.52, 135.86]];
const visionLetters = VISION_LETTERS.map(([ch, lx, lw], n) => {
  const left = WORD_STRIP_X[LAST] + lx, right = left + lw;
  const own = shapes.filter((sh) => {
    const [x, y] = shapePosition(sh, TOTAL_MOVE);
    return x + TOTAL_MOVE >= left - 1 && x + TOTAL_MOVE < right - 1 && Math.abs(y - WORD_Y) < 140;
  });
  const box = { x0: left - TOTAL_MOVE, x1: right - TOTAL_MOVE, y0: WORD_Y, y1: WORD_Y + 135.86 };
  const organic = ABOUT_ORGANIC[n];
  const parts = organic.d.split(/(?=M)/).map((part) => part.trim());
  // the organic letter sits right on its sharp letter: the middle of its outline on the middle of the letter
  // (Figma's VISION letters are about 11% taller than their letters, the project titles' only about 3%:
  //  ORGANIC_SIZE makes them the same proportion as the other titles, so they don't hang down)
  const raw = outlinePoints(parts[0], 0, 0);
  const ox = (Math.min(...raw.map((p) => p[0])) + Math.max(...raw.map((p) => p[0]))) / 2;
  const oy = (Math.min(...raw.map((p) => p[1])) + Math.max(...raw.map((p) => p[1]))) / 2;
  const cxL = (box.x0 + box.x1) / 2, cyL = (box.y0 + box.y1) / 2;
  const place = (pts) => pts.map(([x, y]) => [cxL + (x - ox) * ORGANIC_SIZE, cyL + (y - oy) * ORGANIC_SIZE]);
  const outer = place(raw);
  // its own goo: soften the shapes, then cut them sharp again, so touching parts flow into each other
  const filterId = "about-goo-" + n;
  const filter = document.createElementNS(SVG_NS, "filter");
  filter.setAttribute("id", filterId);
  filter.setAttribute("x", "-30%"); filter.setAttribute("y", "-30%");
  filter.setAttribute("width", "160%"); filter.setAttribute("height", "160%");
  const blur = document.createElementNS(SVG_NS, "feGaussianBlur");
  blur.setAttribute("in", "SourceGraphic");
  blur.setAttribute("stdDeviation", "0");
  const sharpen = document.createElementNS(SVG_NS, "feColorMatrix");
  sharpen.setAttribute("type", "matrix");
  sharpen.setAttribute("values", "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11");
  filter.append(blur, sharpen);
  morphDefs.appendChild(filter);
  const group = document.createElementNS(SVG_NS, "g");
  morphSvg.appendChild(group);
  const L = { outer, group, blur, filterId, t: 0, target: 0, from: middleOf(outer), leaveTimer: null, shapes: [], holes: [] };
  own.forEach((sh) => {
    const [x, y] = shapePosition(sh, TOTAL_MOVE);
    const from = outlinePoints(ABOUT_SHAPES[sh.shape][2], x, y);
    const path = document.createElementNS(SVG_NS, "path");
    path.style.visibility = "hidden";
    group.appendChild(path);
    L.shapes.push({ el: sh.el, path, from, to: lineUp(from, outer) });
  });
  parts.slice(1).forEach((part) => {   // the holes (O), drawn in the background colour on top
    const points = place(outlinePoints(part, 0, 0));
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", "about-morph-hole");
    path.style.visibility = "hidden";
    morphSvg.appendChild(path);
    L.holes.push({ path, points, middle: middleOf(points) });
  });
  return L;
});

// how much later each point starts: the further from where the mouse touched, the later
function delays(L) {
  const all = L.shapes.flatMap((sh) => sh.from);
  const far = Math.max(...all.map((p) => Math.hypot(p[0] - L.from[0], p[1] - L.from[1])), 1);
  L.shapes.forEach((sh) => { sh.delay = sh.from.map((p) => OOZE_SPREAD * Math.hypot(p[0] - L.from[0], p[1] - L.from[1]) / far); });
}
function drawLetter(L) {
  const showing = L.t > 0;
  const goo = GOO * Math.sin(Math.PI * L.t) ** 0.8;   // the melting: none at the start and the end, strongest halfway
  if (goo > 0.05) { L.blur.setAttribute("stdDeviation", goo.toFixed(2)); L.group.setAttribute("filter", `url(#${L.filterId})`); }
  else L.group.removeAttribute("filter");
  L.shapes.forEach((sh) => {
    sh.el.style.visibility = showing ? "hidden" : "";   // the real shape hides while reshaping
    sh.path.style.visibility = showing ? "visible" : "hidden";
    if (!showing) return;
    sh.path.setAttribute("d", pathFrom(sh.from.map((p, i) => {
      const e = ooze(clamp01(L.t * (1 + OOZE_SPREAD) - sh.delay[i]));
      return [p[0] + (sh.to[i][0] - p[0]) * e, p[1] + (sh.to[i][1] - p[1]) * e];
    })));
  });
  L.holes.forEach(({ path, points, middle }) => {
    const e = ooze(clamp01(L.t * (1 + OOZE_SPREAD) - OOZE_SPREAD * 0.6));
    path.style.visibility = showing && e > 0 ? "visible" : "hidden";
    path.setAttribute("d", pathFrom(points.map((p) => [middle[0] + (p[0] - middle[0]) * e, middle[1] + (p[1] - middle[1]) * e])));
  });
}
// one animation loop for the whole word
let morphLast = null, morphRunning = false;
function morphFrame(now) {
  const step = morphLast === null ? 0 : (now - morphLast) / MORPH_TIME;
  morphLast = now;
  let busy = false;
  visionLetters.forEach((L) => {
    if (L.t === L.target) return;
    L.t = L.target > L.t ? Math.min(L.target, L.t + step) : Math.max(L.target, L.t - step);
    drawLetter(L);
    if (L.t !== L.target) busy = true;
  });
  if (busy) requestAnimationFrame(morphFrame);
  else { morphRunning = false; morphLast = null; }
}
function goTo(L, value) {
  L.target = value;
  if (!morphRunning) { morphRunning = true; requestAnimationFrame(morphFrame); }
}

// each letter has a spot that feels the mouse: around its shapes and its organic shape
visionLetters.forEach((L) => {
  const pts = L.shapes.flatMap((sh) => sh.from).concat(L.outer);
  L.area = { x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])),
             y0: Math.min(...pts.map((p) => p[1])), y1: Math.max(...pts.map((p) => p[1])) };
  const el = document.createElement("div");
  el.className = "about-letter-hover";
  stage.appendChild(el);
  L.el = el;
  el.addEventListener("mouseenter", (event) => {
    clearTimeout(L.leaveTimer);
    if (L.t === 0) {
      // the ooze starts where the mouse came in
      const b = el.getBoundingClientRect();
      L.from = [L.area.x0 + ((event.clientX - b.left) / b.width) * (L.area.x1 - L.area.x0),
                L.area.y0 + ((event.clientY - b.top) / b.height) * (L.area.y1 - L.area.y0)];
      delays(L);
    }
    goTo(L, 1);
  });
  // it stays organic for a moment, then oozes back
  el.addEventListener("mouseleave", () => {
    clearTimeout(L.leaveTimer);
    L.leaveTimer = setTimeout(() => goTo(L, 0), STAY_TIME);
  });
});

// Called by draw(): the drawing and the hover spots follow the screen; they only work at the very end
function placeMorph(moved, u, screenH) {
  const atEnd = moved >= TOTAL_MOVE - 0.5;
  stage.classList.toggle("is-at-end", atEnd);
  if (!atEnd) visionLetters.forEach((L) => { if (L.target !== 0) { clearTimeout(L.leaveTimer); goTo(L, 0); } });
  const w = stage.clientWidth / u, h = screenH / u;
  morphSvg.setAttribute("viewBox", `0 ${(WORD_MID - h / 2).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
  visionLetters.forEach((L) => {
    L.el.style.left = L.area.x0 * u + "px";
    L.el.style.top = screenH / 2 + (L.area.y0 - WORD_MID) * u + "px";
    L.el.style.width = (L.area.x1 - L.area.x0) * u + "px";
    L.el.style.height = (L.area.y1 - L.area.y0) * u + "px";
  });
}

// ----- The typewriter: the bar blinks, the letters are typed one by one, then the bar blinks on -----
// The scrolling types it: once it is reached only its bar shows (blinking); then the further you scroll,
// the more letters are typed (scrolling back takes them away). When the scrolling stops, even in the
// middle of a word, the typing stops and the bar blinks. It is fully typed within TEXT_APPEAR, so always
// before the next word starts.
const BAR_FIRST = 15;       // how far you scroll with only the bar showing, before the first letter
const PER_LETTER = 10;      // how far you scroll for each letter (about units)
// How far you scroll while a text is being typed (from its bar appearing until its last letter)
function typingLength(i) { return BAR_FIRST + (TEXTS[i].text.length - 1) * PER_LETTER; }
// How much a text stays behind the moving page: it stands still while it is typed, so afterwards it is
// that much further right than its place on the strip (it never jumps)
function typingHold(i, moved) {
  const t = TEXTS[i];
  if (t.appear === undefined) return 0;
  return Math.min(Math.max(moved - t.appear, 0), typingLength(i));
}
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
const EXTRA_MOVE = Math.max(0, TEXTS[LAST_TEXT].stripX + typingLength(LAST_TEXT) + TEXTS[LAST_TEXT].text.length * LETTER_WIDTH + 30 - TOTAL_MOVE);

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
