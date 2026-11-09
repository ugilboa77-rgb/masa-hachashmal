// =========================================================
// lock.js – נעילת ניסויים בתוך המעבדה
//
// ניסוי נפתח רק אחרי שהתלמיד כתב הסבר של 10 תווים לפחות
// לניסוי הקודם. בשאר החלקים של התחנה אין נעילה.
//
//   <div class="lab">
//     <article class="experiment"> … <textarea data-explain …> … </article>
//     <article class="experiment"> … </article>
//   </div>
// =========================================================

import { icon } from "./icons.js";

export const MIN_EXPLAIN = 10;
// הטקסט מתוך תחנה 1 > מעבדה > [הדמיה] הודעת נעילה
const LOCK_MESSAGE = "כתבו הסבר קצר כדי לפתוח את הניסוי הבא.";

function explainLength(exp) {
  const t = exp.querySelector("[data-explain]");
  return t ? t.value.trim().length : MIN_EXPLAIN;
}

function setupLab(lab) {
  const exps = [...lab.querySelectorAll(".experiment")];

  exps.forEach((exp, i) => {
    if (i === 0) return;
    const note = document.createElement("p");
    note.className = "lock-note";
    note.innerHTML = `${icon("lock")}<span>${LOCK_MESSAGE}</span>`;
    exp.prepend(note);
  });

  function update() {
    let open = true;
    exps.forEach((exp, i) => {
      if (i > 0) open = open && explainLength(exps[i - 1]) >= MIN_EXPLAIN;
      const body = exp.querySelector(".experiment-body");
      const wasLocked = exp.classList.contains("is-locked");
      exp.classList.toggle("is-locked", !open);
      if (body) body.inert = !open;
      const note = exp.querySelector(".lock-note");
      if (note) note.hidden = open;
      if (wasLocked && open) {
        exp.dispatchEvent(new CustomEvent("experiment-unlocked", { bubbles: true }));
      }
    });
  }

  lab.addEventListener("input", update);
  lab.addEventListener("journal-change", update);
  update();
}

/** מפעיל נעילה בכל המעבדות בתוך root */
export function setupLocks(root = document) {
  root.querySelectorAll(".lab").forEach((lab) => {
    if (lab.dataset.lockReady) return;
    lab.dataset.lockReady = "1";
    setupLab(lab);
  });
}
