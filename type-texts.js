// The project pages' short texts type themselves out (once; they are never erased):
// - the four on the first screen (.lab-intro) a moment after the page opens; they then scroll up and out
//   with the page,
// - the four on the black end (.lab-info) once they come onto the screen.
// All the texts of a group type at the same time, each with its own bar; the bar stands still while it
// types and goes away once its text is typed.
// An invisible copy of each text keeps it at its full size, and the line breaks are measured on it first,
// so a word that goes on the next row is typed there from its first letter (it never jumps down).
(function () {
  const PER_LETTER = 30;     // ms for each letter
  const FIRST_WAIT = 600;    // ms the bars blink before the first letter

  function prepare(el) {
    const full = el.textContent.trim();
    el.setAttribute("aria-label", full);
    el.textContent = "";
    const ghost = document.createElement("span");
    ghost.className = "type-ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.textContent = full;
    const live = document.createElement("span");
    live.className = "type-live";
    live.setAttribute("aria-hidden", "true");
    const typed = document.createElement("span");
    const bar = document.createElement("span");
    bar.className = "type-bar flow-edge-cursor";
    bar.textContent = "|";
    live.append(typed, bar);
    el.append(ghost, live);
    el.classList.add("is-waiting");   // nothing shows until it starts
    return { el, full, ghost, typed, shown: 0, withBreaks: full };
  }

  // Where the rows break (the space before a word that starts a new row becomes a line break)
  function measure(t) {
    const node = t.ghost.firstChild, range = document.createRange();
    let out = "", lastTop = null;
    for (let i = 0; i < t.full.length; i++) {
      const ch = t.full[i];
      if (ch === "\n") { out += ch; lastTop = null; continue; }
      if (ch !== " ") {
        range.setStart(node, i); range.setEnd(node, i + 1);
        const top = range.getBoundingClientRect().top;
        if (lastTop !== null && top > lastTop + 2 && out.endsWith(" ")) out = out.slice(0, -1) + "\n";
        lastTop = top;
      }
      out += ch;
    }
    t.withBreaks = out;
    t.typed.textContent = out.slice(0, t.shown);
  }

  // Types a group of texts together
  function typeGroup(group) {
    group.forEach((t) => { t.el.classList.remove("is-waiting"); });
    setTimeout(() => {
      group.forEach((t) => t.el.classList.add("is-typing"));
      const timer = setInterval(() => {
        let busy = false;
        group.forEach((t) => {
          if (t.shown < t.full.length) {
            t.shown++;
            t.typed.textContent = t.withBreaks.slice(0, t.shown);
            if (t.shown === t.full.length) { t.el.classList.remove("is-typing"); t.el.classList.add("is-done"); }
            else busy = true;
          }
        });
        if (!busy) clearInterval(timer);
      }, PER_LETTER);
    }, FIRST_WAIT);
  }

  const intro = [...document.querySelectorAll(".lab-intro")].map(prepare);
  const info = [...document.querySelectorAll(".lab-info")].map(prepare);
  const all = intro.concat(info);
  if (!all.length) return;

  document.fonts.ready.then(() => {
    all.forEach(measure);
    if (intro.length) typeGroup(intro);   // the first screen: right away
    // the black end: once its texts are on the screen
    if (info.length) {
      const watch = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { watch.disconnect(); typeGroup(info); }
      }, { threshold: 1 });
      info.forEach((t) => watch.observe(t.el));
    }
  });
  window.addEventListener("resize", () => all.forEach(measure));
})();
