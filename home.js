// ===== Home page: the opening animation and the project gallery =====
// Figma flow: frame 74 (scattered) → 71 ("ELANA GERTEL") → 70 (gallery).
//   - Opening: the scattered black shapes (FLOW_PIECES in home-moves.js) slide into "ELANA GERTEL"
//     from outside the word in a few long straight slides of 0.55s each, like the move to
//     "THE MEMORY LAB" (FLOW_TIMELINE).
//   - Then each letter moves to the gallery as one block, and the project pictures, names and
//     years (ITEMS below) slide in from the edges like puzzle pieces (ITEM_TIMELINE).
//     Before that they wait outside the page.
// All positions are in Figma pixels (the frame is 1440 wide); CSS turns them into page sizes.

// Timing (milliseconds) — must match the planning scripts
const START_PAUSE = 800;    // the scattered shapes stay still for 0.8s, like in Figma
const LAST_SLIDE = 550;     // extra time after the last planned move, before hovering turns on
const STEP_PAUSE = 800;     // pause once "ELANA GERTEL" is complete

// When each part starts: 0 = the opening (74 → 71), 1 = letters and cards into the gallery (71 → 70)
const STEP_STARTS = [0, FLOW_STEP_ENDS[0] + STEP_PAUSE];

// ----- Project pictures and names -----
// at: [x, y] in frames 74, 71, 70. null = not on the page yet (it slides in from the edge later).
// Pictures: "kind" picks the picture and how it is cropped (see .photo-… in styles.css).
// caption / year: shown under / above the picture while it is hovered (Figma: Component 2).
const ITEMS = [
  // pictures
  { type: "photo", kind: "house",   alt: "Double Families", caption: "Double Families", year: "2023", at: [[1595, 712], [1595, 712], [961, 712]] },
  { type: "photo", kind: "cactus",  alt: "The Israeli Cactus", caption: "The Israeli Cactus", year: "2023", at: [[-406, 877], [-406, 877], [168, 877]],
    link: "israeli-cactus.html", toTitle: "cactus", titleMid: 512.03 },   // opens the project page (moves: to-cactus-moves.js)
  { type: "photo", kind: "mind",    alt: "The Memory Lab",  caption: "The Memory Lab", year: "2023", at: [[-366, 398], [-366, 398], [330, 395]],
    link: "memory-lab.html", toTitle: "lab", titleMid: 493.75 },          // "mind": opens the project page (moves: to-lab-moves.js)
  { type: "photo", kind: "sense",   alt: "Sense",           caption: "Sense", year: "2023", at: [[1650, -17], [1650, -17], [962, 72]],
    link: "sense.html", toTitle: "sense", titleMid: 512.18 },                // opens the project page (moves: to-sense-moves.js)
  { type: "photo", kind: "brain",   alt: "",                at: [[1476, 1360], [1476, 1360], [964, 1360]] },
  { type: "photo", kind: "brain",   alt: "",                at: [[-327, 1681], [-327, 1681], [11, 1681]] },
  { type: "photo", kind: "water-b", alt: "The Memory Lab",  caption: "The Memory Lab", at: [null, null, [329, 1193]] },
  { type: "photo", kind: "house",   alt: "Double Families", caption: "Double Families", year: "2023", at: [null, null, [646, 1685]] },

  // project names (width in Figma pixels; text centred inside it). They show in the opening only:
  // in the gallery each picture shows its own caption while hovered (see "caption" above)
  { type: "name", text: "Shintana",          width: 124, at: [[-239, 930], [-239, 930], [335, 930]] },
  { type: "name", text: "Double Families",   width: 192, at: [[1727, 756], [1727, 756], [1093, 756]] },
  { type: "name", text: "The  \nMemory Lab", width: 175, at: [[-203, 428], [-203, 428], [520, 428]],
    finalText: "The  \nMemory\nLab", finalWidth: 118 },
  { type: "name", text: "The  \nMemory Lab", width: 175, at: [[1818, 29], [1818, 29], [1158, 118]],
    finalText: "The  \nMemory\nLab", finalWidth: 118 },
  { type: "name", text: "The  \nMemory\nLab", width: 118, at: [null, null, [523, 1240]] },
  { type: "name", text: "Double Families",   width: 192, at: [null, null, [778, 1729]] },

  // years ("2023" next to The Memory Lab waits outside the frame and comes in with the gallery)
  { type: "year", text: "2023", at: [[-88, 408], [-81, 408], [588, 408]] },
  { type: "year", text: "2023", at: [[1865, 736], [1865, 736], [1231, 736]] },
  { type: "year", text: "2023", at: [[-132, 901], [-132, 901], [442, 901]] },
  { type: "year", text: "2023", at: [[1935, 14], [1935, 14], [1243, 102]] }, // comes in with The Memory Lab (top right)
  { type: "year", text: "2023", at: [null, null, [916, 1709]] },
];

