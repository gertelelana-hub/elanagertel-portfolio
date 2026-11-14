// ===== Home page: the opening animation and the project gallery =====
// Figma flow: frame 77 (scattered) → 76 ("ELANA GERTEL") → 75 (gallery).
//   - Opening: the scattered black shapes (FLOW_PIECES in home-moves.js) slide into "ELANA GERTEL"
//     from outside the word in a few long straight slides of 0.55s each, like the move to
//     "THE MEMORY LAB" (FLOW_TIMELINE).
//   - Then each letter moves to the gallery as one block, and the project pictures, names and
//     years (ITEMS below) slide in from the edges like puzzle pieces (ITEM_TIMELINE).
//     Before that they wait outside the page.
// All positions are in home units: Figma pixels divided by HOME_SCALE. In Figma the home shapes got
// smaller (like the project titles); here they keep one size (68) and the page draws everything
// HOME_SCALE times as big (.flow in styles.css uses the same number).
const HOME_SCALE = 0.9351;

// Timing (milliseconds) — must match the planning scripts
const START_PAUSE = 800;    // the scattered shapes stay still for 0.8s, like in Figma
const LAST_SLIDE = 550;     // extra time after the last planned move, before hovering turns on
const STEP_PAUSE = 800;     // pause once "ELANA GERTEL" is complete

// When each part starts: 0 = the opening (74 → 71), 1 = letters and cards into the gallery (71 → 70)
const STEP_STARTS = [0, FLOW_STEP_ENDS[0] + STEP_PAUSE];

// ----- Project pictures and names -----
// at: [x, y] in frames 77, 76, 75 (home units). null = not on the page yet (it slides in from the edge later).
// Pictures: "kind" picks the picture and how it is cropped (see .photo-… in styles.css).
// caption / year: shown under / above the picture while it is hovered (Figma: Component 2).
const ITEMS = [
  // pictures
  { type: "photo", kind: "house",   alt: "Double Families", caption: "Double Families", year: "2023", at: [[1705.7, 761.42], [1705.7, 761.42], [1046.76, 631.73]] },
  { type: "photo", kind: "cactus",  alt: "The Israeli Cactus", caption: "The Israeli Cactus", year: "2023", at: [[-434.18, 937.87], [-434.18, 937.87], [350.27, 635.81]],
    link: "israeli-cactus.html", toTitle: "cactus" },   // opens the project page (moves: to-cactus-moves.js)
  { type: "photo", kind: "mind",    alt: "The Memory Lab",  caption: "The Memory Lab", year: "2023", at: [[-391.4, 425.62], [-238.76, 389.96], [344.53, 327.42]],
    link: "memory-lab.html", toTitle: "lab" },          // "mind": opens the project page (moves: to-lab-moves.js)
  { type: "photo", kind: "sense",   alt: "Sense",           caption: "Sense", year: "2023", at: [[1764.52, -18.18], [1764.52, -18.18], [1052.93, 19.25]],
    link: "sense.html", toTitle: "sense" },                // opens the project page (moves: to-sense-moves.js)
  { type: "photo", kind: "archive", alt: "",                at: [[1578.44, 1454.39], [1578.44, 1454.39], [1335.19, 1247.51]] },
  { type: "photo", kind: "archive", alt: "Israeli Movie Archive", at: [[-349.7, 1797.67], [-349.7, 1797.67], [1335.19, 172.75]],
    link: "israeli-movie-archive.html", toTitle: "archive" },   // opens the project page (moves: to-archive-moves.js)
  { type: "photo", kind: "water-b", alt: "The Memory Lab",  caption: "The Memory Lab", at: [null, null, [344.78, 1091.6]] },
  { type: "photo", kind: "house",   alt: "Double Families", caption: "Double Families", year: "2023", at: [null, null, [689.81, 1613.67]] },

  // project names (width in Figma pixels; text centred inside it). They show in the opening only:
  // in the gallery each picture shows its own caption while hovered (see "caption" above)
  { type: "name", text: "Shintana",          width: 124, at: [[-255.59, 994.55], [-255.59, 994.55], [382.27, 868.32]] },
  { type: "name", text: "Double Families",   width: 192, at: [[1846.86, 808.47], [1846.86, 808.47], [1129.86, 696.56]] },
  { type: "name", text: "The  \nMemory Lab", width: 175, at: [[-217.09, 457.71], [-217.09, 457.71], [564.7, 372.75]],
    finalText: "The  \nMemory\nLab", finalWidth: 118 },
  { type: "name", text: "The  \nMemory Lab", width: 175, at: [[1944.18, 31.01], [1944.18, 31.01], [1194.53, 66.72]],
    finalText: "The  \nMemory\nLab", finalWidth: 118 },
  { type: "name", text: "The  \nMemory\nLab", width: 118, at: [null, null, [567.66, 1174.36]] },
  { type: "name", text: "Double Families",   width: 192, at: [null, null, [818.89, 1657.11]] },

  // years ("2023" next to The Memory Lab waits outside the frame and comes in with the gallery)
  { type: "year", text: "2023", at: [[-94.11, 436.32], [-86.62, 436.32], [632.55, 353.01]] },
  { type: "year", text: "2023", at: [[1994.44, 787.08], [1994.44, 787.08], [1267.32, 676.81]] },
  { type: "year", text: "2023", at: [[-141.16, 963.53], [-141.16, 963.53], [488.42, 839.7]] },
  { type: "year", text: "2023", at: [[2069.3, 14.97], [2069.3, 14.97], [1279.17, 50.92]] }, // comes in with The Memory Lab (top right)
  { type: "year", text: "2023", at: [null, null, [956.35, 1637.36]] },
];

