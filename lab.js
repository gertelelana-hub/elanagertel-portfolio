// ===== Project pages ("The Memory Lab", "The Israeli Cactus") =====
// Draws the project title with the same black shapes as the home page, and again in white at the
// bottom of the page. Clicking the first screen scrolls down to the pictures (they slide up over the
// title, which stays). All positions are in Figma pixels (the frame is 1440 wide).
// Each page loads its own title first: TITLE_PIECES, TITLE_TOP, TITLE_SCALE and ORGANIC_LETTERS
// (lab-organic.js for The Memory Lab, cactus-title.js for The Israeli Cactus).

const SVG_NS = "http://www.w3.org/2000/svg";

// Put an element at [x, y] (Figma pixels). The CSS reads --x and --y.
function place(el, point) {
  el.style.setProperty("--x", point[0]);
  el.style.setProperty("--y", point[1]);
}

// ----- Create the shapes: the black title at the top and the white one at the bottom -----
// Each shape is an <svg> right in the page, so it gets the same thin outline as on the home page
// (touching shapes look merged, with no white line between them).
// The black title goes in the first screen (which stays while you scroll), the white one in the
// black end, in a box that the CSS puts in the middle of the screen at the end of the page.
const titleShapes = [];
const footerTitle = document.getElementById("lab-footer-title");
[false, true].forEach((white) => {
  TITLE_PIECES.forEach(([number, width, x, y]) => {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", white ? "flow-piece lab-piece lab-piece-white" : "flow-piece lab-piece");
    svg.setAttribute("aria-hidden", "true");
    svg.style.setProperty("--w", width * TITLE_SCALE);
    place(svg, white ? [x, y - TITLE_TOP] : [x, y]);
    (white ? footerTitle : document.getElementById("lab-first")).appendChild(svg);
    titleShapes.push({ svg, file: "flow-piece-" + number + ".svg", white, x, y, width: width * TITLE_SCALE });
  });
});

// The outlines come from pieces.js (loaded before this file), so the title is drawn right away,
// before the page is first shown: coming from the home page, the title is simply there.
function drawShapes() {
  titleShapes.forEach((shape) => {
    const { viewBox, outlines } = PIECE_SHAPES[shape.file];
    shape.svg.setAttribute("viewBox", viewBox);
    outlines.forEach((d) => {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", d);
      shape.svg.appendChild(path);
    });
  });
}
drawShapes();

// ----- The white title only shows over the black end -----
// While you scroll, everything of it above the top of the black end is cut off,
// so the title turns white exactly where the black end passes behind it.
const whiteLayer = document.getElementById("lab-white");
if (whiteLayer) {
  const footer = document.querySelector(".lab-footer");
  const cutWhite = () => {
    const cut = footer.getBoundingClientRect().top - whiteLayer.getBoundingClientRect().top;
    whiteLayer.style.clipPath = `inset(${Math.max(0, cut)}px 0 0 0)`;
  };
  window.addEventListener("scroll", cutWhite, { passive: true });
  window.addEventListener("resize", cutWhite);
  cutWhite();
}

// ----- Clicking the first screen scrolls down until the first picture is in the middle -----
// (a page without pictures yet scrolls down to its black end instead)
document.getElementById("lab-first-screen").addEventListener("click", () => {
  const firstPicture = document.querySelector(".lab-media");
  if (firstPicture) firstPicture.scrollIntoView({ behavior: "smooth", block: "center" });
  else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
});

// ----- Hovering a letter: its shapes ooze into the letter's organic shape, like slime -----
// (The organic letters are in the page's title file: ORGANIC_LETTERS.)
// Each shape's outline and its letter's organic outline are turned into the same number of points;
// every point slides from one outline to the other, so the shapes melt into the organic letter
// (all shapes of a letter end up as the same organic shape, on top of each other).
// Like slime: the change starts where the mouse touched the letter and oozes outward, and while it
// changes the shapes melt together like liquid (a "goo" filter: soften, then cut sharp again);
// the melting fades out as the letter arrives, so it ends crisp on the organic shape.
// The holes (O, R, A, B) grow in from their middle. Each letter reacts on its own and stays
// organic for a moment after the mouse leaves, so a quick sweep leaves a few organic together.
const MORPH_POINTS = 120;   // points on each outline
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const MORPH_TIME = REDUCED ? 1 : 1100;   // ms for a whole letter to change
const OOZE_SPREAD = 0.3;                 // how much later the far points start (part of the time)
const STAY_TIME = 700;                   // ms a letter stays organic after the mouse leaves
const GOO = 7;                           // how soft the shapes melt together halfway (Figma pixels)

