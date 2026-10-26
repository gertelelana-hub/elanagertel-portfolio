// ===== Process page: stacking dates =====
// Each date sticks near the top of the screen while you scroll, and every new date
// sticks under the ones before it (like in Figma: 19 . 10 at 80px, 26 . 10 at 126px).
// This script does two small jobs for every entry:
//   1. tells the CSS which entry this is (0, 1, 2 …), so each date sticks a bit lower;
//   2. makes the date's rail reach the end of the list, so the date stays until the bottom.

const entriesList = document.querySelector(".process-entries");
const entries = document.querySelectorAll(".process-entry");

function setUpDates() {
  const listBottom = entriesList.getBoundingClientRect().bottom;

  entries.forEach((entry, number) => {
    entry.style.setProperty("--entry-number", number);

    // On phones the dates don't stick (the CSS puts them back in the normal flow),
    // so the rail keeps its own height there
    const rail = entry.querySelector(".entry-date-rail");
    if (getComputedStyle(rail).position === "absolute") {
      const entryTop = entry.getBoundingClientRect().top;
      rail.style.height = listBottom - entryTop + "px";
    } else {
      rail.style.height = "";
    }
  });
}

// Run now, and again whenever the list changes size (pictures loading, window resizing)
setUpDates();
new ResizeObserver(setUpDates).observe(entriesList);