// Which picture file each kind of picture uses
const PHOTO_FILES = {
  "house": "gallery-house.png",
  "brain": "gallery-brain.png",
  "archive": "gallery-archive.jpg",   // the new picture (Figma "לפיגמה ץץץ"): the Israeli Movie Archive
  "mind": "gallery-brain.png",   // the same brain picture, cropped differently
  "cactus": "gallery-cactus.png",
  "sense": "gallery-sense.jpg",
  "water-a": "gallery-watercolor.png",
  "water-b": "gallery-watercolor.png",
};

const flow = document.getElementById("flow");

// Put an element at [x, y] (Figma pixels). The CSS reads --x and --y.
function place(el, point) {
  el.style.setProperty("--x", point[0]);
  el.style.setProperty("--y", point[1]);
}

// Slide an element in one straight line, taking `duration` milliseconds
function slide(el, axis, value, duration) {
  el.style.transitionDuration = duration + "ms";
  el.style.setProperty(axis === 0 ? "--x" : "--y", value);
}

// ----- Create the shapes -----
// Each shape is drawn as an <svg> right in the page (not an <img>), so it can have a thin black
// outline that reaches past its edge: touching shapes then overlap a tiny bit and look merged,
// with no white hairline between them (see .flow-piece in styles.css).
const SVG_NS = "http://www.w3.org/2000/svg";
const pieceElements = FLOW_PIECES.map((piece) => {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "flow-piece");
  svg.setAttribute("aria-hidden", "true");
  svg.style.setProperty("--w", piece.width);
  place(svg, piece.path[0]);
  flow.appendChild(svg);
  return svg;
});

// Load each shape file once (remembered), and copy its outline into an <svg>
const shapeFiles = new Map();
function loadShape(file) {
  if (!shapeFiles.has(file)) {
    shapeFiles.set(file, fetch("images/" + file).then((answer) => answer.text()).then((text) => {
      const source = new DOMParser().parseFromString(text, "image/svg+xml").documentElement;
      // close every outline, so the thin outline goes all the way round
      const outlines = [...source.querySelectorAll("path")].map((path) =>
        path.getAttribute("d").replace(/([^Zz\s])\s*M/g, "$1Z M").replace(/([^Zz\s])\s*$/, "$1Z"));
      return { viewBox: source.getAttribute("viewBox"), outlines };
    }));
  }
  return shapeFiles.get(file);
}