// A hidden <svg> to measure outlines in
const measureSvg = document.createElementNS(SVG_NS, "svg");
measureSvg.setAttribute("class", "lab-measure");
document.body.appendChild(measureSvg);

// Points along an outline (d), turned into page positions by toPage([x, y])
function outlinePoints(d, toPage) {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", d);
  measureSvg.appendChild(path);
  const length = path.getTotalLength();
  const points = [];
  for (let i = 0; i < MORPH_POINTS; i++) {
    const p = path.getPointAtLength((length * i) / MORPH_POINTS);
    points.push(toPage([p.x, p.y]));
  }
  path.remove();
  return points;
}

// Which way an outline goes round (clockwise or not)
function turning(points) {
  let area = 0;
  points.forEach((p, i) => { const q = points[(i + 1) % points.length]; area += p[0] * q[1] - q[0] * p[1]; });
  return Math.sign(area);
}

// Line up the target's points with the shape's points (same direction, nearest starting point),
// so every point travels as little as possible
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

function pathFrom(points) {
  return "M" + points.map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L") + "Z";
}

// Thick and gooey: a slow start and a soft stop, never past the shape
function ooze(p) {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  return p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
}
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function setUpMorph(white) {
  const container = white ? footerTitle : document.getElementById("lab-first");
  const top = white ? TITLE_TOP : 0;   // the white title's box starts at the title's top edge

  // the drawing that shows the reshaping (on top of the shapes, in the same place);
  // it covers the title's band only (y 255 to 775), so it never makes the page longer
  const drawing = document.createElementNS(SVG_NS, "svg");
  drawing.setAttribute("class", white ? "lab-morph lab-morph-white" : "lab-morph");
  drawing.setAttribute("viewBox", "0 255 1440 520");
  drawing.style.top = `calc(${255 - top} * var(--u))`;
  drawing.setAttribute("aria-hidden", "true");
  container.appendChild(drawing);

  const defs = document.createElementNS(SVG_NS, "defs");
  drawing.appendChild(defs);

  // the organic letters: outer outline and holes, in page positions
  const letters = ORGANIC_LETTERS.map((organic, n) => {
    const parts = organic.d.split(/(?=M)/).map((part) => part.trim());
    const toPage = ([x, y]) => [organic.x + x, organic.y + y];
    const outer = outlinePoints(parts[0], toPage);
    const middle = [outer.reduce((a, p) => a + p[0], 0) / outer.length, outer.reduce((a, p) => a + p[1], 0) / outer.length];
    // the letter's own goo filter: blur the shapes, then make the edge sharp again, so touching
    // parts flow into each other like drops of liquid
    const filterId = (white ? "goo-white-" : "goo-") + n;
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
    defs.appendChild(filter);
    const group = document.createElementNS(SVG_NS, "g");
    drawing.appendChild(group);
    return { outer, middle, holeOutlines: parts.slice(1).map((part) => outlinePoints(part, toPage)),
             shapes: [], holes: [], t: 0, target: 0, from: middle, leaveTimer: null, group, blur, filterId };
  });

  // every shape: its own outline, and the same number of points on its letter's organic outline
  titleShapes.filter((shape) => shape.white === white).forEach((shape) => {
    const [vx, vy, vw] = shape.svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
    const scale = shape.width / vw;
    const toPage = ([x, y]) => [shape.x + (x - vx) * scale, shape.y + (y - vy) * scale];
    const d = [...shape.svg.querySelectorAll("path")].map((path) => path.getAttribute("d")).join(" ");
    const from = outlinePoints(d, toPage);
    // its letter: the organic letter whose middle is nearest
    const cx = from.reduce((a, p) => a + p[0], 0) / from.length, cy = from.reduce((a, p) => a + p[1], 0) / from.length;
    const letter = letters.reduce((best, l) => (Math.hypot(l.middle[0] - cx, l.middle[1] - cy) < Math.hypot(best.middle[0] - cx, best.middle[1] - cy) ? l : best));
    const path = document.createElementNS(SVG_NS, "path");
    path.style.visibility = "hidden";
    letter.group.appendChild(path);
    letter.shapes.push({ svg: shape.svg, path, from, to: lineUp(from, letter.outer) });
  });
  // the holes, drawn in the background colour on top
  letters.forEach((letter) => letter.holeOutlines.forEach((points) => {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", "lab-morph-hole");
    path.style.visibility = "hidden";
    drawing.appendChild(path);
    const mx = points.reduce((a, p) => a + p[0], 0) / points.length, my = points.reduce((a, p) => a + p[1], 0) / points.length;
    letter.holes.push({ path, points, middle: [mx, my] });
  }));

  // how much later each point starts: the further from where the mouse touched, the later
  function delays(letter) {
    const all = letter.shapes.flatMap((s) => s.from);
    const far = Math.max(...all.map((p) => Math.hypot(p[0] - letter.from[0], p[1] - letter.from[1])), 1);
    letter.shapes.forEach((s) => {
      s.delay = s.from.map((p) => OOZE_SPREAD * Math.hypot(p[0] - letter.from[0], p[1] - letter.from[1]) / far);
    });
  }

  function draw(letter) {
    const showing = letter.t > 0;
    // the melting: none at the start and the end, strongest halfway
    const goo = GOO * Math.sin(Math.PI * letter.t) ** 0.8;
    if (goo > 0.05) {
      letter.blur.setAttribute("stdDeviation", goo.toFixed(2));
      letter.group.setAttribute("filter", `url(#${letter.filterId})`);
    } else {
      letter.group.removeAttribute("filter");
    }
    letter.shapes.forEach((s) => {
      s.svg.classList.toggle("is-reshaping", showing);   // the real shape hides while reshaping
      s.path.style.visibility = showing ? "visible" : "hidden";
      if (!showing) return;
      s.path.setAttribute("d", pathFrom(s.from.map((p, i) => {
        // each point runs its own part of the time: it starts later the further it is
        const e = ooze(clamp01((letter.t * (1 + OOZE_SPREAD) - s.delay[i]) / 1));
        return [p[0] + (s.to[i][0] - p[0]) * e, p[1] + (s.to[i][1] - p[1]) * e];
      })));
    });
    letter.holes.forEach(({ path, points, middle }) => {
      const e = ooze(clamp01((letter.t * (1 + OOZE_SPREAD) - OOZE_SPREAD * 0.6) / 1));
      path.style.visibility = showing && e > 0 ? "visible" : "hidden";
      path.setAttribute("d", pathFrom(points.map((p) => [middle[0] + (p[0] - middle[0]) * e, middle[1] + (p[1] - middle[1]) * e])));
    });
  }

  // play every letter that is changing; one animation loop for the whole title
  let last = null, running = false;
  function frame(now) {
    const step = last === null ? 0 : (now - last) / MORPH_TIME;
    last = now;
    let busy = false;
    letters.forEach((letter) => {
      if (letter.t === letter.target) return;
      letter.t = letter.target > letter.t ? Math.min(letter.target, letter.t + step) : Math.max(letter.target, letter.t - step);
      draw(letter);
      if (letter.t !== letter.target) busy = true;
    });
    if (busy) requestAnimationFrame(frame);
    else { running = false; last = null; }
  }
  function goTo(letter, value) {
    letter.target = value;
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  // each letter has its own spot that feels the mouse: around its shapes and its organic shape
  letters.forEach((letter) => {
    const pts = letter.shapes.flatMap((s) => s.from).concat(letter.outer);
    const x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0]));
    const y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
    const area = document.createElement("div");
    area.className = "lab-title-hover";
    place(area, [x0, y0 - top]);
    area.style.setProperty("--w", x1 - x0);
    area.style.setProperty("--h", y1 - y0);
    container.appendChild(area);
    area.addEventListener("mouseenter", (event) => {
      clearTimeout(letter.leaveTimer);
      if (letter.t === 0) {
        // the ooze starts where the mouse came in (in page positions)
        const box = area.getBoundingClientRect();
        letter.from = [x0 + ((event.clientX - box.left) / box.width) * (x1 - x0), y0 + ((event.clientY - box.top) / box.height) * (y1 - y0)];
        delays(letter);
      }
      goTo(letter, 1);
    });
    // it stays organic for a moment, then oozes back
    area.addEventListener("mouseleave", () => {
      clearTimeout(letter.leaveTimer);
      letter.leaveTimer = setTimeout(() => goTo(letter, 0), STAY_TIME);
    });
    // the first screen's title still scrolls down when clicked (it lies over the big button)
    if (!white) area.addEventListener("click", () => document.getElementById("lab-first-screen").click());
  });
}

// Hovering the titles: their letters ooze into organic shapes (both titles are drawn by now)
setUpMorph(false);   // the black title (first screen)
setUpMorph(true);    // the white title
