// ===== Phones: shared helpers for every page =====
// 1. touchedJustNow(): tells the other scripts whether the last tap was a finger (not a mouse).
//    A phone also sends "mouse" events after every tap (mouseenter, mouseleave, focus…), so the hover
//    effects use this to tell a real mouse from a finger, and give fingers their own tap effects.
// 2. The rotate prompt: on a phone held upright (portrait), a white screen asks the visitor to turn
//    the phone sideways. It goes away by itself once the phone is turned, and "continue anyway" hides it
//    for the rest of the visit (remembered in sessionStorage).
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
  const DISMISSED_KEY = "rotate-prompt-dismissed";
  let dismissed = false;
  try { dismissed = sessionStorage.getItem(DISMISSED_KEY) === "yes"; } catch (e) { /* storage blocked: just ask again */ }
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
      <span class="rotate-piece rotate-piece-a" style="--c: 1; --r: 0"></span>
      <span class="rotate-piece rotate-piece-b" style="--c: 0; --r: 0"></span>
      <span class="rotate-piece" style="--c: 0; --r: 1"></span>
      <span class="rotate-piece" style="--c: 1; --r: 1"></span>
      <span class="rotate-piece" style="--c: 0; --r: 2"></span>
      <span class="rotate-piece" style="--c: 1; --r: 2"></span>
    </div>
    <p class="rotate-prompt-text">Rotate your screen for this experience<span class="flow-edge-cursor"> |</span></p>
    <button class="rotate-prompt-skip" type="button">continue anyway</button>`;

  function isShowing() {
    return isPhone && portrait.matches && !dismissed;
  }
  function update() {
    const showing = isShowing();
    document.documentElement.classList.toggle("rotate-prompt-open", showing);
    if (!showing) waiting.splice(0).forEach((todo) => todo());
  }
  prompt.querySelector(".rotate-prompt-skip").addEventListener("click", () => {
    dismissed = true;
    try { sessionStorage.setItem(DISMISSED_KEY, "yes"); } catch (e) { /* not remembered: fine */ }
    update();
  });
  // while it shows, a finger on it does not scroll the page under it
  prompt.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });

  if (isPhone) {
    document.body.appendChild(prompt);
    portrait.addEventListener("change", update);   // turning the phone shows or hides it
    update();
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