async function drawShape(svg, file) {
  const { viewBox, outlines } = await loadShape(file);
  svg.setAttribute("viewBox", viewBox);
  outlines.forEach((d) => {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
  });
}

FLOW_PIECES.forEach((piece, i) => drawShape(pieceElements[i], piece.file));

// ----- Create the pictures, names and years -----
const itemElements = ITEMS.map((item) => {
  let el;
  if (item.type === "photo") {
    // a window that shows part of the picture (the crop comes from Figma); a link if it opens a page
    el = document.createElement(item.link ? "a" : "div");
    if (item.link) el.href = item.link;
    el.className = "flow-photo photo-" + item.kind;
    const crop = document.createElement("div");
    crop.className = "flow-photo-window";
    const img = document.createElement("img");
    img.src = "images/" + PHOTO_FILES[item.kind];
    img.alt = item.alt;
    crop.append(img);   // always sharp (no blur)
    el.appendChild(crop);
    // the caption and year, hidden until the picture is hovered
    [["flow-photo-caption", item.caption], ["flow-photo-year", item.year]].forEach(([name, text]) => {
      if (!text) return;
      const label = document.createElement("span");
      label.className = name;
      label.setAttribute("aria-hidden", "true");   // the picture's alt already says it
      label.textContent = text;
      el.appendChild(label);
    });
  } else {
    el = document.createElement("p");
    el.className = item.type === "name" ? "flow-name" : "flow-year";
    el.textContent = item.text;
    if (item.width) el.style.setProperty("--w", item.width);
  }
  const first = item.at.find((p) => p !== null);
  place(el, first);
  if (item.at[0] === null) el.classList.add("is-hidden"); // appears later
  flow.appendChild(el);
  return el;
});

// Move every picture/name to its place in frame number `frame` (0 = 77, 1 = 76, 2 = 75)
function glideItemsTo(frame) {
  ITEMS.forEach((item, i) => {
    const el = itemElements[i];
    const point = item.at[frame];
    if (point === null) return;
    place(el, point);
    el.classList.remove("is-hidden");
    // in the gallery, "The Memory Lab" breaks into three lines
    if (frame === 2 && item.finalText) {
      el.textContent = item.finalText;
      el.style.setProperty("--w", item.finalWidth);
    }
  });
}

// Step 3 begins: the pictures, names and years jump (unseen, outside the page) to where they
// start sliding in from — each project card keeps its layout (ITEM_STARTS in home-moves.js)
function getItemsReadyAtEdges() {
  flow.classList.add("no-item-transition");
  ITEMS.forEach((item, i) => {
    const el = itemElements[i];
    place(el, ITEM_STARTS[i]); // (items that don't move start where they already are)
    el.classList.remove("is-hidden");
    // in the gallery, "The Memory Lab" breaks into three lines
    if (item.finalText) {
      el.textContent = item.finalText;
      el.style.setProperty("--w", item.finalWidth);
    }
  });
  void flow.offsetWidth; // let the browser draw the jump before transitions come back
  flow.classList.remove("no-item-transition");
  flow.classList.add("is-step-3"); // from now on they slide like the shapes
}

// ----- Hovering in the gallery (the plans are in hover-moves.js) -----
// Hovering any picture scatters the shapes; a big letter is pushed away by the mouse like a magnet,
// and the letters and cards near it make room. Like a sliding puzzle: each move is one straight slide, and a new move starts only when
// something changes direction. When the mouse leaves a letter, the same moves play backwards;
// when it leaves a picture, everything glides straight home in one quick motion.
// A new hover effect starts only once the previous one is back home.
let wanted = null;      // which effect the mouse asks for now: "scatter" ("mind"), "scatter-N" (picture N),
                        // a letter's plan, or null
let showing = null;     // which effect is out right now (null = the gallery is at rest)
let busy = false;       // true while an effect is moving

