// ===== Project page "The Memory Lab" =====
// Draws the title "THE MEMORY LAB" with the same black shapes as the home page (Figma Frame 84),
// and again in white at the bottom of the page (Figma Frame 94). Clicking the first screen scrolls
// down to the pictures (they slide up over the title, which stays). All positions are in Figma pixels (the frame is 1440 wide).

// Each title shape: [shape file number (images/flow-piece-NN.svg), width, x, y]
const TITLE_PIECES = [
  ["06", 34, 510.66, 269.6],
  ["01", 68, 544.63, 269.6],
  ["01", 68, 544.63, 337.55],
  ["13", 34, 612.58, 269.6],
  ["04", 68, 652.55, 269.6],
  ["14", 68, 720.5, 269.6],
  ["16", 68, 652.55, 337.55],
  ["05", 68, 720.5, 337.55],
  ["01", 68, 794.45, 269.6],
  ["02", 68, 862.4, 269.6],
  ["03", 68, 862.4, 303.58],
  ["02", 68, 862.4, 337.55],
  ["03", 68, 862.4, 371.53],
  ["01", 68, 794.45, 337.55],
  ["07", 68, 296, 425.55],
  ["09", 68, 363.95, 425.55],
  ["01", 68, 296, 493.5],
  ["01", 68, 363.95, 493.5],
  ["01", 68, 437.9, 425.55],
  ["02", 68, 505.84, 425.55],
  ["03", 68, 505.84, 459.53],
  ["02", 68, 505.84, 493.5],
  ["03", 68, 505.84, 527.48],
  ["01", 68, 437.9, 493.5],
  ["07", 68, 579.79, 425.55],
  ["09", 68, 647.74, 425.55],
  ["01", 68, 579.79, 493.5],
  ["01", 68, 647.74, 493.5],
  ["09", 68, 721.69, 425.55],
  ["07", 68, 789.64, 425.55],
  ["11", 68, 721.69, 493.5],
  ["10", 68, 789.64, 493.5],
  ["01", 68, 867.66, 425.55],
  ["01", 68, 867.66, 493.5],
  ["03", 68, 935.61, 425.55],
  ["02", 68, 935.61, 459.52],
  ["12", 68, 935.61, 493.5],
  ["05", 68, 1009.56, 425.55],
  ["16", 68, 1077.51, 425.55],
  ["01", 68, 1043.54, 493.5],
  ["01", 68, 510.66, 581.5],
  ["01", 68, 510.66, 649.45],
  ["14", 68, 578.6, 649.45],
  ["09", 68, 652.55, 581.5],
  ["07", 68, 720.5, 581.5],
  ["01", 68, 652.55, 649.45],
  ["01", 68, 720.5, 649.45],
  ["01", 68, 794.45, 581.5],
  ["03", 68, 862.4, 581.5],
  ["02", 68, 862.4, 615.47],
  ["01", 68, 794.45, 649.45],
  ["03", 68, 862.4, 649.45],
  ["02", 68, 862.4, 683.42],
];
const TITLE_TOP = 269.6;   // the top edge of the title (the white copy is drawn from this edge)
// The title's grid is a little bigger than the home page's (67.95 instead of 67.49 per cell):
// each shape is drawn that much bigger, so touching shapes meet exactly
const TITLE_SCALE = 67.9483 / 67.493;

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
    titleShapes.push({ svg, file: "flow-piece-" + number + ".svg" });
  });
});

// Load each shape file once and copy its outline into every shape that uses it
async function drawShapes() {
  const files = [...new Set(titleShapes.map((shape) => shape.file))];
  await Promise.all(files.map(async (file) => {
    const text = await (await fetch("images/" + file)).text();
    const source = new DOMParser().parseFromString(text, "image/svg+xml").documentElement;
    const viewBox = source.getAttribute("viewBox");
    // close every outline, so the thin outline goes all the way round
    const outlines = [...source.querySelectorAll("path")].map((path) =>
      path.getAttribute("d").replace(/([^Zz\s])\s*M/g, "$1Z M").replace(/([^Zz\s])\s*$/, "$1Z"));
    titleShapes.forEach((shape) => {
      if (shape.file !== file) return;
      shape.svg.setAttribute("viewBox", viewBox);
      outlines.forEach((d) => {
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", d);
        shape.svg.appendChild(path);
      });
    });
  }));
}
drawShapes();

// ----- Clicking the first screen scrolls down until the first picture is in the middle -----
document.getElementById("lab-first-screen").addEventListener("click", () => {
  const firstPicture = document.querySelector(".lab-media-brain");
  firstPicture.scrollIntoView({ behavior: "smooth", block: "center" });
});
