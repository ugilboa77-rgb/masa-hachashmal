// =========================================================
// sort.js – מיון כרטיסים לכמה קבוצות (תחנה 5)
//
//   <div class="sorter" data-sort-key="s5.sort">
//     <ul class="sort-cards">
//       <li data-answer="wind water steam">מסובבת מחולל</li> …
//     </ul>
//     <p class="feedback …" data-fb="wrong">…</p>
//     <p … data-fb="missing">…</p>
//     <p … data-fb="generator">…</p>
//     <p … data-fb="done">…</p>
//   </div>
//
// כרטיס יכול להיכנס לכמה קבוצות. מכניסים בגרירה אל הקבוצה,
// או בכפתורים שעל הכרטיס (החלופה בלחיצות). "בדיקה" נותן משוב.
// =========================================================

import { load, save } from "../storage.js";
import { icon } from "./icons.js";

const GROUPS = [
  { key: "wind", name: "רוח" },
  { key: "water", name: "מים" },
  { key: "steam", name: "קיטור" },
];

function setupOne(box) {
  const key = `sort:${box.dataset.sortKey}`;
  const cards = [...box.querySelectorAll(".sort-cards > li")].map((li, i) => ({
    id: String(i),
    text: li.textContent.trim(),
    answer: (li.dataset.answer || "").split(/\s+/).filter(Boolean),
    li,
  }));
  const fb = Object.fromEntries([...box.querySelectorAll("[data-fb]")].map((p) => [p.dataset.fb, p]));
  Object.values(fb).forEach((p) => { p.hidden = true; });

  // מצב: לכל קבוצה – אילו כרטיסים בתוכה
  const saved = load(key, null);
  const state = Object.fromEntries(GROUPS.map((g) => [g.key, new Set((saved && saved[g.key]) || [])]));
  const persist = () => save(key, Object.fromEntries(GROUPS.map((g) => [g.key, [...state[g.key]]])));

  // ----- הקבוצות -----
  const bins = document.createElement("div");
  bins.className = "sort-bins";
  bins.innerHTML = GROUPS.map((g) => `
    <section class="sort-bin" data-group="${g.key}" aria-labelledby="bin-${g.key}">
      <h3 class="sort-bin-title" id="bin-${g.key}">${g.name}</h3>
      <ul class="sort-bin-list"></ul>
    </section>`).join("");
  box.querySelector(".sort-cards").before(bins);

  // ----- הכרטיסים: טקסט + כפתורי קבוצה -----
  cards.forEach((c) => {
    c.li.className = "sort-card";
    c.li.innerHTML = `
      <span class="sort-card-text">${c.text}</span>
      <span class="sort-card-btns" role="group" aria-label="${c.text}">
        ${GROUPS.map((g) => `<button type="button" class="sort-toggle" data-group="${g.key}" aria-pressed="false" aria-label="${c.text} – ${g.name}">${g.name}</button>`).join("")}
      </span>`;
    c.li.querySelectorAll(".sort-toggle").forEach((b) => {
      b.addEventListener("click", () => toggle(c.id, b.dataset.group));
    });
  });

  const checkBtn = document.createElement("button");
  checkBtn.type = "button";
  checkBtn.className = "btn btn-primary sort-check";
  checkBtn.textContent = "בדיקה";
  box.querySelector(".sort-cards").after(checkBtn);

  let checked = false;

  function toggle(cardId, group, force) {
    const set = state[group];
    const on = force === undefined ? !set.has(cardId) : force;
    if (on) set.add(cardId); else set.delete(cardId);
    persist();
    checked = false;
    render();
  }

  function render() {
    cards.forEach((c) => {
      c.li.querySelectorAll(".sort-toggle").forEach((b) => {
        b.setAttribute("aria-pressed", String(state[b.dataset.group].has(c.id)));
      });
    });
    GROUPS.forEach((g) => {
      const list = bins.querySelector(`[data-group="${g.key}"] .sort-bin-list`);
      list.innerHTML = "";
      cards.filter((c) => state[g.key].has(c.id)).forEach((c) => {
        const wrong = checked && !c.answer.includes(g.key);
        const li = document.createElement("li");
        li.innerHTML = `<button type="button" class="sort-chip${wrong ? " is-wrong" : ""}" aria-label="להוציא את ${c.text} מ${g.name}${wrong ? " (עוד לא במקום)" : ""}">
          ${wrong ? `<span class="sort-x" aria-hidden="true">?</span>` : ""}<span>${c.text}</span>${icon("close")}</button>`;
        li.querySelector("button").addEventListener("click", () => toggle(c.id, g.key, false));
        list.append(li);
      });
    });
    if (!checked) Object.values(fb).forEach((p) => { p.hidden = true; });
  }

  checkBtn.addEventListener("click", () => {
    checked = true;
    render();
    let wrong = false, missing = false;
    cards.forEach((c) => GROUPS.forEach((g) => {
      const placed = state[g.key].has(c.id);
      const should = c.answer.includes(g.key);
      if (placed && !should) wrong = true;
      if (!placed && should) missing = true;
    }));
    const gen = cards.find((c) => c.answer.length === 3 && c.text === "מסובבת מחולל");
    const genEverywhere = gen && GROUPS.every((g) => state[g.key].has(gen.id));
    Object.values(fb).forEach((p) => { p.hidden = true; });
    if (wrong && fb.wrong) fb.wrong.hidden = false;
    else if (missing && fb.missing) fb.missing.hidden = false;
    else if (fb.done) fb.done.hidden = false;
    if (genEverywhere && fb.generator) fb.generator.hidden = false;
    const done = !wrong && !missing;
    box.classList.toggle("is-correct", done);
    box.dispatchEvent(new CustomEvent("sort-checked", { bubbles: true, detail: { done } }));
  });

  // ----- גרירה של כרטיס אל קבוצה -----
  cards.forEach((c) => {
    const handle = c.li.querySelector(".sort-card-text");
    let start = null, ghost = null;
    handle.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    });
    handle.addEventListener("pointermove", (e) => {
      if (!start || e.pointerId !== start.id) return;
      if (!ghost && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) {
        handle.setPointerCapture(e.pointerId);
        ghost = document.createElement("div");
        ghost.className = "sort-ghost";
        ghost.textContent = c.text;
        ghost.setAttribute("aria-hidden", "true");
        document.body.append(ghost);
      }
      if (ghost) {
        ghost.style.left = `${e.clientX}px`;
        ghost.style.top = `${e.clientY}px`;
        bins.querySelectorAll(".sort-bin").forEach((b) => {
          const r = b.getBoundingClientRect();
          b.classList.toggle("is-drop", e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom);
        });
      }
    });
    const end = (e) => {
      if (ghost) {
        const target = [...bins.querySelectorAll(".sort-bin")].find((b) => {
          const r = b.getBoundingClientRect();
          return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        });
        if (target) toggle(c.id, target.dataset.group, true);
        ghost.remove();
        ghost = null;
        bins.querySelectorAll(".sort-bin").forEach((b) => b.classList.remove("is-drop"));
      }
      start = null;
    };
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  });

  render();
}

export function setupSorters(root = document) {
  root.querySelectorAll(".sorter").forEach((box) => {
    if (box.dataset.ready) return;
    box.dataset.ready = "1";
    setupOne(box);
  });
}