function planFor(key) {
  if (key === "scatter") return HOVER_SCATTER;                          // "mind": Figma's scatter
  if (typeof key === "string") return PHOTO_SCATTERS[key.split("-")[1]]; // another picture: its own scatter
  return key;
}

// The mouse and the letters are like magnets that cannot touch: the mouse pushes a letter the way
// the mouse is moving. If the mouse is almost still, the letter moves away from the side it came from.
// If there is no room that way, it tries the two sideways directions, and last the opposite one.
let mouseMove = [0, 0];   // how the mouse moved lately (pixels)
let lastMouse = null;
document.addEventListener("mousemove", (event) => {
  if (lastMouse) {
    // keep a smooth average of the latest movements
    mouseMove = [mouseMove[0] * 0.5 + (event.clientX - lastMouse[0]), mouseMove[1] * 0.5 + (event.clientY - lastMouse[1])];
  }
  lastMouse = [event.clientX, event.clientY];
});

function escapePlan(letter, area, event) {
  let [pushX, pushY] = mouseMove;
  if (Math.hypot(pushX, pushY) < 3) {
    // almost still: push away from where the mouse is
    const box = area.getBoundingClientRect();
    pushX = (box.left + box.width / 2) - event.clientX;
    pushY = (box.top + box.height / 2) - event.clientY;
  }
  const alongX = pushX > 0 ? "right" : "left";
  const alongY = pushY > 0 ? "down" : "up";
  const backX = pushX > 0 ? "left" : "right";
  const backY = pushY > 0 ? "up" : "down";
  const order = Math.abs(pushX) > Math.abs(pushY)
    ? [alongX, alongY, backY, backX]
    : [alongY, alongX, backX, backY];
  const direction = order.find((d) => letter.plans[d]);
  return letter.plans[direction];
}

// Play a plan forwards (out = true) or backwards (back home)
function playPlan(plan, out, done) {
  plan.moves.forEach(([time, kind, i, from, to, duration]) => {
    const el = kind === "p" ? pieceElements[i] : itemElements[i];
    // backwards: each move starts as long before the end as it started after the beginning
    const start = out ? time : plan.total - time - duration;
    const target = out ? to : from;
    setTimeout(() => {
      el.style.transitionDuration = duration + "ms";
      el.style.transitionTimingFunction = plan.ease || "";   // letters: a quick magnet push
      place(el, target);
    }, start);
  });
  setTimeout(done, plan.total);
}

// After hovering a picture: everything goes straight home together, in one quick glide
// (not the puzzle moves backwards)
const RETURN_TIME = 400;   // ms
function glideHome(plan, done) {
  const home = new Map();   // each element's place before the plan moved it: the "from" of its first move
  [...plan.moves].sort((a, b) => a[0] - b[0]).forEach(([time, kind, i, from]) => {
    const el = kind === "p" ? pieceElements[i] : itemElements[i];
    if (!home.has(el)) home.set(el, from);
  });
  home.forEach((point, el) => {
    el.style.transitionDuration = RETURN_TIME + "ms";
    el.style.transitionTimingFunction = "cubic-bezier(0.33, 1, 0.68, 1)";   // quick start, soft stop
    place(el, point);
  });
  setTimeout(done, RETURN_TIME);
}

// Bring the gallery to what the mouse asks for, one effect at a time
function updateHover() {
  if (busy || leaving || !flow.classList.contains("is-done")) return;
  if (showing !== null && showing !== wanted) {
    busy = true;
    const backHome = () => { busy = false; showing = null; updateHover(); };
    if (typeof showing === "string") glideHome(planFor(showing), backHome);   // after a picture
    else playPlan(planFor(showing), false, backHome);
  } else if (showing === null && wanted !== null) {
    busy = true;
    showing = wanted;
    playPlan(planFor(showing), true, () => { busy = false; updateHover(); });
  }
}

function hoverOn(key) { wanted = key; updateHover(); }
function hoverOff(key) { if (wanted === key) wanted = null; updateHover(); }

