// "contact me" (top left, on every page).
// - Hovering it types out the contact details next to it (Figma: Frame 207, Variant2): all three lines at
//   once, each with its own bar; a line's bar goes away once that line is typed.
// - Leaving the area (the words and the details) for a few moments erases them the same way, from the end,
//   letter by letter. Coming back before that keeps them open.
(function () {
  const contact = document.querySelector(".flow-contact");
  if (!contact) return;
  const PER_LETTER = 30;     // ms for each letter (typing and erasing)
  const LEAVE_WAIT = 2500;   // ms after the mouse leaves before the details erase themselves

  // ----- The contact details (Figma: 131 to the right of "contact me", on the grid's 2nd column) -----
  const LINES = [
    ["@elanagertel (instagram)", "https://www.instagram.com/elanagertel/"],
    ["+972-54-262-7915 (whatsapp)", "https://wa.me/972542627915"],
    ["gertel.elana@gmail.com", "mailto:gertel.elana@gmail.com"],
  ];
  const list = document.createElement("div");
  list.className = "flow-contact-lines";
  list.hidden = true;
  const lines = LINES.map(([words, href]) => {
    const line = document.createElement("a");
    line.className = "flow-small-text flow-contact-line";
    line.href = href;
    if (href.startsWith("http")) { line.target = "_blank"; line.rel = "noopener"; }
    line.setAttribute("aria-label", words);
    const box = document.createElement("span");
    const bar = document.createElement("span");
    bar.className = "flow-edge-cursor";
    bar.textContent = "|";
    line.append(box, bar);
    list.appendChild(line);
    return { line, box, words, shown: 0 };
  });
  contact.after(list);

  // Types (open) or erases (closed) all the lines together, one letter each step
  let open = false, linesTimer = null, leaveTimer = null;
  function step() {
    let busy = false;
    lines.forEach((l) => {
      const target = open ? l.words.length : 0;
      if (l.shown !== target) { l.shown += open ? 1 : -1; l.box.textContent = l.words.slice(0, l.shown); }
      const done = l.shown === target;
      l.line.classList.toggle("is-typing", !done);          // the bar stands still while it types or erases
      l.line.classList.toggle("is-done", done && open);     // ...and goes away once the line is typed
      if (!done) busy = true;
    });
    if (!busy) {
      clearInterval(linesTimer);
      if (!open) list.hidden = true;   // all erased: the details are gone
    }
  }
  function setOpen(value) {
    clearTimeout(leaveTimer);
    if (open === value) return;
    open = value;
    if (open) list.hidden = false;
    lines.forEach((l) => l.line.classList.remove("is-done"));   // the bars show while it erases
    clearInterval(linesTimer);
    linesTimer = setInterval(step, PER_LETTER);
  }
  // A few moments after leaving, the details erase themselves
  function leaveSoon() {
    clearTimeout(leaveTimer);
    if (open) leaveTimer = setTimeout(() => setOpen(false), LEAVE_WAIT);
  }

  // ----- The mouse (and the keyboard: moving onto "contact me" with Tab works the same) -----
  // (a tap on a phone also sends these; it is handled below instead, so they do nothing then)
  const byFinger = () => typeof window.touchedJustNow === "function" && window.touchedJustNow();
  contact.setAttribute("tabindex", "0");
  contact.addEventListener("mouseenter", () => { if (!byFinger()) setOpen(true); });
  contact.addEventListener("focus", () => { if (!byFinger()) setOpen(true); });
  contact.addEventListener("mouseleave", () => { if (!byFinger()) leaveSoon(); });
  contact.addEventListener("blur", () => { if (!byFinger()) leaveSoon(); });
  list.addEventListener("mouseenter", () => { if (!byFinger()) clearTimeout(leaveTimer); });
  list.addEventListener("mouseleave", () => { if (!byFinger()) leaveSoon(); });

  // ----- A finger (phones): a tap on "contact me" opens or closes the details;
  //       a tap anywhere else, or a few seconds without a tap, closes them -----
  const TOUCH_OPEN_TIME = 8000;   // ms the details stay open after a tap
  contact.addEventListener("click", () => {
    if (!byFinger()) return;
    setOpen(!open);
    if (open) leaveTimer = setTimeout(() => setOpen(false), TOUCH_OPEN_TIME);
  });
  document.addEventListener("click", (event) => {
    if (!byFinger() || !open) return;
    if (event.target.closest(".flow-contact, .flow-contact-lines")) return;
    setOpen(false);
  });
})();
