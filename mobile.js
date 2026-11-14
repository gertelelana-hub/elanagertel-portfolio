// ===== Phones: shared helpers for every page =====
// 1. touchedJustNow(): tells the other scripts whether the last tap was a finger (not a mouse).
//    A phone also sends "mouse" events after every tap (mouseenter, mouseleave, focus…), so the hover
//    effects use this to tell a real mouse from a finger, and give fingers their own tap effects.
// 2. The rotate prompt: on a phone held upright (portrait), a white screen asks the visitor to turn
//    the phone sideways. It goes away by itself once the phone is turned (there is no way around it).
// 3. The small names on the edges (ELANA / GERTEL): on a phone the first tap shows "home|" / "about me|",
//    a second tap opens the link.
// This file is loaded before the page's other scripts, so they can use window.touchedJustNow and
// window.rotatePrompt. Nothing here changes anything for a computer with a mouse.

(function () {
  // ----- 1. Was the last tap a finger? -----
  let lastTouch = 0;
  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch" || event.pointerType === "pen") lastTouch = Date.now();
  }, true);   // "true": we hear it before anyone else
  // true for about 1.5 seconds after a finger touched the screen (the "mouse" events a tap sends come right after)
  window.touchedJustNow = () => Date.now() - lastTouch < 1500;

  // A phone or a small tablet held in the hand: a touch screen with no mouse, and a small screen
  const isPhone = window.matchMedia("(hover: none) and (pointer: coarse)").matches &&
                  Math.min(window.screen.width, window.screen.height) < 600;
  if (isPhone) document.documentElement.classList.add("is-phone");

  // ----- 2. The rotate prompt -----
  const portrait = window.matchMedia("(orientation: portrait)");
  const waiting = [];   // things to do once the prompt is gone (the home page's opening waits for it)

  const prompt = document.createElement("div");
  prompt.className = "rotate-prompt";
  prompt.setAttribute("role", "dialog");
  prompt.setAttribute("aria-label", "Turn your phone sideways");
  // Figma "phone first dcreen": a black upright rectangle of six square pieces (2 across, 3 down) that
  // puzzles its way to lying on its side (3 across, 2 down) and back, and the text in the middle of the screen
  prompt.innerHTML = `
    <div class="rotate-puzzle" aria-hidden="true">
      <span class="rotate-piece" data-piece="A" style="--c: 0; --r: 0"></span>
      <span class="rotate-piece" data-piece="B" style="--c: 1; --r: 0"></span>
      <span class="rotate-piece" data-piece="C" style="--c: 0; --r: 1"></span>
      <span class="rotate-piece" data-piece="D" style="--c: 1; --r: 1"></span>
      <span class="rotate-piece" data-piece="E" style="--c: 0; --r: 2"></span>
      <span class="rotate-piece" data-piece="F" style="--c: 1; --r: 2"></span>
    </div>
    <p class="rotate-prompt-text" aria-label="Rotate your screen for this experience">
      <span class="rotate-prompt-ghost" aria-hidden="true">Rotate your screen for this experience |</span>
      <span class="rotate-prompt-live" aria-hidden="true"><span class="rotate-prompt-typed"></span><span class="flow-edge-cursor"> |</span></span>
    </p>`;

  // ----- The puzzle: upright → on its side → upright, again and again -----
  // Squares (in whole squares): A B / C D / E F upright. Each step slides one piece straight into an empty
  // square, so pieces never overlap. On its side the pieces fill the bottom two rows of three squares;
  // then the whole shape glides half a square left to be centred. Then everything plays backwards.
  const PUZZLE_STEPS = [
    ["F", 1, 0],    // bottom right slides right
    ["D", 0, 1],    // middle right drops into its place
    ["B", 1, 0],    // top right slides right
    ["A", 1, 0],    // top left slides right…
    ["A", 0, 1],    // …and down into the middle
    ["B", 0, 1],    // the far right one drops down
    ["E", -1, 0],   // bottom left slides out to the left…
    ["C", 0, 1],    // …the one above it drops into its place…
    ["E", 0, -1],   // …and it goes up…
    ["E", 1, 0],    // …and back in, above it
  ];
  const STEP_MS = 300, HOLD_UPRIGHT = 1000, HOLD_SIDE = 1100, GLIDE_MS = 400;
  function startPuzzle() {
    const box = prompt.querySelector(".rotate-puzzle");
    const pieces = {};
    box.querySelectorAll(".rotate-piece").forEach((el) => { pieces[el.dataset.piece] = el; });
    const cell = pieces.A.offsetWidth;
    if (!cell || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // the whole timeline: hold, the steps, glide left, hold, glide back, the steps backwards
    const there = STEP_MS * PUZZLE_STEPS.length;
    const total = HOLD_UPRIGHT + there + GLIDE_MS + HOLD_SIDE + GLIDE_MS + there;
    const at = (ms) => ms / total;
    const frames = {};   // each piece's keyframes
    const pos = {};
    Object.keys(pieces).forEach((k) => { pos[k] = [0, 0]; frames[k] = [{ offset: 0, transform: "translate(0px, 0px)" }]; });
    const key = (k, ms) => frames[k].push({ offset: at(ms), transform: `translate(${pos[k][0] * cell}px, ${pos[k][1] * cell}px)`, easing: "ease-in-out" });
    let t = HOLD_UPRIGHT;
    PUZZLE_STEPS.forEach(([k, dx, dy]) => { key(k, t); pos[k][0] += dx; pos[k][1] += dy; key(k, t + STEP_MS); t += STEP_MS; });
    t += GLIDE_MS + HOLD_SIDE + GLIDE_MS;
    [...PUZZLE_STEPS].reverse().forEach(([k, dx, dy]) => { key(k, t); pos[k][0] -= dx; pos[k][1] -= dy; key(k, t + STEP_MS); t += STEP_MS; });
    Object.keys(pieces).forEach((k) => {
      frames[k].push({ offset: 1, transform: "translate(0px, 0px)" });
      frames[k].forEach((f, i) => { if (i && f.offset < frames[k][i - 1].offset) f.offset = frames[k][i - 1].offset; });
      pieces[k].getAnimations().forEach((a) => a.cancel());
      pieces[k].animate(frames[k], { duration: total, iterations: Infinity });
    });
    // the glide: half a square left while it lies on its side
    const sideStart = HOLD_UPRIGHT + there;
    box.getAnimations().forEach((a) => a.cancel());
    box.animate([
      { offset: 0, transform: "translateX(0px)" },
      { offset: at(sideStart), transform: "translateX(0px)", easing: "ease-in-out" },
      { offset: at(sideStart + GLIDE_MS), transform: `translateX(${-cell / 2}px)` },
      { offset: at(sideStart + GLIDE_MS + HOLD_SIDE), transform: `translateX(${-cell / 2}px)`, easing: "ease-in-out" },
      { offset: at(sideStart + 2 * GLIDE_MS + HOLD_SIDE), transform: "translateX(0px)" },
      { offset: 1, transform: "translateX(0px)" },
    ], { duration: total, iterations: Infinity });

    // The sentence types itself out while the pieces go from upright to sideways, stays while it lies on
    // its side, and erases itself while they go back (the bar stands still while it types or erases)
    const words = "Rotate your screen for this experience";
    const text = prompt.querySelector(".rotate-prompt-text");
    const typed = prompt.querySelector(".rotate-prompt-typed");
    const glide = box.getAnimations()[0];
    const backStart = sideStart + 2 * GLIDE_MS + HOLD_SIDE;
    cancelAnimationFrame(startPuzzle.frame);
    (function follow() {
      const ms = (glide.currentTime || 0) % total;
      let part = 0;   // how much of the sentence shows (0 to 1)
      if (ms >= HOLD_UPRIGHT && ms < sideStart) part = (ms - HOLD_UPRIGHT) / there;
      else if (ms >= sideStart && ms < backStart) part = 1;
      else if (ms >= backStart) part = 1 - (ms - backStart) / there;
      const n = Math.round(Math.max(0, Math.min(1, part)) * words.length);
      if (typed.textContent.length !== n) typed.textContent = words.slice(0, n);
      text.classList.toggle("is-typing", part > 0 && part < 1);
      startPuzzle.frame = requestAnimationFrame(follow);
    })();
  }

  function isShowing() {
    return isPhone && portrait.matches;
  }
  function update() {
    const showing = isShowing();
    document.documentElement.classList.toggle("rotate-prompt-open", showing);
    if (!showing) waiting.splice(0).forEach((todo) => todo());
  }
  // while it shows, a finger on it does not scroll the page under it
  prompt.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });

  if (isPhone) {
    document.body.appendChild(prompt);
    portrait.addEventListener("change", update);   // turning the phone shows or hides it
    update();
    startPuzzle();
    window.addEventListener("resize", startPuzzle);   // the squares' size follows the screen
  }

  // For the other scripts: is it showing, and "do this once it is gone"
  window.rotatePrompt = {
    isShowing,
    whenGone(todo) { if (isShowing()) waiting.push(todo); else todo(); },
  };

  // ----- 3. The small names on the edges: first tap shows the text, second tap opens the link -----
  const CLOSE_AFTER = 3000;   // ms: the text hides again if there is no second tap
  document.querySelectorAll(".flow-edge").forEach((edge) => {
    let closeTimer = null;
    edge.addEventListener("click", (event) => {
      if (!window.touchedJustNow() || edge.classList.contains("is-open")) return;   // a mouse, or the second tap: open the link
      event.preventDefault();
      document.querySelectorAll(".flow-edge.is-open").forEach((other) => other.classList.remove("is-open"));
      edge.classList.add("is-open");
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => edge.classList.remove("is-open"), CLOSE_AFTER);
    });
  });
  // a tap anywhere else hides the text again
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".flow-edge")) {
      document.querySelectorAll(".flow-edge.is-open").forEach((edge) => edge.classList.remove("is-open"));
    }
  });
})();