// Phones: a tap also sends "mouse" events (mouseenter, focus…). Those are ignored right after a finger
// touched the screen (window.touchedJustNow, in mobile.js); taps get their own effects instead.
const byFinger = () => typeof window.touchedJustNow === "function" && window.touchedJustNow();
const photoShow = {};      // each picture's show(on) (below), so a tap can use it too

// Every picture scatters the shapes (also when reached with the keyboard), turns sharp,
// and shows its caption and year
ITEMS.forEach((item, i) => {
  if (item.type !== "photo") return;
  const el = itemElements[i];
  function show(on) {
    el.classList.toggle("is-colored", on);
    // each picture scatters the shapes its own way ("mind" like Figma)
    const key = typeof PHOTO_SCATTERS !== "undefined" && PHOTO_SCATTERS[i] ? "scatter-" + i : "scatter";
    on ? hoverOn(key) : hoverOff(key);
  }
  // (a tap on a phone also sends these: then they do nothing, see "tapping a picture" below)
  el.addEventListener("mouseenter", () => { if (!byFinger()) show(true); });
  el.addEventListener("mouseleave", () => { if (!byFinger()) show(false); });
  el.addEventListener("focus", () => { if (!byFinger()) show(true); });
  el.addEventListener("blur", () => { if (!byFinger()) show(false); });
  photoShow[i] = show;
});

// ----- Phones: tapping a picture -----
// The first tap does what hovering does (the shapes scatter, the caption and year show);
// a second tap on the same picture opens its project (see goToProject below).
// A tap anywhere else puts everything back.
let tappedPhoto = null;    // the picture shown by a tap (its number in ITEMS), or null
function tapPhoto(i) {
  if (tappedPhoto !== null && tappedPhoto !== i) photoShow[tappedPhoto](false);
  tappedPhoto = i;
  photoShow[i](true);
}
document.addEventListener("click", (event) => {
  if (tappedPhoto === null || !byFinger() || event.target.closest(".flow-photo")) return;
  photoShow[tappedPhoto](false);
  tappedPhoto = null;
});

// Every big letter: an invisible area over the letter's place in the gallery feels the mouse.
// It is a little bigger than the letter (the magnet reacts just before they touch), and it stays
// put, so the letter can slide away without the mouse "leaving" it.
const MAGNET_REACH = 12;   // Figma pixels
const TAP_LETTER_TIME = 1600;   // ms a tapped letter stays pushed away (phones)
LETTER_HOVER.forEach((letter) => {
  const area = document.createElement("div");
  area.className = "flow-letter-area";
  const [left, top, right, bottom] = letter.area;
  place(area, [left - MAGNET_REACH, top - MAGNET_REACH]);
  area.style.setProperty("--w", right - left + 2 * MAGNET_REACH);
  area.style.setProperty("--h", bottom - top + 2 * MAGNET_REACH);
  let plan = null;   // the escape this letter is doing (or wants to do) for the mouse
  area.addEventListener("mouseenter", (event) => {
    if (byFinger()) return;
    plan = escapePlan(letter, area, event);
    hoverOn(plan);
  });
  area.addEventListener("mouseleave", () => { if (!byFinger()) hoverOff(plan); });
  // Phones: a tap pushes the letter away from the finger, and after a moment it slides back
  let backTimer = null;
  area.addEventListener("click", (event) => {
    if (!byFinger()) return;
    mouseMove = [0, 0];   // a finger does not "move": the letter is pushed away from where it was tapped
    if (plan) hoverOff(plan);
    plan = escapePlan(letter, area, event);
    hoverOn(plan);
    clearTimeout(backTimer);
    const tapped = plan;
    backTimer = setTimeout(() => hoverOff(tapped), TAP_LETTER_TIME);
  });
  flow.appendChild(area);
});

