// =========================================================
// order.js – סידור כרטיסים לפי הסדר
//
// אפשר לסדר בשלוש דרכים:
// • גרירה בעכבר או באצבע (בידית שבצד הכרטיס)
// • כפתורי חץ "למעלה" ו"למטה" בכל כרטיס (חלופה בלחיצות)
// • מקלדת: Tab לכפתורי החצים, ואז Enter
//
//   <div class="order" data-order-key="s0.path">
//     <ol class="order-list">
//       <li data-correct="3">עמוד חשמל ברחוב</li> …
//     </ol>
//     <p class="order-feedback" data-ok>משוב כשהסדר נכון</p>
//     <p class="order-feedback" data-retry>משוב כשהסדר לא נכון</p>
//   </div>
//
// הסדר שבו הכרטיסים כתובים ב-HTML הוא הסדר ההתחלתי (מעורבב).
// =========================================================

import { load, save } from "../storage.js";
import { icon } from "./icons.js";

function setupOne(box) {
  const key = box.dataset.orderKey || "order";
  const list = box.querySelector(".order-list");
  const okText = box.querySelector("[data-ok]");
  const retryText = box.querySelector("[data-retry]");
  okText.hidden = true;
  retryText.hidden = true;

  // ----- בניית הכרטיסים -----
  const items = [...list.children];
  items.forEach((li) => {
    const label = li.textContent.trim();
    li.className = "order-item";
    li.dataset.label = label;
    li.innerHTML = `
      <span class="order-handle" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="24" height="24"><g fill="currentColor"><circle cx="9" cy="6" r="1.8"/><circle cx="15" cy="6" r="1.8"/><circle cx="9" cy="12" r="1.8"/><circle cx="15" cy="12" r="1.8"/><circle cx="9" cy="18" r="1.8"/><circle cx="15" cy="18" r="1.8"/></g></svg>
      </span>
      <span class="order-pos" aria-hidden="true"></span>
      <span class="order-label">${label}</span>
      <span class="order-moves">
        <button type="button" class="order-move" data-dir="-1" aria-label="להזיז את ${label} למעלה">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button type="button" class="order-move" data-dir="1" aria-label="להזיז את ${label} למטה">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </span>`;
  });

  // ----- סדר שמור מפעם קודמת -----
  const saved = load(`order:${key}`, null);
  if (Array.isArray(saved) && saved.length === items.length) {
    saved.forEach((label) => {
      const li = items.find((x) => x.dataset.label === label);
      if (li) list.append(li);
    });
  }

  const live = document.createElement("p");
  live.className = "visually-hidden";
  live.setAttribute("aria-live", "polite");
  box.append(live);

  const current = () => [...list.children];

  function afterChange(announce) {
    current().forEach((li, i) => {
      li.querySelector(".order-pos").textContent = i + 1;
      li.querySelector('[data-dir="-1"]').disabled = i === 0;
      li.querySelector('[data-dir="1"]').disabled = i === items.length - 1;
    });
    save(`order:${key}`, current().map((li) => li.dataset.label));
    okText.hidden = true;
    retryText.hidden = true;
    box.classList.remove("is-correct");
    if (announce) live.textContent = announce;
  }

  // ----- כפתורי חץ -----
  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".order-move");
    if (!btn) return;
    const li = btn.closest(".order-item");
    const dir = Number(btn.dataset.dir);
    const all = current();
    const i = all.indexOf(li);
    const j = i + dir;
    if (j < 0 || j >= all.length) return;
    if (dir < 0) list.insertBefore(li, all[j]);
    else list.insertBefore(all[j], li);
    afterChange(`${li.dataset.label}: מקום ${j + 1}`);
    // המיקוד נשאר על אותו כפתור, גם אם הוא נעשה לא פעיל
    const same = li.querySelector(`[data-dir="${dir}"]`);
    (same.disabled ? li.querySelector(`[data-dir="${-dir}"]`) : same).focus();
  });

  // ----- גרירה (עכבר ומגע) -----
  let dragging = null;

  list.addEventListener("pointerdown", (e) => {
    const handle = e.target.closest(".order-handle, .order-label, .order-pos");
    if (!handle || e.button > 0) return;
    dragging = handle.closest(".order-item");
    dragging.classList.add("is-dragging");
    list.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  list.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const others = current().filter((li) => li !== dragging);
    let before = null;
    for (const li of others) {
      const r = li.getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) { before = li; break; }
    }
    if (before) {
      if (dragging.nextElementSibling !== before) list.insertBefore(dragging, before);
    } else if (list.lastElementChild !== dragging) {
      list.append(dragging);
    }
  });

  function endDrag() {
    if (!dragging) return;
    dragging.classList.remove("is-dragging");
    const label = dragging.dataset.label;
    dragging = null;
    afterChange(`${label}: מקום ${current().findIndex((li) => li.dataset.label === label) + 1}`);
  }
  list.addEventListener("pointerup", endDrag);
  list.addEventListener("pointercancel", endDrag);

  // ----- בדיקה -----
  const check = box.querySelector(".order-check");
  check.addEventListener("click", () => {
    const right = current().every((li, i) => Number(li.dataset.correct) === i + 1);
    okText.hidden = !right;
    retryText.hidden = right;
    box.classList.toggle("is-correct", right);
    (right ? okText : retryText).focus();
  });
  [okText, retryText].forEach((p) => { p.tabIndex = -1; });
  okText.insertAdjacentHTML("afterbegin", icon("check"));

  afterChange();
}

export function setupOrders(root = document) {
  root.querySelectorAll(".order").forEach((box) => {
    if (box.dataset.ready) return;
    box.dataset.ready = "1";
    setupOne(box);
  });
}
