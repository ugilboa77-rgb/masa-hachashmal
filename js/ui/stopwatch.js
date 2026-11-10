// =========================================================
// stopwatch.js – שעון עצר פשוט לניסויים בידיים
//
//   <div class="stopwatch"></div>
//
// כפתורים: התחלה / עצירה, ואיפוס. הזמן מוצג בשניות.
// זה כלי מדידה ולא לחץ זמן: הוא לא רץ לבד ולא מצפצף.
// =========================================================

import { icon } from "./icons.js";

function setupOne(box) {
  box.innerHTML = `
    <p class="sw-label">שעון עצר</p>
    <p class="sw-time" aria-live="off"><span class="sw-num">0.0</span> <span class="sw-unit">שניות</span></p>
    <div class="sw-actions">
      <button type="button" class="btn btn-primary sw-start"></button>
      <button type="button" class="btn btn-secondary sw-reset">איפוס</button>
    </div>
    <p class="visually-hidden sw-live" aria-live="polite"></p>`;
  const num = box.querySelector(".sw-num");
  const start = box.querySelector(".sw-start");
  const reset = box.querySelector(".sw-reset");
  const live = box.querySelector(".sw-live");

  let running = false;
  let startedAt = 0;
  let elapsed = 0;
  let timer = 0;

  const now = () => (running ? elapsed + (performance.now() - startedAt) : elapsed);
  const fmt = (ms) => (ms / 1000).toFixed(1);

  function render() {
    num.textContent = fmt(now());
    start.innerHTML = running
      ? `${icon("stop")}<span>עצירה</span>`
      : `${icon("play")}<span>התחלה</span>`;
    box.classList.toggle("is-running", running);
  }

  start.addEventListener("click", () => {
    if (running) {
      elapsed = now();
      running = false;
      clearInterval(timer);
      live.textContent = `${fmt(elapsed)} שניות`;
    } else {
      startedAt = performance.now();
      running = true;
      timer = setInterval(() => { num.textContent = fmt(now()); }, 100);
    }
    render();
  });
  reset.addEventListener("click", () => {
    running = false;
    clearInterval(timer);
    elapsed = 0;
    live.textContent = "0 שניות";
    render();
  });
  render();
}

export function setupStopwatches(root = document) {
  root.querySelectorAll(".stopwatch").forEach((box) => {
    if (box.dataset.ready) return;
    box.dataset.ready = "1";
    setupOne(box);
  });
}