// ----- Clicking a project picture: the shapes puzzle into its title, then the project page opens -----
// "mind" → "THE MEMORY LAB" (to-lab-moves.js), the cactus → "THE ISRAELI CACTUS" (to-cactus-moves.js),
// the women on the grass → "SENSE" (to-sense-moves.js), the cake (top right) → "ISRAELI MOVIE ARCHIVE" (to-archive-moves.js).
// Pictures, names and years slide out; shapes the title does not need leave through an edge, and the
// missing ones come in from an edge. The project page starts with the title in the same place, so the
// change of page is not seen.
let leaving = false;

// The planned moves into a project's title (null if its file did not load)
function titleMoves(name) {
  if (name === "lab" && typeof TO_LAB !== "undefined") return TO_LAB;
  if (name === "cactus" && typeof TO_CACTUS !== "undefined") return TO_CACTUS;
  if (name === "sense" && typeof TO_SENSE !== "undefined") return TO_SENSE;
  if (name === "archive" && typeof TO_ARCHIVE !== "undefined") return TO_ARCHIVE;
  return null;
}

function goToProject(event, i) {
  const link = event.currentTarget.href;
  const plan = titleMoves(ITEMS[i].toTitle);
  event.preventDefault();
  if (leaving) return;
  if (!plan || !flow.classList.contains("is-done") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.location.href = link;   // no animation: open the page right away
    return;
  }
  leaving = true;
  // The title is built right where it is on the project page: its middle (titleMid, home units) in the
  // middle of the screen, level with the side names. The page does not move: the title's place in the
  // plan is moved up or down by `shift` (Figma pixels) instead.
  const u = flow.getBoundingClientRect().width / 1440 * HOME_SCALE;   // one home unit
  const shift = (window.innerHeight / 2 + window.scrollY) / u - plan.titleMid;
  flow.classList.add("is-leaving");
  // the plan starts from the shapes this picture spreads out (the mouse is on it): make sure they are there
  const key = PHOTO_SCATTERS[i] ? "scatter-" + i : "scatter";
  const ready = () => {
    if (busy) { setTimeout(ready, 50); return; }
    if (showing === key) { playToTitle(plan, link, shift, plan.shrink); return; }
    busy = true;
    const spread = () => { showing = key; playPlan(planFor(key), true, () => { busy = false; playToTitle(plan, link, shift, plan.shrink); }); };
    if (showing === null) spread();
    else if (typeof showing === "string") glideHome(planFor(showing), spread);   // first take back another effect
    else playPlan(planFor(showing), false, spread);
  };
  ready();
}

// shift: how far (Figma pixels, down) the title is built from its place in the plan, so that it is
// built where it is on the project page.
// size: the title is built with the home shapes, a little bigger than the project page's title, so
// once it is built it shrinks to that size around the middle of the screen, and then the page opens
function playToTitle(plan, link, shift, size = 1) {
  // the shapes that come in from the edges (they start shifted too, so their way in stays the same)
  const newPieces = plan.newPieces.map((piece) => {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "flow-piece");
    svg.setAttribute("aria-hidden", "true");
    svg.style.setProperty("--w", piece.width);
    place(svg, [piece.start[0], piece.start[1] + shift]);
    flow.appendChild(svg);
    drawShape(svg, piece.file);
    return svg;
  });
  const elementOf = ([kind, n]) => kind === "i" ? itemElements[n]
    : (n < pieceElements.length ? pieceElements[n] : newPieces[n - pieceElements.length]);
  const at = (el) => [parseFloat(el.style.getPropertyValue("--x")), parseFloat(el.style.getPropertyValue("--y"))];

  // The shapes already on the page that go into the title: their last slide up or down is made
  // longer or shorter by `shift` (a shape that only slides sideways gets it in its last slide).
  const moves = plan.moves.map((move) => [...move]);
  plan.bodies.forEach((things, body) => {
    const own = moves.filter((move) => move[1] === body).sort((a, b) => a[0] - b[0]);
    if (!own.length || things[0][0] !== "p" || things[0][1] >= pieceElements.length) return;
    const [x, y] = at(elementOf(things[0]));
    const end = [x + own.reduce((s, m) => s + m[2], 0), y + own.reduce((s, m) => s + m[3], 0)];
    const intoTitle = end[0] > -10 && end[0] < 1440 / HOME_SCALE && end[1] > -10 && end[1] < 1100 / HOME_SCALE;   // the others leave the page
    if (!intoTitle) return;
    const upDown = own.filter((move) => move[2] === 0);
    (upDown.length ? upDown[upDown.length - 1] : own[own.length - 1])[3] += shift;
  });

  // every slide: the whole body (a shape, or a picture with its name and year) moves together
  moves.forEach(([time, body, dx, dy]) => {
    setTimeout(() => {
      plan.bodies[body].forEach((thing) => {
        const el = elementOf(thing);
        el.style.transitionDuration = plan.slide + "ms";
        el.style.transitionTimingFunction = "";
        place(el, [parseFloat(el.style.getPropertyValue("--x")) + dx, parseFloat(el.style.getPropertyValue("--y")) + dy]);
      });
    }, time);
  });
  const SHRINK = 300;   // ms
  setTimeout(() => {
    const box = flow.getBoundingClientRect();
    flow.style.transformOrigin = `${box.width / 2}px ${window.innerHeight / 2 - box.top}px`;
    flow.style.transition = `transform ${SHRINK}ms ease-in-out`;
    flow.style.transform = `scale(${size})`;
  }, plan.total + 150);
  setTimeout(() => { window.location.href = link; }, plan.total + 150 + (size === 1 ? 0 : SHRINK + 50));
}