// Which picture file each kind of picture uses
const PHOTO_FILES = {
  "house": "gallery-house.png",
  "brain": "gallery-brain.png",
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
    img.className = "flow-photo-soft";   // a little blurred
    // the same picture sharp on top: hovering reveals it (see .flow-photo-color)
    const color = document.createElement("img");
    color.src = img.src;
    color.alt = "";
    color.className = "flow-photo-color";
    crop.append(img, color);
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

// Move every picture/name to its place in frame number `frame` (0 = 74, 1 = 71, 2 = 70)
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
  el.addEventListener("mouseenter", () => show(true));
  el.addEventListener("mouseleave", () => show(false));
  el.addEventListener("focus", () => show(true));
  el.addEventListener("blur", () => show(false));
});

// Every big letter: an invisible area over the letter's place in the gallery feels the mouse.
// It is a little bigger than the letter (the magnet reacts just before they touch), and it stays
// put, so the letter can slide away without the mouse "leaving" it.
const MAGNET_REACH = 12;   // Figma pixels
LETTER_HOVER.forEach((letter) => {
  const area = document.createElement("div");
  area.className = "flow-letter-area";
  const [left, top, right, bottom] = letter.area;
  place(area, [left - MAGNET_REACH, top - MAGNET_REACH]);
  area.style.setProperty("--w", right - left + 2 * MAGNET_REACH);
  area.style.setProperty("--h", bottom - top + 2 * MAGNET_REACH);
  let plan = null;   // the escape this letter is doing (or wants to do) for the mouse
  area.addEventListener("mouseenter", (event) => {
    plan = escapePlan(letter, area, event);
    hoverOn(plan);
  });
  area.addEventListener("mouseleave", () => hoverOff(plan));
  flow.appendChild(area);
});

// ----- Clicking a project picture: the shapes puzzle into its title, then the project page opens -----
// "mind" → "THE MEMORY LAB" (to-lab-moves.js), the cactus → "THE ISRAELI CACTUS" (to-cactus-moves.js),
// the women on the grass → "SENSE" (to-sense-moves.js).
// Pictures, names and years slide out; shapes the title does not need leave through an edge, and the
// missing ones come in from an edge. The project page starts with the title in the same place, so the
// change of page is not seen.
let leaving = false;

// The planned moves into a project's title (null if its file did not load)
function titleMoves(name) {
  if (name === "lab" && typeof TO_LAB !== "undefined") return TO_LAB;
  if (name === "cactus" && typeof TO_CACTUS !== "undefined") return TO_CACTUS;
  if (name === "sense" && typeof TO_SENSE !== "undefined") return TO_SENSE;
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
  // The title forms where it is on the project page: its middle (titleMid, Figma y) in the middle of
  // the screen, level with the side names. A short window scrolls down to it; a tall one moves the
  // whole page down instead (it cannot scroll above the top).
  const u = flow.getBoundingClientRect().width / 1440;   // one Figma pixel
  const mid = ITEMS[i].titleMid;
  const scrollTarget = Math.max(0, mid * u - window.innerHeight / 2);
  const lift = Math.max(0, window.innerHeight / 2 - mid * u);
  flow.style.setProperty("--title-lift", lift + "px");
  flow.classList.add("is-leaving");
  const moving = Math.abs(window.scrollY - scrollTarget) > 1 || lift > 0;
  window.scrollTo({ top: scrollTarget, behavior: "smooth" });
  // the plan starts from the shapes this picture spreads out (the mouse is on it): make sure they are there
  const key = PHOTO_SCATTERS[i] ? "scatter-" + i : "scatter";
  const ready = () => {
    if (busy) { setTimeout(ready, 50); return; }
    if (showing === key) { playToTitle(plan, link); return; }
    busy = true;
    const spread = () => { showing = key; playPlan(planFor(key), true, () => { busy = false; playToTitle(plan, link); }); };
    if (showing === null) spread();
    else if (typeof showing === "string") glideHome(planFor(showing), spread);   // first take back another effect
    else playPlan(planFor(showing), false, spread);
  };
  setTimeout(ready, moving ? 400 : 0);
}

function playToTitle(plan, link) {
  // the shapes that come in from the edges
  const newPieces = plan.newPieces.map((piece) => {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "flow-piece");
    svg.setAttribute("aria-hidden", "true");
    svg.style.setProperty("--w", piece.width);
    place(svg, piece.start);
    flow.appendChild(svg);
    drawShape(svg, piece.file);
    return svg;
  });
  const elementOf = ([kind, n]) => kind === "i" ? itemElements[n]
    : (n < pieceElements.length ? pieceElements[n] : newPieces[n - pieceElements.length]);
  // every slide: the whole body (a shape, or a picture with its name and year) moves together
  plan.moves.forEach(([time, body, dx, dy]) => {
    setTimeout(() => {
      plan.bodies[body].forEach((thing) => {
        const el = elementOf(thing);
        el.style.transitionDuration = plan.slide + "ms";
        el.style.transitionTimingFunction = "";
        place(el, [parseFloat(el.style.getPropertyValue("--x")) + dx, parseFloat(el.style.getPropertyValue("--y")) + dy]);
      });
    }, time);
  });
  setTimeout(() => { window.location.href = link; }, plan.total + 150);
}

ITEMS.forEach((item, i) => {
  if (item.link) itemElements[i].addEventListener("click", (event) => goToProject(event, i));
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

// Visitors who asked their device for less motion see the gallery right away
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  showGallery();
} else {
  playOpening();
}
