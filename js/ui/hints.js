// =========================================================
// hints.js – כפתור רמז בשתי רמות
//
// איך משתמשים בתוך עמוד:
//   <div class="hints" data-hint-key="s1.e1">
//     <p class="hint" data-level="1">טקסט רמז 1</p>
//     <p class="hint" data-level="2">טקסט רמז 2</p>
//   </div>
//
// לחיצה ראשונה פותחת את רמז 1, לחיצה שנייה את רמז 2.
// רק אחרי שני הרמזים מופיעה ההצעה לבקש עזרה בכרטיס הרמזור.
// רמז שנפתח נשאר פתוח גם אחרי רענון, ונספר בשורה "רמזים שהשתמשתי בהם".
// =========================================================

import { countHint, hintOpened } from "../progress.js";
import { setTrafficLight } from "./traffic-light.js";
import { icon } from "./icons.js";

function setupOne(box, stationId) {
  const key = box.dataset.hintKey || "";
  const hints = [...box.querySelectorAll(".hint")].sort(
    (a, b) => Number(a.dataset.level) - Number(b.dataset.level)
  );
  if (!hints.length) return;

  hints.forEach((h, i) => {
    h.hidden = true;
    h.id = h.id || `hint-${key.replace(/\W/g, "-")}-${i + 1}`;
    h.insertAdjacentHTML("afterbegin", `<strong class="hint-label">רמז ${i + 1}: </strong>`);
  });

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-hint";
  box.prepend(button);

  // ההצעה לבקש עזרה – הטקסט מתוך "טקסטי ממשק" במילון
  const help = document.createElement("div");
  help.className = "hint-help";
  help.hidden = true;
  help.innerHTML = `
    <p>עדיין תקועים? הפכו את כרטיס הרמזור לצהוב.</p>
    <button type="button" class="btn btn-secondary btn-help">${icon("hand")}<span>תקוע, צריך עזרה</span></button>`;
  box.append(help);
  help.querySelector(".btn-help").addEventListener("click", () => setTrafficLight("help"));

  let opened = 0;

  function update() {
    hints.forEach((h, i) => { h.hidden = i >= opened; });
    if (opened < hints.length) {
      button.hidden = false;
      // טקסט הכפתור מתוך "טקסטי ממשק": רמז · עוד רמז
      button.innerHTML = `${icon("bulb")}<span>${opened === 0 ? "רמז" : "עוד רמז"}</span>`;
      button.setAttribute("aria-controls", hints[opened].id);
    } else {
      button.hidden = true;
    }
    help.hidden = opened < hints.length;
  }

  // רמזים שכבר נפתחו בעבר
  hints.forEach((_, i) => {
    if (hintOpened(stationId, `${key}.${i + 1}`)) opened = Math.max(opened, i + 1);
  });

  button.addEventListener("click", () => {
    opened += 1;
    countHint(stationId, `${key}.${opened}`);
    update();
    const shown = hints[opened - 1];
    shown.setAttribute("tabindex", "-1");
    shown.focus();
  });

  update();
}

/** מפעיל את כל תיבות הרמזים בתוך root */
export function setupHints(root = document) {
  const stationId = document.body.dataset.station || "general";
  root.querySelectorAll(".hints").forEach((box) => {
    if (box.dataset.ready) return;
    box.dataset.ready = "1";
    setupOne(box, stationId);
  });
}