// (phones: the first tap on a picture only shows it, see "tapping a picture" above; the second opens it)
ITEMS.forEach((item, i) => {
  if (item.type !== "photo") return;
  itemElements[i].addEventListener("click", (event) => {
    if (byFinger() && tappedPhoto !== i) {
      event.preventDefault();
      if (flow.classList.contains("is-done") && !leaving) tapPhoto(i);
      return;
    }
    if (item.link) goToProject(event, i);
  });
});

// The opening is over: the gallery is ready for hovering
function finishOpening() {
  flow.classList.remove("is-animating", "is-step-3");
  flow.classList.add("is-done");
  updateHover(); // in case the mouse is already on something
}

// Show the gallery right away (no animation)
function showGallery() {
  pieceElements.forEach((piece, i) => place(piece, FLOW_PIECES[i].path[2]));
  glideItemsTo(2);
  finishOpening();
}

// ----- Play the opening animation -----
function playOpening() {
  flow.classList.add("is-animating"); // turns on the CSS transitions

  // the shapes: every planned slide at its time (straight slides; a new one only when a shape turns)
  FLOW_TIMELINE.forEach(([time, moves]) => {
    setTimeout(() => {
      moves.forEach(([i, axis, value, duration]) => slide(pieceElements[i], axis, value, duration));
    }, START_PAUSE + time);
  });

  // during the opening everything else waits outside the frame (frame 71 positions)
  setTimeout(() => glideItemsTo(1), START_PAUSE + STEP_STARTS[0]);

  // then they slide in from the edges like puzzle pieces (planned in ITEM_TIMELINE)
  setTimeout(getItemsReadyAtEdges, START_PAUSE + STEP_STARTS[1]);
  ITEM_TIMELINE.forEach(([time, i, axis, value, duration]) => {
    setTimeout(() => slide(itemElements[i], axis, value, duration), START_PAUSE + time);
  });

  const end = START_PAUSE + FLOW_STEP_ENDS[1] + LAST_SLIDE;
  setTimeout(finishOpening, end);
}

// Visitors who asked their device for less motion see the gallery right away, and so does anyone
// coming back from another page through the small name on the edges (index.html?gallery)
// On a phone held upright, the opening waits until the rotate prompt (mobile.js) is gone, so it is not missed.
const skipIntro = new URLSearchParams(window.location.search).has("gallery");
if (skipIntro || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  showGallery();
} else if (window.rotatePrompt) {
  window.rotatePrompt.whenGone(playOpening);
} else {
  playOpening();
}
