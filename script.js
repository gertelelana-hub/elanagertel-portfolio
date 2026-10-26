// ===== Puzzle animation: scattered shapes slowly "solve" into the words "coming soon" =====
// Think of it as a Rubik's cube: the scattered shapes are the mixed-up cube,
// and the words "coming soon" (Figma frame 11) are the solved cube.
// The moves are planned ahead of time (see puzzle-moves.js), following these rules:
//   - pieces slide sideways or up/down only, one at a time, and never overlap;
//   - pieces move together only when one pushes another out of its way;
//   - a piece that reaches its place in the words stays there.
// This file only places the pieces and plays one of the planned timelines.

// Size of the Figma frames, used to turn pixel positions into percentages
const FRAME_WIDTH = 1440;
const FRAME_HEIGHT = 1024;

// Timing (milliseconds)
const START_PAUSE = 700;    // how long the scattered shapes stay still before moving
const MOVE_DURATION = 650;  // how long one slide takes (the plans were made for this exact value)
const END_PAUSE = 250;      // pause after the last piece arrives, before the final swap
const EASING = "cubic-bezier(0.65, 0, 0.35, 1)"; // slow start, fast middle, soft stop

// All 27 pieces: shape file, SVG width (px in the frame) and [x, y] in each frame.
// The S uses two bigger pieces (piece-22, piece-23), each made of 4 small squares flattened in Figma.
//   path[0] = frame 13 (scattered start), path[1] = frame 12, path[2] = frame 11 (final words)
const pieces = [
  { file: "piece-01.svg", width: 54, path: [[652.12, 167], [652.12, 566], [652.12, 458]] },
  { file: "piece-02.svg", width: 54, path: [[705.24, 113], [705.24, 219], [705.24, 458]] },
  { file: "piece-03.svg", width: 54, path: [[705.24, 805], [705.24, 725], [705.24, 511.12]] },
  { file: "piece-04.svg", width: 54, path: [[484.39, 405], [484.39, 405], [484.39, 459.82]] },
  { file: "piece-05.svg", width: 54, path: [[484.39, 619], [484.39, 512.93], [484.39, 512.93]] },
  { file: "piece-06.svg", width: 54, path: [[166, 619], [166, 459.8], [166, 459.8]] },
  { file: "piece-07.svg", width: 54, path: [[265, 566], [219.14, 566], [219.14, 512.95]] },
  { file: "piece-08.svg", width: 54, path: [[318, 405], [219.14, 405], [219.14, 459.78]] },
  { file: "piece-09.svg", width: 107, path: [[87, 299], [263.85, 299], [263.85, 459.68]] },
  { file: "piece-09.svg", width: 107, path: [[1061, 805], [954.82, 805], [954.82, 459.8]] },
  { file: "piece-09.svg", width: 107, path: [[1061.15, 113], [1061.15, 193], [1061.15, 459.8]] },
  { file: "piece-10.svg", width: 54, path: [[370, 459.82], [423.85, 459.82], [423.85, 459.82]] },
  { file: "piece-05.svg", width: 54, path: [[423.85, 726], [423.85, 619], [423.85, 512.93]] },
  { file: "piece-07.svg", width: 54, path: [[370.73, 352], [370.73, 352], [370.73, 459.82]] },
  { file: "piece-11.svg", width: 54, path: [[370.73, 805], [370.73, 566], [370.73, 512.93]] },
  { file: "piece-05.svg", width: 54, path: [[599, 672], [545.71, 672], [545.71, 512.92]] },
  { file: "piece-12.svg", width: 54, path: [[545.71, 566], [545.71, 566], [545.71, 459.83]] },
  { file: "piece-13.svg", width: 54, path: [[485, 272], [598.84, 272], [598.84, 459.83]] },
  { file: "piece-14.svg", width: 54, path: [[598.84, 352], [598.84, 352], [598.84, 512.91]] },
  { file: "piece-03.svg", width: 54, path: [[1167.38, 619], [1167.38, 619], [1167.38, 512.92]] },
  { file: "piece-15.svg", width: 54, path: [[1167.38, 246], [1167.38, 352], [1167.38, 459.83]] },
  { file: "piece-13.svg", width: 54, path: [[1274, 379], [1274, 459.83], [1220.51, 459.83]] },
  { file: "piece-14.svg", width: 54, path: [[1220.51, 753], [1220.51, 699], [1220.51, 512.91]] },
  { file: "piece-10.svg", width: 54, path: [[796, 459.82], [796, 459.82], [848.77, 459.82]] },
  { file: "piece-22.svg", width: 54, path: [[901.89, 298], [901.89, 298], [901.89, 459.86]] },
  { file: "piece-19.svg", width: 54, path: [[901.82, 512.91], [901.82, 512.91], [901.82, 512.91]] },
  { file: "piece-23.svg", width: 54, path: [[848.77, 726], [848.77, 672], [848.77, 512.95]] },
];

// The puzzle area (same size as the stage) that holds all the pieces
const puzzle = document.querySelector(".puzzle");

// Turn a frame pixel value into a percentage of the stage
const toPercentX = (x) => (x / FRAME_WIDTH) * 100 + "%";
const toPercentY = (y) => (y / FRAME_HEIGHT) * 100 + "%";

// Create one <img> per piece, placed at its scattered (frame 13) position
const pieceImages = pieces.map((piece) => {
  const img = document.createElement("img");
  img.className = "shape-piece";
  img.src = "images/" + piece.file;
  img.alt = "";
  img.style.width = toPercentX(piece.width);
  img.style.left = toPercentX(piece.path[0][0]);
  img.style.top = toPercentY(piece.path[0][1]);
  puzzle.appendChild(img);
  return img;
});

// Move one piece on one axis (0 = sideways, 1 = up/down) to a new position
function movePiece(i, axis, value) {
  if (axis === 0) pieceImages[i].style.left = toPercentX(value);
  else pieceImages[i].style.top = toPercentY(value);
}

// Show the finished words: swap the pieces for the one-piece words (no hairlines between pieces)
function showFinishedWords() {
  pieces.forEach((piece, i) => {
    movePiece(i, 0, piece.path[2][0]);
    movePiece(i, 1, piece.path[2][1]);
  });
  puzzle.classList.add("is-solved");
}

// Play one planned timeline. Each slide is [start time, [[piece, axis, new position], ...]];
// all pieces in one slide start together (one piece pushing the others).
function playPuzzle(timeline) {
  pieceImages.forEach((img) => {
    img.style.transition = `left ${MOVE_DURATION}ms ${EASING}, top ${MOVE_DURATION}ms ${EASING}`;
  });
  timeline.forEach(([startTime, moves]) => {
    setTimeout(() => {
      moves.forEach(([i, axis, value]) => movePiece(i, axis, value));
    }, START_PAUSE + startTime);
  });
  const lastStart = timeline[timeline.length - 1][0];
  setTimeout(showFinishedWords, START_PAUSE + lastStart + MOVE_DURATION + END_PAUSE);
}

// Visitors who asked their device for less motion see the final words right away
const prefersLessMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersLessMotion) {
  showFinishedWords();
} else {
  // A different planned timeline on each visit
  const timeline = PUZZLE_TIMELINES[Math.floor(Math.random() * PUZZLE_TIMELINES.length)];
  playPuzzle(timeline);
}
