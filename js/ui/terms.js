// =========================================================
// terms.js – מושג מודגש בטקסט נפתח כחלונית קטנה עם ההסבר
//
// כל <strong> בכרטיסי "מה צריך לדעת" שהטקסט שלו הוא מושג
// מהמילון (js/glossary-data.js) הופך לכפתור. לחיצה פותחת
// מתחת לפסקה את ההסבר מהמילון, וקישור לעמוד המילון.
// =========================================================

import { termByWord } from "../glossary-data.js";

let uid = 0;

export function setupTerms(root = document) {
  root.querySelectorAll(".slide p strong, .info-card p strong").forEach((strong) => {
    const t = termByWord(strong.textContent);
    if (!t || strong.dataset.term) return;
    strong.dataset.term = "1";
    const id = `term-pop-${++uid}`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "term";
    btn.textContent = strong.textContent;
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", id);
    strong.replaceWith(btn);

    const pop = document.createElement("div");
    pop.className = "term-pop";
    pop.id = id;
    pop.hidden = true;
    pop.innerHTML = `<p><strong>${t.term}:</strong> ${t.text}</p><a href="glossary.html">מילון מושגים</a>`;
    btn.closest("p").after(pop);

    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      pop.hidden = !open;
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    document.querySelectorAll('.term[aria-expanded="true"]').forEach((b) => {
      b.setAttribute("aria-expanded", "false");
      document.getElementById(b.getAttribute("aria-controls")).hidden = true;
    });
  });
}
